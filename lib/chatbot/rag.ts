import { pool } from '@/lib/cyberquiz/db';

export interface RetrievedChunk {
  id: number;
  text: string;
  chunk_index: number;
  session_number: number;
  title: string;
  score: number;
}

// Dot product of two L2-normalized vectors == cosine similarity.
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

// Fetch all published chunks for a course, score against the query embedding in Node,
// return the top K with session info for citation. Fine at hundreds–low-thousands of chunks.
export async function retrieveTopChunks(
  cohortId: number,
  queryEmbedding: number[],
  topK = 6
): Promise<RetrievedChunk[]> {
  const [rows] = await pool.query(
    `SELECT c.id, c.text, c.chunk_index, c.embedding, t.session_number, t.title
     FROM atc_chunks c
     JOIN atc_transcripts t ON t.id = c.transcript_id
     WHERE c.cohort_id = ? AND t.status = 'published'`,
    [cohortId]
  ) as any[];

  const scored: RetrievedChunk[] = [];
  for (const r of rows) {
    let emb: number[];
    try {
      emb = typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding;
    } catch {
      continue;
    }
    scored.push({
      id: r.id,
      text: r.text,
      chunk_index: r.chunk_index,
      session_number: r.session_number,
      title: r.title,
      score: cosineSimilarity(queryEmbedding, emb),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// Compose the system prompt: the active persona + a CONTEXT block of retrieved chunks,
// each tagged with its session number so the model can cite accurately.
export function buildSystemPrompt(personaText: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((c) => `[Session ${c.session_number}${c.title ? ` — ${c.title}` : ''}]\n${c.text}`)
    .join('\n\n---\n\n');

  return `${personaText}

────────────────────────────────────────
[CONTEXT] — transcript excerpts from the student's course. Answer ONLY from these.
If they don't contain the answer, say so plainly; do not invent.

${context}
────────────────────────────────────────`;
}

// The similarity floor below which we treat retrieval as "weak" and tell the model
// to be explicit about low confidence. MiniLM cosine scores run lower than OpenAI's,
// so this threshold is tuned for that model.
export const LOW_CONFIDENCE_THRESHOLD = 0.25;
