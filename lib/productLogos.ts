// Shared Palo Alto Networks product-line logo resolver, used by both CyberQuiz
// and the AI Chatbot. Matches by keyword so it works regardless of code format
// (EDU210 / EDU-210, XDR-ENG / XDR-ENGINEER, etc.). Dark-mode reversed/KO
// variants, since both surfaces are dark-themed.

const CORTEX     = '/logos/cortex-primary-reversed.png';
const PRISMA     = '/logos/prisma-reverse.png';
const STRATA     = '/logos/Strata_Tagline_Logo_RGB_KO.png';
const PANW       = '/logos/PANW_Parent_Brand_Primary_Logo_RGB_Red_White.png';
const CHECKPOINT = '/logos/checkpoint.png';
const F5         = '/logos/f5.png';

export function productLogo(code: string, name = '', group = ''): string {
  const s = `${code} ${name} ${group}`.toUpperCase();
  // Other vendors first (so their codes aren't mistaken for PANW lines).
  if (/CHECK ?POINT|\bCCSA\b|\bCCSE\b|MAESTRO|QUANTUM|\bGAIA\b/.test(s)) return CHECKPOINT;
  if (/\bF5\b|BIG-?IP|\bLTM\b|\bGTM\b|\bAPM\b|\bASM\b/.test(s)) return F5;
  // Palo Alto Networks product lines.
  if (/\b(XDR|XSOAR|XSIAM|CORTEX)\b/.test(s)) return CORTEX;
  if (/PRISMA|SD-?WAN|\bSASE\b|\bSSE\b/.test(s)) return PRISMA;
  if (/\bEDU|NGFW|STRATA|PAN-?OS|NETWORK SECURITY|FIREWALL/.test(s)) return STRATA;
  return PANW;
}
