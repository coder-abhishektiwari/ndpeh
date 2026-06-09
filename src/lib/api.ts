// src/lib/api.ts
// TypeScript port of js/api.js — REST API client to the exam backend
import type { Paper, Announcement, Bulletin, Analytics, QuizTopic } from "@/types";

const PRODUCTION_API_URL = "https://array-to-pdf-converter.onrender.com";
const API_BASE_URLS: string[] = [PRODUCTION_API_URL];

async function request<T>(path: string): Promise<T> {
  let lastError: Error | undefined;

  for (const baseUrl of API_BASE_URLS) {
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
          const body = await response.json();
          message = body.detail || body.error || message;
        } catch {
          // Keep the HTTP status message when the response is not JSON.
        }
        throw new Error(message);
      }
      return response.json() as Promise<T>;
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error("Backend is unavailable");
}

export const examApi = Object.freeze({
  baseUrl: API_BASE_URLS[0],
  async listPapers(): Promise<Paper[]> {
    const result = await request<{ papers?: Paper[] }>("/papers");
    return result.papers || [];
  },

  async getSectors(): Promise<{ sectors: string[] }> {
    const result = await request<{ sectors?: string[] }>("/papers");
    return {
      sectors: result.sectors || [],
    };
  },

  getPaper(paperId: string): Promise<Paper> {
    return request<Paper>(`/paper/${encodeURIComponent(paperId)}`);
  },
  async getAnnouncements(): Promise<Announcement[]> {
    return request<Announcement[]>("/announcements");
  },
  async getBulletins(): Promise<Bulletin[]> {
    return request<Bulletin[]>("/bulletins");
  },
  async getAnalytics(): Promise<Analytics> {
    return request<Analytics>("/analytics");
  },
  /** GET /exams — exam calendar data (fallback to sampleData) */
  async getExams(): Promise<import("@/types").ExamCalendarItem[]> {
    const d = await request<{ papers?: any[] }>("/papers");

    return (d.papers || []).map((paper) => ({
      id: paper.id,
      exam_name: paper.exam_name,
      exam_board: paper.exam_board,
      exam_date: paper.exam_date,
      application_start_date: paper.application_start_date,
      application_end_date: paper.application_end_date,
      vacancy: paper.vacancy,
      sector: paper.sector,
      status: paper.status,
      eligibility: paper.eligibility,
    }));

  },
  /** GET /quiz-topics — quiz topics and questions */
  // @/lib/api.ts ke andar
  async getQuizTopics(): Promise<QuizTopic[]> {
    // Pura object fetch karein jisme { topics: QuizTopic[] } ho
    const result = await request<{ topics: QuizTopic[] }>("/quiz-topics");

    // Usme se topics waali array nikal kar return kar dein
    return result.topics || [];
  },

  async getQuizTopicById(topicId: string): Promise<QuizTopic> {
    return await request<QuizTopic>(`/quiz-topics/${topicId}`);
  },

  /** GET /mock-tests — mock test configurations */
  async getMockTests(): Promise<import("@/types").MockTest[]> {
    try {
      const d = await request<{ tests?: import("@/types").MockTest[] }>("/mock-tests");
      return d.tests || [];
    } catch { return []; }
  },
});
