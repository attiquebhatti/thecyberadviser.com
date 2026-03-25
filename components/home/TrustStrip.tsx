'use client';

import { motion } from 'framer-motion';
export function TrustStrip() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-obsidian-950" />
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[#FFC300]/[0.03] blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[#FFC300] text-sm font-bold uppercase tracking-[0.3em] mb-4">
            Expertise Across Platforms
          </p>
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-[#FFC300] to-transparent" />
        </div>

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
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6"
        >
          {[
            'Palo Alto Networks',
            'Microsoft Azure',
            'Amazon Web Services',
            'Google Cloud',
            'Zscaler',
            'CrowdStrike',
          ].map((platform) => (
            <motion.div
              key={platform}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl transition-all duration-500 hover:border-[#FFC300]/40 shadow-2xl"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#FFC300]/0 group-hover:bg-[#FFC300] transition-colors duration-500" />
              <span className="text-slate-400 text-xs md:text-sm font-bold text-center tracking-wide group-hover:text-white transition-colors">
                {platform}
              </span>
              <div className="mt-3 w-1.5 h-1.5 rounded-full bg-[#FFC300]/10 group-hover:bg-[#FFC300] group-hover:shadow-[0_0_10px_#FFC300] transition-all duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
