import React from 'react';

interface VendorLogoProps {
  className?: string;
}

export const PaloAltoLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M8 34 24 18l8 8-16 16-8-8Z" fill="#FF5A2F" />
    <path d="M24 42 40 26l8 8-16 16-8-8Z" fill="#FF5A2F" />
    <path d="M32 34 48 18l8 8-16 16-8-8Z" fill="#FF5A2F" />
  </svg>
);

export const AzureLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M10 50L28 14l10 22-12 14H10Z" fill="#0078D4" />
    <path d="M33 14h12l9 36-16-14-7-22Z" fill="#50E6FF" />
  </svg>
);

export const AWSLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M16 41c0-10 8-18 18-18 3 0 6 .7 8.6 2.1A12.2 12.2 0 0 1 48 24c6.6 0 12 5.1 12 11.5V44H16v-3Z" fill="#F7F7F7" stroke="#FF9900" strokeWidth="2.5" />
    <path d="M24 31h16" stroke="#232F3E" strokeWidth="3" strokeLinecap="round" />
    <path d="M25 36c4.8 3 11.2 3.8 17.5 1.3" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" />
    <path d="m40.2 36.7 4.8-.4-2.8 3.7" stroke="#FF9900" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GCPLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M23 37a11 11 0 0 1 10-15 11 11 0 0 1 8.3 3.7" stroke="#EA4335" strokeWidth="7" strokeLinecap="round" />
    <path d="M22.5 37a11 11 0 0 0 9.5 6h12" stroke="#34A853" strokeWidth="7" strokeLinecap="round" />
    <path d="M45 43a11 11 0 0 0 3-7.8" stroke="#4285F4" strokeWidth="7" strokeLinecap="round" />
    <path d="M24 25.5A11 11 0 0 1 42 25" stroke="#FBBC05" strokeWidth="7" strokeLinecap="round" />
    <rect x="28" y="28" width="15" height="9" rx="4.5" fill="#fff" />
  </svg>
);

export const ZscalerLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M18 42c0-7.8 6.2-14 14-14 3.5 0 6.7 1.2 9.2 3.3a10.5 10.5 0 0 1 6.8-2.5c6 0 10.9 4.9 10.9 10.9V43H18v-1Z" fill="#2D67E8" />
    <path d="M22 47h20" stroke="#2D67E8" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export const CrowdStrikeLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M14 34L46 18l-12 12h16L18 46l10-12H14Z" fill="#E01F3D" />
  </svg>
);

export const NetskopeLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="24" cy="36" r="6" fill="#FF8A00" />
    <circle cx="35" cy="28" r="6" fill="#666A73" />
    <circle cx="46" cy="37" r="6" fill="#0BA9E0" />
    <path d="M24 36l11-8m0 0 11 9" stroke="#666A73" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const FortinetLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="10" y="20" width="12" height="10" rx="2" fill="#EE3124" />
    <rect x="26" y="20" width="12" height="10" rx="2" fill="#EE3124" />
    <rect x="42" y="20" width="12" height="10" rx="2" fill="#EE3124" />
    <rect x="10" y="34" width="12" height="10" rx="2" fill="#EE3124" />
    <rect x="42" y="34" width="12" height="10" rx="2" fill="#EE3124" />
  </svg>
);

export const CheckPointLogo = ({ className }: VendorLogoProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="28" cy="32" r="14" fill="#EC0A7A" />
    <path d="M24 32h8" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    <path d="m28 32 8-7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
    <circle cx="42" cy="20" r="5" fill="#111" />
  </svg>
);

export const VendorIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name.toLowerCase()) {
    case 'palo alto networks': return <PaloAltoLogo className={className} />;
    case 'microsoft azure': return <AzureLogo className={className} />;
    case 'amazon web services': return <AWSLogo className={className} />;
    case 'google cloud': return <GCPLogo className={className} />;
    case 'zscaler': return <ZscalerLogo className={className} />;
    case 'crowdstrike': return <CrowdStrikeLogo className={className} />;
    case 'netskope': return <NetskopeLogo className={className} />;
    case 'fortigate': 
    case 'fortinet': return <FortinetLogo className={className} />;
    case 'check point': 
    case 'checkpoint': return <CheckPointLogo className={className} />;
    default: return null;
  }
};
