# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`thecyberadviser.com` — a Next.js 13.5.1 (App Router) marketing site for The Cyber Adviser that also hosts several self-contained **tools**: CyberQuiz, an AI Training Chatbot, a Unified Migration tool, and Prisma Access / SIEM sizing calculators. Despite the `package.json` name (`unified-migrator`), this is the full website. Runs on **Hostinger shared hosting** behind a **custom Node server** (`server.js`), backed by **MySQL** (`mysql2/promise`).

## Commands

```bash
npm run dev          # custom server (server.js) in dev — NOT `next dev`
npm run build        # next build
npm run start        # custom server in production mode
npm run typecheck    # tsc --noEmit
npm run lint         # next lint

# Tests run through sucrase-node (no jest). Run a single suite directly:
npm run test:unified-migrator
npm run test:scm               # Panorama→SCM pipeline (uses @xmldom polyfill)
npm run test:prisma-sizing
npm run test:siem-sizing
# or: npx sucrase-node test/<file>.test.ts
```

Tests use a hand-rolled `Module._resolveFilename` shim to resolve the `@/` path alias (see the top of any `test/*.ts`) — replicate it in new harnesses rather than expecting tsconfig paths to "just work" under sucrase.

The app **must run through `server.js`**, not `next dev`/`next start` — `server.js` attaches Socket.io for CyberQuiz live multiplayer (wrapped in try/catch so HTTP still serves if sockets fail).

## Critical environment realities

- **Local dev talks to the PRODUCTION database.** `CQ_DB_*` / `ATC_DB_*` in `.env.local` point at the live Hostinger MySQL. Any DB write (creating courses, seeding chunks, RBAC changes) is **immediately live**. Only code changes require a deploy. Be deliberate about destructive SQL.
- **Deployment is push-to-`main`** → Hostinger serves the live site. There is no staging. `www.thecyberadviser.com` is canonical (apex redirects via `next.config.js`).
- **Secrets are managed by the site owner** in `.env.local` / Hostinger — never paste API keys, DB passwords, or private keys into committed files. For the GA service-account key, the code reads a file path (`GA_KEY_FILE`) instead of inlining the key.
- **`images.unoptimized: true`** is required — Hostinger can't run the `/_next/image` optimizer. Don't re-enable optimization.
- `@google-analytics/data` is in `serverComponentsExternalPackages` (native/optional deps) — keep it there.

## Hard rules

- **Never commit or push `app/tools/cyberlearn/`** — it's a work-in-progress and is gitignored. Verify it stays ignored before any commit.
- **Build locally, test, and ask before pushing to live** unless the user has clearly authorized the push in the current request.
- `uploads/` and `.env*.local` are gitignored — uploaded files live outside `public/` so they aren't publicly reachable.

## Architecture

### Tool module pattern
Each tool is a vertical slice with the same three-part layout — follow it for new tools:
- `lib/<tool>/` — DB pool, auth helpers, business logic (server + shared)
- `app/api/<tool>/` — route handlers (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'` where they touch `fs`/DB)
- `app/tools/<tool>/` — pages and client components

CyberQuiz (`lib/cyberquiz`) is the reference implementation; the AI Chatbot (`lib/chatbot`) mirrors its patterns (its own `globalThis` pool cache key, own `ATC_*` env vars, own JWT).

### Database & migrations
No migration framework exists. Schema changes ship as **idempotent `CREATE TABLE IF NOT EXISTS` blocks inside a guarded route handler** (e.g. `app/api/chatbot/_migrate/route.ts`), protected by an `x-seed-secret` header and run manually after deploy. The MySQL pool is a `globalThis`-cached singleton with a `typeCast` that maps `TINY(1)` → boolean. Embeddings/vectors are stored as JSON columns (no native vector type on shared MySQL).

### Auth & RBAC
CyberQuiz issues a JWT (`qa_token`); the chatbot reuses CyberQuiz SSO. Admin access is gated by allow-listed emails in env (`ADMIN_EMAIL` / `ATC_ADMIN_EMAIL`); `profiles.role` provides DB-level RBAC, with the env admin as an un-demotable super-admin. `requireAuthUser(req)` returns `{user} | {error: Response}`.

### AI Training Chatbot (RAG)
`lib/chatbot`. Embeddings via Google **`gemini-embedding-001`** (768-dim, REST, paced with `GEMINI_PACE_MS` for free-tier rate limits); generation via **Groq `llama-3.3-70b-versatile`**. Chunks + embeddings stored in MySQL; cosine similarity computed in Node at query time. Chat responses stream over SSE. Markdown is rendered with an **explicit `react-markdown` components map** because `@tailwindcss/typography` is not installed (the Tailwind reset strips list markers otherwise). The persona never reveals its source (transcripts vs. model knowledge).

### Unified Migration tool
`lib/unified-migrator`. Two pipelines, **both run entirely client-side in the browser** (uploaded configs never leave the machine — `runMigration`/`runScmMigration` are imported directly into `app/tools/MigratorClient.tsx`):
1. **Generic vendor → PAN-OS** (`runtime.ts` `runMigration`): parsers for Cisco ASA / FortiGate / Check Point / PAN-OS → canonical IR (`types.ts`) → generators. Flat, single-firewall model.
2. **Panorama → Strata Cloud Manager (SCM)** (`lib/unified-migrator/scm/`, `runScmMigration`): hierarchy-aware. `panorama-parser.ts` uses the browser-native **`DOMParser`** (guarded for non-browser shims; tested in Node via `@xmldom/xmldom`). Flow is `parse → map (device-groups→folders, templates→snippets, shared→Global) → remediate → generate`. `limitations.ts` is the **SCM### remediation engine** that auto-remaps or flags each construct the SCM onboarding tool can't ingest. Output is a downloadable bundle (cleaned `scm-config.xml`, set-CLI, logical-router static routes, remediation report, mapping JSON) plus a coverage cross-check.

The Unified Migration tool also ships as an Electron desktop app (`electron/`, `npm run desktop:*`); `desktop-storage.ts` swaps localStorage-style persistence for offline mode.

### Sizing calculators
`lib/prisma-sizing` and `lib/siem-sizing` are pure, heuristic, deterministic estimators (documented in `docs/`) with corresponding test suites. They are intentionally not official PANW pricing/sizing logic.
