/**
 * 个性化学习内容服务
 */
import apiClient from '@/lib/api-client';
import { AxiosResponse } from 'axios';

export interface PersonalizedContent {
  id: number;
  content: string;
  created_at: string;
  has_history: boolean;
  history_count: number;
}

export interface PersonalizedContentHistoryItem {
  id: number;
  content: string;
  created_at: string;
}

class PersonalizedLearningService {
  private API_BASE_URL = '/student/personalized-learning';

  /**
   * 获取资源的个性化学习内容（最新）
   */
  async getContent(resourceId: number): Promise<PersonalizedContent> {
    try {
      const response: AxiosResponse<PersonalizedContent> = await apiClient.get(
        `${this.API_BASE_URL}/personalized-content/${resourceId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      throw error;
    }
  }

  /**
   * 生成新的个性化学习内容
   */
  async generateContent(resourceId: number): Promise<PersonalizedContent> {
    try {
      const response: AxiosResponse<PersonalizedContent> = await apiClient.post(
        `${this.API_BASE_URL}/personalized-content/generate`,
        { resource_id: resourceId }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating personalized content:', error);
      throw error;
    }
  }

  /**
   * 获取个性化学习内容历史记录
   */
  async getHistory(resourceId: number, skip: number = 0, limit: number = 10): Promise<PersonalizedContentHistoryItem[]> {
    try {
      const response: AxiosResponse<PersonalizedContentHistoryItem[]> = await apiClient.get(
        `${this.API_BASE_URL}/personalized-content/${resourceId}/history`,
        { params: { skip, limit } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching content history:', error);
      throw error;
    }
  }

  /**
   * 记录个性化学习内容的学习时长
   */
  async recordStudyTime(resourceId: number, contentId: number, durationSeconds: number): Promise<void> {
    try {
      await apiClient.post(
        `${this.API_BASE_URL}/personalized-content/record-study`,
        { resource_id: resourceId, content_id: contentId, duration_seconds: durationSeconds }
      );
    } catch (error) {
      console.error('Error recording study time:', error);
      // 不抛出错误，避免影响用户体验
    }
  }
}

const personalizedLearningService = new PersonalizedLearningService();
export default personalizedLearningService;
