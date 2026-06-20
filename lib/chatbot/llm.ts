// Free generation via Groq (OpenAI-compatible API), reusing CyberQuiz's CQ_GROQ_API_KEY.
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.ATC_CHAT_MODEL || 'llama-3.3-70b-versatile';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Streams assistant content deltas from Groq. Yields plain text fragments.
export async function* streamGroqChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const apiKey = process.env.CQ_GROQ_API_KEY;
  if (!apiKey) throw new Error('CQ_GROQ_API_KEY is not configured.');

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by double newlines; each "data: {...}" line is a chunk.
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore keep-alive / partial frames.
      }
    }
  }
}
