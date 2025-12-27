import apiClient from '@/lib/api-client';

export interface Exam {
  id: number;
  teacher_id: number;
  teacher_name: string;
  exam_paper_id: number;
  paper_name: string;
  exam_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  cover_image?: string;
  early_login_minutes: number;
  late_forbidden_minutes: number;
  status: 'not_started' | 'in_progress' | 'ended';
  student_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamStudent {
  id: number;
  student_id: number;
  student_no: string;
  student_name: string;
  username: string;
  phone?: string;
}

export interface ExamDetail extends Exam {
  students: ExamStudent[];
}

export interface ExamCreate {
  exam_paper_id: number;
  exam_name: string;
  exam_date: string; // YYYY-MM-DD
  start_time: string; // YYYY-MM-DDTHH:mm:ss
  end_time: string; // YYYY-MM-DDTHH:mm:ss
  early_login_minutes: number;
  late_forbidden_minutes: number;
}

export interface ExamUpdate {
  exam_paper_id?: number;
  exam_name?: string;
  exam_date?: string;
  start_time?: string;
  end_time?: string;
  early_login_minutes?: number;
  late_forbidden_minutes?: number;
}

export interface AddStudentsRequest {
  student_ids: number[];
}

class ExamService {
  /**
   * 获取考试列表
   */
  async getAll(
    teacherId: number,
    skip: number = 0,
    limit: number = 100,
    search?: string,
    status?: string
  ): Promise<Exam[]> {
    const params: any = { teacher_id: teacherId, skip, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    
    const response = await apiClient.get<Exam[]>('/teacher/exams/', { params });
    return response.data;
  }

  /**
   * 获取考试详情
   */
  async getById(examId: number, teacherId: number): Promise<ExamDetail> {
    const response = await apiClient.get<ExamDetail>(
      `/teacher/exams/${examId}?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 创建考试
   */
  async create(teacherId: number, data: ExamCreate): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exams/?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 更新考试
   */
  async update(examId: number, teacherId: number, data: ExamUpdate): Promise<any> {
    const response = await apiClient.put(
      `/teacher/exams/${examId}?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 删除考试
   */
  async delete(examId: number, teacherId: number): Promise<void> {
    await apiClient.delete(`/teacher/exams/${examId}?teacher_id=${teacherId}`);
  }

  /**
   * 上传考试封面
   */
  async uploadCover(examId: number, teacherId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacher_id', teacherId.toString());
    
    const response = await apiClient.post(
      `/teacher/exams/${examId}/cover`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * 添加考生
   */
  async addStudents(examId: number, teacherId: number, data: AddStudentsRequest): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exams/${examId}/students?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 移除考生
   */
  async removeStudent(examId: number, studentId: number, teacherId: number): Promise<void> {
    await apiClient.delete(
      `/teacher/exams/${examId}/students/${studentId}?teacher_id=${teacherId}`
    );
  }

  /**
   * 导出成绩
   */
  async exportGrades(examId: number, teacherId: number): Promise<any> {
    const response = await apiClient.get(
      `/teacher/exams/${examId}/export-grades?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 获取封面URL
   */
  getCoverUrl(coverImage?: string): string {
    if (!coverImage) return '';
    if (coverImage.startsWith('http')) return coverImage;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${baseUrl}/${coverImage}`;
  }
}

export const examService = new ExamService();
export default examService;

