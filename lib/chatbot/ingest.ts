import { pool } from '@/lib/cyberquiz/db';
import { chunkText } from './chunk';
import { embedTexts } from './embeddings';

// Chunk a published transcript's raw_text, embed each chunk, and store rows in atc_chunks.
// Runs at publish time only — so edits/rejections before publish never leave stray chunks.
export async function processTranscript(transcriptId: number): Promise<number> {
  const [[t]] = await pool.query('SELECT * FROM atc_transcripts WHERE id = ?', [transcriptId]) as any[];
  if (!t) throw new Error('Transcript not found.');
  if (!t.raw_text || !t.raw_text.trim()) throw new Error('Transcript has no text to process.');

  // Clear any previous chunks for idempotency (safe re-publish).
  await pool.query('DELETE FROM atc_chunks WHERE transcript_id = ?', [transcriptId]);

  // Smaller chunks (~200 tokens) to fit within the local MiniLM embedding window.
  const chunks = chunkText(t.raw_text, { targetTokens: 200, overlapTokens: 40 });
  if (chunks.length === 0) throw new Error('Chunking produced no content.');

  const embeddings = await embedTexts(chunks);

  // Bulk insert chunk rows.
  const BATCH = 50;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const values = slice.map((text, j) => [
      transcriptId,
      t.cohort_id,
      i + j,
      text,
      JSON.stringify(embeddings[i + j]),
    ]);
    await pool.query(
      'INSERT INTO atc_chunks (transcript_id, cohort_id, chunk_index, text, embedding) VALUES ?',
      [values]
    );
  }

  return chunks.length;
}

// Publish: set status='processing', run the pipeline in the background, then mark
// published/failed. Returns immediately so the HTTP request isn't blocked on embedding.
export async function publishTranscript(transcriptId: number): Promise<void> {
  await pool.query("UPDATE atc_transcripts SET status = 'processing', processing_error = NULL WHERE id = ?", [transcriptId]);

  // Fire-and-forget — the upload route returns while this runs.
  (async () => {
    try {
      const count = await processTranscript(transcriptId);
      await pool.query(
        "UPDATE atc_transcripts SET status = 'published', processed_at = NOW() WHERE id = ?",
        [transcriptId]
      );
      console.log(`[chatbot] transcript ${transcriptId} published with ${count} chunks`);
    } catch (err: any) {
      console.error(`[chatbot] transcript ${transcriptId} publish failed:`, err);
      await pool.query(
        "UPDATE atc_transcripts SET status = 'failed', processing_error = ? WHERE id = ?",
        [String(err?.message || err).slice(0, 1000), transcriptId]
      );
    }
  })();
}
