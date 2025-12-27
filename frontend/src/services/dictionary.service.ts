import apiClient from '@/lib/api-client';

export interface DictionaryItem {
  id: number;
  type_id: number;
  code: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
  remark?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DictionaryType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  items: DictionaryItem[];
  created_at?: string;
  updated_at?: string;
}

export interface DictionaryTypeCreate {
  code: string;
  name: string;
  description?: string;
  is_active?: boolean;
}

export interface DictionaryItemCreate {
  type_id: number;
  code: string;
  label: string;
  value: string;
  sort_order?: number;
  is_active?: boolean;
  remark?: string;
}

export const dictionaryService = {
  // 字典类型
  getTypes: async (): Promise<DictionaryType[]> => {
    const response = await apiClient.get<DictionaryType[]>('/dictionary/types');
    return response.data;
  },

  getType: async (typeId: number): Promise<DictionaryType> => {
    const response = await apiClient.get<DictionaryType>(`/dictionary/types/${typeId}`);
    return response.data;
  },

  createType: async (data: DictionaryTypeCreate): Promise<DictionaryType> => {
    const response = await apiClient.post<DictionaryType>('/dictionary/types', data);
    return response.data;
  },

  updateType: async (typeId: number, data: Partial<DictionaryTypeCreate>): Promise<DictionaryType> => {
    const response = await apiClient.put<DictionaryType>(`/dictionary/types/${typeId}`, data);
    return response.data;
  },

  deleteType: async (typeId: number): Promise<void> => {
    await apiClient.delete(`/dictionary/types/${typeId}`);
  },

  // 字典项
  getItemsByTypeCode: async (typeCode: string): Promise<DictionaryItem[]> => {
    const response = await apiClient.get<DictionaryItem[]>(`/dictionary/items/by-type/${typeCode}`);
    return response.data;
  },

  createItem: async (data: DictionaryItemCreate): Promise<DictionaryItem> => {
    const response = await apiClient.post<DictionaryItem>('/dictionary/items', data);
    return response.data;
  },

  updateItem: async (itemId: number, data: Partial<DictionaryItemCreate>): Promise<DictionaryItem> => {
    const response = await apiClient.put<DictionaryItem>(`/dictionary/items/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/dictionary/items/${itemId}`);
  },
};

