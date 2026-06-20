// Local, free embeddings via Transformers.js — no API, no per-call cost.
// Model: all-MiniLM-L6-v2 (384-dim, mean-pooled, L2-normalized). ~90MB, cached on first use.

let _extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!_extractorPromise) {
    _extractorPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers');
      // Allow remote model download (first run) + local cache afterwards.
      env.allowLocalModels = true;
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return _extractorPromise;
}

export const EMBEDDING_DIMENSIONS = 384;

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const out: number[][] = [];
  // MiniLM truncates beyond ~256 word-pieces; that's fine for our ~200-token chunks.
  for (const text of texts) {
    const result = await extractor(text, { pooling: 'mean', normalize: true });
    out.push(Array.from(result.data as Float32Array).map((n) => Number(n)));
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
