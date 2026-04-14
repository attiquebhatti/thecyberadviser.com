# Prisma Access Sizing Calculator

This repository now includes an embeddable Prisma Access Sizing Calculator designed for use inside The Cyber Adviser website and external iframe integrations.

Technical reference:

- [`docs/prisma-access-sizing-technical-overview.md`](./docs/prisma-access-sizing-technical-overview.md)
- [`docs/siem-sizing-master-prompt.md`](./docs/siem-sizing-master-prompt.md)

## What it does

The calculator provides architectural estimate guidance for Prisma Access planning scenarios covering:

- mobile users
- remote networks and branches
- ZTNA apps and connector assumptions
- service connections
- regions and resilience
- logging and telemetry options

The current implementation uses editable heuristic rules for V1. It is intentionally not official Palo Alto Networks pricing, licensing, or final sizing logic.

## Local setup

From the website project root:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/tools`
- `http://localhost:3000/embed/prisma-access-sizing`

## Build commands

```bash
npm run typecheck
npm run test:prisma-sizing
npm run build
```

## Deployment notes

- The calculator is fully client-safe for V1 and does not require a backend.
- The embed route lives at `/embed/prisma-access-sizing`.
- The root site chrome is automatically removed for `/embed/*` routes.
- The iframe route posts height updates to the parent window using:

```json
{ "type": "prisma-sizing:height", "height": 1234 }
```

## Embed instructions

Example iframe:

```html
<iframe
  id="prisma-sizing-frame"
  src="https://your-domain.com/embed/prisma-access-sizing?mode=simple&mobileUsers=2500&branchSites=40&throughputValue=5&throughputUnit=Gbps"
  title="Prisma Access Sizing Calculator"
  loading="lazy"
  style="width:100%;min-height:1400px;border:0;display:block;"
></iframe>
```

Example responsive container CSS:

```css
.prisma-sizing-embed-wrap {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
}

.prisma-sizing-embed-frame {
  width: 100%;
  min-height: 1400px;
  border: 0;
  display: block;
}

@media (max-width: 1024px) {
  .prisma-sizing-embed-frame {
    min-height: 1800px;
  }
}
```

Example parent page resize handler:

```html
<script>
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "prisma-sizing:height") return;
    const iframe = document.getElementById("prisma-sizing-frame");
    if (iframe) iframe.style.height = event.data.height + "px";
  });
</script>
```

## Where to edit sizing logic

Editable heuristic assumptions live in:

- [`config/prisma-sizing-rules.json`](./config/prisma-sizing-rules.json)

Core recommendation logic lives in:

- [`lib/prisma-sizing/rules-engine.ts`](./lib/prisma-sizing/rules-engine.ts)

Validation lives in:

- [`lib/prisma-sizing/validators.ts`](./lib/prisma-sizing/validators.ts)

Summary and export formatting lives in:

- [`lib/prisma-sizing/summary.ts`](./lib/prisma-sizing/summary.ts)

## Editable rule assumptions

The following rule groups are intentionally editable for workshop tuning:

- throughput conversion from `Mbps` to `Gbps`
- default concurrent user ratio
- branch complexity weights for small, medium, and large sites
- branch bandwidth defaults in Mbps
- feature uplifts for ADEM, clean pipe, and local breakout
- connector recommendations by app count
- logging recommendation text by retention option
- minimum regions by redundancy level
- score bands for recommended tier, regions, HA model, and guidance text
- advisory thresholds for high throughput and mixed deployment complexity

## Tests included

The Prisma sizing test suite covers:

- normalization and throughput conversion
- concurrency greater than total user rejection
- negative number rejection
- mixed deployment recommendations
- advisory note generation
- computed metric generation

Run:

```bash
npm run test:prisma-sizing
```

## Accessibility and UX notes

- labels are explicitly associated with inputs
- helper text is present in each section
- segmented controls expose `aria-pressed`
- the architecture table is horizontally scrollable on smaller screens
- a print-friendly summary view is rendered for export workflows

## Disclaimer language

Use this calculator as an architectural estimate tool only.

The outputs are not official Palo Alto Networks pricing, licensing, support, or final sizing guidance. All recommendations are based on editable heuristic assumptions intended for workshops, proposal notes, and internal planning. Final designs must be validated separately.

