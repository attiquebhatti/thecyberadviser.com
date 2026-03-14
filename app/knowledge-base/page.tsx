"use client"; // This is required to make the buttons interactive in Next.js

import React, { useState } from 'react';
import Link from 'next/link';

// THE MASSIVE ENTERPRISE ARTICLE DATABASE (55 Articles)
const articles = [
  // --- PRISMA ACCESS (5) ---
  { category: 'PRISMA ACCESS', title: 'Prisma Access: Optimizing Split-Tunneling', description: 'A deep dive into latency reduction for global remote workforces using Strata and Prisma Access integrations.', date: '2026-02-15', slug: 'prisma-split-tunneling' },
  { category: 'PRISMA ACCESS', title: 'Legacy VPN to ZTNA: The Migration Plan', description: 'A structural guide to decommissioning traditional VPNs and migrating to cloud-delivered Zero Trust without user disruption.', date: '2026-02-10', slug: 'legacy-vpn-to-prisma-ztna' },
  { category: 'PRISMA ACCESS', title: 'Scaling Mobile User Gateways (MUG)', description: 'Architectural considerations for auto-scaling capacity and managing IP pools during sudden workforce expansions.', date: '2026-02-01', slug: 'scaling-mobile-user-gateways' },
  { category: 'PRISMA ACCESS', title: 'Advanced DLP Policy Orchestration', description: 'Preventing data exfiltration at the edge by deploying enterprise Data Loss Prevention profiles through Prisma Access.', date: '2026-01-25', slug: 'advanced-dlp-prisma' },
  { category: 'PRISMA ACCESS', title: 'Troubleshooting IPSec Tunnels', description: 'A step-by-step debug playbook for resolving BGP and routing failures over Prisma Access Service Connections.', date: '2026-01-18', slug: 'troubleshooting-service-connections' },

  // --- PRISMA SD-WAN (5) ---
  { category: 'PRISMA SD-WAN', title: 'Seamless Migration from MPLS to Broadband', description: 'How to overlay Prisma SD-WAN on existing MPLS circuits for a phased, zero-downtime cutover.', date: '2026-02-20', slug: 'mpls-to-broadband-sdwan' },
  { category: 'PRISMA SD-WAN', title: 'App-Fabric: Application-Defined Routing', description: 'Moving beyond packet-based routing. How to build policies based on application telemetry and SLA metrics.', date: '2026-02-12', slug: 'app-fabric-routing-deep-dive' },
  { category: 'PRISMA SD-WAN', title: 'High Availability Design for ION Devices', description: 'Branch resilience patterns: Designing active/active and active/standby clusters for critical branch ION deployments.', date: '2026-02-05', slug: 'ion-device-high-availability' },
  { category: 'PRISMA SD-WAN', title: 'QoS and Traffic Shaping for Voice/Video', description: 'Guaranteeing Microsoft Teams and Zoom performance over degraded internet links using Prisma QoS capabilities.', date: '2026-01-28', slug: 'qos-traffic-shaping-sdwan' },
  { category: 'PRISMA SD-WAN', title: 'Integrating SD-WAN with Prisma Access', description: 'The SASE convergence: Automating IPSec tunnel creation between branch IONs and the Prisma Access cloud.', date: '2026-01-15', slug: 'integrating-sdwan-prisma-access' },

  // --- CORTEX XSOAR (5) ---
  { category: 'CORTEX XSOAR', title: 'Building Your First Phishing Triage Playbook', description: 'Stop wasting analyst hours on manual triage. Learn how to ingest and enrich indicators of compromise.', date: '2026-02-26', slug: 'phishing-triage-playbook' },
  { category: 'CORTEX XSOAR', title: 'Automating Endpoint Isolation via XDR', description: 'Closing the loop: Automatically isolating compromised hosts at wire-speed upon critical XDR alert generation.', date: '2026-02-18', slug: 'automating-endpoint-isolation' },
  { category: 'CORTEX XSOAR', title: 'Custom API Scripts: Threat Intel Feeds', description: 'Writing custom Python integrations to pull, parse, and score threat intelligence from third-party APIs.', date: '2026-02-08', slug: 'custom-api-threat-intel' },
  { category: 'CORTEX XSOAR', title: 'Automated Ransomware Containment', description: 'An aggressive playbook design for killing processes, isolating hosts, and notifying stakeholders.', date: '2026-01-30', slug: 'ransomware-containment-workflows' },
  { category: 'CORTEX XSOAR', title: 'Mastering the XSOAR War Room', description: 'Collaborative incident response: Utilizing War Room commands, evidence boards, and real-time chat.', date: '2026-01-22', slug: 'mastering-xsoar-war-room' },

  // --- CORTEX XDR (5) ---
  { category: 'CORTEX XDR', title: 'Tuning BIOCs to Reduce Alert Fatigue', description: 'Strategic modification of Behavioral Indicators of Compromise to silence noise while maintaining high fidelity.', date: '2026-02-22', slug: 'tuning-xdr-biocs' },
  { category: 'CORTEX XDR', title: 'Threat Hunting: Querying XQL for APTs', description: 'Advanced XDR Query Language (XQL) techniques for proactively discovering lateral movement and credential dumping.', date: '2026-02-14', slug: 'threat-hunting-xql' },
  { category: 'CORTEX XDR', title: 'Deploying XDR Agents at Enterprise Scale', description: 'Best practices for rolling out Cortex XDR agents globally using SCCM, Intune, and handling VDI environments.', date: '2026-02-04', slug: 'deploying-xdr-scale' },
  { category: 'CORTEX XDR', title: 'Analyzing Causality Chains', description: 'How to read XDR causality views to trace the exact lineage of an attack from delivery to execution.', date: '2026-01-27', slug: 'analyzing-causality-chains' },
  { category: 'CORTEX XDR', title: 'Integrating Identity Context (AD)', description: 'Enriching endpoint telemetry with identity context to instantly identify compromised privileged accounts.', date: '2026-01-19', slug: 'integrating-identity-context' },

  // --- STRATA NGFW (5) ---
  { category: 'STRATA NGFW', title: 'Migrating Rulebases using Expedition', description: 'A structural guide to cleanly translating Cisco ASA or Check Point rulebases into optimized App-ID policies.', date: '2026-02-24', slug: 'expedition-tool-migration' },
  { category: 'STRATA NGFW', title: 'SSL Forward Proxy Decryption at Scale', description: 'Overcoming the technical and political hurdles of deploying TLS/SSL decryption in enterprise environments.', date: '2026-02-16', slug: 'ssl-decryption-at-scale' },
  { category: 'STRATA NGFW', title: 'Active/Passive Cluster Engineering', description: 'Avoiding split-brain scenarios: LACP, HA links, and failover trigger optimization for Data Center firewalls.', date: '2026-02-06', slug: 'ha-cluster-engineering' },
  { category: 'STRATA NGFW', title: 'Optimizing App-ID and User-ID', description: 'Moving away from Layer 4 ports. Enforcing strict identity and application-based perimeters.', date: '2026-01-29', slug: 'optimizing-appid-userid' },
  { category: 'STRATA NGFW', title: 'Threat Prevention: Vulnerability Tuning', description: 'Applying strict security profiles without breaking production traffic using targeted packet captures.', date: '2026-01-21', slug: 'threat-prevention-tuning' },

  // --- CHECK POINT (10) ---
  { category: 'CHECK POINT', title: 'Maestro: Hyperscale Security Architecture', description: 'Designing linear, cloud-level scalability on-premise using Maestro Orchestrators and Security Groups.', date: '2026-02-25', slug: 'maestro-hyperscale-architecture' },
  { category: 'CHECK POINT', title: 'Upgrading MDSM Environments', description: 'A zero-downtime playbook for upgrading Provider-1/MDSM environments across global deployments.', date: '2026-02-17', slug: 'upgrading-mdsm' },
  { category: 'CHECK POINT', title: 'ClusterXL: Active-Active vs. Active-Passive', description: 'Architectural trade-offs and configuration deep-dives for Check Point high-availability deployments.', date: '2026-02-09', slug: 'clusterxl-deployments' },
  { category: 'CHECK POINT', title: 'Automating via Management API', description: 'Writing Python scripts to automate object creation, rule base modifications, and policy pushes via API.', date: '2026-02-02', slug: 'automating-management-api' },
  { category: 'CHECK POINT', title: 'Troubleshooting SecureXL and CoreXL', description: 'Identifying CPU spikes and optimizing hardware acceleration to maintain wire-speed throughput.', date: '2026-01-26', slug: 'troubleshooting-securexl-corexl' },
  { category: 'CHECK POINT', title: 'Implementing Identity Awareness (IDA)', description: 'Integrating AD Query and Identity Collectors to build granular user-based access control policies.', date: '2026-01-18', slug: 'identity-awareness-ida' },
  { category: 'CHECK POINT', title: 'Best Practices for IPS Profile Tuning', description: 'Balancing security and performance: How to tune Threat Prevention profiles to block critical CVEs.', date: '2026-01-12', slug: 'ips-profile-tuning' },
  { category: 'CHECK POINT', title: 'Migrating from Cisco ASA to Quantum', description: 'Translating legacy ACLs into Check Point inline layers using the SmartMove migration tool.', date: '2026-01-05', slug: 'cisco-asa-to-checkpoint' },
  { category: 'CHECK POINT', title: 'Site-to-Site VPNs: 3rd Party Interoperability', description: 'Debugging IKEv1/IKEv2 negotiations and encryption domain mismatches with non-Check Point peers.', date: '2025-12-28', slug: 'vpn-interoperability' },
  { category: 'CHECK POINT', title: 'Optimizing Gaia OS for High-Throughput', description: 'Under-the-hood Linux kernel tuning, interface bonding, and routing optimizations for Gaia OS.', date: '2025-12-20', slug: 'optimizing-gaia-os' },

  // --- FORTINET (10) ---
  { category: 'FORTINET', title: 'FortiGate SD-WAN: SLA Routing Strategies', description: 'Configuring SD-WAN rules based on latency, jitter, and packet loss metrics to ensure performance.', date: '2026-02-23', slug: 'fortigate-sdwan-sla-routing' },
  { category: 'FORTINET', title: 'Designing HA Security Fabrics', description: 'Building resilient FortiGate HA clusters (FGCP) and integrating them into the broader Security Fabric.', date: '2026-02-13', slug: 'fortinet-ha-security-fabric' },
  { category: 'FORTINET', title: 'FortiAnalyzer & FortiManager Integration', description: 'Centralized logging and policy orchestration: Best practices for managing fleet-wide FortiOS updates.', date: '2026-02-07', slug: 'fortianalyzer-fortimanager-workflows' },
  { category: 'FORTINET', title: 'Optimizing FortiOS SSL Inspection', description: 'Leveraging NP processors and certificate inspection to maintain throughput during deep packet inspection.', date: '2026-01-31', slug: 'fortios-ssl-inspection' },
  { category: 'FORTINET', title: 'Fortinet VDOMs: Multi-Tenant Architecture', description: 'Segmenting large chassis firewalls into Virtual Domains for isolated departmental routing.', date: '2026-01-24', slug: 'fortinet-vdom-architecture' },
  { category: 'FORTINET', title: 'Implementing ZTNA with FortiGate', description: 'Deploying the FortiClient EMS and configuring access proxies for on-premise Zero Trust Network Access.', date: '2026-01-16', slug: 'implementing-ztna-fortigate' },
  { category: 'FORTINET', title: 'Troubleshooting BGP over IPSec Tunnels', description: 'Resolving route advertisement failures and tunnel flapping in route-based VPN deployments.', date: '2026-01-10', slug: 'troubleshooting-bgp-ipsec' },
  { category: 'FORTINET', title: 'Automating Deployments using Terraform', description: 'Bootstrapping FortiGate configurations and policies using the FortiOS Terraform provider.', date: '2026-01-03', slug: 'automating-fortigate-terraform' },
  { category: 'FORTINET', title: 'Tuning FortiGate IPS for ICS/SCADA', description: 'Deploying robust industrial signatures to protect critical infrastructure without false positives.', date: '2025-12-25', slug: 'fortigate-ips-ics-scada' },
  { category: 'FORTINET', title: 'FortiGate Cloud vs. On-Premise ROI', description: 'A strategic analysis of management overhead, scaling, and operational costs for control planes.', date: '2025-12-15', slug: 'fortigate-cloud-vs-onpremise' },

  // --- ARCHITECTURE (10) ---
  { category: 'ARCHITECTURE', title: 'Zero Trust vs. Legacy VPN: The ROI', description: 'A structural comparison of traditional hub-and-spoke models versus modern cloud-delivered architectures.', date: '2026-01-20', slug: 'zero-trust-roi' },
  { category: 'ARCHITECTURE', title: 'Micro-Segmentation for East-West Traffic', description: 'Preventing lateral movement in the Data Center by architecting granular inter-VLAN segmentation.', date: '2026-02-21', slug: 'micro-segmentation-east-west' },
  { category: 'ARCHITECTURE', title: 'Securing Hybrid Cloud Connectivity', description: 'Architecture patterns for secure transit between on-premise networks, AWS Transit Gateways, and Azure vWANs.', date: '2026-02-11', slug: 'hybrid-cloud-connectivity' },
  { category: 'ARCHITECTURE', title: 'Architecture Patterns for PCI-DSS', description: 'Designing isolated Cardholder Data Environments (CDE) in the financial sector to simplify compliance audits.', date: '2026-02-03', slug: 'pci-dss-architecture-patterns' },
  { category: 'ARCHITECTURE', title: 'SASE Convergence: Consolidating Edge Security', description: 'The strategic framework for unifying SD-WAN, CASB, SWG, and ZTNA under a single architectural umbrella.', date: '2026-01-23', slug: 'sase-convergence-edge' },
  { category: 'ARCHITECTURE', title: 'OT/IT Convergence: Securing Manufacturing', description: 'Implementing the Purdue Model and air-gapping strategies for critical industrial control systems (ICS).', date: '2026-01-14', slug: 'ot-it-convergence-security' },
  { category: 'ARCHITECTURE', title: 'BGP Route Hijacking Prevention', description: 'Securing the internet edge: Implementing RPKI and strict route filtering to prevent traffic misdirection.', date: '2026-01-08', slug: 'bgp-route-hijacking-prevention' },
  { category: 'ARCHITECTURE', title: 'DNS Security: Preventing C2 Callbacks', description: 'Architecting sinkholes, DNS-over-HTTPS inspection, and advanced threat intelligence at the DNS layer.', date: '2026-01-02', slug: 'dns-security-c2-prevention' },
  { category: 'ARCHITECTURE', title: 'Data Center Spine-Leaf Topologies', description: 'Integrating high-throughput NGFWs into modern Cisco ACI or Arista spine-leaf fabrics without bottlenecks.', date: '2025-12-22', slug: 'spine-leaf-security-topologies' },
  { category: 'ARCHITECTURE', title: 'Developing a CSPM Strategy', description: 'Cloud Security Posture Management: Architecting automated compliance tracking in multi-cloud deployments.', date: '2025-12-10', slug: 'developing-cspm-strategy' }
];

