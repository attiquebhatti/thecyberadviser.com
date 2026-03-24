import Link from 'next/link';
import React from 'react';

// ==========================================
// THE CONTENT DICTIONARY
// ==========================================
const articleContent: Record<string, React.ReactNode> = {
  
  // 1. ARCHITECTURE: Hybrid Cloud Connectivity
  'hybrid-cloud-connectivity': (
    <div className="space-y-8 text-lg text-slate-300 font-light leading-relaxed">
      <p className="text-xl text-white font-medium">
        As enterprises expand beyond on-premise data centers, routing traffic efficiently between branch offices, AWS Transit Gateways, and Azure vWANs becomes a massive architectural bottleneck.
      </p>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">The Hairpinning Problem</h3>
      <p>
        Legacy hub-and-spoke models force cloud-destined traffic back through an on-premise NGFW for inspection. This creates a "hairpin" effect, drastically increasing latency and overwhelming the core firewall's throughput capacity.
      </p>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Architecture Solution: Cloud-Native Transit</h3>
      <ul className="space-y-4 list-disc pl-6 text-slate-400">
        <li><strong className="text-white">AWS Transit Gateway (TGW):</strong> Deploy virtualized NGFWs (e.g., VM-Series) in a dedicated Security VPC. Route all East-West (VPC-to-VPC) and North-South (Internet-to-VPC) traffic through this inspection fleet using TGW route tables.</li>
        <li><strong className="text-white">Azure Virtual WAN (vWAN):</strong> Utilize a secured virtual hub. By placing a centralized security appliance within the vWAN hub, you achieve unified routing and security policy enforcement without backhauling to physical data centers.</li>
        <li><strong className="text-white">BGP Dynamic Routing:</strong> Establish BGP over IPSec between your SD-WAN edge and the cloud gateways to ensure dynamic failover and optimal path selection.</li>
      </ul>
      <div className="bg-executive-charcoal/50 p-6 border-l-4 border-accent-gold mt-8">
        <h4 className="text-accent-gold font-bold uppercase tracking-widest text-sm mb-2">Consultant's Note</h4>
        <p className="text-base">Always utilize ECMP (Equal-Cost Multi-Path) routing across multiple IPSec tunnels terminating in the cloud to scale beyond the standard 1.25 Gbps tunnel limitation in AWS.</p>
      </div>
    </div>
  ),

  // 2. PRISMA ACCESS: Optimizing Split-Tunneling
  'prisma-split-tunneling': (
    <div className="space-y-8 text-lg text-slate-300 font-light leading-relaxed">
      <p className="text-xl text-white font-medium">
        Sending 100% of remote user traffic through a cloud security gateway ensures absolute visibility, but it can cripple high-bandwidth, low-risk applications like Zoom and Microsoft Teams.
      </p>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">The Case for Split-Tunneling</h3>
      <p>
        In a Prisma Access deployment, the GlobalProtect agent routes traffic to the nearest Mobile User Gateway (MUG). However, Unified Communications as a Service (UCaaS) traffic is latency-sensitive and inherently encrypted. Inspecting this traffic adds milliseconds of delay and consumes massive SPN compute resources for zero security gain.
      </p>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Execution Strategy</h3>
      <ul className="space-y-4 list-disc pl-6 text-slate-400">
        <li><strong className="text-white">Exclude by App-ID:</strong> Instead of relying on brittle IP-based exclusions, use Palo Alto's App-ID. Exclude applications like `ms-teams-audio`, `ms-teams-video`, and `zoom-base` directly in the GlobalProtect Gateway settings.</li>
        <li><strong className="text-white">Exclude by Video Domains:</strong> Create a custom URL category for streaming services (e.g., YouTube, Netflix) and apply it to the split-tunnel exclude list to prevent recreational bandwidth from saturating your Prisma licenses.</li>
      </ul>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Verification</h3>
      <p>
        Post-deployment, instruct users to check their GlobalProtect client statistics. The "Direct Access" tab should reflect the bypassed domains, and your Prisma Access dashboard should show a significant drop in sustained throughput.
      </p>
    </div>
  ),

  // 3. CORTEX XSOAR: Phishing Triage Playbook
  'phishing-triage-playbook': (
    <div className="space-y-8 text-lg text-slate-300 font-light leading-relaxed">
      <p className="text-xl text-white font-medium">
        Phishing remains the primary vector for credential theft. Manual triage takes a SOC analyst an average of 45 minutes per email. With Cortex XSOAR, we reduce this MTTR to under 3 minutes.
      </p>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Playbook Architecture</h3>
      <p>
        A production-grade phishing playbook must operate autonomously through ingestion, enrichment, and containment before engaging a human analyst.
      </p>
      <ul className="space-y-4 list-decimal pl-6 text-slate-400">
        <li><strong className="text-white">Ingestion:</strong> Configure the IMAP or EWS integration to monitor the `phishing@company.com` abuse inbox. Map email headers, body, and attachments to incident fields.</li>
        <li><strong className="text-white">Indicator Extraction:</strong> Run the `ExtractIndicators` script to pull URLs, IPs, domains, and file hashes from the email body and attachments.</li>
        <li><strong className="text-white">Enrichment:</strong> Automatically cross-reference extracted indicators against VirusTotal, CrowdStrike Falcon, and Palo Alto AutoFocus.</li>
        <li><strong className="text-white">Detonation:</strong> Send unverified attachments to a WildFire sandbox for dynamic analysis.</li>
      </ul>
      <h3 className="text-2xl font-bold text-white mt-12 mb-4">Automated Response Actions</h3>
      <p>
        If the enrichment phase returns a Malicious verdict (Score: 3), the playbook immediately executes containment logic:
      </p>
      {/* ERROR FIXED BELOW: Safely wrapped the XSOAR variables in string literals */}
      <div className="bg-executive-obsidian p-6 border border-white/10 font-mono text-sm text-accent-gold overflow-x-auto">
        1. !ad-disable-account username="{"${incident.reportedby}"}"<br/>
        2. !panorama-block-ip ip="{"${incident.malicious_ips}"}"<br/>
        3. !exchange-search-and-delete message-id="{"${incident.emailmessageid}"}"
      </div>
    </div>
  )
};

