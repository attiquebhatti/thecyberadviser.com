# The Cyber Adviser SEO, AEO, GEO, and Page-Speed Handover

Date: 2026-06-29
Repository used for implementation: `C:\tmp\thecyberadviser-push`
Production site: https://www.thecyberadviser.com
Branch: `main`
Latest pushed commit: `fa1d22f fix(perf): reduce homepage client javascript`

## Executive Summary

The main SEO/AEO/GEO implementation work has been completed and pushed live. The site now has stronger answer-first content for AI and search extraction, a dedicated AI/entity overview page, improved `llms.txt`, shorter HTML cache behavior, immutable static media caching, optimized homepage media, and several Lighthouse accessibility/performance fixes.

The only unresolved verification item is a fresh Google PageSpeed Insights result. The PageSpeed API repeatedly returned `429 Too Many Requests`, so current PSI scores could not be confirmed through the API. Live checks confirmed the code-side fixes are deployed.

## Completed Work

### AEO Improvements

Added answer-first blocks near the top of valuable technical/service pages:

- `/services`
  - Question: `What is Cortex XDR architecture?`
  - Includes concise answer, source summary, recommended approach, entities, and comparison rows.
- `/tools/prisma-access-sizing`
  - Question: `What is Prisma Access sizing?`
  - Includes planning guidance for mobile users, remote networks, service connections, resilience, and logging.
- `/tools/siem-sizing`
  - Question: `How do you size SIEM ingestion?`
  - Includes EPS, GB/day, retention, compute, and source-mix guidance.
- `/tools/unified-migration`
  - Question: `What is firewall migration validation?`
  - Includes policy, NAT/routing, and operational readiness guidance.

Notes:
- No FAQPage schema was added for Google rich-result purposes.
- No HowTo schema was added.
- The implementation follows the current constraint that broad Google FAQ rich results are retired.

### GEO Improvements

Added or improved AI-search citation signals:

- Added reusable `AnswerFirstBlock` component:
  - `components/seo/AnswerFirstBlock.tsx`
- Added dedicated AI/entity overview page:
  - `/ai-overview`
  - File: `app/ai-overview/page.tsx`
  - Includes concise brand, founder, services, tools, audience, and entity summary.
- Updated `public/llms.txt` to include the AI Overview Source page.
- Updated sitemap to include `/ai-overview`.
- Added clearer entity mentions across service/tool answer blocks, including:
  - The Cyber Adviser
  - Attique Bhatti
  - Prisma Access
  - SASE
  - Zero Trust
  - Cortex XDR / XSOAR / XSIAM
  - SIEM / SOAR / SOC
  - Firewall migration vendors and platforms

### Page-Speed and Caching Improvements

Implemented homepage and caching fixes:

- Optimized homepage/slide images to WebP.
- Switched homepage hero media to static imports so assets are emitted under `/_next/static/media/...`.
- Verified the LCP WebP is served with:
  - `Cache-Control: public, max-age=31536000, immutable`
- Changed public page HTML to short cache behavior:
  - `Cache-Control: public, max-age=0, s-maxage=600, stale-while-revalidate=60, must-revalidate`
- Split HTML and asset cache rules in `next.config.js`.
- Added route segment cache behavior in app routes so public pages are served through the shorter cache path.
- Deferred Google Analytics to `lazyOnload`.
- Removed unnecessary client boundary from `app/page.tsx`.
- Converted below-fold homepage sections from Framer Motion client components to server-rendered components with CSS hover transitions:
  - `components/home/TrustStrip.tsx`
  - `components/home/ServicesGrid.tsx`
- Homepage route improved from about `11 kB / 155 kB First Load JS` to `6.68 kB / 150 kB First Load JS` after the latest reduction.

### Lighthouse Warning Fixes Addressed

Code-side fixes made for the screenshot-reported warnings:

- `Use efficient cache lifetimes`
  - Fixed for homepage HTML and `_next/static`/static media assets controlled by Next.
- `Improve image delivery`
  - Added optimized WebP assets and static media imports.
- `Reduce unused JavaScript`
  - Removed Framer Motion client JS from two below-fold homepage sections.
- `Touch targets do not have sufficient size or spacing`
  - Increased carousel controls and slide tabs to `h-11`/larger targets.
- `Heading elements are not in a sequentially-descending order`
  - Changed footer section labels from heading tags to text labels.
- `Background and foreground colors do not have sufficient contrast ratio`
  - Increased several homepage/footer low-contrast text colors from slate-500/600 and dim amber variants to stronger slate/amber values.
- `Browser errors were logged to the console`
  - Removed inert `href="#"` footer links and an unverified social link.

### Security/Header Fixes

Security headers are live on key routes:

- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- CSP currently includes `upgrade-insecure-requests`; some host/CDN normalization was observed earlier.

## Important Commits

Recent implementation commits, newest first:

- `fa1d22f fix(perf): reduce homepage client javascript`
- `b2f2417 fix(perf): address homepage lighthouse warnings`
- `f8c7610 fix(perf): serve homepage media as immutable assets`
- `0068145 fix(perf): split html and asset cache headers`
- `4e5d3c8 fix(perf): route public pages through short cache`
- `bc2f35d feat(seo): add answer-first GEO summaries`
- `c52df82 fix(perf): optimize homepage media loading`
- `c033f2b fix(seo): add frame options header fallback`

