import apiClient from '@/lib/api-client';
import {
  HomeworkDetail,
  HomeworkSubmitRequest,
  HomeworkSubmitResponse,
  AddAttachmentRequest,
  AddAttachmentResponse,
} from '@/types/homework';

class StudentHomeworkService {
  /**
   * 获取作业详情
   */
  async getHomeworkDetail(homeworkId: number): Promise<HomeworkDetail> {
    const response = await apiClient.get<HomeworkDetail>(`/student/homeworks/${homeworkId}`);
    return response.data;
  }

  /**
   * 提交或保存作业
   * @param homeworkId 作业ID
   * @param data 提交数据
   */
  async submitHomework(
    homeworkId: number,
    data: HomeworkSubmitRequest
  ): Promise<HomeworkSubmitResponse> {
    const response = await apiClient.post<HomeworkSubmitResponse>(
      `/student/homeworks/${homeworkId}/submit`,
      data
    );
    return response.data;
  }

  /**
   * 添加作业附件
   */
  async addAttachment(data: AddAttachmentRequest): Promise<AddAttachmentResponse> {
    const params = new URLSearchParams();
    params.append('homework_id', data.homework_id.toString());
    params.append('file_name', data.file_name);
    params.append('file_url', data.file_url);
    if (data.file_size !== undefined) {
      params.append('file_size', data.file_size.toString());
    }
    if (data.file_type) {
      params.append('file_type', data.file_type);
    }

    const response = await apiClient.post<AddAttachmentResponse>(
      `/student/homeworks/attachments/upload?${params.toString()}`
    );
    return response.data;
  }

  /**
   * 删除作业附件
   */
  async deleteAttachment(attachmentId: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/student/homeworks/attachments/${attachmentId}`
    );
    return response.data;
  }

  /**
   * 获取附件预览URL
   * @param fileUrl 文件URL
   */
  async getAttachmentPreviewUrl(fileUrl: string): Promise<{
    preview_url: string;
    preview_type: string;
    access_token?: string;
    refresh_token?: string;
    access_token_expired_time?: string;
    refresh_token_expired_time?: string;
  }> {
    const response = await apiClient.post('/upload/preview-url', {
      file_url: fileUrl,
    });
    return response.data;
  }
}

export const studentHomeworkService = new StudentHomeworkService();
export default studentHomeworkService;
