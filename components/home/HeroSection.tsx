'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CTAButton } from '@/components/shared/CTAButton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  { 
    src: '/images/home-architecture2.jpg', 
    title: 'Enterprise Security Reference Design',
    focus: 'Enterprise Sec',
    platforms: 'Multi-Vendor',
    strategy: 'Zero Trust'
  },
  { 
    src: '/images/slides/slide-1.png', 
    title: 'Cortex XSOAR: Unified Security Orchestration',
    focus: 'Automation',
    platforms: 'Cortex XSOAR',
    strategy: 'SOC Ops'
  },
  { 
    src: '/images/slides/slide-2.png', 
    title: 'Intelligent WAN Resilience',
    focus: 'Networking',
    platforms: 'Prisma SD-WAN',
    strategy: 'WAN Resilience'
  },
  { 
    src: '/images/slides/slide-3.png', 
    title: 'SASE Architecture Design',
    focus: 'Cloud Security',
    platforms: 'Prisma Access',
    strategy: 'SASE Adoption'
  },
  { 
    src: '/images/slides/slide-4.png', 
    title: 'Cortex XDR Visibility',
    focus: 'Detection',
    platforms: 'Cortex XDR',
    strategy: 'XDR Evolution'
  },
  { 
    src: '/images/slides/slide-5.png', 
    title: 'Advanced Network Telemetry',
    focus: 'Visibility',
    platforms: 'Network Ops',
    strategy: 'Deep Analysis'
  },
  { 
    src: '/images/slides/slide-6.png', 
    title: 'Prisma Access Workflow',
    focus: 'Edge Security',
    platforms: 'SASE / Cloud',
    strategy: 'Global Scale'
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden pt-24 pb-12 md:pt-28 md:pb-14 lg:pt-32 lg:pb-16">
      {/* Background stays the same */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#000814]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[1400px] bg-gradient-radial from-[#FFC300]/[0.05] via-transparent to-transparent" />
        <div className="absolute top-1/4 right-0 h-[600px] w-[600px] bg-gradient-radial from-[#003566]/[0.16] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
        >
          <div className="max-w-4xl">
            <motion.div 
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 }
              }}
              className="mb-6 inline-flex items-center gap-3"
            >
              <div className="h-px w-12 bg-gradient-to-r from-[#FFC300] to-[#FFC300]/0" />
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FFC300]">
                Cybersecurity Advisory
              </span>
            </motion.div>

            <motion.h1 
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
            >
              Architecting
              <br />
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[#FFD60A] via-[#FFC300] to-[#e59b00] bg-clip-text text-transparent">
                  Enterprise Security
                </span>
              </span>
              <br />
              <span className="text-slate-400">for the Modern Era</span>
            </motion.h1>

            <motion.p 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-6 max-w-2xl text-xl font-light leading-relaxed text-slate-400 md:text-2xl"
            >
              Strategic advisory for global enterprises navigating Zero Trust
              transformation, SASE architecture, and security modernization at scale.
            </motion.p>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <CTAButton href="/contact" variant="primary" size="lg">
                Schedule Consultation
              </CTAButton>
              <CTAButton
                href="/knowledge-base"
                variant="secondary"
                size="lg"
                showArrow
              >
                Explore Insights
              </CTAButton>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative group"
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-[#FFC300]/8 via-transparent to-[#FFC300]/4 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-obsidian-900/40 backdrop-blur-xl p-1 shadow-2xl transition-all duration-500 group-hover:border-[#FFC300]/40 group-hover:shadow-[#FFC300]/5 group-hover:scale-[1.01]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFC300]/20 group-hover:bg-[#FFC300] transition-colors duration-500 z-20" />
              
              <div className="overflow-hidden rounded-[calc(1rem+4px)] bg-obsidian-950">
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FFC300]">
                      Technical Architecture Preview
                    </p>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={currentSlide}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-1 text-sm font-medium text-slate-200"
                      >
                        {slides[currentSlide].title}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-2 items-center ml-4">
                    <button onClick={prevSlide} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-1.5 px-1">
                      {slides.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setCurrentSlide(i)}
                          className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-5 bg-[#FFC300]' : 'w-1 bg-[#FFC300]/20'}`}
                        />
                      ))}
                    </div>
                    <button onClick={nextSlide} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-[16/10] bg-black">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                      className="absolute inset-0 p-3 md:p-4"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/[0.04] bg-obsidian-950 shadow-inner">
                        <Image
                          src={slides[currentSlide].src}
                          alt={slides[currentSlide].title}
                          fill
                          priority
                          className="object-contain object-center transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-white/[0.06] bg-white/[0.01] px-5 py-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`meta-${currentSlide}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="contents"
                    >
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Focus</p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">{slides[currentSlide].focus}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Platforms</p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">{slides[currentSlide].platforms}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FFC300]/60">Strategy</p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">{slides[currentSlide].strategy}</p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
