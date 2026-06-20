// Official Palo Alto Networks documentation references, mapped by course code.
// Used when a course has no class transcripts yet ("documentation mode") so the bot
// can point students to the authoritative source for the product they're studying.

const GENERAL = [
  'Palo Alto Networks docs: https://docs.paloaltonetworks.com/',
  'Community / LIVEcommunity: https://live.paloaltonetworks.com/',
];

const REFS: Record<string, string[]> = {
  'EDU-210':        ['NGFW: https://docs.paloaltonetworks.com/ngfw', 'Network Security: https://docs.paloaltonetworks.com/network-security'],
  'EDU-220':        ['NGFW: https://docs.paloaltonetworks.com/ngfw', 'Firewall administration: https://docs.paloaltonetworks.com/ngfw/administration/firewall-administration'],
  'EDU-330':        ['NGFW: https://docs.paloaltonetworks.com/ngfw', 'Firewall administration: https://docs.paloaltonetworks.com/ngfw/administration/firewall-administration'],
  'PRISMA-ACCESS':  ['SASE / Prisma Access: https://docs.paloaltonetworks.com/sase'],
  'PRISMA-SDWAN':   ['SASE / Prisma SD-WAN: https://docs.paloaltonetworks.com/sase'],
  'XDR-ENGINEER':   ['Cortex XDR: https://docs-cortex.paloaltonetworks.com/'],
  'XDR-ANALYST':    ['Cortex XDR: https://docs-cortex.paloaltonetworks.com/'],
  'XSOAR':          ['Cortex XSOAR dev docs: https://xsoar.pan.dev/', 'Cortex docs: https://docs-cortex.paloaltonetworks.com/'],
  'XSIAM-ENGINEER': ['Cortex XSIAM: https://docs-cortex.paloaltonetworks.com/'],
  'XSIAM-ANALYST':  ['Cortex XSIAM: https://docs-cortex.paloaltonetworks.com/'],
  'PANORAMA':       ['Panorama: https://docs.paloaltonetworks.com/panorama'],
  'PRISMA-CLOUD':   ['Prisma Cloud: https://docs.prismacloud.io/en'],
};

export function docRefsFor(courseCode: string): string[] {
  const specific = REFS[courseCode?.toUpperCase()] ?? [];
  return [...specific, ...GENERAL];
}
