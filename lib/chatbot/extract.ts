import mammoth from 'mammoth';

// Extract raw text from an uploaded file based on its extension.
export async function extractText(file: File, ext: string): Promise<string> {
  const lower = ext.toLowerCase();
  if (lower === 'txt' || lower === 'vtt') {
    return await file.text();
  }
  if (lower === 'docx') {
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (lower === 'pdf') {
    // pdf-parse is CommonJS (export =); import lazily so it isn't bundled where unused.
    const pdfParse = (await import('pdf-parse')) as unknown as (b: Buffer) => Promise<{ text: string }>;
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text;
  }
  throw new Error(`Unsupported file type: .${ext}`);
}

// Correct common PANW product-name casing. Order matters: multi-word / more specific
// names first so we don't partially rewrite a longer name.
const PRODUCT_CORRECTIONS: Array<[RegExp, string]> = [
  [/\bstrata\s+cloud\s+manager\b/gi, 'Strata Cloud Manager'],
  [/\bprisma\s+access\b/gi,          'Prisma Access'],
  [/\bprisma\s+sd-?wan\b/gi,         'Prisma SD-WAN'],
  [/\bcortex\s+xdr\b/gi,             'Cortex XDR'],
  [/\bcortex\s+xsoar\b/gi,           'Cortex XSOAR'],
  [/\bcortex\s+xsiam\b/gi,           'Cortex XSIAM'],
  [/\bglobal\s*protect\b/gi,         'GlobalProtect'],
  [/\bwild\s*fire\b/gi,              'WildFire'],
  [/\bpanorama\b/gi,                 'Panorama'],
  // Standalone acronyms only when not already preceded by "Cortex " (handled above).
  [/\bxsoar\b/gi,                    'XSOAR'],
  [/\bxsiam\b/gi,                    'XSIAM'],
  [/\bxdr\b/gi,                      'XDR'],
];

export function applyProductNameCorrections(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PRODUCT_CORRECTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}
