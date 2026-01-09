import apiClient from '@/lib/api-client';

export interface CourseWithProgress {
  id: number;
  title: string;
  code?: string;
  introduction?: string;
  cover_image?: string;
  cover_id?: number;
  credits?: number;
  course_type?: string;
  is_public?: boolean;
  major_name?: string;
  teacher_name?: string;
  last_learning_time?: string;
  learner_count?: number;
  created_at?: string;
  study_minutes?: number;
  study_count?: number;
}

export interface StudentDashboard {
  my_courses: CourseWithProgress[];
  recommended_courses: CourseWithProgress[];
  new_courses: CourseWithProgress[];
  stats: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
  };
  class_info?: {
    class_id: number;
    class_name: string;
  };
}

export interface StudentExam {
  id: number;
  exam_name: string;
  course_name?: string;
  course_id?: number;
  chapter_name?: string;
  section_name?: string;
  start_time: string;
  end_time: string;
  status: 'not_started' | 'in_progress' | 'expired';
  duration: number;
  source: 'direct' | 'course';
}

export interface LearningCurve {
  date: string;
  study_count: number;
  study_duration: number; // minutes
}

export interface TeacherInteraction {
  id: number;
  teacher_name: string;
  teacher_avatar?: string;
  course_name: string;
  message: string;
  interaction_type: string;
  created_at: string;
  is_read: boolean;
}

class StudentHomeService {
  /**
   * 获取学生首页Dashboard数据
   */
  async getDashboard(): Promise<StudentDashboard> {
    const response = await apiClient.get<StudentDashboard>('/student/home/dashboard');
    return response.data;
  }

  /**
   * 获取学生的考试列表
   */
  async getMyExams(): Promise<StudentExam[]> {
    const response = await apiClient.get<StudentExam[]>('/student/exams');
    return response.data;
  }

  /**
   * 获取学习曲线数据
   */
  async getLearningCurve(days: number = 7): Promise<LearningCurve[]> {
    const response = await apiClient.get<LearningCurve[]>(`/student/home/learning-curve?days=${days}`);
    return response.data;
  }

  /**
   * 获取师生互动记录
   */
  async getInteractions(limit: number = 10): Promise<TeacherInteraction[]> {
    const response = await apiClient.get<TeacherInteraction[]>(`/student/interactions?limit=${limit}`);
    return response.data;
  }

  /**
   * 标记互动消息为已读
   */
  async markInteractionAsRead(interactionId: number): Promise<void> {
    await apiClient.post(`/student/interactions/${interactionId}/read`);
  }

  /**
   * 获取课程封面URL
   */
  getCoverUrl(coverImage?: string, coverId?: number): string {
    if (!coverImage && !coverId) return '';
    
    if (coverId) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
      return `${apiBase}/course-covers/${coverId}/image`;
    }
    
    if (coverImage) {
      if (coverImage.startsWith('http')) {
        return coverImage;
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
      return `${apiBase}/course-covers/file/${encodeURIComponent(coverImage)}`;
    }
    
    return '';
  }

  /**
   * 判断考试状态
   */
  getExamStatus(startTime: string, endTime: string): 'not_started' | 'in_progress' | 'expired' {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) {
      return 'not_started';
    } else if (now >= start && now <= end) {
      return 'in_progress';
    } else {
      return 'expired';
    }
  }

  /**
   * 格式化剩余时间
   */
  formatTimeRemaining(startTime: string, endTime: string): string {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const status = this.getExamStatus(startTime, endTime);
    
    if (status === 'not_started') {
      const diff = start.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `${days}天后开始`;
      } else if (hours > 0) {
        return `${hours}小时后开始`;
      } else {
        return '即将开始';
      }
    } else if (status === 'in_progress') {
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      if (days > 0) {
        return `剩余${days}天`;
      } else if (hours > 0) {
        return `剩余${hours}小时`;
      } else {
        return '即将结束';
      }
    } else {
      return '已结束';
    }
  }
}

export const studentHomeService = new StudentHomeService();
export default studentHomeService;

