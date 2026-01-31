import apiClient from '@/lib/api-client';

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected';

export interface EnrollmentListItem {
  id: number;
  phone: string;
  status: EnrollmentStatus;
  child_name: string;
  programme_interested: string | null;
  created_at: string | null;
}

export interface EnrollmentListResponse {
  items: EnrollmentListItem[];
  total: number;
}

export interface CreateEnrollmentResponse {
  id: number;
  phone: string;
  status: EnrollmentStatus;
  created_at: string | null;
}

export type EnrollmentPayload = Record<string, any> & {
  phone: string;
};

export const enrollmentService = {
  async create(payload: EnrollmentPayload) {
    const res = await apiClient.post<CreateEnrollmentResponse>('/enrollments', payload);
    return res.data;
  },

  async getByPhone(phone: string) {
    const res = await apiClient.get<EnrollmentListResponse>('/enrollments/by-phone', {
      params: { phone },
    });
    return res.data;
  },
};
