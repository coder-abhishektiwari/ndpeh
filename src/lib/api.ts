import type { Paper, Announcement, Bulletin, Analytics, QuizTopic, EnrichedMockTest, Question, LeaderboardData, TestimonialData } from "@/types";

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
    const response = await request<Announcement[]>("/announcements");

    console.log("API response in api.ts:", response);

    if (Array.isArray(response)) {
      return response;
    }

    return [];
  },

  async getBulletins(): Promise<Bulletin[]> {
    const response = await request<{ bulletins: Bulletin[] }>("/bulletins");
    return response.bulletins || [];
  },

  async getAnalytics(): Promise<Analytics> {
    const result = await request<{ metrics: any[] }>("/analytics");
    return (result || { metrics: [] }) as unknown as Analytics;
  },

  async getLeaderBoard(): Promise<LeaderboardData> {
    const result = await request<any>("/analytics");
    return {
      leaderboard_data: result?.leaderboard_data || result?.leader_board_data || []
    };
  },

  async getTestimonial(): Promise<TestimonialData> {
    const result = await request<any>("/analytics");
    return {
      testimonial_data: result?.testimonial_data || []
    };
  },

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
      apply_url: paper.apply_url,
      eligibility: paper.eligibility,
    }));

  },
  
  async getQuizTopics(): Promise<QuizTopic[]> {
    const result = await request<{ topics: QuizTopic[] }>("/quiz-topics");
    return result.topics || [];
  },

  async getQuizTopicById(topicId: string): Promise<QuizTopic> {
    return await request<QuizTopic>(`/quiz-topics/${topicId}`);
  },

  async getMockTests(): Promise<EnrichedMockTest[]> {
    try {
      return await request<EnrichedMockTest[]>("/mock-tests");
    } catch (err) {
      console.error("Error loading mock test list:", err);
      return [];
    }
  },

  async getMockTestQuestions(paperId: string): Promise<{ id: string; questions: Question[] }> {
    return request<{ id: string; questions: Question[] }>(`/mock-test/${encodeURIComponent(paperId)}`);
  },
});