export default function KnowledgeBase() {
  // STATE: This tracks which tab is currently selected
  const [activeTab, setActiveTab] = useState('ALL ARTICLES');

  // FILTER LOGIC: Decides which articles to show based on the active tab
  const filteredArticles = articles.filter(article => {
    if (activeTab === 'ALL ARTICLES') return true;
    
    // Group all Palo Alto products under one tab
    if (activeTab === 'PALO ALTO') {
      return ['PRISMA ACCESS', 'PRISMA SD-WAN', 'CORTEX XSOAR', 'CORTEX XDR', 'STRATA NGFW'].includes(article.category);
    }
    
    // For Check Point, Fortinet, and Architecture, match exactly
    return article.category === activeTab;
  });

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-[#000814] selection:bg-[#FFC300] selection:text-[#000814] pb-24">

      {/* 1. KNOWLEDGE BASE HEADER */}
      <section className="w-full pt-32 pb-14 px-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-[#000814] to-[#000814]">
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6">
          Technical <span className="text-slate-500">Knowledge Base</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          Real-world guides, troubleshooting playbooks, and architecture insights from 15 years in production environments.
        </p>
      </section>

      {/* 2. INTERACTIVE FILTER TABS */}
      <nav className="w-full border-y border-white/10 bg-[#001D3D]/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-wrap justify-start md:justify-center items-center gap-5 md:gap-10 py-5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['ALL ARTICLES', 'PALO ALTO', 'CHECK POINT', 'FORTINET', 'ARCHITECTURE'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all pb-1 border-b-2
                ${activeTab === tab
                  ? 'text-[#FFC300] border-[#FFC300]'
                  : 'text-slate-500 border-transparent hover:text-white hover:border-white/30'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. DYNAMIC ARTICLE GRID */}
      <section className="w-full max-w-[1200px] mx-auto px-8 py-16 min-h-[600px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">

          {filteredArticles.map((article, index) => (
            <div key={index} className="bg-[#003566]/40 border border-[#003566] p-7 flex flex-col h-full hover:border-[#FFC300]/50 transition-all duration-500 shadow-2xl relative group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500"></div>

              <span className="text-[#FFC300] font-mono text-xs font-black uppercase tracking-widest mb-4 block">
                {article.category}
              </span>

              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight leading-tight group-hover:text-[#FFD60A] transition-colors">
                {article.title}
              </h2>

              <p className="text-base text-slate-400 font-light leading-relaxed mb-6 flex-grow">
                {article.description}
              </p>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                  {article.date}
                </span>
                <Link href={`/knowledge-base/${article.slug}`} className="text-[#FFC300] font-bold uppercase tracking-widest text-xs flex items-center gap-2 group/link hover:text-[#FFD60A] transition-colors">
                  READ <span className="transition-transform group-hover/link:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}

        </div>

        {/* Empty State Fallback */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-2xl text-white font-bold mb-4">No articles found in this category.</h3>
            <button onClick={() => setActiveTab('ALL ARTICLES')} className="text-[#FFC300] hover:underline">Return to All Articles</button>
          </div>
        )}
      </section>

    </main>
  );
}