import axios from 'axios';

export interface CreatePPTRequest {
  title: string;
  knowledge_point: string;
  graph_id: number;
  teacher_id: number;
  custom_prompt?: string;
  selected_resource_ids?: string;
  template_file?: File;
}

export interface CreatePPTResponse {
  success: boolean;
  project_id?: string;
  iframe_url?: string;
  error?: string;
}

export interface SavePPTResponse {
  success: boolean;
  resource_id?: number;
  error?: string;
}

class PPTCreationService {
  private baseURL = '/api/v1/teacher/ppt-creation';

  async createProject(data: {
    title: string;
    knowledge_point: string;
    graph_id: number;
    teacher_id: number;
    custom_prompt?: string;
    selected_resource_ids?: number[];
    template_file?: File;
  }): Promise<CreatePPTResponse> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('knowledge_point', data.knowledge_point);
    formData.append('graph_id', data.graph_id.toString());
    formData.append('teacher_id', data.teacher_id.toString());
    
    if (data.custom_prompt) {
      formData.append('custom_prompt', data.custom_prompt);
    }
    
    if (data.selected_resource_ids && data.selected_resource_ids.length > 0) {
      formData.append('selected_resource_ids', data.selected_resource_ids.join(','));
    }
    
    if (data.template_file) {
      formData.append('template_file', data.template_file);
    }

    const response = await axios.post(`${this.baseURL}/create`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000  // 5分钟
    });
    return response.data;
  }

  async saveToSystem(projectId: string, data: {
    resource_name: string;
    folder_id?: number;
    knowledge_point?: string;
    teacher_id: number;
  }): Promise<SavePPTResponse> {
    const formData = new FormData();
    formData.append('resource_name', data.resource_name);
    formData.append('teacher_id', data.teacher_id.toString());
    
    if (data.folder_id) {
      formData.append('folder_id', data.folder_id.toString());
    }
    
    if (data.knowledge_point) {
      formData.append('knowledge_point', data.knowledge_point);
    }

    const response = await axios.post(`${this.baseURL}/${projectId}/save`, formData);
    return response.data;
  }

  async exportPPT(projectId: string): Promise<Blob> {
    const response = await axios.get(`${this.baseURL}/${projectId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const pptCreationService = new PPTCreationService();

