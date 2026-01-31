import apiClient from '@/lib/api-client';

export interface GradeComponent {
  key: string;
  name: string;
  weight: number;
  enabled: boolean;
}

export interface GradeComposition {
  components: GradeComponent[];
}

export interface CourseClassInfo {
  id: number;
  name: string | null;
  student_count: number;
}

export interface CourseGradeSummary {
  id: number;
  title: string;
  code?: string | null;
  grade_composition: GradeComposition;
  class_list: CourseClassInfo[];
  student_count: number;
}

export interface CourseStudentScore {
  quiz?: number | null;
  learning?: number | null;
  midterm?: number | null;
  final?: number | null;
}

export interface CourseStudentGrade {
  student_id: number;
  student_no?: string | null;
  student_name: string;
  class_id: number;
  class_name?: string | null;
  scores: CourseStudentScore;
  total_score: number;
  is_published: boolean;
  published_at?: string | null;
  learning_ai_result?: string | null;
}

export interface CourseStudentGradeResponse {
  course_id: number;
  composition: GradeComponent[];
  students: CourseStudentGrade[];
}

export interface PublishRequest {
  scope: 'class' | 'student';
  class_id?: number;
  student_ids?: number[];
  remark?: string;
}

export interface PublishHistoryItem {
  id: number;
  action: 'publish' | 'unpublish';
  scope: 'class' | 'student';
  class_id?: number | null;
  class_name?: string | null;
  student_id?: number | null;
  student_name?: string | null;
  operator_id: number;
  operator_name?: string | null;
  remark?: string | null;
  created_at: string;
}

class TeacherGradesService {
  async listCourses(params?: { search?: string; class_id?: number }): Promise<CourseGradeSummary[]> {
    const response = await apiClient.get<CourseGradeSummary[]>('/teacher/grades/courses', { params });
    return response.data;
  }

  async getComposition(courseId: number): Promise<GradeComposition> {
    const response = await apiClient.get<GradeComposition>(`/teacher/grades/courses/${courseId}/composition`);
    return response.data;
  }

  async updateComposition(courseId: number, payload: GradeComposition): Promise<GradeComposition> {
    const response = await apiClient.put<GradeComposition>(`/teacher/grades/courses/${courseId}/composition`, payload);
    return response.data;
  }

  async getCourseStudents(courseId: number, params?: { class_id?: number }): Promise<CourseStudentGradeResponse> {
    const response = await apiClient.get<CourseStudentGradeResponse>(`/teacher/grades/courses/${courseId}/students`, { params });
    return response.data;
  }

  async calculateLearningAIScore(courseId: number, studentId: number): Promise<{ student_id: number; score: number; reason?: string | null; raw_response?: string | null }> {
    const response = await apiClient.post(`/teacher/grades/courses/${courseId}/learning-ai-score`, { student_id: studentId });
    return response.data;
  }

  async downloadTemplate(courseId: number, examType: 'midterm' | 'final'): Promise<Blob> {
    const response = await apiClient.get(`/teacher/grades/courses/${courseId}/import/template`, {
      params: { exam_type: examType },
      responseType: 'blob'
    });
    return response.data;
  }

  async importExamScores(courseId: number, examType: 'midterm' | 'final', file: File): Promise<{ updated: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/teacher/grades/courses/${courseId}/import/${examType}`, formData);
    return response.data;
  }

  async publishGrades(courseId: number, payload: PublishRequest): Promise<{ updated: number }> {
    const response = await apiClient.post(`/teacher/grades/courses/${courseId}/publish`, payload);
    return response.data;
  }

  async unpublishGrades(courseId: number, payload: PublishRequest): Promise<{ updated: number }> {
    const response = await apiClient.post(`/teacher/grades/courses/${courseId}/unpublish`, payload);
    return response.data;
  }

  async getPublishHistory(courseId: number, params?: { student_id?: number }): Promise<PublishHistoryItem[]> {
    const response = await apiClient.get<PublishHistoryItem[]>(`/teacher/grades/courses/${courseId}/publish-history`, { params });
    return response.data;
  }
}

export const teacherGradesService = new TeacherGradesService();
export default teacherGradesService;
