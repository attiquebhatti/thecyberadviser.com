# Prisma Access Sizing Calculator Technical Overview

Audience: solution architects, frontend engineers

## Architecture overview

The Prisma Access Sizing Calculator is a client-side Next.js feature embedded into The Cyber Adviser website. It uses a local, config-driven heuristic engine to convert user inputs into architectural estimates without relying on a backend service.

The implementation is intentionally split into:

- presentation layer: Next.js routes and React UI
- domain layer: TypeScript types for inputs, normalized values, computed metrics, and recommendations
- validation and parsing layer: zod-based input validation and query-param hydration
- rules layer: local JSON sizing assumptions and recommendation logic
- export layer: human-readable summaries and JSON export payloads

This keeps the UI lightweight while allowing sizing assumptions to be tuned without rewriting React components.

## Component structure

Primary entry points:

- `app/tools/prisma-access-sizing/page.tsx`
  - site-native calculator page with breadcrumb, intro copy, and related-tool card
- `app/embed/prisma-access-sizing/page.tsx`
  - minimal iframe-safe route for external embedding

Primary feature component:

- `components/prisma-sizing/PrismaAccessSizingEmbed.tsx`
  - main interactive calculator UI
  - deployment selection
  - compact input panel
  - recommendation/result card
  - copy summary, export JSON, and print actions

Supporting modules:

- `types/prisma-sizing.ts`
  - domain types, enums, recommendation contracts, and export payload types
- `lib/prisma-sizing/validators.ts`
  - zod schema and input validation helpers
- `lib/prisma-sizing/query-state.ts`
  - query-param parsing and prefill hydration
- `lib/prisma-sizing/rules-engine.ts`
  - normalization, metric derivation, scoring, recommendations, and advisory generation
- `lib/prisma-sizing/summary.ts`
  - workshop-friendly text summary and stable export formatting
- `hooks/use-prisma-sizing-embed-height.ts`
  - posts iframe height changes to the parent page
- `config/prisma-sizing-rules.json`
  - editable heuristic assumptions and calibration values

## Data flow

The calculator follows a predictable client-safe flow:

1. The page route reads optional query params.
2. `parsePrismaSizingPrefill` maps those params into an initial input object.
3. The main React component stores the working input state.
4. On input changes, validation runs through the zod schema.
5. Valid inputs are passed into the rules engine.
6. The rules engine returns structured recommendation output, KPI metrics, advisory notes, and architecture rows.
7. The UI renders the highlighted recommendation card and supporting detail.
8. Summary and export actions serialize the current recommendation for sharing or workshops.

The UI keeps logic out of components and consumes engine output rather than recomputing thresholds in React.

## Sizing engine flow

The engine in `lib/prisma-sizing/rules-engine.ts` follows this sequence:

1. Validate raw input
2. Normalize input values
3. Derive computed metrics
4. Calculate scale and complexity scores
5. Apply rule thresholds and deployment-specific multipliers
6. Build recommendations and advisory notes
7. Return structured output for UI, export, and print

Current computed metrics include:

- normalized throughput in Gbps
- branch/SPN bandwidth estimate
- remote-network storage estimate
- mobile-user storage estimate
- NGFW storage estimate
- total estimated logging storage
- recommended purchase storage in TB
- deployment complexity score

The engine is heuristic by design. It is calibrated for planning conversations and can be further tuned by adjusting the JSON rules file.

## Editable rule locations

Primary rule file:

- `config/prisma-sizing-rules.json`

Typical editable areas inside the rules file include:

- throughput conversion assumptions
- storage estimation coefficients
- deployment-type multipliers
- branch bandwidth assumptions
- retention mappings
- region and redundancy thresholds
- tier/recommendation score bands
- advisory thresholds

Code locations that consume those rules:

- `lib/prisma-sizing/rules-engine.ts`
- `lib/prisma-sizing/validators.ts`

If recommendation behavior needs to change, edit the JSON first and update engine logic only when the model itself needs a new concept.

## Embed strategy

V1 uses iframe embedding because it is the safest and fastest integration path.

Embed route:

- `app/embed/prisma-access-sizing/page.tsx`

Embed characteristics:

- minimal outer layout
- no internal app shell chrome
- client-safe logic only
- optional query-param prefills
- parent resize support through `postMessage`

Height updates are sent by:

- `hooks/use-prisma-sizing-embed-height.ts`

Message contract:

```json
{ "type": "prisma-sizing:height", "height": 1234 }
```

This allows the parent website to resize the iframe smoothly without sharing business logic across applications.

## Known limitations

- The sizing model is not official Palo Alto Networks sizing or licensing logic.
- Accuracy is bounded by local heuristic calibration and available benchmark samples.
- No backend persistence exists in V1; results are session-local.
- The current implementation is optimized for workshops and proposal support, not procurement-grade output.
- Mixed deployments are summarized through a shared model and may still need separate detailed validation by use case.
- Print/export output is optimized for readability, not formal quote generation.

## Future enhancements

- calibrate the heuristic engine against a larger benchmark set
- split deployment models further for remote network, mobile user, ZTNA, and NGFW-specific workflows
- add more explicit throughput-to-logging utilization profiles
- support CSV/XLSX export for architecture rows and report bundles
- introduce versioned rule packs for different estimation baselines
- add admin-side tuning controls for non-developer rule editing
- move from iframe-only embed to an optional JavaScript widget bundle with Shadow DOM
- add telemetry and anonymized input analytics if product usage insights are needed

## Assumptions and disclaimer

Core assumptions:

- all outputs are architectural estimates
- sizing rules are locally editable and intentionally transparent
- logging storage and bandwidth figures are derived from simplified calibration heuristics
- recommendation bands prioritize advisory speed and usability over vendor-internal precision

Disclaimer:

This calculator does not represent official Palo Alto Networks pricing, licensing, support policy, or final sizing guidance. It is intended for workshop planning, proposal notes, and internal estimation conversations only. Final designs and commercial quantities must be validated separately.
