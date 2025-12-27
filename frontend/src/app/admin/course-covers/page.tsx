"use client";

import { useState, useEffect, useRef } from 'react';
import { courseCoverService, CoverImage } from '@/services/courseCover.service';
import { useLanguage } from '@/contexts/LanguageContext';
import Tooltip from '@/components/common/Tooltip';
import AdminLayout from '@/components/admin/AdminLayout';
import ImagePreviewModal from '@/components/admin/ImagePreviewModal';

export default function AdminCourseCoversPage() {
  const { t } = useLanguage();
  const [images, setImages] = useState<CoverImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 预览弹窗状态
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');
  const [previewImageName, setPreviewImageName] = useState<string>('');
  
  // 编辑弹窗状态
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CoverImage | null>(null);
  const [editFilename, setEditFilename] = useState<string>('');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreviewUrl, setReplacePreviewUrl] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
    loadCount();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const data = await courseCoverService.getAll();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load images:', error);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async () => {
    try {
      const data = await courseCoverService.getCount();
      setTotalCount(data.total);
    } catch (error) {
      console.error('Failed to load count:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert(t.admin.courseCovers.fileTypeError);
      return;
    }

    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert(t.admin.courseCovers.fileSizeError);
      return;
    }

    setUploadFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      await courseCoverService.uploadImage(uploadFile);
      alert(t.admin.courseCovers.uploadSuccess);
      setUploadModalOpen(false);
      setUploadFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadImages();
      loadCount();
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      // 改进错误信息显示
      let errorMessage = t.admin.courseCovers.uploadError;
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage += ': ' + error.response.data;
        } else if (error.response.data.detail) {
          errorMessage += ': ' + (typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail));
        } else {
          errorMessage += ': ' + JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (image: CoverImage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t.admin.courseCovers.deleteConfirm)) return;

    try {
      await courseCoverService.deleteImage(image.id);
      alert(t.admin.courseCovers.deleteSuccess);
      loadImages();
      loadCount();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      // 改进错误信息显示
      let errorMessage = t.admin.courseCovers.deleteError;
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage += ': ' + error.response.data;
        } else if (error.response.data.detail) {
          errorMessage += ': ' + (typeof error.response.data.detail === 'string' 
            ? error.response.data.detail 
            : JSON.stringify(error.response.data.detail));
        } else {
          errorMessage += ': ' + JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
    }
  };

  const handleViewImage = (image: CoverImage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // 使用image_url（可能是OSS URL或API URL）
    setPreviewImageUrl(image.image_url);
    setPreviewImageName(image.filename);
    setPreviewModalOpen(true);
  };

  const handleEdit = (image: CoverImage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingImage(image);
    // 提取文件名（如果是OSS URL，提取最后一部分；如果是本地文件，直接使用）
    const isOssUrl = image.filename.startsWith('http://') || image.filename.startsWith('https://');
    if (isOssUrl) {
      // OSS URL，提取文件名部分
      const urlParts = image.filename.split('/');
      setEditFilename(urlParts[urlParts.length - 1].split('?')[0]); // 移除查询参数
    } else {
      setEditFilename(image.filename);
    }
    setReplaceFile(null);
    setReplacePreviewUrl(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      const isOssUrl = editingImage.filename.startsWith('http://') || editingImage.filename.startsWith('https://');
      
      if (replaceFile) {
        // 替换图片（OSS和本地都支持）
        await courseCoverService.replaceImage(editingImage.id, replaceFile);
        alert('图片替换成功');
      } else if (!isOssUrl && editFilename !== editingImage.filename) {
        // 重命名（仅本地文件支持）
        await courseCoverService.updateImage(editingImage.id, editFilename);
        alert('文件名更新成功');
      } else if (!replaceFile && (isOssUrl || editFilename === editingImage.filename)) {
        // 没有修改
        setEditModalOpen(false);
        setEditingImage(null);
        setEditFilename('');
        setReplaceFile(null);
        setReplacePreviewUrl(null);
        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
        return;
      }
      
      setEditModalOpen(false);
      setEditingImage(null);
      setEditFilename('');
      setReplaceFile(null);
      setReplacePreviewUrl(null);
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
      loadImages();
    } catch (error: any) {
      console.error('Failed to update image:', error);
      let errorMessage = '更新失败';
      if (error.response?.data?.detail) {
        errorMessage += ': ' + error.response.data.detail;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
    }
  };

  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('只支持 JPG、PNG 格式的图片');
      return;
    }

    // 检查文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('文件大小不能超过 2MB');
      return;
    }

    setReplaceFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onloadend = () => {
      setReplacePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const buttonStyle = "px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95";

  return (
    <AdminLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.admin.courseCovers.title}</h1>
              <p className="text-sm text-slate-500">
                {t.admin.courseCovers.subtitle} ({totalCount} {t.admin.courseCovers.totalImages})
              </p>
            </div>
            <button
              onClick={() => {
                setUploadFile(null);
                setPreviewUrl(null);
                setUploadModalOpen(true);
              }}
              className={`${buttonStyle} text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              {t.admin.courseCovers.upload}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            {loading ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
              </div>
            ) : images.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-lg font-bold text-slate-600 mb-1">{t.common.noData}</p>
                  <p className="text-sm text-slate-400 mb-4">{t.admin.courseCovers.noImages}</p>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className={`${buttonStyle} text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20`}
                  >
                    {t.admin.courseCovers.uploadFirst}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.courseCovers.columns.image}</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.courseCovers.columns.filename}</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.courseCovers.columns.size}</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.courseCovers.columns.uploadTime}</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">{t.admin.courseCovers.columns.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {images.map((image) => (
                      <tr key={image.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                            onClick={() => handleViewImage(image)}
                          >
                            <img
                              src={courseCoverService.getImageUrl(image.id)}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Cpath d="M9 9h6v6H9z"/%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Tooltip content={t.admin.courseCovers.view}>
                                <button
                                  onClick={(e) => handleViewImage(image, e)}
                                  className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="text-sm font-medium text-slate-900 max-w-xs truncate" title={image.filename}>
                            {image.filename}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm text-slate-600">{formatFileSize(image.file_size)}</span>
                        </td>
                        <td className="px-8 py-4">
                          <span className="text-sm text-slate-600">{formatDate(image.created_at)}</span>
                        </td>
                        <td className="px-8 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip content={t.admin.courseCovers.view || '查看'}>
                              <button
                                onClick={() => handleViewImage(image)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content="编辑">
                              <button
                                onClick={(e) => handleEdit(image, e)}
                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                              </button>
                            </Tooltip>
                            <Tooltip content={t.admin.courseCovers.delete}>
                              <button
                                onClick={(e) => handleDelete(image, e)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {uploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-black text-slate-900">
                  {t.admin.courseCovers.uploadTitle}
                </h2>
                <button
                  onClick={() => {
                    setUploadModalOpen(false);
                    setUploadFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    {t.admin.courseCovers.selectFile}
                  </label>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 mx-auto rounded-lg" />
                        <p className="text-sm text-slate-600">{uploadFile?.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadFile(null);
                            setPreviewUrl(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {t.common.reset}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        <p className="text-sm text-slate-600">{t.admin.courseCovers.dragDrop}</p>
                        <p className="text-xs text-slate-400">{t.admin.courseCovers.supportedFormats}</p>
                        <p className="text-xs text-slate-400">{t.admin.courseCovers.maxSize}</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalOpen(false);
                      setUploadFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className={`${buttonStyle} text-slate-500 hover:bg-slate-100`}
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!uploadFile}
                    className={`${buttonStyle} text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t.common.submit}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 预览弹窗 */}
        <ImagePreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          imageUrl={previewImageUrl}
          imageName={previewImageName}
        />

        {/* 编辑弹窗 */}
        {editModalOpen && editingImage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-black text-slate-900">编辑封面</h2>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingImage(null);
                    setEditFilename('');
                    setReplaceFile(null);
                    setReplacePreviewUrl(null);
                    if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* 当前图片预览 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">当前图片</label>
                  <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-center">
                    <img
                      src={editingImage.image_url}
                      alt={editingImage.filename}
                      className="max-w-full max-h-48 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Cpath d="M9 9h6v6H9z"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                </div>

                {/* 文件名编辑（仅本地文件） */}
                {!editingImage.image_url.startsWith('http') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">文件名</label>
                    <input
                      type="text"
                      value={editFilename}
                      onChange={(e) => setEditFilename(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入文件名"
                    />
                    <p className="mt-1 text-xs text-slate-400">仅支持本地文件重命名</p>
                  </div>
                )}
                
                {/* OSS文件提示 */}
                {editingImage.image_url.startsWith('http') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      此图片存储在OSS，可以通过替换图片功能更新
                    </p>
                  </div>
                )}

                {/* 替换图片 */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">替换图片（可选）</label>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => replaceFileInputRef.current?.click()}
                  >
                    {replacePreviewUrl ? (
                      <div className="space-y-4">
                        <img src={replacePreviewUrl} alt="Preview" className="max-w-full max-h-64 mx-auto rounded-lg" />
                        <p className="text-sm text-slate-600">{replaceFile?.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplaceFile(null);
                            setReplacePreviewUrl(null);
                            if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          重新选择
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                        </svg>
                        <p className="text-sm text-slate-600">点击选择新图片</p>
                        <p className="text-xs text-slate-400">支持 JPG、PNG 格式，最大 2MB</p>
                      </div>
                    )}
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleReplaceFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setEditingImage(null);
                      setEditFilename('');
                      setReplaceFile(null);
                      setReplacePreviewUrl(null);
                      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                    }}
                    className={`${buttonStyle} text-slate-500 hover:bg-slate-100`}
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={
                      !replaceFile && 
                      (!editingImage.image_url.startsWith('http') ? editFilename === editingImage.filename : true)
                    }
                    className={`${buttonStyle} text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
