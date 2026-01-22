import apiClient from '@/lib/api-client';
import {
  TeacherCourseOption,
  TeacherHomeworkSubmissionListResponse,
  TeacherHomeworkSubmissionDetail,
  TeacherHomeworkGradeRequest,
  TeacherHomeworkGradeHistoryResponse,
  TeacherHomeworkAIGradeResponse,
} from '@/types/homework';

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

  async getHomeworkCourses(): Promise<TeacherCourseOption[]> {
    const response = await apiClient.get<TeacherCourseOption[]>('/teacher/homeworks/courses');
    return response.data;
  }

  async getHomeworkSubmissions(params: {
    skip?: number;
    limit?: number;
    course_id?: number;
    student_no?: string;
    student_name?: string;
    homework_title?: string;
    status?: 'submitted' | 'graded';
  }): Promise<TeacherHomeworkSubmissionListResponse> {
    const response = await apiClient.get<TeacherHomeworkSubmissionListResponse>(
      '/teacher/homeworks/submissions',
      { params }
    );
    return response.data;
  }

  async getHomeworkSubmissionDetail(submissionId: number): Promise<TeacherHomeworkSubmissionDetail> {
    const response = await apiClient.get<TeacherHomeworkSubmissionDetail>(
      `/teacher/homeworks/submissions/${submissionId}`
    );
    return response.data;
  }

  async gradeHomeworkSubmission(
    submissionId: number,
    data: TeacherHomeworkGradeRequest
  ): Promise<TeacherHomeworkSubmissionDetail> {
    const response = await apiClient.post<TeacherHomeworkSubmissionDetail>(
      `/teacher/homeworks/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  }

  async getHomeworkSubmissionHistory(
    submissionId: number,
    params?: { skip?: number; limit?: number }
  ): Promise<TeacherHomeworkGradeHistoryResponse> {
    const response = await apiClient.get<TeacherHomeworkGradeHistoryResponse>(
      `/teacher/homeworks/submissions/${submissionId}/history`,
      { params }
    );
    return response.data;
  }

  async aiGradeHomeworkSubmission(submissionId: number): Promise<TeacherHomeworkAIGradeResponse> {
    const response = await apiClient.post<TeacherHomeworkAIGradeResponse>(
      `/teacher/homeworks/submissions/${submissionId}/ai-grade`
    );
    return response.data;
  }
}

export const teacherService = new TeacherService();
export default teacherService;
