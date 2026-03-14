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

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-obsidian-950/90 backdrop-blur-xl border-b border-white/[0.04] shadow-lg shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link
            href="/"
            className="group flex items-center gap-3 text-white font-semibold text-lg hover:opacity-90 transition-all duration-300"
          >
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg" />
              <Shield className="relative w-5 h-5 text-amber-500" />
            </div>
            <span className="tracking-tight">The Cyber Adviser</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-all duration-300',
                  pathname === item.href
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute inset-x-2 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
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
              <span className="relative text-obsidian-950">Schedule Consultation</span>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300',
            isOpen ? 'max-h-[28rem] pb-8' : 'max-h-0'
          )}
        >
          <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                  pathname === item.href
                    ? 'text-white bg-white/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-obsidian-950 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all duration-300"
            >
              Schedule Consultation
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
