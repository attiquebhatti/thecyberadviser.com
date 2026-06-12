// Shared types for CyberQuiz — mirrors the MySQL schema shape.

export interface Quiz {
  id: string;
  host_id: string;
  title: string;
  subject: string;
  grade_level: string;
  is_public: boolean;
  play_count: number;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  // computed/joined fields returned by some endpoints
  question_count?: number;
  fork_count?: number;
}

export interface QuestionOption {
  text: string;
  is_correct?: boolean;
  order?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  order_index: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'poll' | 'word_cloud' | 'ordering' | 'slider' | 'fill_blank';
  question_text: string;
  image_url: string | null;
  options: QuestionOption[];
  correct_answer: string | null;
  explanation: string | null;
  time_limit_seconds: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface SessionSettings {
  team_mode?: boolean;
  power_ups?: boolean;
  music?: boolean;
  self_paced?: boolean;
  deadline?: string | null;
  timer_visible?: boolean;
  show_leaderboard?: boolean;
  max_players?: number;
  shuffle_questions?: boolean;
  question_ids_order?: string[] | null;
}

export interface Session {
  id: string;
  quiz_id: string | null;
  host_id: string;
  join_code: string;
  game_mode: string;
  status: 'lobby' | 'active' | 'paused' | 'completed';
  settings: SessionSettings | string;
  current_question_index: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  quiz_title?: string;
}

export interface Player {
  id: string;
  session_id: string;
  nickname: string;
  avatar_config: { seed?: string; bg?: string } | string;
  score: number;
  coins: number;
  lives: number;
  streak: number;
  is_eliminated: boolean;
  joined_at: string;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  player_id: string;
  answer_value: string | null;
  is_correct: boolean;
  response_time_ms: number;
  points_earned: number;
  coins_earned: number;
  created_at: string;
  nickname?: string;
  avatar_config?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  tier: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
