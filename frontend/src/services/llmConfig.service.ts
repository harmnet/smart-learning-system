import apiClient from '../lib/api-client';

export interface LLMConfig {
  id: number;
  provider_name: string;
  provider_key: string;
  api_key: string;
  api_secret?: string;
  endpoint_url?: string;
  model_name?: string;
  config_json?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LLMConfigCreate {
  provider_name: string;
  provider_key: string;
  api_key: string;
  api_secret?: string;
  endpoint_url?: string;
  model_name?: string;
  config_json?: string;
  is_active: boolean;
}

export interface LLMConfigUpdate {
  provider_name?: string;
  api_key?: string;
  api_secret?: string;
  endpoint_url?: string;
  model_name?: string;
  config_json?: string;
  is_active?: boolean;
}

class LLMConfigService {
  private baseUrl = '/admin/llm-configs';

  async getAll(): Promise<LLMConfig[]> {
    const response = await apiClient.get<LLMConfig[]>(this.baseUrl);
    return response.data;
  }

  async getById(id: number): Promise<LLMConfig> {
    const response = await apiClient.get<LLMConfig>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(data: LLMConfigCreate): Promise<LLMConfig> {
    const response = await apiClient.post<LLMConfig>(this.baseUrl, data);
    return response.data;
  }

  async update(id: number, data: LLMConfigUpdate): Promise<LLMConfig> {
    const response = await apiClient.put<LLMConfig>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async toggle(id: number): Promise<LLMConfig> {
    const response = await apiClient.patch<LLMConfig>(`${this.baseUrl}/${id}/toggle`);
    return response.data;
  }

  async test(id: number, message: string): Promise<{success: boolean; response?: string; error?: string}> {
    const response = await apiClient.post<{success: boolean; response?: string; error?: string}>(
      `${this.baseUrl}/${id}/test`,
      { message }
    );
    return response.data;
  }
}

export const llmConfigService = new LLMConfigService();

