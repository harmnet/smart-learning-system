import apiClient from '@/lib/api-client';

// ============= Types =============
export interface Major {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  duration_years: number;
}

export interface ClassInfo {
  id: number;
  name: string;
  major_id: number;
  semester: string | null;
  grade: string | null;
  code: string | null;
  student_count: number;
}

export interface Student {
  id: number;
  student_no: string;
  student_name: string;
  username: string;
  phone: string | null;
  class_name: string | null;
}

export interface ExamStudent {
  id: number;
  exam_id: number;
  student_id: number;
  student_no: string;
  student_name: string;
  class_name: string | null;
  created_at: string;
}

// ============= Service =============
class ExamStudentService {
  /**
   * 获取教师管理的专业
   */
  async getTeacherMajors(teacherId: number): Promise<Major[]> {
    const response = await apiClient.get<Major[]>(
      `/teacher/majors?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 获取专业下的班级
   */
  async getMajorClasses(majorId: number): Promise<ClassInfo[]> {
    const response = await apiClient.get<ClassInfo[]>(
      `/teacher/majors/${majorId}/classes`
    );
    return response.data;
  }

  /**
   * 获取班级下的学生
   */
  async getClassStudents(classId: number): Promise<Student[]> {
    const response = await apiClient.get<Student[]>(
      `/teacher/classes/${classId}/students`
    );
    return response.data;
  }

  /**
   * 获取考试的考生列表
   */
  async getExamStudents(examId: number, teacherId: number): Promise<ExamStudent[]> {
    const response = await apiClient.get<ExamStudent[]>(
      `/teacher/exams/${examId}/students?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 添加单个学生到考试
   */
  async addStudent(examId: number, teacherId: number, studentId: number): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exams/${examId}/students/batch?teacher_id=${teacherId}`,
      { student_ids: [studentId] }
    );
    return response.data;
  }

  /**
   * 批量添加学生到考试
   */
  async addStudentsBatch(examId: number, teacherId: number, studentIds: number[]): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exams/${examId}/students/batch?teacher_id=${teacherId}`,
      { student_ids: studentIds }
    );
    return response.data;
  }

  /**
   * 添加整个班级的学生到考试
   */
  async addClassStudents(examId: number, teacherId: number, classId: number): Promise<any> {
    const response = await apiClient.post(
      `/teacher/exams/${examId}/students/class/${classId}?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 移除单个考生
   */
  async removeStudent(examId: number, teacherId: number, examStudentId: number): Promise<void> {
    await apiClient.delete(
      `/teacher/exams/${examId}/students/batch?teacher_id=${teacherId}`,
      {
        data: { exam_student_ids: [examStudentId] }
      }
    );
  }

  /**
   * 批量移除考生
   */
  async removeStudentsBatch(examId: number, teacherId: number, examStudentIds: number[]): Promise<void> {
    await apiClient.delete(
      `/teacher/exams/${examId}/students/batch?teacher_id=${teacherId}`,
      {
        data: { exam_student_ids: examStudentIds }
      }
    );
  }
}

export const examStudentService = new ExamStudentService();
export default examStudentService;

