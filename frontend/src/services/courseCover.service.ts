import apiClient from '@/lib/api-client';

export interface CoverImage {
  id: number;
  filename: string;
  image_url: string;
  file_size?: number;
  created_at?: string;
}

class CourseCoverService {
  /**
   * 获取所有图片列表
   */
  async getAll(skip: number = 0, limit: number = 100, includeUsed: boolean = true): Promise<CoverImage[]> {
    const response = await apiClient.get<CoverImage[]>('/course-covers/', {
      params: { skip, limit, include_used: includeUsed }
    });
    return response.data;
  }

  /**
   * 获取图片总数
   */
  async getCount(includeUsed: boolean = true): Promise<{ total: number }> {
    const response = await apiClient.get<{ total: number }>('/course-covers/count', {
      params: { include_used: includeUsed }
    });
    return response.data;
  }

  /**
   * 上传图片
   */
  async uploadImage(file: File): Promise<{ id: number; filename: string; image_url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    // 不要手动设置 Content-Type，让浏览器自动设置（包含 boundary）
    const response = await apiClient.post('/course-covers/upload', formData);
    return response.data;
  }

  /**
   * 删除图片
   */
  async deleteImage(imageId: number): Promise<void> {
    await apiClient.delete(`/course-covers/${imageId}`);
  }

  /**
   * 获取图片URL
   */
  getImageUrl(imageId: number): string {
    // 如果 NEXT_PUBLIC_API_URL 已经包含 /api/v1，直接使用；否则添加
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const apiBase = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
    return `${apiBase}/course-covers/${imageId}/image`;
  }

  /**
   * 更新图片信息（重命名）
   */
  async updateImage(imageId: number, filename: string): Promise<CoverImage> {
    const response = await apiClient.put(`/course-covers/${imageId}`, { filename });
    return response.data;
  }

  /**
   * 替换图片
   */
  async replaceImage(imageId: number, file: File): Promise<{ id: number; filename: string; image_url: string; file_size: number }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/course-covers/${imageId}/replace`, formData);
    return response.data;
  }
}

export const courseCoverService = new CourseCoverService();
export default courseCoverService;
