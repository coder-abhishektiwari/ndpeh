// src/types/index.ts
// Shared TypeScript types for the NDPEH Next.js migration

export interface Paper {
  id: string;
  exam_name: string;
  sector?: string;
  post_name?: string;
  exam_board?: string;
  catergory?: String;
  status?: string;
  notification_date?: string;
  application_start_date?: string;
  application_end_date?: string;
  exam_date?: string;
  eligibility?: string | EligibilityObject;
  ageLimit?: string | { age_min?: number; age_max?: number; age_relaxation?: string };
  vacancy?: string | number;
  salary?: string | number;
  job_location?: string;
  application_fee?: string;
  exam_mode?: string;
  selection_process?: string[];
  exam_duration?: string;
  total_questions?: string | number;
  total_marks?: string | number;
  negative_marking?: string;
  subjects?: string[];
  syllabus?: string;
  exam_pattern?: string;
  previous_year_papers_available: boolean;
  official_website?: string;
  notification_url?: string;
  apply_url?: string;
  language?: string[];
  tags: string[];

  sections?: ExamSection[];
  [key: string]: unknown;
}

export interface EligibilityObject {
  education?: string;
  age_min?: number | string;
  age_max?: number | string;
  age_relaxation?: string;
  [key: string]: unknown;
}

export interface ExamSection {
  title: string;
  description?: string;
  questions: ExamQuestion[];
}

export interface ExamQuestion {
  q: string;
  options: string[];
  answer?: number;
  explanation?: string;
}

export interface ExamCalendarItem {
  id: string;
  exam_name: string;
  exam_board: string;
  exam_date: string;
  application_start_date: string;
  application_end_date: string;
  vacancy?: string | number;
  status: "upcoming" | "ongoing" | "closed";
  sector?: string;
  [key: string]: unknown;
  apply_url?: string;
  eligibility?: string | EligibilityObject;
  ageLimit?: string | { age_min?: number; age_max?: number; age_relaxation?: string };
}

export interface MockTest {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  total_questions: number;
  total_marks: number;
  negativeMarking: number;
  passingMarks: number;
  category: string;
  questions: MockQuestion[];
  layoutType?: LayoutType;
  sections?: SectionConfig[];
  sessions?: Session[];
  specialties?: string[];
}

export interface MockQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation?: string;
  sectionId?: string;
  specialty?: string;
  passage?: string;
}

export interface QuizTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  examPreparingFor?: string;
  createdAt?: unknown;
  lastActive?: unknown;
  settings?: {
    dailyEmailReminder: boolean;
    emailNotifications: boolean;
    preferredTopics: string[];
  };
}

export interface QuizResult {
  id?: string;
  uid: string;
  topic: string;
  total_questions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  accuracy: number;
  timeSpent: number;
  createdAt?: unknown;
}

export interface MockResult {
  id?: string;
  uid: string;
  testId: string;
  testTitle: string;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
  total_marks: number;
  accuracy: number;
  timeSpent: number;
  passed: boolean;
  createdAt?: unknown;
}

export interface SavedExam {
  id?: string;
  uid: string;
  examId: string;
  examName: string;
  exam_board: string;
  exam_date: string;
  savedAt?: unknown;
}

export interface Announcement {
  id: string;
  icon: string;
  title: string;
  description: string,
  link?: string;
  isNew?: boolean;
}

export interface Bulletin {
  id: string;
  date: string;
  title: string;
  link?: string;
}

export interface Metric {
  label: string;
  description: string;
  value: string;
}

export interface Analytics {
  metrics: Metric[];
}

export interface LeaderboardEntry {
  name: string,
  score: number
}

export interface LeaderboardData {
  leaderboard_data: LeaderboardEntry[];
}


export interface Testimonial {
  name: string;
  message: string;
  rating: number;
}
export interface TestimonialData {
  testimonial_data: Testimonial[];
}


// ─────────────────────────────────────────────────────────────
// types/examEngine.ts
// Extended type definitions for the Dynamic Exam Engine
// ─────────────────────────────────────────────────────────────

export type LayoutType =
  | "STANDARD"          // Single global timer, free navigation
  | "SECTIONAL_LOCK"    // Per-section timers, locked after expiry (Banking)
  | "MULTI_SESSION"     // Session 1 / Session 2 blocks with session-level rules
  | "TECH_SPLIT"        // Branch selector overlay + filtered question set (GATE)
  | "PASSAGE_SPLIT";    // Split-screen reading passage + question (Law/Judiciary)

export interface Question {
  q: string;
  options: string[];
  answer: number;          // 0-based index of correct option
  sectionId: string;       // e.g. "math" | "reasoning" | "english" | "technical"
  specialty?: string;      // TECH_SPLIT: "civil" | "mechanical" | "cs" | "electrical"
  passage?: string;        // PASSAGE_SPLIT: full passage text
}

export interface SectionConfig {
  id: string;              // Matches question.sectionId
  label: string;           // Display name e.g. "English Language"
  duration: number;        // Section time in minutes (SECTIONAL_LOCK)
  noNegative?: boolean;    // Override: disable negative marking for this section
}

export interface Session {
  id: string;
  label: string;           // e.g. "Session 1 — Objective"
  sectionIds: string[];    // Which sectionIds belong to this session
  noNegative?: boolean;    // Override: disable negative marking for this session
}

export interface EnrichedMockTest {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number;              // Total duration in minutes (global timer)
  total_questions: number;
  total_marks: number;
  negativeMarking: number;       // Default negative marking per wrong answer
  passingMarks: number;
  layoutType: LayoutType;        // Controls which engine variant renders
  path: string;
  questions: Question[];

  // ── Layout-specific config ──────────────────────────
  sections?: SectionConfig[];    // Required for SECTIONAL_LOCK
  sessions?: Session[];          // Required for MULTI_SESSION
  specialties?: string[];        // Required for TECH_SPLIT; list of branch names
}
