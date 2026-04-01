"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const blogs = [
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
  }
];

function BlogsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('ALL BLOGS');

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      const normalizedCategory = category.toUpperCase().replace('+', ' ');
      const validTabs = ['ALL BLOGS', 'STRATA', 'PRISMA', 'CORTEX', 'PANORAMA'];
      if (validTabs.includes(normalizedCategory)) {
        setActiveTab(normalizedCategory);
      } else {
        setActiveTab('ALL BLOGS');
      }
    }
  }, [searchParams]);

  const filteredBlogs = blogs.filter(blog => {
    if (activeTab === 'ALL BLOGS') return true;
    if (activeTab === 'PRISMA') {
      return ['PRISMA ACCESS', 'PRISMA SD-WAN', 'PRISMA SASE'].includes(blog.category);
    }
    if (activeTab === 'CORTEX') {
      return ['CORTEX XDR', 'XSOAR', 'XSIAM'].includes(blog.category);
    }
    return blog.category === activeTab;
  });

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-[#000814] selection:bg-[#FFC300] selection:text-[#000814] pb-24">
      <section className="w-full pt-32 pb-14 px-8 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-[#000814] to-[#000814]">
        <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter mb-6">
          Security <span className="text-[#FFC300]">Insights Blog</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          The latest perspectives on Palo Alto Networks solutions, cybersecurity trends, and enterprise-grade resilience.
        </p>
      </section>

      <nav className="w-full border-y border-white/10 bg-[#001D3D]/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-8 flex flex-wrap justify-start md:justify-center items-center gap-5 md:gap-10 py-5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['ALL BLOGS', 'STRATA', 'PRISMA', 'CORTEX', 'PANORAMA'].map((tab) => (
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
          {filteredBlogs.map((blog, index) => (
            <motion.div 
              key={index}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-obsidian-900/40 backdrop-blur-xl border-t border-l border-white/10 border-b border-r border-black/60 p-7 flex flex-col h-full hover:border-[#FFC300]/50 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_20px_40px_rgba(0,0,0,0.4)] relative group rounded-2xl overflow-hidden hover:shadow-[#FFC300]/10"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 rounded-t-2xl"></div>
              <span className="text-[#FFC300] font-mono text-xs font-black uppercase tracking-widest mb-4 block">
                {blog.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight leading-tight group-hover:text-[#FFD60A] transition-colors">
                {blog.title}
              </h2>
              <p className="text-base text-slate-400 font-light leading-relaxed mb-6 flex-grow">
                {blog.description}
              </p>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                  {blog.date}
                </span>
                <Link href={`/blogs/${blog.slug}`} className="text-[#FFC300] font-bold uppercase tracking-widest text-xs flex items-center gap-2 group/link hover:text-[#FFD60A] transition-colors">
                  READ ARTICLE <span className="transition-transform group-hover/link:translate-x-1">→</span>
                </Link>
              </div>
            </motion.div>
          ))}
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
