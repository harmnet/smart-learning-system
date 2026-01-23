import apiClient from '@/lib/api-client';

export interface TeachingResource {
  id: number;
  teacher_id: number;
  teacher_name: string;
  resource_name: string;
  original_filename: string;
  file_size: number;
  resource_type: string;
  knowledge_point?: string;
  folder_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResourceStats {
  total: number;
  by_type: {
    video: number;
    ppt: number;
    pdf: number;
    word: number;
    excel: number;
    markdown: number;
    image: number;
  };
}

class TeachingResourceService {
  /**
   * 获取资源统计
   */
  async getStats(): Promise<ResourceStats> {
    const response = await apiClient.get<ResourceStats>('/teacher/resources/stats');
    return response.data;
  }

  /**
   * 获取资源列表
   */
  async getAll(
    teacherId: number,
    skip: number = 0,
    limit: number = 20,
    resourceType?: string,
    search?: string,
    folderId?: number
  ): Promise<TeachingResource[]> {
    const params: any = { teacher_id: teacherId, skip, limit };
    if (resourceType) params.resource_type = resourceType;
    if (search) params.search = search;
    if (folderId !== undefined) params.folder_id = folderId;
    
    console.log('请求教学资源，参数:', params, 'URL: /teacher/resources/');
    const response = await apiClient.get<TeachingResource[]>('/teacher/resources/', { params });
    console.log('教学资源API响应:', response.data);
    return response.data;
  }

  /**
   * 上传资源（支持进度回调）
   */
  async uploadResource(
    file: File,
    data: { resource_name: string; knowledge_point?: string; folder_id?: number },
    teacherId: number,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teacher_id', teacherId.toString());
    formData.append('resource_name', data.resource_name);
    if (data.knowledge_point) formData.append('knowledge_point', data.knowledge_point);
    if (data.folder_id !== undefined && data.folder_id !== null) {
      formData.append('folder_id', data.folder_id.toString());
    }
    
    console.log('上传文件信息:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      resourceName: data.resource_name,
      knowledgePoint: data.knowledge_point,
      folderId: data.folder_id,
      teacherId: teacherId
    });
    
    const response = await apiClient.post('/teacher/resources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  }

  /**
   * 更新资源信息
   */
  async updateResource(
    resourceId: number,
    data: { resource_name?: string; knowledge_point?: string; folder_id?: number }
  ): Promise<any> {
    const response = await apiClient.put(`/teacher/resources/${resourceId}`, data);
    return response.data;
  }

  /**
   * 删除资源
   */
  async deleteResource(resourceId: number): Promise<void> {
    await apiClient.delete(`/teacher/resources/${resourceId}`);
  }

  /**
   * 获取下载URL
   */
  getDownloadUrl(resourceId: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    return `${apiBase}/teacher/resources/${resourceId}/download`;
  }

  /**
   * 获取预览URL（包含token作为查询参数，用于iframe/img/video标签）
   */
  getPreviewUrl(resourceId: number): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    
    // 从localStorage获取token并添加到URL中（用于iframe/img/video标签，它们无法发送Authorization头）
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      if (token) {
        return `${apiBase}/teacher/resources/${resourceId}/preview?token=${encodeURIComponent(token)}`;
      }
    }
    
    return `${apiBase}/teacher/resources/${resourceId}/preview`;
  }

  /**
   * 获取WebOffice在线预览URL
   */
  async getWebOfficePreviewUrl(
    resourceId: number,
    options?: {
      expires?: number;
      allow_export?: boolean;
      allow_print?: boolean;
      watermark?: string;
    }
  ): Promise<{
    success: boolean;
    preview_url: string;
    resource_id: number;
    resource_name: string;
    resource_type: string;
    expires_in: number;
  }> {
    const params: any = {};
    if (options?.expires) params.expires = options.expires;
    if (options?.allow_export !== undefined) params.allow_export = options.allow_export;
    if (options?.allow_print !== undefined) params.allow_print = options.allow_print;
    if (options?.watermark) params.watermark = options.watermark;
    
    const response = await apiClient.get(`/teacher/resources/${resourceId}/weboffice-url`, { params });
    return response.data;
  }

  /**
   * 获取文档的预览信息（异步调用，返回预览URL和备用下载URL）
   * 返回格式：{ preview_url, download_url, preview_type, resource_type, file_name }
   */
  async getOfficePreviewUrl(resourceId: number, teacherId?: number): Promise<{
    preview_url: string;
    download_url?: string;
    preview_type: string;
    resource_type: string;
    file_name?: string;
    access_token?: string;
    refresh_token?: string;
    access_token_expired_time?: string;
    refresh_token_expired_time?: string;
  }> {
    try {
      // 构建请求参数，如果提供了teacherId则添加
      const params: any = {};
      if (teacherId !== undefined) {
        params.teacher_id = teacherId;
      }
      
      const response = await apiClient.get(`/teacher/resources/${resourceId}/preview`, {
        params,
        timeout: 60000, // 增加超时时间到60秒
      });
      // 如果返回的是JSON格式（包含preview_url字段）
      if (response.data && typeof response.data === 'object' && response.data.preview_url) {
        console.log('后端返回预览信息:', response.data);
        return {
          preview_url: response.data.preview_url,
          download_url: response.data.download_url || response.data.preview_url,
          preview_type: response.data.preview_type || 'download',
          resource_type: response.data.resource_type || 'unknown',
          file_name: response.data.file_name,
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          access_token_expired_time: response.data.access_token_expired_time,
          refresh_token_expired_time: response.data.refresh_token_expired_time,
        };
      }
      // 如果返回的是重定向或其他格式，说明不是Office文档
      console.warn('后端返回的不是JSON格式，可能是重定向');
      return {
        preview_url: this.getPreviewUrl(resourceId),
        download_url: this.getPreviewUrl(resourceId),
        preview_type: 'direct',
        resource_type: 'unknown'
      };
    } catch (error: any) {
      console.error('获取预览URL失败:', error);
      // 如果失败，返回接口URL作为备用
      const fallbackUrl = this.getPreviewUrl(resourceId);
      return {
        preview_url: fallbackUrl,
        download_url: fallbackUrl,
        preview_type: 'direct',
        resource_type: 'unknown'
      };
    }
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

export const teachingResourceService = new TeachingResourceService();
export default teachingResourceService;