Earlier content expansion commits also exist for Cortex XDR, Prisma Access, XSIAM, and agentic endpoint guides.

## Validation Already Performed

Local validation commands that passed after the major changes:

```powershell
npm.cmd run build
npm.cmd run typecheck
```

Known build warnings:

- Optional `ws` dependencies:
  - `bufferutil`
  - `utf-8-validate`
- Stale Browserslist/caniuse-lite data.

These warnings were already present and are not caused by the SEO/page-speed changes.

Live verification completed:

- Homepage returns `200`.
- Homepage HTML cache is short TTL:
  - `public, max-age=0, s-maxage=600, stale-while-revalidate=60, must-revalidate`
- Homepage has `X-Frame-Options: SAMEORIGIN`.
- Homepage uses `/_next/static/media/...` WebP assets.
- Static WebP media returns:
  - `public, max-age=31536000, immutable`
- `href="#"` placeholder links no longer appear on homepage.
- Footer `h4` section labels no longer appear on homepage.
- Homepage carousel touch-target classes are live.
- `/ai-overview` is live.
- `llms.txt` includes `/ai-overview`.
- Sitemap includes `/ai-overview`.

## Pending / Next Steps

### 1. Re-run PageSpeed Insights

Status: pending due to API blocker.

The Google PageSpeed Insights API repeatedly returned:

```text
429 Too Many Requests
```

Next action:

- Run PageSpeed manually in a browser for `https://www.thecyberadviser.com/`, or retry the API after quota/rate-limit cools down.
- Capture mobile and desktop scores.
- Compare against the original screenshot baseline:
  - Performance: `78`
  - Accessibility: `91`
  - Best Practices: `96`
  - SEO: `100`
  - LCP: `5.3s`
  - FCP: `1.5s`
  - TBT: `60ms`
  - CLS: `0`

### 2. Review Remaining PageSpeed Warnings

After PageSpeed is available again, check whether these remain:

- Render-blocking requests
- Unused CSS
- Unused JavaScript
- Forced reflow
- Network dependency tree
- Third-party impact
- Any remaining accessibility contrast/touch-target/heading issues
- Console errors

### 3. Decide Whether to Keep Homepage Dynamic

Current approach intentionally routes public pages through short-cache server behavior to avoid Hostinger/CDN serving year-long stale HTML.

Next action:

- If hosting can be configured to respect proper HTML cache headers for static output, reconsider whether all public pages need `force-dynamic`.
- If Hostinger continues to apply stale one-year cache to static HTML, keep the current dynamic/short-cache approach.

### 4. Investigate Remaining Asset Cache Headers Outside `_next/static`

`/_next/static/media` assets are verified immutable.

Public-folder image URLs under `/images/...` may still lack explicit cache headers depending on Hostinger behavior. Most homepage-critical images have been moved to static imports, but other pages may still reference `/images/...` directly.

Next action:

- Audit remaining `<Image src="/images/...">` and `<img src="/images/...">` references.
- Convert high-traffic static image references to imports where appropriate.
- Leave content/blog images alone if static imports are impractical, unless PageSpeed flags them.

Suggested command:

```powershell
rg -n "src=\"/images/|src='\/images/|/images/" app components data --glob "*.tsx" --glob "*.ts"
```

### 5. Optional: Update Browserslist Data

Build warns that Browserslist/caniuse-lite is stale.

Next action:

```powershell
npx update-browserslist-db@latest
```

Only do this if dependency lockfile changes are acceptable.

### 6. Optional: Address Optional `ws` Warnings

Build warnings mention missing optional packages used by `ws` through Socket.io/CyberQuiz.

Next action options:

- Ignore if runtime is healthy; these are optional native accelerators.
- Install optional packages if needed and acceptable:
  - `bufferutil`
  - `utf-8-validate`

### 7. Optional: Add Legal Pages or Remove Footer Policy Links Permanently

The footer placeholder Privacy/Terms links were removed from homepage output. If legal pages are required, add real routes and restore footer links to real URLs.

Potential routes:

- `/privacy-policy`
- `/terms-of-service`

## Operational Notes

- The configured workspace folder `C:\App Development\TheCyberAdviser\thecyberadviser.com` was not a usable git worktree during this work.
- The active implementation clone used was `C:\tmp\thecyberadviser-push`.
- All pushed changes went to `origin/main` at `https://github.com/attiquebhatti/thecyberadviser.com.git`.
- Do not rely on the old workspace folder unless it is refreshed or converted into a proper worktree.

## Suggested Next Operator Checklist

1. Open PageSpeed Insights manually and test `https://www.thecyberadviser.com/` on mobile and desktop.
2. Save the new scores and diagnostics.
3. If performance is still below target, prioritize whatever PageSpeed lists first.
4. Run `npm.cmd run build` and `npm.cmd run typecheck` before any new push.
5. After every push, verify live headers:

```powershell
$resp=Invoke-WebRequest -UseBasicParsing 'https://www.thecyberadviser.com/' -TimeoutSec 25
$resp.Headers['Cache-Control']
$resp.Headers['X-Frame-Options']
$resp.Content.Contains('/_next/static/media/')
```

6. Check one emitted media asset:

```powershell
# Replace URL with an actual /_next/static/media/*.webp URL found in homepage HTML
Invoke-WebRequest -UseBasicParsing 'https://www.thecyberadviser.com/_next/static/media/example.webp' -Method Head
```