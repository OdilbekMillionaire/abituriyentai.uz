// ── Subject ───────────────────────────────────────────────────────────────────

export type Subject = "MOTHER_TONGUE" | "MATHEMATICS" | "HISTORY";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type SessionStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
export type Language = "uz" | "ru";

// ── Question ──────────────────────────────────────────────────────────────────

export interface Question {
  id: number;
  subject: Subject;
  difficulty: Difficulty;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  is_competency_based: boolean;
  tags: string[] | null;
  era_tag: string | null;
}

// ── Exam Session ──────────────────────────────────────────────────────────────

export interface ExamSession {
  session_id: number;
  questions: Question[];
  time_limit_minutes: number;
  started_at: string; // ISO datetime
  total_questions: number;
  subjects_included: Subject[];
}

export interface AnswerSubmit {
  question_id: number;
  selected_option: "A" | "B" | "C" | "D" | null;
}

export interface ExamSubmitRequest {
  session_id: number;
  answers: AnswerSubmit[];
}

// ── Exam Answer ───────────────────────────────────────────────────────────────

export interface ExamAnswer {
  question_id: number;
  selected_option: "A" | "B" | "C" | "D" | null;
  is_correct?: boolean;
  points_earned?: number;
}

// ── Exam Result ───────────────────────────────────────────────────────────────

export interface SubjectBreakdown {
  subject: Subject;
  subject_label: string;
  correct_count: number;
  total_questions: number;
  score: number;
  max_score: number;
  percentage: number;
}

export interface ExamResult {
  session_id: number;
  status: SessionStatus;
  started_at: string;
  submitted_at: string | null;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  grade_label: string;
  mother_tongue_breakdown: SubjectBreakdown;
  math_breakdown: SubjectBreakdown;
  history_breakdown: SubjectBreakdown;
  total_correct: number;
  total_questions: number;
  xp_earned: number;
  coins_earned: number;
}

// ── Lesson ────────────────────────────────────────────────────────────────────

export interface LessonListItem {
  id: number;
  subject: Subject;
  title: string;
  order_index: number;
  xp_reward: number;
  era_tag: string | null;
  created_at: string;
  is_completed: boolean;
}

export interface Lesson extends LessonListItem {
  content_markdown: string;
}

export interface LessonCompleteResponse {
  lesson_id: number;
  xp_earned: number;
  new_total_xp: number;
  new_level: number;
  coins_earned: number;
  message: string;
}

// ── User / Profile ────────────────────────────────────────────────────────────

export interface UserOut {
  id: number;
  username: string;
  email: string;
  xp: number;
  level: number;
  streak_days: number;
  coins: number;           // Tanga (regular)
  oxforder_tanga: number;  // Premium; 1 per 1000 Tanga
  created_at: string;
}

export interface UserProfile extends UserOut {
  last_active_date: string | null;
  xp_to_next_level: number;
  xp_in_current_level: number;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: UserOut;
}

// ── Gamification ──────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  streak_days: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  title_ru: string;
  xp_reward: number;
  coin_reward: number;
  is_completed: boolean;
  progress: number;
  required: number;
}

// ── Appeals ───────────────────────────────────────────────────────────────────

export interface AppealResponse {
  question_id: number;
  question_text: string;
  correct_option: string;
  correct_answer_text: string;
  explanation: string;
  source_decree: string;
  subject: Subject;
  is_competency_based: boolean;
  appeal_timestamp: string;
}

// ── AI Tutor (OdilbekAI) ──────────────────────────────────────────────────────

export interface TutorChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export interface TutorChatResponse {
  answer: string;
  subject: Subject;
  model_used: string;
}

export interface ExamHintResponse {
  hint: string;
  question_id: number;
  model_used: string;
}

export interface AppealResponseAI extends AppealResponse {
  ai_explanation: string | null;
  ai_model_used: string | null;
}

// ── Exam Review ───────────────────────────────────────────────────────────────

export interface ExamReviewItem {
  question_id: number;
  subject: Subject;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  selected_option: string | null;
  is_correct: boolean;
  points_earned: number;
  explanation: string;
  tags: string[] | null;
  era_tag: string | null;
}

export interface ExamReviewResponse {
  session_id: number;
  items: ExamReviewItem[];
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface TopicPerformance {
  tag: string;
  subject: Subject;
  correct: number;
  total: number;
  accuracy: number;   // 0.0 – 1.0
  is_weak: boolean;
}

export interface WeakAreasResponse {
  topics: TopicPerformance[];
  total_answers_analyzed: number;
}

// ── Study Plan ────────────────────────────────────────────────────────────────

export interface PlanDay {
  day_number: number;
  date_str: string;
  is_today: boolean;
  is_past: boolean;
  topic_label: string;
  subject: Subject;
  subject_label: string;
  action_type: string;
  action_label: string;
  action_icon: string;
  action_href: string;
  accuracy: number | null;
  is_weak: boolean;
}

export interface StudyPlanResponse {
  days_remaining: number;
  exam_date: string;
  plan: PlanDay[];
  total_weak_topics: number;
  total_topics: number;
  message: string;
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export interface BookmarkedQuestion {
  question_id: number;
  subject: Subject;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  tags: string[] | null;
  era_tag: string | null;
}

export interface BookmarkListResponse {
  questions: BookmarkedQuestion[];
  total: number;
}

// ── Progress History ──────────────────────────────────────────────────────────

export interface ProgressDataPoint {
  date: string;
  total_pct: number;
  mt_pct: number;
  math_pct: number;
  history_pct: number;
  total_score: number;
}

export interface ProgressHistoryResponse {
  points: ProgressDataPoint[];
  best_score: number;
  average_score: number;
  trend: "improving" | "stable" | "declining" | "insufficient_data";
}

// ── Drill / Spaced Repetition ─────────────────────────────────────────────────

export interface DrillQuestion {
  card_id: number;
  question_id: number;
  subject: Subject;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  tags: string[] | null;
  era_tag: string | null;
  interval: number;
  repetitions: number;
  ease_factor: number;
  total_answers: number;
  correct_answers: number;
}

export interface DrillAnswerResult {
  card_id: number;
  question_id: number;
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  next_review_in_days: number;
  new_ease_factor: number;
  xp_earned: number;
}

export interface DrillStats {
  total_cards: number;
  due_today: number;
  mastered: number;
  total_answers: number;
  correct_answers: number;
  accuracy_pct: number;
}

// ── UI Helpers ────────────────────────────────────────────────────────────────

export interface SubjectInfo {
  key: Subject;
  label: string;
  label_ru: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}
