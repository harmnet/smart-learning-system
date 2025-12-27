import apiClient from '@/lib/api-client';

export interface ReferenceFolder {
  id: number;
  teacher_id: number;
  folder_name: string;
  parent_id?: number;
  description?: string;
  is_active: boolean;
  resource_count: number;
  subfolder_count: number;
  created_at: string;
  updated_at: string;
}

export interface FolderCreate {
  folder_name: string;
  parent_id?: number;
  description?: string;
}

export interface FolderUpdate {
  folder_name?: string;
  description?: string;
}

class ReferenceFolderService {
  private API_BASE_URL = '/teacher/reference-folders';

  /**
   * 获取文件夹列表
   */
  async getFolders(teacherId: number, parentId?: number): Promise<ReferenceFolder[]> {
    const params: any = { teacher_id: teacherId };
    if (parentId !== undefined) {
      params.parent_id = parentId;
    }
    const response = await apiClient.get<ReferenceFolder[]>(this.API_BASE_URL, { params });
    return response.data;
  }

  /**
   * 创建文件夹
   */
  async createFolder(teacherId: number, data: FolderCreate): Promise<any> {
    const response = await apiClient.post(
      `${this.API_BASE_URL}?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 更新文件夹
   */
  async updateFolder(folderId: number, teacherId: number, data: FolderUpdate): Promise<any> {
    const response = await apiClient.put(
      `${this.API_BASE_URL}/${folderId}?teacher_id=${teacherId}`,
      data
    );
    return response.data;
  }

  /**
   * 删除文件夹
   */
  async deleteFolder(folderId: number, teacherId: number): Promise<any> {
    const response = await apiClient.delete(
      `${this.API_BASE_URL}/${folderId}?teacher_id=${teacherId}`
    );
    return response.data;
  }

  /**
   * 移动文件夹
   */
  async moveFolder(folderId: number, teacherId: number, targetParentId?: number): Promise<any> {
    const params: any = { teacher_id: teacherId };
    if (targetParentId !== undefined && targetParentId !== null) {
      params.target_parent_id = targetParentId;
    }
    const response = await apiClient.post(
      `${this.API_BASE_URL}/${folderId}/move`,
      null,
      { params }
    );
    return response.data;
  }

  /**
   * 移动参考资料
   */
  async moveMaterial(materialId: number, teacherId: number, targetFolderId?: number): Promise<any> {
    const params: any = { teacher_id: teacherId };
    if (targetFolderId !== undefined && targetFolderId !== null) {
      params.target_folder_id = targetFolderId;
    }
    const response = await apiClient.post(
      `${this.API_BASE_URL}/resources/${materialId}/move`,
      null,
      { params }
    );
    return response.data;
  }
}

export const referenceFolderService = new ReferenceFolderService();
export default referenceFolderService;

