/**
 * AI创作服务
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface GenerateRequest {
  knowledge_point: string;
  graph_id: number;
  teacher_id: number;
  custom_prompt?: string;
  selected_resource_ids?: number[];
  auxiliary_files?: File[];
}

export interface GenerateResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface SaveRequest {
  teacher_id: number;
  resource_name: string;
  markdown_content: string;
  knowledge_point: string;
  folder_id?: number;
}

export interface SaveResponse {
  success: boolean;
  resource_id?: number;
  error?: string;
}

export interface ExportRequest {
  resource_name: string;
  markdown_content: string;
}

export const aiCreationService = {
  /**
   * AI生成教学内容
   */
  generateContent: async (data: GenerateRequest): Promise<GenerateResponse> => {
    try {
      const formData = new FormData();
      formData.append('knowledge_point', data.knowledge_point);
      formData.append('graph_id', data.graph_id.toString());
      formData.append('teacher_id', data.teacher_id.toString());
      
      // 添加自定义提示词
      if (data.custom_prompt) {
        formData.append('custom_prompt', data.custom_prompt);
      }
      
      // 添加选中的资源ID列表
      if (data.selected_resource_ids && data.selected_resource_ids.length > 0) {
        formData.append('selected_resource_ids', data.selected_resource_ids.join(','));
      }
      
      // 添加辅助文件
      if (data.auxiliary_files && data.auxiliary_files.length > 0) {
        data.auxiliary_files.forEach((file) => {
          formData.append('auxiliary_files', file);
        });
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/teacher/ai-creation/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 330000, // 5.5分钟超时（比后端的5分钟稍长）
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('AI生成内容失败:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || '生成失败',
      };
    }
  },

  /**
   * 保存AI生成的内容到系统
   */
  saveContent: async (data: SaveRequest): Promise<SaveResponse> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/teacher/ai-creation/save`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('保存AI内容失败:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message || '保存失败',
      };
    }
  },

  /**
   * 导出AI生成的内容到本地
   */
  exportContent: async (data: ExportRequest): Promise<Blob> => {
    try {
      const formData = new FormData();
      formData.append('resource_name', data.resource_name);
      formData.append('markdown_content', data.markdown_content);
      
      const response = await axios.post(
        `${API_BASE_URL}/teacher/ai-creation/export`,
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('导出AI内容失败:', error);
      throw new Error(error.response?.data?.detail || error.message || '导出失败');
    }
  },
};

