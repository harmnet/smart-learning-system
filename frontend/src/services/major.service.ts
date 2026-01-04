import apiClient from '@/lib/api-client';

export interface Major {
  id: number;
  name: string;
  code?: string | null;
  description?: string;
  tuition_fee: number;
  duration_years: number;
  organization_id: number;
  organization_name?: string;
  teacher_id?: number | null;
  teacher_name?: string | null;
  classes_count?: number;
  students_count?: number;
  total_tuition?: number;
}

export interface MajorCreate {
  name: string;
  code?: string | null;
  description?: string;
  tuition_fee: number;
  duration_years: number;
  organization_id: number;
  teacher_id?: number | null;
}

export interface MajorUpdate {
  name?: string;
  code?: string | null;
  description?: string;
  tuition_fee?: number;
  duration_years?: number;
  organization_id?: number;
  teacher_id?: number | null;
}

export interface Teacher {
  id: number;
  username: string;
  phone?: string;
}

export interface MajorStats {
  total: number;
  avg_tuition: number;
  avg_duration: number;
  departments: number;
}

export const majorService = {
  getAll: async (params?: { name?: string; skip?: number; limit?: number }): Promise<{ items: Major[]; total: number; skip: number; limit: number }> => {
    const response = await apiClient.get<{ items: Major[]; total: number; skip: number; limit: number }>('/majors/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Major> => {
    const response = await apiClient.get<Major>(`/majors/${id}`);
    return response.data;
  },

  create: async (data: MajorCreate): Promise<Major> => {
    const response = await apiClient.post<Major>('/majors/', data);
    return response.data;
  },

  update: async (id: number, data: MajorUpdate): Promise<Major> => {
    const response = await apiClient.put<Major>(`/majors/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/majors/${id}`);
  },

  // Aliases for consistency
  updateMajor: async (id: number, data: MajorUpdate): Promise<Major> => {
    const response = await apiClient.put<Major>(`/majors/${id}`, data);
    return response.data;
  },

  deleteMajor: async (id: number): Promise<void> => {
    await apiClient.delete(`/majors/${id}`);
  },

  createMajor: async (data: MajorCreate): Promise<Major> => {
    const response = await apiClient.post<Major>('/majors/', data);
    return response.data;
  },

  getStats: async (): Promise<MajorStats> => {
    const response = await apiClient.get<MajorStats>('/majors/stats');
    return response.data;
  },

  importMajors: async (file: File): Promise<{ message: string; imported_count: number; total_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/majors/import', formData);
    return response.data;
  },

  searchTeachers: async (search?: string): Promise<Teacher[]> => {
    const response = await apiClient.get<Teacher[]>('/majors/teachers', { params: { search } });
    return response.data;
  },
};

