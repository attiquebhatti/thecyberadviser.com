import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/cyberquiz/auth';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL        = 'llama-3.3-70b-versatile';

export async function POST(req: NextRequest) {
  const auth = requireAuthUser(req);
  if ('error' in auth) return auth.error;

  const { topic, questionCount = 10, types = ['multiple_choice'], difficulty = 'medium' } = await req.json();
  if (!topic) return NextResponse.json({ error: 'topic is required' }, { status: 400 });

  const apiKey = process.env.CQ_GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });

  const typeList = Array.isArray(types) ? types.join(', ') : types;

  const systemPrompt = `You are QuizArena's AI question generator. Produce a JSON array of exactly ${questionCount} quiz questions.
Each object must have: type (one of [${typeList}]), question_text, options (array of {text, is_correct}), correct_answer, explanation, time_limit_seconds (10-60), points (500/750/1000), difficulty ("${difficulty}").
Return ONLY the JSON array, no markdown, no extra text.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate ${questionCount} ${difficulty} questions about: "${topic}". Types: ${typeList}.` },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) return NextResponse.json({ error: 'AI service error' }, { status: 502 });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '[]';
    const cleaned = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) return NextResponse.json({ error: 'AI returned unexpected format' }, { status: 502 });
    return NextResponse.json({ questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
