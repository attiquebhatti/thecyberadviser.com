import { NextRequest } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser, isAdminEmail } from '@/lib/chatbot/auth';
import { embedQuery } from '@/lib/chatbot/embeddings';
import { retrieveTopChunks, buildSystemPrompt, LOW_CONFIDENCE_THRESHOLD } from '@/lib/chatbot/rag';
import { getActivePersona } from '@/lib/chatbot/persona';
import { streamGroqChat, ChatMessage } from '@/lib/chatbot/llm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const admin = isAdminEmail(user.email);

  let body: any;
  try { body = await req.json(); } catch { return json400('Invalid request body.'); }
  const cohortId = parseInt(String(body.cohortId), 10);
  const question = String(body.question || '').trim();
  const history: ChatMessage[] = Array.isArray(body.history) ? body.history.slice(-6) : [];
  if (isNaN(cohortId)) return json400('A course must be specified.');
  if (!question) return json400('Question is required.');

  // Access control: course must exist; non-admins can only use listed, non-expired courses.
  const [[course]] = await pool.query('SELECT * FROM atc_cohorts WHERE id = ?', [cohortId]) as any[];
  if (!course) return json400('Course not found.', 404);
  if (!admin) {
    if (!course.is_listed) return json400('This course is not available.', 403);
    if (course.expires_at && new Date(course.expires_at) < new Date())
      return json400('Access to this course has expired.', 403);
  }

  // Embed the query locally, retrieve top chunks.
  const queryEmbedding = await embedQuery(question);
  const chunks = await retrieveTopChunks(cohortId, queryEmbedding, 6);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: any) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      const persona = await getActivePersona();
      const personaText = persona?.prompt_text || 'You are a helpful Palo Alto Networks training assistant.';
      let systemPrompt = buildSystemPrompt(personaText, chunks);

      // Seamless grounding: use the context when it answers the question, otherwise
      // answer from PANW knowledge — without ever revealing which. When retrieval is
      // weak/empty, nudge the model toward its own product knowledge.
      if (chunks.length === 0 || chunks[0].score < LOW_CONFIDENCE_THRESHOLD) {
        systemPrompt += `\n\nThis course is "${course.name}" (${course.course_code}). If the context above doesn't fully answer the question, answer from your accurate, current product knowledge for this course's vendor and topic. Either way, answer directly and never mention or hint at where the answer came from.`;
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: question },
      ];

      // Sessions used — logged for the admin's question log, but NOT shown to the
      // student (per the requirement to never surface the source).
      const sources = Array.from(
        new Map(chunks.map((c) => [c.session_number, { session: c.session_number, title: c.title }])).values()
      ).sort((a, b) => a.session - b.session);

      let full = '';
      try {
        for await (const delta of streamGroqChat(messages)) {
          full += delta;
          send({ type: 'token', value: delta });
        }
      } catch (err: any) {
        const msg = `\n\n_(Generation error: ${err?.message || err}. Check that CQ_GROQ_API_KEY is set.)_`;
        send({ type: 'token', value: msg });
        full += msg;
      }

      const logId = await logQA(cohortId, user.id, question, full, sources);
      send({ type: 'done', logId });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

async function logQA(cohortId: number, userId: string, question: string, response: string, sources: any[]): Promise<number | null> {
  try {
    const [result] = await pool.query(
      'INSERT INTO atc_question_logs (cohort_id, user_id, question, response, sources) VALUES (?, ?, ?, ?, ?)',
      [cohortId, userId, question, response, JSON.stringify(sources)]
    ) as any[];
    return result.insertId;
  } catch (err) {
    console.error('[chatbot] failed to log Q&A:', err);
    return null;
  }
}

function json400(error: string, status = 400) {
  return new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
}
