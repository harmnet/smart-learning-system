import apiClient from '@/lib/api-client';

export interface TeacherInfo {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  major_id?: number;
  major_name?: string;
  title?: string;
  intro?: string;
}

export interface TeacherAnalyticsOverview {
  stats: {
    total_courses: number;
    student_count: number;
    avg_completion_rate: number;
    warning_students: number;
    study_hours: number;
  };
  learning_trend: Array<{
    date: string;
    study_count: number;
    study_duration: number;
  }>;
  course_progress: Array<{
    course_id: number;
    course_name: string;
    study_minutes: number;
    study_count: number;
  }>;
  score_distribution: Array<{ name: string; value: number }>;
  risk_students: Array<{
    student_id: number;
    student_name: string;
    student_no?: string;
    course_name?: string;
    reason: string;
    progress: number;
  }>;
}

class TeacherService {
  /**
   * 获取当前登录教师的信息
   */
  async getCurrentTeacher(): Promise<TeacherInfo> {
    const response = await apiClient.get<TeacherInfo>('/teacher/me');
    return response.data;
  }

  async getAnalyticsOverview(range: 'week' | 'month' | 'term' = 'month'): Promise<TeacherAnalyticsOverview> {
    const response = await apiClient.get<TeacherAnalyticsOverview>('/teacher/analytics/overview', {
      params: { range }
    });
    return response.data;
  }
}

export const teacherService = new TeacherService();
export default teacherService;
