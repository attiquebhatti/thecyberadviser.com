# SIEM Sizing Calculator Master Prompt

Use this prompt when you want to regenerate or extend the SIEM sizing tool with the same structure and behavior.

```text
Build a production-ready SIEM / SOAR sizing calculator for a Next.js website using React, TypeScript, Tailwind CSS, and shadcn/ui components where appropriate.

Reference experience:
- Closely mirror the UX, information hierarchy, and output structure of the public Open SIEM Deployer sizing page at https://www.opensiem-deployer.com/siem-sizing
- Do not copy markup or implementation from that site
- Create an original implementation with reusable code and clean separation of concerns
- Keep the final result visually polished and easy to scan for solution architects and frontend engineers

Project context:
- The app lives inside an existing website with a dark premium theme
- The tool should be available at /tools/siem-sizing
- The tool should feel native to the website, not like a standalone app shell
- Use website-friendly cards, rounded corners, soft shadows, strong spacing, restrained accents, and responsive layout

Tech stack:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- No backend for V1
- Pure reusable calculation engine

Implementation goals:
- Build a clean SIEM / SOAR sizing calculator for SOC architects and security engineers
- Estimate architecture, compute, RAM, disk, and infrastructure sizing
- Keep formulas transparent and easy to edit later
- Separate UI, config, types, and calculation logic

Required file structure:
- /app/tools/siem-sizing/page.tsx
- /components/siem-sizing/SiemSizingCalculator.tsx
- /lib/siem-sizing/engine.ts
- /config/siem-sizing-platforms.ts
- /types/siem-sizing.ts
- /test/siem-sizing.test.ts
- /docs/siem-sizing-master-prompt.md

Page structure:
1. Breadcrumb and page intro
2. Header card with:
   - Badge: Free Tool
   - Badge: Beta
   - Title: SIEM Sizing Calculator
   - Subtitle: Estimate the storage, compute, and cost requirements for your SIEM or SOAR deployment. Designed for SOC architects and security engineers.
3. Mode toggle:
   - Simple
   - Advanced
4. Platform selector cards for:
   - Wazuh
   - Splunk Enterprise
   - IBM QRadar
   - Microsoft Sentinel
   - LogRhythm
   - Graylog
   - Cortex XSOAR
5. Simple mode inputs:
   - Number of employees
   - Network equipment
   - concise helper text under each
6. Advanced mode inputs:
   - Endpoints
   - Servers
   - Network sources
   - Cloud / SaaS sources
   - Retention days
   - Compression ratio
   - High availability toggle
7. Results panel:
   - Title: Recommended Architecture
   - Architecture type
   - Explanation text
   - Node counters:
     - Master node
     - Indexer nodes
     - Dashboard nodes
     - Worker nodes
   - Stat cards:
     - Estimated agents
     - Estimated daily volume
     - Estimated storage (X days)
8. Infrastructure summary table:
   - Component
   - Qty
   - vCPU
   - RAM
   - Disk
   - totals row
9. Informational note:
   - Need more precision? Switch to Advanced mode for per-source configuration and retention tuning.

Platform config requirements:
- Store all platform assumptions in a reusable config object
- Include:
  - label
  - shortLabel
  - employeeAgentFactor
  - networkAgentFactor
  - endpointGbPerDay
  - serverGbPerDay
  - networkGbPerDay
  - cloudGbPerDay

Platform coefficients:
- Wazuh:
  - employeeAgentFactor: 0.20
  - networkAgentFactor: 0.35
  - endpointGbPerDay: 0.04
  - serverGbPerDay: 0.12
  - networkGbPerDay: 0.50
  - cloudGbPerDay: 0.80
- Splunk Enterprise:
  - employeeAgentFactor: 0.24
  - networkAgentFactor: 0.40
  - endpointGbPerDay: 0.06
  - serverGbPerDay: 0.18
  - networkGbPerDay: 0.70
  - cloudGbPerDay: 1.00
- IBM QRadar:
  - employeeAgentFactor: 0.18
  - networkAgentFactor: 0.30
  - endpointGbPerDay: 0.05
  - serverGbPerDay: 0.15
  - networkGbPerDay: 0.60
  - cloudGbPerDay: 0.90
- Microsoft Sentinel:
  - employeeAgentFactor: 0.22
  - networkAgentFactor: 0.30
  - endpointGbPerDay: 0.05
  - serverGbPerDay: 0.16
  - networkGbPerDay: 0.65
  - cloudGbPerDay: 0.90
- LogRhythm:
  - employeeAgentFactor: 0.18
  - networkAgentFactor: 0.28
  - endpointGbPerDay: 0.05
  - serverGbPerDay: 0.14
  - networkGbPerDay: 0.55
  - cloudGbPerDay: 0.85
- Graylog:
  - employeeAgentFactor: 0.18
  - networkAgentFactor: 0.32
  - endpointGbPerDay: 0.045
  - serverGbPerDay: 0.13
  - networkGbPerDay: 0.52
  - cloudGbPerDay: 0.82
- Cortex XSOAR:
  - employeeAgentFactor: 0.16
  - networkAgentFactor: 0.22
  - endpointGbPerDay: 0.035
  - serverGbPerDay: 0.10
  - networkGbPerDay: 0.40
  - cloudGbPerDay: 0.70

Formula requirements:
- Simple mode:
  - estimated_endpoint_agents = ceil(employees * platform.employeeAgentFactor)
  - estimated_network_agents = ceil(networkEquipment * platform.networkAgentFactor)
  - total_agents = estimated_endpoint_agents + estimated_network_agents
  - daily_volume_gb = employees * platform.endpointGbPerDay + networkEquipment * platform.networkGbPerDay
- Advanced mode:
  - total_agents = endpoints + servers + networkSources + cloudSources
  - daily_volume_gb =
      endpoints * platform.endpointGbPerDay +
      servers * platform.serverGbPerDay +
      networkSources * platform.networkGbPerDay +
      cloudSources * platform.cloudGbPerDay
- Storage:
  - storage_gb = (daily_volume_gb * retention_days) / compression_ratio

Architecture rules:
- Recommend Single node when:
  - daily_volume_gb <= 8
  - total_agents <= 50
  - high availability is disabled
- Recommend Distributed when:
  - daily_volume_gb > 8
  - or total_agents > 50
  - or high availability is enabled
- Single node sizing:
  - one all-in-one node
  - 4 to 8 vCPU depending on volume
  - 8 to 16 GB RAM depending on volume
  - disk = max(120, storage_gb + 50)
- Distributed sizing:
  - 1 master node: 4 vCPU, 8 GB RAM, 50 GB disk
  - 1 dashboard node: 2 vCPU, 4 GB RAM, 50 GB disk
  - indexer node count:
    - 1 if daily_volume_gb <= 40
    - 2 if daily_volume_gb > 40
    - 3 if daily_volume_gb > 120
  - worker nodes:
    - 0 by default
    - add workers only for very large environments
  - indexer disk:
    - distribute storage_gb across indexers
    - each indexer should have at least 120 GB disk

Defaults:
- platform = wazuh
- mode = simple
- employees = 250
- network equipment = 10
- retention_days = 90
- compression_ratio = 7

Engineering constraints:
- Use TypeScript throughout
- Keep the calculation engine pure
- Do not hardcode platform thresholds inside React components
- Keep the UI component reusable and self-contained
- Use responsive grids and avoid clutter
- Make the results panel prominent and easy to scan
- Use comments only where helpful
- Avoid placeholder lorem ipsum
- Do not introduce broken imports

Verification requirements:
- Add a small test file for the engine
- Run typecheck
- Keep the code ready to drop into the existing Next.js site

Output:
- Return complete runnable code
- Include all helper functions and config files needed
- Also provide a concise implementation summary and the file list
```
