/**
 * 学习偏好测评服务
 */
import apiClient from '@/lib/api-client';

export interface Assessment {
  id: number;
  student_id: number;
  answers: Record<string, string>;
  open_response?: string;
  ai_evaluation: string;
  tags?: string[];
  llm_config_id?: number;
  created_at: string;
}

export interface LearningProfile {
  has_profile: boolean;
  total_assessments: number;
  latest_assessment?: Assessment;
  history: Assessment[];
}

export interface AssessmentSubmit {
  answers: Record<string, string>;
  open_response?: string;
}

export interface AssessmentHistory {
  total: number;
  assessments: Assessment[];
}

class LearningProfileService {
  /**
   * 获取学习偏好档案
   */
  async getProfile(): Promise<LearningProfile> {
    const response = await apiClient.get<LearningProfile>('/student/learning-profile');
    return response.data;
  }

  /**
   * 提交测评
   */
  async submitAssessment(data: AssessmentSubmit): Promise<Assessment> {
    const response = await apiClient.post<Assessment>('/student/learning-profile/submit', data);
    return response.data;
  }

  /**
   * 获取测评历史
   */
  async getHistory(skip: number = 0, limit: number = 10): Promise<AssessmentHistory> {
    const response = await apiClient.get<AssessmentHistory>('/student/learning-profile/history', {
      params: { skip, limit }
    });
    return response.data;
  }
}

export const learningProfileService = new LearningProfileService();
export default learningProfileService;
