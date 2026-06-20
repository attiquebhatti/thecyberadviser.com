import { NextRequest } from 'next/server';
import { pool } from '@/lib/cyberquiz/db';
import { requireAuthUser, isAdminEmail } from '@/lib/chatbot/auth';
import { embedQuery } from '@/lib/chatbot/embeddings';
import { retrieveTopChunks, buildSystemPrompt, LOW_CONFIDENCE_THRESHOLD } from '@/lib/chatbot/rag';
import { getActivePersona } from '@/lib/chatbot/persona';
import { streamGroqChat, ChatMessage } from '@/lib/chatbot/llm';
import { docRefsFor } from '@/lib/chatbot/docRefs';

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

      const docRefs = docRefsFor(course.course_code);
      const docList = docRefs.map((d) => `  - ${d}`).join('\n');

      // Three grounding modes:
      //  (a) DOC MODE      — course has no transcripts at all → answer purely from PANW
      //                      knowledge + official docs, with no "your sessions" language.
      //  (b) FALLBACK      — has transcripts but this question isn't covered → supplement
      //                      with general knowledge, flagged "Not covered in your sessions".
      //  (c) TRANSCRIPT    — good retrieval → answer from context, cite Session N.
      if (chunks.length === 0) {
        systemPrompt += `\n\nThis course has no class transcripts yet, so answer as an authoritative Palo Alto Networks training assistant using your well-established, accurate knowledge of the relevant PANW product. Be precise and current. Do NOT mention class sessions or transcripts. Where useful, point the student to the official documentation:\n${docList}\nEnd with **Sources:** Official PANW documentation, citing the most relevant link above.`;
      } else if (chunks[0].score < LOW_CONFIDENCE_THRESHOLD) {
        systemPrompt += `\n\nNOTE: The class transcript above does not clearly cover this question. Answer from your well-established, accurate Palo Alto Networks product knowledge instead, and BEGIN that part with "Not covered in your sessions, but in general:". You may also point to official docs:\n${docList}\nDo not claim it came from class. End with **Sources:** General PANW knowledge.`;
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: question },
      ];

      // Distinct sessions cited, for the collapsible Sources panel.
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

      send({ type: 'sources', value: sources });
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
