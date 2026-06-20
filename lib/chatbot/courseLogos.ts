// Maps a course code to its Palo Alto Networks product-line logo (dark-mode
// reversed/KO variants, since the chatbot UI is dark). Used on course cards and
// the chat header.

const CORTEX = '/logos/cortex-primary-reversed.png';
const PRISMA = '/logos/prisma-reverse.png';
const STRATA = '/logos/Strata_Tagline_Logo_RGB_KO.png';
const PANW   = '/logos/PANW_Parent_Brand_Primary_Logo_RGB_Red_White.png';

const BY_CODE: Record<string, string> = {
  // Network Security / NGFW → Strata
  'EDU-210': STRATA,
  'EDU-220': STRATA,
  'EDU-330': STRATA,
  // Cortex line
  'XDR-ENGINEER':   CORTEX,
  'XDR-ANALYST':    CORTEX,
  'XSOAR':          CORTEX,
  'XSIAM-ENGINEER': CORTEX,
  'XSIAM-ANALYST':  CORTEX,
  // Prisma / SASE line
  'PRISMA-ACCESS': PRISMA,
  'PRISMA-SDWAN':  PRISMA,
};

export function courseLogo(courseCode: string): string {
  return BY_CODE[(courseCode || '').toUpperCase()] || PANW;
}
