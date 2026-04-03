import { ParseInput, SourceVendor } from '@/lib/unified-migrator/types';

export function detectVendor(input: ParseInput): SourceVendor {
  if (input.selectedVendor && input.selectedVendor !== 'unknown') {
    return input.selectedVendor;
  }

  const sample = `${input.fileName}\n${input.content.slice(0, 4000)}`.toLowerCase();

  // PAN-OS XML detection
  if (sample.includes('<config version=') || sample.includes('<config urldb=')) {
    return 'pan-os';
  }

  if (
    sample.includes('access-list ') ||
    sample.includes('object network ') ||
    sample.includes('nameif ')
  ) {
    return 'cisco-asa';
  }

  if (
    sample.includes('config firewall address') ||
    sample.includes('config firewall policy') ||
    sample.includes('config system interface')
  ) {
    return 'fortigate';
  }

  if (
    sample.includes('add access-rule') ||
    sample.includes('add host ') ||
    sample.includes('set group name ')
  ) {
    return 'checkpoint';
  }

  return 'unknown';
}

export function detectVersion(vendor: SourceVendor, content: string) {
  if (vendor === 'pan-os') {
    const match = content.match(/<config version="([^"]+)"/);
    return match?.[1] ?? '10.x';
  }

  if (vendor === 'fortigate') {
    const match = content.match(/FortiGate-?(?:VM)?\s*v?(\d+\.\d+(?:\.\d+)?)/i);
    return match?.[1] ?? '5.x-7.x';
  }

  if (vendor === 'cisco-asa') {
    const match = content.match(/Version\s+(\d+\.\d+(?:\(\d+\))?)/i);
    return match?.[1] ?? '8.x-9.x';
  }

  if (vendor === 'checkpoint') {
    const match = content.match(/R(7[78]|80(?:\.\d+)?)/i);
    return match?.[0] ?? 'R77/R80+';
  }

  return 'unknown';
}
