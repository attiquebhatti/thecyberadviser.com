// Uses the SAME qa_token as CyberQuiz — true SSO, no separate login for this tool.
function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('qa_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export interface ChatbotCourse {
  id: number;
  name: string;
  course_code: string;
  instructor_name: string;
  session_count: number;
}

export interface AdminCourse {
  id: number;
  name: string;
  course_code: string;
  instructor_name: string;
  is_listed: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  transcript_count: number;
  published_count: number;
}

export interface CourseInput {
  name: string;
  courseCode: string;
  instructorName?: string;
  expiresAt?: string | null;
  isListed?: boolean;
}

function jsonHeaders(): Record<string, string> {
  return { ...authHeaders(), 'Content-Type': 'application/json' };
}

export const atcApi = {
  me: async (): Promise<{ id: string; email: string; displayName: string; isAdmin: boolean }> => {
    const res = await fetch('/api/chatbot/auth/me', { headers: authHeaders() });
    return handle(res);
  },

  courses: async (): Promise<ChatbotCourse[]> => {
    const res = await fetch('/api/chatbot/courses', { headers: authHeaders() });
    return handle(res);
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  adminListCourses: async (): Promise<AdminCourse[]> => {
    const res = await fetch('/api/chatbot/admin/courses', { headers: authHeaders() });
    return handle(res);
  },

  adminCreateCourse: async (input: CourseInput): Promise<AdminCourse> => {
    const res = await fetch('/api/chatbot/admin/courses', {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify(input),
    });
    return handle(res);
  },

  adminUpdateCourse: async (id: number, patch: Partial<CourseInput>): Promise<AdminCourse> => {
    const res = await fetch(`/api/chatbot/admin/courses/${id}`, {
      method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(patch),
    });
    return handle(res);
  },

  adminDeleteCourse: async (id: number): Promise<{ ok: boolean }> => {
    const res = await fetch(`/api/chatbot/admin/courses/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    return handle(res);
  },

  // ── Admin: transcripts ───────────────────────────────────────────────────
  adminListTranscripts: async (courseId: number): Promise<AdminTranscript[]> => {
    const res = await fetch(`/api/chatbot/admin/transcripts?course=${courseId}`, { headers: authHeaders() });
    return handle(res);
  },

  adminUploadTranscript: async (form: FormData): Promise<{ ok: boolean; transcript: AdminTranscript }> => {
    const res = await fetch('/api/chatbot/admin/transcripts/upload', {
      method: 'POST', headers: authHeaders(), body: form,
    });
    return handle(res);
  },

  adminGetTranscript: async (id: number): Promise<AdminTranscriptDetail> => {
    const res = await fetch(`/api/chatbot/admin/transcripts/${id}`, { headers: authHeaders() });
    return handle(res);
  },

  adminUpdateTranscript: async (id: number, patch: { rawText?: string; title?: string; sessionNumber?: number }): Promise<AdminTranscript> => {
    const res = await fetch(`/api/chatbot/admin/transcripts/${id}`, {
      method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(patch),
    });
    return handle(res);
  },

  adminPublishTranscript: async (id: number): Promise<{ ok: boolean; status: string }> => {
    const res = await fetch(`/api/chatbot/admin/transcripts/${id}/publish`, {
      method: 'POST', headers: authHeaders(),
    });
    return handle(res);
  },

  adminDeleteTranscript: async (id: number): Promise<{ ok: boolean }> => {
    const res = await fetch(`/api/chatbot/admin/transcripts/${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    return handle(res);
  },

  // ── Admin: logs ──────────────────────────────────────────────────────────
  adminLogs: async (filters: LogFilters = {}): Promise<{ total: number; rows: QuestionLog[] }> => {
    const qs = new URLSearchParams();
    if (filters.course) qs.set('course', String(filters.course));
    if (filters.feedback !== undefined && filters.feedback !== '') qs.set('feedback', String(filters.feedback));
    if (filters.from) qs.set('from', filters.from);
    if (filters.to) qs.set('to', filters.to);
    if (filters.limit) qs.set('limit', String(filters.limit));
    if (filters.offset) qs.set('offset', String(filters.offset));
    const res = await fetch(`/api/chatbot/admin/logs?${qs.toString()}`, { headers: authHeaders() });
    return handle(res);
  },

  adminLogsExportUrl: (filters: LogFilters = {}): string => {
    const qs = new URLSearchParams();
    if (filters.course) qs.set('course', String(filters.course));
    if (filters.feedback !== undefined && filters.feedback !== '') qs.set('feedback', String(filters.feedback));
    if (filters.from) qs.set('from', filters.from);
    if (filters.to) qs.set('to', filters.to);
    return `/api/chatbot/admin/logs/export?${qs.toString()}`;
  },

  // ── Admin: persona ───────────────────────────────────────────────────────
  adminGetPersona: async (): Promise<{ active: PersonaVersion | null; history: PersonaVersion[] }> => {
    const res = await fetch('/api/chatbot/admin/persona', { headers: authHeaders() });
    return handle(res);
  },

  adminPublishPersona: async (promptText: string): Promise<{ ok: boolean; active: PersonaVersion }> => {
    const res = await fetch('/api/chatbot/admin/persona', {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ promptText }),
    });
    return handle(res);
  },
};

export interface LogFilters {
  course?: number;
  feedback?: 1 | -1 | 0 | '';
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface QuestionLog {
  id: number;
  cohort_id: number;
  user_id: string;
  question: string;
  response: string;
  sources: { session: number; title: string }[] | null;
  feedback: 1 | -1 | null;
  feedback_text: string | null;
  created_at: string;
  course_name: string | null;
  course_code: string | null;
  user_email: string | null;
  user_name: string | null;
}

export interface PersonaVersion {
  id: number;
  prompt_text: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface AdminTranscript {
  id: number;
  cohort_id: number;
  session_number: number;
  title: string;
  file_name: string;
  status: 'pending' | 'review_needed' | 'processing' | 'published' | 'failed';
  processing_error: string | null;
  text_length: number;
  chunk_count: number;
  created_at: string;
  processed_at: string | null;
}

export interface AdminTranscriptDetail extends AdminTranscript {
  raw_text: string;
}

export interface ChatSource { session: number; title: string; }

// Stream a chat answer via SSE. Calls onToken for each text fragment, onSources once,
// and resolves with the log id (for feedback) when complete.
export async function streamChat(
  cohortId: number,
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  handlers: { onToken: (t: string) => void; onSources: (s: ChatSource[]) => void }
): Promise<number | null> {
  const res = await fetch('/api/chatbot/chat', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ cohortId, question, history }),
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Chat failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let logId: number | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      try {
        const evt = JSON.parse(trimmed.slice(5).trim());
        if (evt.type === 'token') handlers.onToken(evt.value);
        else if (evt.type === 'sources') handlers.onSources(evt.value);
        else if (evt.type === 'done') logId = evt.logId ?? null;
      } catch { /* ignore partial frames */ }
    }
  }
  return logId;
}

export async function sendFeedback(logId: number, feedback: 1 | -1, feedbackText?: string): Promise<void> {
  const res = await fetch('/api/chatbot/chat/feedback', {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ logId, feedback, feedbackText }),
  });
  await handle(res);
}
