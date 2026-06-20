import { getEncoding, Tiktoken } from 'js-tiktoken';

let _enc: Tiktoken | null = null;
function enc(): Tiktoken {
  if (!_enc) _enc = getEncoding('cl100k_base');
  return _enc;
}

function countTokens(text: string): number {
  return enc().encode(text).length;
}

// Split text into rough sentences. Imperfect is fine — chunk boundaries only need to be
// reasonably coherent. We guard against splitting on common abbreviations.
const ABBREVIATIONS = /(\b(?:e\.g|i\.e|etc|vs|Mr|Mrs|Ms|Dr|Inc|Ltd|Co|Fig|No|Vol)\.)$/i;

export function splitSentences(text: string): string[] {
  // Normalise whitespace but keep line breaks meaningful (transcript turns).
  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const rawLines = normalized.split('\n');

  const sentences: string[] = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Split each line on sentence-ending punctuation followed by whitespace.
    const parts = trimmed.split(/(?<=[.!?])\s+/);
    let buffer = '';
    for (const part of parts) {
      buffer = buffer ? `${buffer} ${part}` : part;
      if (ABBREVIATIONS.test(buffer)) continue; // don't break on "e.g." etc.
      sentences.push(buffer);
      buffer = '';
    }
    if (buffer) sentences.push(buffer);
  }
  return sentences;
}

export interface ChunkOptions {
  targetTokens?: number;
  overlapTokens?: number;
}

// Accumulate sentences into ~targetTokens chunks, carrying the last ~overlapTokens
// worth of trailing sentences forward as overlap (never splits mid-sentence).
export function chunkText(text: string, opts: ChunkOptions = {}): string[] {
  const targetTokens = opts.targetTokens ?? 400;
  const overlapTokens = opts.overlapTokens ?? 80;

  const sentences = splitSentences(text);
  const chunks: string[] = [];

  let current: string[] = [];
  let currentTokens = 0;

  for (const sentence of sentences) {
    const sTokens = countTokens(sentence);

    // A single sentence longer than the target becomes its own chunk.
    if (sTokens >= targetTokens) {
      if (current.length) { chunks.push(current.join(' ')); current = []; currentTokens = 0; }
      chunks.push(sentence);
      continue;
    }

    if (currentTokens + sTokens > targetTokens && current.length) {
      chunks.push(current.join(' '));
      // Build overlap from the tail of the chunk we just closed.
      const overlap: string[] = [];
      let overlapCount = 0;
      for (let i = current.length - 1; i >= 0; i--) {
        const t = countTokens(current[i]);
        if (overlapCount + t > overlapTokens) break;
        overlap.unshift(current[i]);
        overlapCount += t;
      }
      current = [...overlap];
      currentTokens = overlapCount;
    }

    current.push(sentence);
    currentTokens += sTokens;
  }

  if (current.length) chunks.push(current.join(' '));
  return chunks.filter((c) => c.trim().length > 0);
}
