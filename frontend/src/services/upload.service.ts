import apiClient from '@/lib/api-client';

export interface UploadResult {
  url: string;
  filename: string;
  size?: number;
  type?: string;
  can_preview?: boolean;
  preview_url?: string;
}

export interface PreviewResult {
  preview_url: string;
  preview_type: 'image' | 'weboffice';
  expires_in?: number;
}

class UploadService {
  /**
   * 通用文件上传
   * @param file 文件
   * @param folder 文件夹/类型 (如: 'homework', 'resource', 'cover')
   * @param onProgress 上传进度回调
   */
  async uploadFile(
    file: File,
    folder: string = 'general',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  /**
   * 上传多个文件
   */
  async uploadFiles(
    files: File[],
    folder: string = 'general',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile(files[i], folder, (p) => {
        if (onProgress) {
          // 计算总体进度
          const totalProgress = Math.round(((i * 100) + p) / files.length);
          onProgress(totalProgress);
        }
      });
      results.push(result);
    }
    return results;
  }

  /**
   * 获取文件预览URL
   * @param fileUrl 文件URL
   * @param watermark 可选的水印文字
   */
  async getPreviewUrl(fileUrl: string, watermark?: string): Promise<PreviewResult> {
    const response = await apiClient.post<PreviewResult>('/upload/preview-url', {
      file_url: fileUrl,
      watermark_text: watermark,
    });
    return response.data;
  }

  /**
   * 检查文件是否支持预览
   */
  isPreviewable(filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const previewableExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
    return previewableExts.includes(ext);
  }

  /**
   * 获取文件图标类型
   */
  getFileIconType(filename: string): 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'image' | 'video' | 'audio' | 'archive' | 'unknown' {
    const ext = filename.toLowerCase().split('.').pop() || '';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'document';
    if (['xls', 'xlsx'].includes(ext)) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext)) return 'presentation';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
    return 'unknown';
  }
}

export const uploadService = new UploadService();
export default uploadService;
