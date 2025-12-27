import apiClient from '@/lib/api-client';

export interface StudentCourse {
  id: number;
  title: string;
  name: string;
  code?: string;
  description?: string;
  credits?: number;
  course_type?: string;
  hours?: number;
  introduction?: string;
  objectives?: string;
  cover_image?: string;
  cover_id?: number;
  teachers?: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  main_teacher_id?: number;
}

export interface StudentProfile {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  phone?: string;
  student_no?: string;
  class_id?: number;
  class_name?: string;
  major_id?: number;
  status?: string;
}

class StudentService {
  /**
   * 获取学生的课程列表（基于班级关联）
   */
  async getCourses(): Promise<StudentCourse[]> {
    const response = await apiClient.get<StudentCourse[]>('/student/courses');
    return response.data;
  }

  /**
   * 获取学生个人信息
   */
  async getProfile(): Promise<StudentProfile> {
    const response = await apiClient.get<StudentProfile>('/student/profile');
    return response.data;
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
}

export const studentService = new StudentService();
export default studentService;

