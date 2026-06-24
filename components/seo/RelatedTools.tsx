// Internal linking: surface relevant tools on a blog post, chosen by topic.
import Link from 'next/link';

type Tool = { href: string; name: string; desc: string };

const TOOLS: Record<string, Tool> = {
  siem: { href: '/tools/siem-sizing', name: 'SIEM Sizing Calculator', desc: 'Estimate SIEM/SOAR storage, compute, and architecture.' },
  cyberquiz: { href: '/tools/cyberquiz', name: 'CyberQuiz', desc: 'Practice with curated PANW, Check Point, and F5 question banks.' },
  prisma: { href: '/tools/prisma-access-sizing', name: 'Prisma Access Sizing', desc: 'Size Prisma Access for mobile users, branches, and ZTNA.' },
  migration: { href: '/tools/unified-migration', name: 'Unified Migration', desc: 'Convert firewall configs across vendors and to Prisma Access / SCM.' },
  chatbot: { href: '/tools/ai-chatbot', name: 'AI Training Chatbot', desc: 'Ask follow-up questions about course content, in Attique’s voice.' },
};

function pickTools(topic: string): Tool[] {
  const t = (topic || '').toUpperCase();
  if (/CORTEX|XSIAM|XSOAR|XDR|SIEM|SOC|SOAR|INCIDENT/.test(t)) return [TOOLS.siem, TOOLS.cyberquiz];
  if (/PRISMA|SASE|SD-?WAN|SSE|CLOUD/.test(t)) return [TOOLS.prisma, TOOLS.migration];
  if (/ZERO TRUST|ARCHITECTURE|NGFW|FIREWALL|MIGRAT|SEGMENT/.test(t)) return [TOOLS.migration, TOOLS.prisma];
  return [TOOLS.cyberquiz, TOOLS.chatbot];
}

export default function RelatedTools({ topic }: { topic: string }) {
  const tools = pickTools(topic);
  return (
    <section className="mt-16 max-w-[820px] mx-auto w-full px-6">
      <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[#FFC300] mb-5">Related tools</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#FFC300]/40 hover:bg-white/[0.05] p-5 transition-all"
          >
            <p className="text-white font-semibold group-hover:text-[#FFC300] transition-colors">{tool.name}</p>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{tool.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
