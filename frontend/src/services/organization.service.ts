import apiClient from '@/lib/api-client';

export interface Organization {
  id: number;
  name: string;
  parent_id: number | null;
  level?: number;
  children?: Organization[];
  majors_count?: number;
  classes_count?: number;
  students_count?: number;
  created_by?: number | null;
  updated_by?: number | null;
  creator_name?: string | null;
  updater_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface OrganizationCreate {
  name: string;
  parent_id?: number | null;
}

export interface OrganizationUpdate {
  name?: string;
  parent_id?: number | null;
}

export interface OrganizationTreeResponse {
  items: Organization[];
  total: number;
  skip: number;
  limit: number;
  tree: Organization[];
}

export const organizationService = {
  getAll: async (params?: { skip?: number; limit?: number; search?: string }): Promise<OrganizationTreeResponse> => {
    const response = await apiClient.get<OrganizationTreeResponse>('/organizations/', { params });
    return response.data;
  },

  getTree: async (): Promise<{ tree: Organization[] }> => {
    const response = await apiClient.get<{ tree: Organization[] }>('/organizations/tree');
    return response.data;
  },

  getById: async (id: number): Promise<Organization> => {
    const response = await apiClient.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  create: async (data: OrganizationCreate): Promise<Organization> => {
    const response = await apiClient.post<Organization>('/organizations/', data);
    return response.data;
  },

  update: async (id: number, data: OrganizationUpdate): Promise<Organization> => {
    const response = await apiClient.put<Organization>(`/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/organizations/${id}`);
  },

  importOrganizations: async (file: File): Promise<{ message: string; imported_count: number; total_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/organizations/import', formData);
    return response.data;
  },
};

