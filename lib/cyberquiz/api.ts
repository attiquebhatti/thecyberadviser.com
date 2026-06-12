'use client';
// REST API client for CyberQuiz — all paths prefixed with /api/cyberquiz
import type { AuthUser, AuthResponse, Quiz, Question, Session, Player, Answer } from './types';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('qa_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/cyberquiz${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try { const body = await res.json(); message = body.error ?? body.message ?? message; } catch { /* */ }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const cqApi = {
  // Auth
  signup:         (email: string, password: string, displayName: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  login:          (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe:          () => request<AuthUser>('/auth/me'),
  updateProfile:  (updates: { displayName?: string; avatarUrl?: string }) =>
    request<AuthUser>('/auth/profile', { method: 'PATCH', body: JSON.stringify(updates) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', { method: 'PATCH', body: JSON.stringify({ currentPassword, newPassword }) }),
  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword:  (token: string, newPassword: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // Quizzes
  getQuizzes:     () => request<Quiz[]>('/quizzes'),
  getQuiz:        (id: string) => request<Quiz>(`/quizzes/${id}`),
  createQuiz:     (data: Partial<Quiz>) => request<Quiz>('/quizzes', { method: 'POST', body: JSON.stringify(data) }),
  updateQuiz:     (id: string, data: Partial<Quiz>) => request<Quiz>(`/quizzes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteQuiz:     (id: string) => request<void>(`/quizzes/${id}`, { method: 'DELETE' }),
  duplicateQuiz:  (id: string) => request<Quiz>(`/quizzes/${id}/duplicate`, { method: 'POST' }),
  forkQuiz:       (id: string) => request<Quiz>(`/quizzes/${id}/fork`, { method: 'POST' }),
  toggleStar:     (id: string, is_starred: boolean) => request<Quiz>(`/quizzes/${id}`, { method: 'PATCH', body: JSON.stringify({ is_starred }) }),
  getPublicQuizzes: (search?: string) =>
    request<Array<Quiz & { host_name: string; question_count: number }>>(`/quizzes/public${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  // Questions
  getQuestions:       (quizId: string) => request<Question[]>(`/questions/${quizId}`),
  bulkSave:           (quizId: string, questions: Partial<Question>[]) =>
    request<Question[]>(`/questions/${quizId}/bulk`, { method: 'POST', body: JSON.stringify({ questions }) }),
  bulkSaveQuestions:  (quizId: string, questions: Partial<Question>[]) =>
    request<Question[]>(`/questions/${quizId}/bulk`, { method: 'POST', body: JSON.stringify({ questions }) }),

  // Sessions
  createSession:      (data: { quiz_id?: string; game_mode: string; settings?: object }) =>
    request<Session>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
  startSession:       (id: string) => request<{ ok: boolean }>(`/sessions/${id}/start`, { method: 'POST' }),
  joinSession:        (code: string) => request<Session>(`/sessions/join/${code}`),
  getSession:         (id: string) => request<Session>(`/sessions/${id}`),
  getHostSessions:    () => request<Array<Session & { player_count: number }>>('/sessions/host'),
  getSessionPlayers:  (id: string) => request<Player[]>(`/sessions/${id}/players`),
  getSessionResults:  (id: string) => request<unknown>(`/sessions/${id}/results`),
  buyPowerup:         (data: { session_id: string; player_id: string; powerup_type: string; cost: number; target_player_id?: string }) =>
    request<{ ok: boolean; coins: number }>('/sessions/powerup', { method: 'POST', body: JSON.stringify(data) }),
  exploreQuizzes:     (params?: { search?: string; limit?: number }) =>
    request<Array<Quiz & { question_count: number }>>(`/quizzes/public${params?.search ? `?search=${encodeURIComponent(params.search)}` : ''}`),

  // AI
  generateQuiz: (payload: { topic: string; questionCount: number; types: string[]; difficulty: string }) =>
    request<{ questions: Partial<Question>[] }>('/ai/generate', { method: 'POST', body: JSON.stringify(payload) }),

  // Question Banks
  getQuestionBanks:       () => request<any[]>('/question-banks'),
  getQuestionBank:        (courseCode: string, params?: { difficulty?: string; limit?: number; offset?: number }) =>
    request<{ total: number; questions: any[] }>(`/question-banks/${courseCode}${params ? `?${new URLSearchParams(params as any)}` : ''}`),
  generateFromBank:       (courseCode: string, opts: { count: number; difficulty?: string }) =>
    request<Quiz & { question_count: number }>(`/question-banks/${courseCode}/generate-quiz`, { method: 'POST', body: JSON.stringify(opts) }),

  // Module Question Banks
  getModules: (courseCode: string) =>
    request<Array<{ module_num: number; module_name: string; total_questions: number }>>(`/question-banks/${courseCode}/modules`),
  getModuleQuestions: (courseCode: string, moduleNum: number) =>
    request<{ module_name: string; questions: Array<{ id: number; module_num: number; module_name: string; difficulty: string; question_text: string; option_a: string; option_b: string; option_c: string; option_d: string; correct_letter: string; explanation: string }> }>(`/question-banks/${courseCode}/modules/${moduleNum}/questions`),
  hostModuleQuiz: (courseCode: string, moduleNum: number, count: number) =>
    request<{ quiz_id: string; question_count: number; title: string }>(`/question-banks/${courseCode}/modules/${moduleNum}/host-quiz`, { method: 'POST', body: JSON.stringify({ count }) }),
};
