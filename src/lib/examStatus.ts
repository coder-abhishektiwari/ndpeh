// src/lib/examStatus.ts

export type ExamStatusLabel =
  | "Exam Tomorrow!"
  | "Exam This Week"
  | "Exam Approaching"
  | "Admit Card Soon"
  | "Application Closing Soon"
  | "Application Open"
  | "Application Opening Soon"
  | "Upcoming"
  | "Results Expected"
  | null;

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function daysDiff(from: Date, to: Date): number {
  return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function getExamStatusLabel(paper: {
  exam_date?: string | null;
  application_start_date?: string | null;
  application_end_date?: string | null;
}): ExamStatusLabel {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = parseDate(paper.exam_date);
  const appStart = parseDate(paper.application_start_date);
  const appEnd = parseDate(paper.application_end_date);

  // --- EXAM DATE LOGIC ---
  if (examDate) {
    const daysToExam = daysDiff(today, examDate);

    if (daysToExam === 1) return "Exam Tomorrow!";
    if (daysToExam >= 2 && daysToExam <= 7) return "Exam This Week";
    if (daysToExam >= 8 && daysToExam <= 30) return "Exam Approaching";
    if (daysToExam > 30 && daysToExam <= 45) return "Admit Card Soon"; // Admit card ~30-45 days before
  }

  // --- APPLICATION DATE LOGIC ---
  if (appEnd) {
    const daysToClose = daysDiff(today, appEnd);
    if (appStart && today < appStart) {
      // App not started yet
    } else if (daysToClose >= 0 && daysToClose <= 5) {
      return "Application Closing Soon";
    } else if (daysToClose > 5) {
      return "Application Open";
    }
  }

  if (appStart) {
    const daysToOpen = daysDiff(today, appStart);
    if (daysToOpen > 0 && daysToOpen <= 14) return "Application Opening Soon";
  }

  // --- RESULT LOGIC (exam just passed) ---
  if (examDate) {
    const daysSinceExam = daysDiff(examDate, today);
    if (daysSinceExam >= 0 && daysSinceExam <= 90) return "Results Expected";
  }

  return "Upcoming";
}

/**
 * Returns true if exam should be hidden (past exam + result window over)
 * Keep exams visible upto 90 days after exam date for result tracking
 */
export function isExamExpired(paper: {
  exam_date?: string | null;
  application_end_date?: string | null;
}): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = parseDate(paper.exam_date);
  if (examDate) {
    const daysSince = daysDiff(examDate, today);
    return daysSince > 90; // 90 din baad remove
  }

  // Agar sirf application end date hai, exam date nahi
  const appEnd = parseDate(paper.application_end_date);
  if (appEnd) {
    const daysSince = daysDiff(appEnd, today);
    return daysSince > 30; // App close ke 30 din baad remove
  }

  return false; // No dates = don't remove (could be perennial exam)
}