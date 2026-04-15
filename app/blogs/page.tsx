"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const blogs = [
  {
    category: 'XSOAR',
    title: '🔐 Why Cortex XSOAR Is Transforming Modern SOC Operations',
    description: 'Modern SOCs are overwhelmed by fragmented tools. Explore how Cortex XSOAR acts as the central nervous system to automate investigation, enrichment, and response.',
    date: '2026-04-15',
    slug: 'cortex-xsoar-transforming-soc-operations'
  },
  {
    category: 'CORTEX XDR',
    title: 'Securing the Agentic Endpoint with Cortex XDR',
    description: 'Your endpoint just became an AI agent. Autonomous AI agents, self-executing workflows, and AI copilots are running directly on your endpoints — and attackers are evolving to exploit them.',
    date: '2026-04-15',
    slug: 'securing-agentic-endpoint-cortex-xdr'
  },
  {
    category: 'PRISMA SASE',
    title: '⚛️ Quantum Computing is Coming: Why Most Security Teams Aren’t Ready',
    description: 'Quantum computing is moving from research labs to real-world capability. When it reaches scale, it could break today\'s cryptographic foundations. Are you ready?',
    date: '2024-04-14',
    slug: 'quantum-computing-cybersecurity-readiness'
  },
  {
    category: 'CORTEX CLOUD',
    title: 'What Is Palo Alto Networks Cortex Cloud? A Technical Guide',
    description: 'A practical code-to-cloud-to-SOC guide covering Cortex Cloud architecture, capabilities, use cases, and rollout priorities.',
    date: '2026-04-06',
    slug: 'what-is-palo-alto-networks-cortex-cloud'
  },
  { 
    category: 'STRATA', 
    title: 'Strata Next-Gen Firewalls: The Foundation of Zero Trust', 
    description: 'Explore why Palo Alto Networks Strata is more than just a firewall—it\'s the critical enforcement point for modern security architectures.', 
    date: '2026-03-15', 
    slug: 'strata-next-gen-firewalls' 
  },
  { 
    category: 'PANORAMA', 
    title: 'Centralized Mastery with Panorama: Fleet Management at Scale', 
    description: 'Learn how to streamline security operations across thousands of firewalls using advanced Panorama templates and device groups.', 
    date: '2026-03-10', 
    slug: 'panorama-centralized-mastery' 
  },
  { 
    category: 'PRISMA ACCESS', 
    title: 'The SASE Revolution: Consolidating Security with Prisma Access', 
    description: 'A deep dive into how Prisma Access provides consistent security for the hybrid workforce without the latency of traditional VPNs.', 
    date: '2026-03-05', 
    slug: 'prisma-access-sase-revolution' 
  },
  { 
    category: 'CORTEX XDR', 
    title: 'AI-Driven Defense: Mastering Threat Detection with Cortex XDR', 
    description: 'Moving beyond endpoint security. How Cortex XDR stiches together network, endpoint, and cloud telemetry to stop sophisticated attacks.', 
    date: '2026-02-28', 
    slug: 'cortex-xdr-ai-defense' 
  },
  { 
    category: 'XSOAR', 
    title: 'Automating the SOC: Building Resilient Playbooks in XSOAR', 
    description: 'Stop chasing alerts. Learn how to automate incident response workflows and reduce MTTR from hours to minutes with Cortex XSOAR.', 
    date: '2026-02-20', 
    slug: 'automating-soc-xsoar' 
  },
  { 
    category: 'PRISMA SD-WAN', 
    title: 'Cloud-Gen SD-WAN: Beyond Traditional Routing with Prisma', 
    description: 'How Prisma SD-WAN (formerly CloudGenix) uses application-defined policies to transform branch connectivity and performance.', 
    date: '2026-02-15', 
    slug: 'prisma-sd-wan-cloud-gen' 
  },
  { 
    category: 'XSIAM', 
    title: 'The Future of SecOps: Cortex XSIAM and the Autonomous SOC', 
    description: 'An architectural look at how Cortex XSIAM is redefining the SIEM category with integrated data science and automation.', 
    date: '2026-02-10', 
    slug: 'future-secops-xsiam' 
  },
  { 
    category: 'PRISMA SASE', 
    title: 'Prisma SASE: The Convergence of Networking and Security', 
    description: 'Why a unified SASE approach is essential for the modern enterprise, and how Prisma SASE delivers on the promise of the cloud-delivered edge.', 
    date: '2026-02-05', 
    slug: 'prisma-sase-convergence' 
  },
  {
    category: 'ZERO TRUST',
    title: 'From Legacy VPN to ZTNA: A Phased Migration Strategy',
    description: 'A practical roadmap for transitioning from traditional VPN infrastructure to Zero Trust Network Access without disrupting business operations.',
    date: '2024-02-15',
    slug: 'legacy-vpn-to-ztna-the-migration-plan'
  },
  {
    category: 'CLOUD SECURITY',
    title: 'CSPM Implementation: Building Continuous Cloud Visibility',
    description: 'Strategies for deploying and operationalizing Cloud Security Posture Management to maintain compliance and reduce risk across multi-cloud environments.',
    date: '2024-02-01',
    slug: 'cloud-security-posture-management'
  },
  {
    category: 'ARCHITECTURE',
    title: 'Security Architecture Review: A Structured Assessment Methodology',
    description: 'A comprehensive framework for evaluating enterprise security architectures, identifying gaps, and developing strategic remediation roadmaps.',
    date: '2024-01-20',
    slug: 'security-architecture-review-methodology'
  },
];

function BlogsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('ALL BLOGS');

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      const normalizedCategory = category.toUpperCase().replace(/\+/g, ' ').replace(/%20/g, ' ');
      const validTabs = ['ALL BLOGS', 'STRATA NGFW', 'PRISMA SASE', 'CORTEX PLATFORM', 'PANORAMA'];
      if (validTabs.includes(normalizedCategory)) {
        setActiveTab(normalizedCategory);
      } else {
        setActiveTab('ALL BLOGS');
      }
    }
  }, [searchParams]);

  const filteredBlogs = blogs.filter(blog => {
    if (activeTab === 'ALL BLOGS') return true;
    if (activeTab === 'STRATA NGFW') {
      return blog.category === 'STRATA';
    }
    if (activeTab === 'PRISMA SASE') {
      return ['PRISMA ACCESS', 'PRISMA SD-WAN', 'PRISMA SASE'].includes(blog.category);
    }
    if (activeTab === 'CORTEX PLATFORM') {
      return ['CORTEX CLOUD', 'CORTEX XDR', 'XSOAR', 'XSIAM'].includes(blog.category);
    }
    return blog.category === activeTab;
  });

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-[#000814] selection:bg-[#6BD348] selection:text-[#000814] pb-24">
      <section className="w-full pt-32 pb-14 px-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-[#000814] to-[#000814]">
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6">
          Security <span className="text-[#6BD348]">Insights Blog</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          The latest perspectives on Palo Alto Networks solutions, cybersecurity trends, and enterprise-grade resilience.
        </p>
      </section>

      <nav className="w-full border-y border-white/10 bg-[#001D3D]/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-wrap justify-start md:justify-center items-center gap-5 md:gap-10 py-5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['ALL BLOGS', 'STRATA NGFW', 'PRISMA SASE', 'CORTEX PLATFORM', 'PANORAMA'].map((tab) => {
            const isCortexTab = tab === 'CORTEX PLATFORM';
            const tabColor = isCortexTab ? '#6BD348' : '#FFC300';
            return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-bold uppercase tracking-[0.2em] text-xs md:text-sm transition-all pb-1 border-b-2
                ${activeTab === tab
                  ? 'border-transparent'
                  : 'text-slate-500 border-transparent hover:text-white hover:border-white/30'}`}
              style={activeTab === tab ? { color: tabColor, borderColor: tabColor } : {}}
            >
              {tab}
            </button>
            );
          })}
        </div>
      </nav>

      <section className="w-full max-w-[1200px] mx-auto px-8 py-16 min-h-[600px]">
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
        >
          {filteredBlogs.map((blog, index) => {
            const isCortex = ['CORTEX CLOUD', 'CORTEX XDR', 'XSOAR', 'XSIAM'].includes(blog.category);
            const isZeroTrust = blog.category === 'ZERO TRUST';
            const accentColor = isCortex ? '#6BD348' : '#FFC300';
            const accentColorHex = isCortex ? 'bg-[#6BD348]' : 'bg-[#FFC300]';
            const accentColorBorder = isCortex ? 'hover:border-[#6BD348]/50' : 'hover:border-[#FFC300]/50';
            const accentColorShadow = isCortex ? 'hover:shadow-[#6BD348]/10' : 'hover:shadow-[#FFC300]/10';
            const accentColorText = isCortex ? 'text-[#6BD348]' : 'text-[#FFC300]';
            const accentColorOpacity = isCortex ? 'bg-[#6BD348]/20' : 'bg-[#FFC300]/20';
            
            return (
              <Link href={`/blogs/${blog.slug}`} key={index}>
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-white/[0.06] bg-obsidian-900/40 backdrop-blur-xl transition-all duration-500 hover:border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                  style={{
                    boxShadow: `inset 0 1px 1px rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.4), inset 0 0 30px ${accentColor}10`,
                  }}
                >
                  {/* Featured Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${isCortex ? 'from-[#6BD348]/20' : 'from-[#FFC300]/20'} to-transparent z-10 opacity-60`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-transparent z-10 opacity-80" />
                    <img 
                      src={blog.image || `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop`} 
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Floating Category Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-3 py-1.5 rounded-full border border-white/10 bg-obsidian-950/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                        {blog.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex flex-col flex-grow relative">
                    <div 
                      className="absolute top-0 left-0 w-full h-1 group-hover:h-1.5 transition-all duration-500"
                      style={{ backgroundColor: accentColor }}
                    ></div>

                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight leading-tight group-hover:text-white transition-colors mt-2">
                      {blog.title}
                    </h2>
                    
                    <p className="text-base text-slate-400 font-light leading-relaxed mb-8 flex-grow">
                      {blog.excerpt || blog.description}
                    </p>

                    <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                          {blog.date}
                        </span>
                        <span className="text-slate-600 text-[10px] uppercase tracking-widest font-bold mt-1">
                          {blog.readTime || '5 min read'}
                        </span>
                      </div>
                      
                      <div 
                        className="font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 transition-all duration-300"
                        style={{ color: accentColor }}
                      >
                        READ <span className="hidden sm:inline">FULL</span> ARTICLE 
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </motion.div>

        {filteredBlogs.length === 0 && (
          <div className="text-center py-20">
            <h3 className="text-2xl text-white font-bold mb-4">No blog posts found.</h3>
            <button onClick={() => setActiveTab('ALL BLOGS')} className="text-[#FFC300] hover:underline">Return to All Blogs</button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function Blogs() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000814]" />}>
      <BlogsContent />
    </Suspense>
  );
}
