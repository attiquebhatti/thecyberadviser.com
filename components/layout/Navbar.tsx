'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
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
            ? 'bg-obsidian-950/95 backdrop-blur-xl border-b border-white/[0.04] shadow-lg shadow-black/20'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link
              href="/"
              className="group flex items-center gap-3 text-white hover:opacity-90 transition-all duration-300 min-w-0"
            >
              <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg" />
                <Shield className="relative w-5 h-5 text-amber-500" />
              </div>

              <div className="flex flex-col leading-tight min-w-0">
                <span className="tracking-tight font-semibold text-lg text-white truncate">
                  The Cyber Adviser
                </span>
                <span className="hidden sm:block text-[11px] md:text-xs text-slate-400 mt-0.5 truncate">
                  Attique Bhatti - Security Consultant
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 text-sm font-medium transition-all duration-300',
                    pathname === item.href
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-amber-400'
                  )}
                >
                  {item.label}
                  {(pathname === item.href || pathname !== item.href) && (
                    <span
                      className={cn(
                        'absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent transition-opacity duration-300',
                        pathname === item.href ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                      )}
                    />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden lg:block">
              <Link
                href="/contact"
                className="group relative inline-flex items-center px-6 py-2.5 text-sm font-semibold overflow-hidden rounded-lg transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600" />
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative text-obsidian-950">
                  Schedule Consultation
                </span>
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 text-slate-400 hover:text-amber-400 transition-colors rounded-lg hover:bg-white/5 flex-shrink-0"
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
            'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={cn(
            'absolute top-20 left-0 right-0 border-b border-white/[0.05] bg-obsidian-950/98 backdrop-blur-xl shadow-2xl transition-all duration-300',
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          )}
        >
          <div className="px-4 pb-6 pt-4">
            <div className="pb-4 border-b border-white/[0.05]">
              <p className="text-xs text-slate-400">
                Attique Bhatti - Security Consultant
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-300',
                    pathname === item.href
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-white/[0.03]'
                  )}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/contact"
                className="mt-3 inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-obsidian-950 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-300"
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
