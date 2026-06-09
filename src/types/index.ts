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
}

export interface MockQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation?: string;
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
  text: string;
  link?: string;
  date?: string;
  isNew?: boolean;
}

export interface Bulletin {
  id: string;
  title: string;
  date: string;
  description: string;
  link?: string;
  category?: string;
}

export interface Analytics {
  totalUsers?: number;
  totalTests?: number;
  totalQuizzes?: number;
  totalDownloads?: number;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  badge?: string;
}

export interface Testimonial {
  name: string;
  message: string;
  rating: number;
}
