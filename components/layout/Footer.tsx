import Link from 'next/link';
import { Shield, Linkedin, Twitter, Mail } from 'lucide-react';

const footerLinks = {
  navigation: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Portfolio' },
  ],
  resources: [
    { href: '/knowledge-base', label: 'Knowledge Base' },
    { href: '/contact', label: 'Contact' },
  ],
  expertise: [
    'Zero Trust Architecture',
    'SASE & Prisma Access',
    'Cloud Security',
    'Executive Advisory',
  ],
};

export function Footer() {
  return (
    <footer className="relative bg-obsidian-950">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="group flex items-center gap-3 text-white font-semibold text-lg"
            >
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg" />
                <Shield className="relative w-5 h-5 text-amber-500" />
              </div>
              <span className="tracking-tight">The Cyber Adviser</span>
            </Link>

            <p className="mt-5 text-[15px] text-slate-400 leading-relaxed">
              Strategic cybersecurity advisory for enterprises navigating secure
              transformation, Zero Trust adoption, and architecture modernization.
            </p>

            <div className="flex items-center gap-2 mt-8">
              <a
                href="#"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10 transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10 transition-all duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@thecyberadviser.com"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10 transition-all duration-300"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.15em] mb-5">
              Navigation
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-slate-400 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.15em] mb-5">
              Resources
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-slate-400 hover:text-white transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-[0.15em] mb-5">
              Expertise
            </h4>
            <ul className="space-y-3.5">
              {footerLinks.expertise.map((item) => (
                <li key={item} className="text-[15px] text-slate-500">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} The Cyber Adviser. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <Link
                href="#"
                className="text-sm text-slate-500 hover:text-white transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-slate-500 hover:text-white transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
