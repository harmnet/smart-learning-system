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

class TeacherService {
  /**
   * 获取当前登录教师的信息
   */
  async getCurrentTeacher(): Promise<TeacherInfo> {
    const response = await apiClient.get<TeacherInfo>('/teacher/me');
    return response.data;
  }
}

export const teacherService = new TeacherService();
export default teacherService;