export async function generateStaticParams() {
  return [
    { slug: 'hybrid-cloud-connectivity' },
    { slug: 'prisma-split-tunneling' },
    { slug: 'phishing-triage-playbook' },
  ];
}

// ==========================================
// PAGE COMPONENT
// ==========================================
export default function ArticlePage({ params }: { params: { slug: string } }) {
  
  const currentSlug = params.slug;
  const formattedTitle = currentSlug.replace(/-/g, ' ').toUpperCase();
  
  const hasContent = articleContent[currentSlug] !== undefined;

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-executive-obsidian selection:bg-accent-gold selection:text-executive-obsidian pb-24">
      
      {/* ARTICLE HEADER */}
      <section className="w-full pt-40 pb-20 px-8 text-center border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-executive-charcoal via-executive-obsidian to-executive-obsidian">
        <div className="max-w-[1000px] mx-auto">
          <Link href="/knowledge-base" className="text-accent-gold font-mono text-xs font-bold uppercase tracking-widest mb-8 inline-block hover:text-white transition-colors">
            ← Back to Knowledge Base
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tighter mb-8 leading-tight">
            {formattedTitle}
          </h1>
        </div>
      </section>

      {/* ARTICLE CONTENT RENDERER */}
      <section className="w-full max-w-[900px] mx-auto px-8 py-24">
        {hasContent ? (
          <article className="prose prose-invert prose-lg max-w-none">
            {articleContent[currentSlug]}
          </article>
        ) : (
          <div className="bg-executive-charcoal/30 border border-white/10 p-12 md:p-20 text-center rounded-sm">
            <span className="text-accent-gold text-4xl mb-6 block">⚡</span>
            <h3 className="text-3xl font-bold text-white mb-4">Module Under Construction</h3>
            <p className="text-lg text-slate-400 font-light leading-relaxed max-w-2xl mx-auto">
              This specific playbook is currently being transcribed from field notes to the digital Knowledge Base. 
              If you require immediate consulting regarding this architecture, please initiate an engagement.
            </p>
            <div className="mt-12">
              <Link href="/contact" className="inline-block px-10 py-4 bg-accent-gold text-executive-obsidian font-black text-sm hover:bg-accent-bright transition-all shadow-xl uppercase tracking-widest">
                Request Direct Consultation
              </Link>
            </div>
          </div>
        )}
      </section>

    </main>
  );
}