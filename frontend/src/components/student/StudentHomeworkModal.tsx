'use client';

import React, { useEffect, useState, useRef } from 'react';
import Modal from '@/components/common/Modal';
import DocumentPreview, { PreviewInfo } from '@/components/common/DocumentPreview';
import { studentHomeworkService } from '@/services/studentHomework.service';
import { uploadService } from '@/services/upload.service';
import { HomeworkDetail, StudentAttachment } from '@/types/homework';

interface StudentHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeworkId: number | null;
  onSubmitSuccess?: () => void;
}

export default function StudentHomeworkModal({
  isOpen,
  onClose,
  homeworkId,
  onSubmitSuccess,
}: StudentHomeworkModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [homework, setHomework] = useState<HomeworkDetail | null>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<StudentAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 预览相关
  const [showPreview, setShowPreview] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载作业详情
  useEffect(() => {
    if (isOpen && homeworkId) {
      loadHomeworkDetail();
    }
  }, [isOpen, homeworkId]);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      setHomework(null);
      setContent('');
      setAttachments([]);
      setError(null);
    }
  }, [isOpen]);

  const loadHomeworkDetail = async () => {
    if (!homeworkId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await studentHomeworkService.getHomeworkDetail(homeworkId);
      setHomework(data);
      // 恢复已保存的内容
      if (data.submission) {
        setContent(data.submission.content || '');
        setAttachments(data.submission.attachments || []);
      } else {
        setContent('');
        setAttachments([]);
      }
    } catch (err: any) {
      console.error('加载作业详情失败:', err);
      setError(err.message || '加载作业详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!homeworkId) return;

    setSubmitting(true);
    try {
      await studentHomeworkService.submitHomework(homeworkId, {
        content,
        is_final: false,
      });
      alert('草稿保存成功');
      await loadHomeworkDetail();
    } catch (err: any) {
      console.error('保存草稿失败:', err);
      alert('保存草稿失败: ' + (err.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // 提交作业
  const handleSubmit = async () => {
    if (!homeworkId) return;

    if (!content.trim() && attachments.length === 0) {
      alert('请填写作业内容或上传附件');
      return;
    }

    if (!confirm('确定要提交作业吗？提交后将无法修改。')) {
      return;
    }

    setSubmitting(true);
    try {
      await studentHomeworkService.submitHomework(homeworkId, {
        content,
        is_final: true,
      });
      alert('作业提交成功');
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('提交作业失败:', err);
      alert('提交作业失败: ' + (err.message || '未知错误'));
    } finally {
      setSubmitting(false);
    }
  };

  // 上传附件
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !homeworkId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 上传到OSS
        const uploadResult = await uploadService.uploadFile(file, 'homework', (progress) => {
          setUploadProgress(Math.round((i * 100 + progress) / files.length));
        });

        // 关联到作业
        const attachmentResult = await studentHomeworkService.addAttachment({
          homework_id: homeworkId,
          file_name: file.name,
          file_url: uploadResult.url,
          file_size: file.size,
          file_type: file.type,
        });

        // 更新附件列表
        setAttachments((prev) => [
          ...prev,
          {
            id: attachmentResult.id,
            file_name: attachmentResult.file_name,
            file_url: attachmentResult.file_url,
            file_size: attachmentResult.file_size,
            file_type: attachmentResult.file_type,
          },
        ]);
      }
    } catch (err: any) {
      console.error('上传附件失败:', err);
      alert('上传附件失败: ' + (err.message || '未知错误'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // 清空file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除附件
  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('确定要删除这个附件吗？')) {
      return;
    }

    try {
      await studentHomeworkService.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err: any) {
      console.error('删除附件失败:', err);
      alert('删除附件失败: ' + (err.message || '未知错误'));
    }
  };

  // 预览附件
  const handlePreviewAttachment = async (fileUrl: string, fileName: string) => {
    try {
      const previewData = await studentHomeworkService.getAttachmentPreviewUrl(fileUrl);

      // 判断预览类型
      const ext = fileName.toLowerCase().split('.').pop() || '';
      let previewType: 'weboffice' | 'pdf' | 'direct' | 'download' = 'download';

      // 注意：对于Office文档，如果API没有返回access_token，使用pdf方式（iframe）预览
      // 因为OSS的doc/preview处理URL可以直接在iframe中显示
      if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
        // 检查是否有access_token，如果有则使用weboffice，否则使用pdf（iframe）方式
        previewType = previewData.access_token ? 'weboffice' : 'pdf';
      } else if (ext === 'pdf') {
        previewType = 'pdf';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        previewType = 'direct';
      }

      setPreviewInfo({
        preview_url: previewData.preview_url,
        preview_type: previewType,
        resource_type: ext,
        file_name: fileName,
        download_url: fileUrl, // 提供原始URL作为下载链接
        access_token: previewData.access_token,
        refresh_token: previewData.refresh_token,
        access_token_expired_time: previewData.access_token_expired_time,
        refresh_token_expired_time: previewData.refresh_token_expired_time,
      });
      setPreviewFileName(fileName);
      setShowPreview(true);
    } catch (err: any) {
      console.error('获取预览信息失败:', err);
      alert('获取预览信息失败: ' + (err.message || '未知错误'));
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无截止日期';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 检查是否已过截止日期
  const isOverdue = () => {
    if (!homework?.deadline) return false;
    return new Date(homework.deadline) < new Date();
  };

  // 检查是否可以编辑
  const canEdit = () => {
    if (!homework) return false;
    const status = homework.submission?.status;
    return status !== 'submitted' && status !== 'graded';
  };

  // 获取状态显示
  const getStatusDisplay = () => {
    if (!homework?.submission) {
      return { text: '未开始', color: 'bg-gray-100 text-gray-600' };
    }
    switch (homework.submission.status) {
      case 'draft':
        return { text: '草稿', color: 'bg-yellow-100 text-yellow-700' };
      case 'submitted':
        return { text: '已提交', color: 'bg-blue-100 text-blue-700' };
      case 'graded':
        return { text: '已批改', color: 'bg-green-100 text-green-700' };
      default:
        return { text: '未知', color: 'bg-gray-100 text-gray-600' };
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={homework?.title || '作业详情'}
        size="xl"
        maxHeight="85vh"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadHomeworkDetail}
              className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600"
            >
              重试
            </button>
          </div>
        ) : homework ? (
          <div className="space-y-6">
            {/* 作业信息 */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusDisplay().color}`}>
                  {getStatusDisplay().text}
                </span>
                {homework.submission?.score !== null && homework.submission?.score !== undefined && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    得分: {homework.submission.score}
                  </span>
                )}
              </div>
              <div className={`text-sm ${isOverdue() ? 'text-red-500' : 'text-gray-500'}`}>
                截止时间: {formatDate(homework.deadline)}
                {isOverdue() && ' (已过期)'}
              </div>
            </div>

            {/* 作业描述 */}
            <div className="bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 rounded-xl p-4 border border-violet-100">
              <h4 className="flex items-center gap-2 text-base font-semibold text-violet-700 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                作业要求
              </h4>
              {homework.description ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: homework.description }}
                />
              ) : (
                <p className="text-gray-500 italic">暂无作业描述</p>
              )}
            </div>

            {/* 教师附件 */}
            {homework.attachments && homework.attachments.length > 0 && (
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                <h4 className="flex items-center gap-2 text-base font-semibold text-blue-700 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                  </svg>
                  参考资料
                </h4>
                <div className="space-y-2">
                  {homework.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{att.file_name}</p>
                          {att.file_size && (
                            <p className="text-xs text-gray-500">{formatFileSize(att.file_size)}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreviewAttachment(att.file_url, att.file_name)}
                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        查看
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 我的作答 */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                我的作答
              </h4>
              {canEdit() ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请在此输入你的作业内容..."
                  className="w-full min-h-[200px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y text-gray-700"
                />
              ) : (
                <div className="min-h-[100px] p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {content ? (
                    <div className="whitespace-pre-wrap text-gray-700">{content}</div>
                  ) : (
                    <p className="text-gray-400 italic">未填写内容</p>
                  )}
                </div>
              )}
            </div>

            {/* 我的附件 */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h4 className="flex items-center gap-2 text-base font-semibold text-gray-800 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                我的附件
              </h4>

              {/* 已上传的附件 */}
              {attachments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{att.file_name}</p>
                          {att.file_size && (
                            <p className="text-xs text-gray-500">{formatFileSize(att.file_size)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewAttachment(att.file_url, att.file_name)}
                          className="px-3 py-1.5 text-sm bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
                        >
                          预览
                        </button>
                        {canEdit() && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              {canEdit() && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.pdf,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-violet-500 hover:text-violet-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
                        上传中 {uploadProgress}%
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        添加附件
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    支持的文件格式: DOC, DOCX, XLS, XLSX, PPT, PPTX, PDF, TXT, 图片, ZIP, RAR
                  </p>
                </div>
              )}
            </div>

            {/* 教师评语 */}
            {homework.submission?.status === 'graded' && homework.submission.teacher_comment && (
              <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
                <h4 className="flex items-center gap-2 text-base font-semibold text-green-700 mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                  教师评语
                </h4>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-gray-700 whitespace-pre-wrap">{homework.submission.teacher_comment}</p>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            {canEdit() && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSaveDraft}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
                >
                  保存草稿
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isOverdue()}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 font-medium shadow-lg shadow-violet-200"
                >
                  {submitting ? '提交中...' : '提交作业'}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* 文档预览 */}
      {previewInfo && (
        <DocumentPreview
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewInfo(null);
          }}
          previewInfo={previewInfo}
          resourceName={previewFileName}
        />
      )}
    </>
  );
}
