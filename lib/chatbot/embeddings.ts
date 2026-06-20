// Free, serverless embeddings via Google's Gemini API (gemini-embedding-001).
// Pure fetch — no heavy local model — so it runs anywhere, including shared hosting.
// Uses :embedContent (one text per call) since that's what the model supports, and
// L2-normalizes each vector so cosine similarity == dot product.

const MODEL = 'models/gemini-embedding-001';
const URL = `https://generativelanguage.googleapis.com/v1beta/${MODEL}:embedContent`;

export const EMBEDDING_DIMENSIONS = 768;

export function isEmbeddingConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function l2normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum) || 1;
  return v.map((x) => x / norm);
}

// Pace requests to stay under the Gemini free-tier per-minute limit (~100 RPM).
// ~750ms between calls ≈ 80/min. Only applied between calls in a batch, so a
// single query embed (1 text) has no added latency.
const PACE_MS = parseInt(process.env.GEMINI_PACE_MS || '750', 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await sleep(PACE_MS);
    const vec = await embedOne(apiKey, texts[i]);
    out.push(l2normalize(vec));
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

async function embedOne(apiKey: string, text: string, attempt = 0): Promise<number[]> {
  const res = await fetch(`${URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      content: { parts: [{ text }] },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    }),
  });
  if (res.ok) {
    const data = await res.json();
    return data.embedding?.values as number[];
  }
  // Backoff on rate-limit / transient server errors.
  if (attempt < 5 && (res.status === 429 || res.status >= 500)) {
    await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    return embedOne(apiKey, text, attempt + 1);
  }
  const errText = await res.text().catch(() => '');
  throw new Error(`Gemini embed error ${res.status}: ${errText.slice(0, 200)}`);
}
