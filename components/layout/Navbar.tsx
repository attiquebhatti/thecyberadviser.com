'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  {
    href: '/about',
    label: 'About',
    activePaths: ['/about', '/portfolio'],
    children: [
      { href: '/about', label: 'About The Cyber Adviser', description: 'Background, focus areas, and advisory approach' },
      { href: '/portfolio?filter=Prisma+Access', label: 'Prisma Access', description: 'Cloud-delivered security' },
      { href: '/portfolio?filter=Prisma+SD-WAN', label: 'Prisma SD-WAN', description: 'Branch transformation' },
      { href: '/portfolio?filter=Cortex+XSOAR', label: 'Cortex Operations', description: 'Automation and XDR' },
      { href: '/portfolio?filter=Palo+Alto+NGFW', label: 'Network Security', description: 'NGFW and segmentation' },
    ]
  },
  { href: '/services', label: 'Services' },
  { 
    href: '/knowledge-base', 
    label: 'Knowledge Base',
    children: [
      { href: '/knowledge-base?category=PALO+ALTO', label: 'Palo Alto Networks', description: 'Prisma, Cortex, and Strata' },
      { href: '/knowledge-base?category=CHECK+POINT', label: 'Check Point', description: 'Infinity and Quantum solutions' },
      { href: '/knowledge-base?category=FORTINET', label: 'Fortinet', description: 'Security Fabric and FortiGate' },
      { href: '/knowledge-base?category=ARCHITECTURE', label: 'Architecture', description: 'Zero Trust and SASE patterns' },
    ]
  },
  { 
    href: '/blogs', 
    label: 'Blogs',
    children: [
      { href: '/blogs?category=STRATA', label: 'Strata Security', description: 'NGFW and network resilience' },
      { href: '/blogs?category=PRISMA', label: 'Prisma SASE', description: 'Coud-delivered network security' },
      { href: '/blogs?category=CORTEX', label: 'Cortex Operations', description: 'AI-driven detection and response' },
      { href: '/blogs?category=PANORAMA', label: 'Network Management', description: 'Centralized policy orchestration' },
    ]
  },
  { 
    href: '/tools', 
    label: 'Tools',
    children: [
      { href: '/tools', label: 'Unified Migration', description: 'Firewall config converter' }
    ]
  },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const pathname = usePathname();

  const isItemActive = (item: (typeof navItems)[number]) => {
    const paths = item.activePaths ?? [item.href];
    return !!pathname && paths.some((path) => pathname === path || (path !== '/' && pathname.startsWith(path)));
  };

  const toggleExpanded = (label: string) => {
    setExpandedItem(expandedItem === label ? null : label);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpandedItem(null);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled || isOpen
            ? 'bg-obsidian-950/40 backdrop-blur-2xl border-b border-white/[0.08] shadow-2xl shadow-black/40'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-24 md:h-[6.75rem]">
            <Link
              href="/"
              className="group hidden lg:flex shrink-0 items-center pr-6 xl:pr-8 text-white transition-all duration-300 hover:opacity-90"
            >
              <div className="flex items-center py-1">
                <Image 
                  src="/images/header-logo.png" 
                  alt="The Cyber Adviser" 
                  width={430} 
                  height={465} 
                  className="h-[4.75rem] xl:h-[5.1rem] w-auto shrink-0 object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </Link>

            <Link
              href="/"
              className="group lg:hidden flex min-w-0 items-center gap-3 text-white transition-all duration-300 hover:opacity-90"
            >
              <Image 
                src="/images/header-logo.png" 
                alt="The Cyber Adviser" 
                width={430} 
                height={465} 
                className="h-14 w-auto object-contain drop-shadow-2xl"
                priority
              />
            </Link>

            <div className="hidden lg:flex min-w-0 flex-1 items-center justify-center gap-6 xl:gap-8">
              {navItems.map((item) => (
                <div key={item.label} className="relative group/nav">
                  {item.children ? (
                    <>
                      <button
                        className={cn(
                          'relative flex items-center gap-1.5 whitespace-nowrap px-0 py-2 text-[0.96rem] font-medium tracking-[0.01em] transition-all duration-300',
                          isItemActive(item)
                            ? 'text-[#FFC300]'
                            : 'text-slate-300 group-hover/nav:text-[#FFC300]'
                        )}
                      >
                        {item.label}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50 text-[#FFC300] transition-all duration-300 group-hover/nav:rotate-180 group-hover/nav:opacity-100" />
                        <span
                          className={cn(
                            'absolute left-1/2 -bottom-1 h-[2px] w-12 -translate-x-1/2 bg-[#FFC300] transition-opacity duration-300',
                            isItemActive(item) ? 'opacity-100' : 'opacity-0 group-hover/nav:opacity-100'
                          )}
                        />
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:pointer-events-auto transition-all duration-300 ease-out">
                        <div className="w-80 bg-obsidian-900/80 backdrop-blur-3xl border border-white/[0.1] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2.5 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FFC300]/5 to-transparent pointer-events-none" />
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="relative flex flex-col gap-0.5 px-4 py-3.5 rounded-xl hover:bg-white/[0.05] transition-all group/item"
                            >
                              <span className="text-sm font-bold text-slate-200 group-hover/item:text-[#FFC300] transition-colors">
                                {child.label}
                              </span>
                              {child.description && (
                                <span className="text-[11px] text-slate-500 group-hover/item:text-slate-400 transition-colors leading-tight">
                                  {child.description}
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'relative whitespace-nowrap px-0 py-2 text-[0.96rem] font-medium tracking-[0.01em] transition-all duration-300',
                        pathname === item.href
                          ? 'text-[#FFC300]'
                          : 'text-slate-300 hover:text-[#FFC300]'
                      )}
                    >
                      {item.label}
                      <span
                        className={cn(
                          'absolute left-1/2 -bottom-1 h-[2px] w-12 -translate-x-1/2 bg-[#FFC300] transition-opacity duration-300',
                          pathname === item.href ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                        )}
                      />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden lg:flex shrink-0 pl-6 xl:pl-8">
              <Link
                href="/contact"
                className="group relative inline-flex items-center whitespace-nowrap overflow-hidden rounded-2xl px-8 py-3 text-[0.96rem] font-semibold text-obsidian-950 transition-all duration-300 shadow-[0_0_20px_rgba(255,195,0,0.15)] hover:shadow-[0_0_30px_rgba(255,195,0,0.25)]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#FFC300] to-[#FFB703]" />
                <span className="absolute inset-0 bg-gradient-to-r from-[#FFD60A] to-[#FFC300] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative whitespace-nowrap">
                  Schedule Consultation
                </span>
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 text-slate-400 hover:text-[#FFC300] transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 transition-all duration-300',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={cn(
            'absolute top-20 left-0 right-0 border-b border-white/[0.1] bg-obsidian-950/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 rounded-b-3xl',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          )}
        >
          <div className="px-4 pb-8 pt-4">
            <div className="pb-4 border-b border-white/[0.05] mb-4">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#FFC300]">
                Expert Security Advisory
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <div key={item.label} className="flex flex-col">
                  {item.children ? (
                    <div className="flex flex-col">
                      <button
                        onClick={() => toggleExpanded(item.label)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-300',
                          isItemActive(item)
                            ? 'text-[#FFC300] bg-[#FFC300]/5'
                            : 'text-slate-300 hover:bg-white/[0.03]'
                        )}
                      >
                        {item.label}
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          expandedItem === item.label ? "rotate-180 text-[#FFC300]" : "opacity-50"
                        )} />
                      </button>
                      
                      <div className={cn(
                        "grid transition-all duration-300 ease-in-out px-2",
                        expandedItem === item.label ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                      )}>
                        <div className="overflow-hidden flex flex-col gap-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={cn(
                                'px-4 py-3 text-sm font-medium rounded-lg transition-all flex flex-col gap-0.5',
                                pathname === child.href
                                  ? 'text-[#FFC300] bg-[#FFC300]/10'
                                  : 'text-slate-400 hover:text-[#FFC300] hover:bg-white/5'
                              )}
                            >
                              <span>{child.label}</span>
                              {child.description && (
                                <span className="text-[10px] opacity-60 font-normal">{child.description}</span>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-300',
                        pathname === item.href
                          ? 'text-[#FFC300] bg-[#FFC300]/5'
                          : 'text-slate-300 hover:text-[#FFC300] hover:bg-white/[0.03]'
                      )}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="mt-6 inline-flex items-center justify-center px-6 py-4 text-base font-bold text-obsidian-950 bg-gradient-to-r from-[#FFC300] to-[#FFB703] rounded-2xl hover:from-[#FFD60A] hover:to-[#FFC300] transition-all duration-300 shadow-xl shadow-[#FFC300]/10"
              >
                Schedule Consultation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
