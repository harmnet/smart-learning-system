/**
 * AI测评服务
 */
import apiClient from '@/lib/api-client';
import { AxiosResponse } from 'axios';

export interface QuizQuestion {
  id: number;
  type: 'single' | 'multiple' | 'judge';
  question: string;
  options: string[];
  correct_answer: string | string[];
  explanation: string;
  user_answer?: string | string[];
  is_correct?: boolean;
}

export interface AIQuiz {
  id: number;
  questions: QuizQuestion[];
  is_submitted: boolean;
  score?: number;
  total_score: number;
  created_at: string;
  submitted_at?: string;
}

export interface AIQuizSubmitRequest {
  quiz_id: number;
  answers: Record<number, string | string[]>;
}

export interface AIQuizHistoryItem {
  id: number;
  is_submitted: boolean;
  score?: number;
  total_score: number;
  created_at: string;
  submitted_at?: string;
  question_count: number;
}

class AIQuizService {
  private API_BASE_URL = '/student/personalized-learning';

  /**
   * 生成AI测评题目
   */
  async generateQuiz(resourceId: number): Promise<AIQuiz> {
    try {
      const response: AxiosResponse<AIQuiz> = await apiClient.post(
        `${this.API_BASE_URL}/ai-quiz/generate`,
        { resource_id: resourceId }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }

  /**
   * 提交测评答案
   */
  async submitQuiz(quizId: number, answers: Record<number, string | string[]>): Promise<AIQuiz> {
    try {
      const response: AxiosResponse<AIQuiz> = await apiClient.post(
        `${this.API_BASE_URL}/ai-quiz/submit`,
        { quiz_id: quizId, answers }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  /**
   * 获取测评详情
   */
  async getQuizDetail(quizId: number): Promise<AIQuiz> {
    try {
      const response: AxiosResponse<AIQuiz> = await apiClient.get(
        `${this.API_BASE_URL}/ai-quiz/detail/${quizId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz detail:', error);
      throw error;
    }
  }

  /**
   * 用相同题目重新做一次测评
   */
  async retryQuiz(quizId: number): Promise<AIQuiz> {
    try {
      const response: AxiosResponse<AIQuiz> = await apiClient.post(
        `${this.API_BASE_URL}/ai-quiz/retry/${quizId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error retrying quiz:', error);
      throw error;
    }
  }

  /**
   * 获取测评历史记录
   */
  async getHistory(resourceId: number, skip: number = 0, limit: number = 10): Promise<AIQuizHistoryItem[]> {
    try {
      const response: AxiosResponse<AIQuizHistoryItem[]> = await apiClient.get(
        `${this.API_BASE_URL}/ai-quiz/${resourceId}/history`,
        { params: { skip, limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      throw error;
    }
  }

  /**
   * 记录AI测评的学习时长
   */
  async recordStudyTime(resourceId: number, quizId: number, durationSeconds: number): Promise<void> {
    try {
      await apiClient.post(`${this.API_BASE_URL}/ai-quiz/record-study`, {
        resource_id: resourceId,
        quiz_id: quizId,
        duration_seconds: durationSeconds,
      });
    } catch (error) {
      console.error('Error recording quiz study time:', error);
      // 不抛出错误，避免影响用户体验
    }
  }
}

const aiQuizService = new AIQuizService();
export default aiQuizService;
