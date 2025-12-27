import apiClient from '@/lib/api-client';

export interface Student {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  student_no?: string;
  class_id?: number;
  class_name?: string;
  organization_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Teacher {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  major?: string; // From backend custom response
  organization?: string; // From backend custom response
}

export interface Class {
  id: number;
  name: string;
  code: string;
  major_id: number;
  major_name?: string;
  organization_name?: string;
  organization_id?: number;
  grade: string;
  is_active: boolean;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassCreate {
  name: string;
  code?: string;
  major_id: number;
  grade?: string;
}

export interface ClassUpdate {
  name?: string;
  code?: string;
  major_id?: number;
  grade?: string;
}

export interface TeacherCreate {
  username?: string;
  full_name: string;
  email: string;
  phone: string;  // Required field
  major_id: number;
  is_active?: boolean;
}

export interface TeacherUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  major_id?: number;
  is_active?: boolean;
}

export interface StudentCreate {
  username: string;
  password?: string;
  full_name: string;
  email?: string;
  phone: string;
  class_id: number;
  student_no: string;
  is_active?: boolean;
}

export interface StudentUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  class_id?: number;
  student_no?: string;
  is_active?: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  student_id: number;
  student_name: string;
  major_id: number;
  major_name: string;
  amount: number;
  status: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  majors: number;
  by_major: Array<{ major: string; count: number }>;
}

export interface TeacherStats {
  total: number;
  active: number;
  inactive: number;
}

export interface ClassStats {
  total: number;
  active: number;
  inactive: number;
  total_students: number;
}

export interface FinanceStats {
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  paid_amount: number;
  pending_amount: number;
  total_amount: number;
}

export interface StudentUpdate {
  username?: string;
  full_name?: string;
  email?: string;
  is_active?: boolean;
}

export interface MajorUpdate {
  name?: string;
  description?: string;
  tuition_fee?: number;
  duration_years?: number;
}

export const adminService = {
  // 学生管理
  getStudents: async (params?: { name?: string; student_no?: string; phone?: string; skip?: number; limit?: number }): Promise<{ items: Student[]; total: number; skip: number; limit: number }> => {
    const response = await apiClient.get<{ items: Student[]; total: number; skip: number; limit: number }>('/admin/students', { params });
    return response.data;
  },

  createStudent: async (data: StudentCreate): Promise<any> => {
    const response = await apiClient.post<any>('/admin/students', data);
    return response.data;
  },

  getStudent: async (studentId: number): Promise<Student> => {
    const response = await apiClient.get<Student>(`/admin/students/${studentId}`);
    return response.data;
  },

  updateStudent: async (studentId: number, data: StudentUpdate): Promise<Student> => {
    const response = await apiClient.put<Student>(`/admin/students/${studentId}`, data);
    return response.data;
  },

  deleteStudent: async (studentId: number): Promise<void> => {
    await apiClient.delete(`/admin/students/${studentId}`);
  },

  getStudentStats: async (): Promise<StudentStats> => {
    const response = await apiClient.get<StudentStats>('/admin/students/stats');
    return response.data;
  },

  // 教师管理
  getTeachers: async (params?: { name?: string; phone?: string; status?: string }): Promise<Teacher[]> => {
    const response = await apiClient.get<Teacher[]>('/admin/teachers', { params });
    return response.data;
  },

  getTeacherStats: async (): Promise<TeacherStats> => {
    const response = await apiClient.get<TeacherStats>('/admin/teachers/stats');
    return response.data;
  },

  createTeacher: async (data: TeacherCreate): Promise<Teacher> => {
    const response = await apiClient.post<Teacher>('/admin/teachers', data);
    return response.data;
  },

  updateTeacher: async (teacherId: number, data: TeacherUpdate): Promise<Teacher> => {
    const response = await apiClient.put<Teacher>(`/admin/teachers/${teacherId}`, data);
    return response.data;
  },

  deleteTeacher: async (teacherId: number): Promise<void> => {
    await apiClient.delete(`/admin/teachers/${teacherId}`);
  },

  resetTeacherPassword: async (teacherId: number): Promise<{ message: string; new_password: string; username: string }> => {
    const response = await apiClient.post<{ message: string; new_password: string; username: string }>(`/admin/teachers/${teacherId}/reset-password`);
    return response.data;
  },

  // 班级管理
  getClasses: async (params?: { skip?: number; limit?: number; name?: string; major_id?: number; organization_id?: number; grade?: string }): Promise<{ items: Class[]; total: number; skip: number; limit: number }> => {
    const response = await apiClient.get<{ items: Class[]; total: number; skip: number; limit: number }>('/admin/classes', { params });
    return response.data;
  },

  getClassStudents: async (classId: number, params?: { skip?: number; limit?: number }): Promise<{ items: Student[]; total: number; skip: number; limit: number; class_id: number; class_name: string }> => {
    const response = await apiClient.get<{ items: Student[]; total: number; skip: number; limit: number; class_id: number; class_name: string }>(`/admin/classes/${classId}/students`, { params });
    return response.data;
  },

  getClass: async (classId: number): Promise<Class> => {
    const response = await apiClient.get<Class>(`/admin/classes/${classId}`);
    return response.data;
  },

  createClass: async (data: ClassCreate): Promise<Class> => {
    const response = await apiClient.post<Class>('/admin/classes', data);
    return response.data;
  },

  updateClass: async (classId: number, data: ClassUpdate): Promise<Class> => {
    const response = await apiClient.put<Class>(`/admin/classes/${classId}`, data);
    return response.data;
  },

  deleteClass: async (classId: number): Promise<void> => {
    await apiClient.delete(`/admin/classes/${classId}`);
  },

  getClassStats: async (): Promise<ClassStats> => {
    const response = await apiClient.get<ClassStats>('/admin/classes/stats');
    return response.data;
  },

  // 财务管理
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/admin/finance/orders');
    return response.data;
  },

  getFinanceStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get<FinanceStats>('/admin/finance/stats');
    return response.data;
  },

  // 批量导入
  importStudents: async (file: File): Promise<{ message: string; imported_count: number; total_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/students/import', formData);
    return response.data;
  },

  importTeachers: async (file: File): Promise<{ message: string; imported_count: number; total_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/teachers/import', formData);
    return response.data;
  },

  importClasses: async (file: File): Promise<{ message: string; imported_count: number; total_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/admin/classes/import', formData);
    return response.data;
  },
};
