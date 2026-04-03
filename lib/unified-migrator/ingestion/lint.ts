import { LintFinding, ParseInput, SourceVendor } from '@/lib/unified-migrator/types';

export function lintInput(vendor: SourceVendor, input: ParseInput): LintFinding[] {
  const findings: LintFinding[] = [];
  const lines = input.content.split(/\r?\n/);

  if (!input.content.trim()) {
    return [{ level: 'error', message: 'Uploaded config is empty.' }];
  }

  if (lines.length < 3) {
    findings.push({
      level: 'warning',
      message: 'Config is unusually short and may be incomplete.',
    });
  }

  // ── Cross-vendor unsupported hints ──

  const unsupportedHints = [
    { token: 'router ospf', message: 'Dynamic routing (OSPF) detected and deferred.' },
    { token: 'router bgp', message: 'BGP detected and deferred.' },
    { token: 'ikev2', message: 'VPN/IKE configuration detected and deferred.' },
    { token: 'ssl vpn', message: 'Remote access VPN detected and deferred.' },
    { token: 'router rip', message: 'RIP routing detected and deferred.' },
  ];

  unsupportedHints.forEach((hint) => {
    const line = lines.findIndex((value) => value.toLowerCase().includes(hint.token));
    if (line >= 0) {
      findings.push({ level: 'info', message: hint.message, line: line + 1 });
    }
  });

  if (vendor === 'unknown') {
    findings.push({
      level: 'error',
      message: 'Could not detect a supported source vendor from the uploaded file.',
    });
  }

  // ── Cisco ASA specific ──

  if (vendor === 'cisco-asa') {
    // Detect deprecated fixup protocol
    const fixupLine = lines.findIndex((l) => l.trim().startsWith('fixup protocol'));
    if (fixupLine >= 0) {
      findings.push({
        level: 'warning',
        message: 'Deprecated "fixup protocol" syntax detected. This was replaced by "inspect" in newer ASA versions.',
        line: fixupLine + 1,
      });
    }

    // Detect truncated config (missing end marker)
    const lastNonEmpty = lines.filter((l) => l.trim()).pop();
    if (lastNonEmpty && !lastNonEmpty.trim().startsWith(': end') && !lastNonEmpty.trim().startsWith('!')) {
      findings.push({
        level: 'warning',
        message: 'ASA config may be truncated — no end marker detected.',
      });
    }
  }

  // ── FortiGate specific ──

  if (vendor === 'fortigate') {
    const opens = lines.filter((line) => line.trim().startsWith('config ')).length;
    const closes = lines.filter((line) => line.trim() === 'end').length;

    if (opens > closes) {
      findings.push({
        level: 'warning',
        message: `FortiGate config appears to have ${opens - closes} unterminated config block(s).`,
      });
    }

    // Deprecated webfilter content-header
    const deprecated = lines.findIndex((l) => l.trim().startsWith('config webfilter content-header'));
    if (deprecated >= 0) {
      findings.push({
        level: 'warning',
        message: 'Deprecated "webfilter content-header" block detected.',
        line: deprecated + 1,
      });
    }
  }

  // ── Check Point specific ──

  if (vendor === 'checkpoint') {
    // Detect mixed CLI/API format
    const hasCli = lines.some((l) => l.trim().startsWith('add ') || l.trim().startsWith('set '));
    const hasJson = lines.some((l) => l.trim().startsWith('{') || l.trim().startsWith('"'));
    if (hasCli && hasJson) {
      findings.push({
        level: 'warning',
        message: 'Check Point config appears to mix CLI and API/JSON formats. Parsing may be incomplete.',
      });
    }
  }

  return findings;
}
