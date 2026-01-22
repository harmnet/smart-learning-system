'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/common/Modal';
import { TeachingResource } from '@/services/teachingResource.service';
import { ReferenceMaterial } from '@/services/referenceMaterial.service';

type PreviewResource = TeachingResource | ReferenceMaterial;

interface ResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: PreviewResource | null;
  previewUrl: string;
}

export default function ResourcePreviewModal({
  isOpen,
  onClose,
  resource,
  previewUrl,
}: ResourcePreviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [officeContent, setOfficeContent] = useState<string | null>(null); // 存储转换后的HTML内容
  const [useOfficeViewer, setUseOfficeViewer] = useState(true); // 是否使用WebOffice预览（优先方案）
  const [ossPreviewUrl, setOssPreviewUrl] = useState<string>(''); // WebOffice预览URL
  const [downloadUrl, setDownloadUrl] = useState<string>(''); // 下载URL（备用方案）
  const [previewType, setPreviewType] = useState<string>('weboffice'); // 预览类型：weboffice/download/direct
  const [loadingPreviewUrl, setLoadingPreviewUrl] = useState(false); // 是否正在加载预览URL
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>(''); // PDF预览URL
  const [webofficeFailed, setWebofficeFailed] = useState(false); // WebOffice是否失败

  // 加载Office文档并转换为HTML（备用方案）
  const loadOfficeDocument = async (url: string, type: string) => {
    try {
      console.log('loadOfficeDocument开始:', url, type);
      setLoading(true);
      setError(null);
      
      // 动态加载库
      let mammoth: any = null;
      let XLSX: any = null;
      
      const normalizedType = type.toLowerCase();
      if (normalizedType === 'word' || normalizedType === 'docx' || normalizedType === 'doc') {
        console.log('加载mammoth库...');
        mammoth = await import('mammoth');
        console.log('mammoth库加载完成');
      }
      if (normalizedType === 'excel' || normalizedType === 'xlsx' || normalizedType === 'xls') {
        console.log('加载XLSX库...');
        XLSX = await import('xlsx');
        console.log('XLSX库加载完成');
      }
      
      // 下载文件（添加认证信息）
      console.log('开始下载文件:', url);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      console.log('文件下载响应:', response.status, response.ok);
      if (!response.ok) {
        throw new Error(`文件下载失败: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('文件下载完成，大小:', arrayBuffer.byteLength);
      
      if ((normalizedType === 'word' || normalizedType === 'docx' || normalizedType === 'doc') && mammoth) {
        // Word转HTML
        console.log('开始转换Word文档...');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        console.log('Word文档转换完成');
        setOfficeContent(result.value);
        setLoading(false);
      } else if ((normalizedType === 'excel' || normalizedType === 'xlsx' || normalizedType === 'xls') && XLSX) {
        // Excel转HTML表格
        console.log('开始转换Excel文档...');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const html = XLSX.utils.sheet_to_html(worksheet);
        console.log('Excel文档转换完成');
        setOfficeContent(html);
        setLoading(false);
      } else if (normalizedType === 'ppt' || normalizedType === 'pptx') {
        // PPT不支持前端转换，提示下载
        console.log('PPT文件不支持前端转换');
        setError('PPT文件暂不支持在线预览，请下载后查看');
        setLoading(false);
      } else {
        console.warn('未知的文件类型:', type, normalizedType);
        setError(`不支持的文件类型: ${type}`);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Office document conversion error:', err);
      setError('文档转换失败: ' + (err.message || '未知错误'));
      setLoading(false);
    }
  };

  // 为Office文档和PDF异步获取预览信息（直接使用前端转换，不使用WebOffice）
  useEffect(() => {
    if (isOpen && resource && resource.resource_type && ['word', 'excel', 'ppt', 'pdf'].includes(resource.resource_type.toLowerCase())) {
      const fetchPreviewInfo = async () => {
        try {
          setLoadingPreviewUrl(true);
          setLoading(true);
          setError(null);
          setWebofficeFailed(true); // 直接使用前端转换
          setUseOfficeViewer(false); // 不使用WebOffice
          setOfficeContent(null);
          
          // 动态导入service以避免循环依赖
          const { teachingResourceService } = await import('@/services/teachingResource.service');
          const { referenceMaterialService } = await import('@/services/referenceMaterial.service');
          
          let previewInfo: {
            preview_url: string;
            download_url?: string;
            preview_type: string;
            resource_type: string;
            file_name?: string;
          };
          
          if ('teacher_id' in resource) {
            // 教学资源
            previewInfo = await teachingResourceService.getOfficePreviewUrl(resource.id);
          } else {
            // 参考资料
            previewInfo = await referenceMaterialService.getOfficePreviewUrl(resource.id);
          }
          
          console.log('获取到预览信息:', previewInfo);
          const previewUrlValue = previewInfo.preview_url || previewInfo.download_url;
          const downloadUrlValue = previewInfo.download_url || previewInfo.preview_url;
          
          // 如果resource_type是unknown，使用resource的resource_type
          let resourceType = previewInfo.resource_type;
          if (!resourceType || resourceType === 'unknown') {
            resourceType = (resource.resource_type || resource.file_type || 'unknown').toLowerCase();
          }
          console.log('使用的资源类型:', resourceType, '原始类型:', resource.resource_type, '预览信息类型:', previewInfo.resource_type, '预览类型:', previewInfo.preview_type);
          
          setDownloadUrl(downloadUrlValue);
          setPreviewType(previewInfo.preview_type || 'download');
          
          // 如果后端返回的是WebOffice类型，使用WebOffice在线预览
          if (previewInfo.preview_type === 'weboffice') {
            console.log('使用WebOffice预览:', previewUrlValue);
            setOssPreviewUrl(previewUrlValue);
            setUseOfficeViewer(true);
            setWebofficeFailed(false);
            setOfficeContent(null);
            setLoading(false);
            setLoadingPreviewUrl(false);
          }
          // 如果后端返回的是PDF类型，直接使用PDF预览，不需要前端转换
          else if (previewInfo.preview_type === 'pdf' || resourceType === 'pdf') {
            console.log('使用PDF预览:', previewUrlValue);
            setPdfPreviewUrl(previewUrlValue);
            setUseOfficeViewer(false);
            setWebofficeFailed(false);
            setOfficeContent(null);
            setLoading(false);
            setLoadingPreviewUrl(false);
          } else {
            // 使用前端转换预览
            console.log('开始调用loadOfficeDocument:', downloadUrlValue, resourceType);
            await loadOfficeDocument(downloadUrlValue, resourceType);
          }
          
          setLoadingPreviewUrl(false);
        } catch (err: any) {
          console.error('获取预览信息失败:', err);
          setError('获取预览信息失败: ' + (err.message || '未知错误'));
          setLoadingPreviewUrl(false);
          setLoading(false);
          setWebofficeFailed(true);
          setUseOfficeViewer(false);
        }
      };
      
      fetchPreviewInfo();
    }
  }, [isOpen, resource]);

  useEffect(() => {
    if (isOpen && resource && previewUrl) {
      const resourceType = (resource.resource_type || resource.file_type || 'unknown').toLowerCase();
      
      // 压缩包不需要加载
      if (resourceType === 'archive') {
        console.log('Resource type is Archive, no loading needed');
        setLoading(false);
        setError(null);
        setOfficeContent(null);
        setUseOfficeViewer(true);
        return;
      }
      
      // Office文档和PDF：已经在第一个useEffect中处理，这里不需要额外操作
      if (['word', 'excel', 'ppt', 'pdf'].includes(resourceType)) {
        // Office文档和PDF的预览逻辑已经在第一个useEffect中处理
        return;
      }
      
      setLoading(true);
      setError(null);
      setOfficeContent(null);
      setUseOfficeViewer(true);
      console.log('Preview modal opened, resource:', resource, 'previewUrl:', previewUrl, 'resourceType:', resourceType);
      
      // 添加超时处理，如果10秒后还在加载，显示错误
      const timeout = setTimeout(() => {
        console.warn('Preview load timeout after 10s, URL:', previewUrl);
        setLoading(false);
        setError('资源加载超时，请检查网络连接或文件是否存在');
      }, 10000);
      
      return () => clearTimeout(timeout);
    } else if (!isOpen) {
      // 关闭弹窗时重置状态
      setLoading(true);
      setError(null);
      setOfficeContent(null);
      setUseOfficeViewer(true);
      setWebofficeFailed(false);
      setOssPreviewUrl('');
      setDownloadUrl('');
      setPdfPreviewUrl('');
    }
  }, [isOpen, resource, previewUrl]);

  if (!resource) return null;

  const renderPreview = () => {
    const resourceType = (resource.resource_type || resource.file_type || 'unknown').toLowerCase();
    console.log('Rendering preview for resource type:', resourceType, 'resource:', resource);

    // Office文档预览 - 优先使用WebOffice，其次PDF，最后使用前端JavaScript转换
    if (['word', 'excel', 'ppt'].includes(resourceType)) {
      // 如果后端返回的是WebOffice类型，使用WebOffice在线预览
      if (previewType === 'weboffice' && ossPreviewUrl) {
        return (
          <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
            <iframe
              src={ossPreviewUrl}
              className="w-full h-full border-0"
              title="WebOffice Preview"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
              onLoad={() => {
                console.log('WebOffice预览加载完成');
                setLoading(false);
              }}
              onError={(e) => {
                console.error('WebOffice预览加载失败:', e);
                setError('WebOffice加载失败，请检查文件是否存在');
                setLoading(false);
                setWebofficeFailed(true);
              }}
            />
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-slate-600">正在加载WebOffice预览...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute top-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm z-20">
                {error}
              </div>
            )}
          </div>
        );
      }
      
      // 如果后端返回的是PDF类型，使用PDF预览
      if (previewType === 'pdf' || pdfPreviewUrl || (downloadUrl && downloadUrl.includes('/pdf'))) {
        const pdfUrl = pdfPreviewUrl || downloadUrl || previewUrl;
        return (
          <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
              onLoad={() => {
                console.log('PDF预览加载完成');
                setLoading(false);
              }}
              onError={(e) => {
                console.error('PDF预览加载失败:', e);
                setError('PDF加载失败，请检查文件是否存在');
                setLoading(false);
              }}
            />
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                  <p className="text-slate-600">正在加载PDF...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute top-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm z-20">
                {error}
              </div>
            )}
          </div>
        );
      }
      
      // 如果内容已准备好，显示转换后的内容（前端JavaScript转换）
      if (officeContent) {
        return (
          <div className="w-full h-[70vh] bg-white rounded-lg overflow-auto p-6">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: officeContent }}
            />
          </div>
        );
      }
      
      // 正在加载前端转换
      if (loading || loadingPreviewUrl) {
        return (
          <div className="w-full h-[70vh] bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
              <p className="text-slate-600">正在转换文档...</p>
            </div>
          </div>
        );
      }
      
      // 转换失败或PPT不支持
      if (error) {
        return (
          <div className="w-full h-[70vh] bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <p className="text-red-600 mb-4">{error}</p>
              {downloadUrl && (
                <button
                  onClick={() => window.open(downloadUrl, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  下载文件
                </button>
              )}
            </div>
          </div>
        );
      }
      
      // 默认加载状态
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-slate-600">正在准备预览...</p>
          </div>
        </div>
      );
    }

    // 压缩包预览 - 不支持在线预览
    if (resourceType === 'archive') {
      console.log('Archive file, showing download prompt');
      return (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
            📦
          </div>
          <p className="text-slate-900 text-xl font-bold mb-2">{resource.resource_name}</p>
          <p className="text-slate-600 mb-1">文件类型: 压缩包</p>
          {resource.file_size && (
            <p className="text-slate-600 mb-6">
              文件大小: {(resource.file_size / (1024 * 1024)).toFixed(2)} MB
            </p>
          )}
          <p className="text-slate-500 text-sm mb-6 max-w-md">
            压缩包需要下载到本地解压后查看
          </p>
          <button
            onClick={() => {
              window.open(previewUrl.replace('/preview', '/download'), '_blank');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            下载文件
          </button>
        </div>
      );
    }

    // 超链接预览 - 直接跳转
    if (resourceType === 'hyperlink') {
      const linkUrl = 'link_url' in resource ? (resource as ReferenceMaterial).link_url : '';
      if (linkUrl) {
        return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
              🔗
            </div>
            <p className="text-slate-900 text-xl font-bold mb-2">{resource.resource_name}</p>
            <p className="text-slate-600 mb-6 max-w-md break-all">{linkUrl}</p>
            <button
              onClick={() => {
                window.open(linkUrl, '_blank');
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              打开链接
            </button>
          </div>
        );
      }
    }

    // PDF预览 - 使用iframe直接加载
    if (resourceType === 'pdf') {
      // 优先使用pdfPreviewUrl（从API获取的），如果没有则使用previewUrl
      const pdfUrl = pdfPreviewUrl || previewUrl;
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title="PDF Preview"
            onLoad={() => {
              console.log('PDF预览加载完成');
              setLoading(false);
            }}
            onError={(e) => {
              console.error('PDF预览加载失败:', e);
              setError('PDF加载失败，请检查文件是否存在');
              setLoading(false);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600">正在加载PDF...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm z-20">
              {error}
            </div>
          )}
        </div>
      );
    }

    // 图片预览 - 直接显示
    if (resourceType === 'image') {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-auto flex items-center justify-center p-4">
          <img
            src={previewUrl}
            alt={resource.resource_name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            onLoad={() => {
              console.log('图片加载完成');
              setLoading(false);
            }}
            onError={(e) => {
              console.error('图片加载失败:', e);
              setError('图片加载失败，请检查文件是否存在');
              setLoading(false);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600">正在加载图片...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm z-20">
              {error}
            </div>
          )}
        </div>
      );
    }

    // 视频预览 - 使用video标签
    if (resourceType === 'video') {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-full rounded-lg shadow-lg"
            onLoadedData={() => {
              console.log('视频加载完成');
              setLoading(false);
            }}
            onError={(e) => {
              console.error('视频加载失败:', e);
              setError('视频加载失败，请检查文件是否存在');
              setLoading(false);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600">正在加载视频...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute top-4 left-4 right-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm z-20">
              {error}
            </div>
          )}
        </div>
      );
    }

    // Markdown预览 - 简单显示（可以后续集成marked库）
    if (resourceType === 'markdown') {
      return (
        <div className="w-full h-[70vh] bg-white rounded-lg overflow-auto p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {loading ? '正在加载...' : 'Markdown预览功能开发中，请下载文件查看'}
          </pre>
        </div>
      );
    }

    // 默认：不支持预览的类型
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-4">
          📄
        </div>
        <p className="text-slate-900 text-xl font-bold mb-2">{resource.resource_name}</p>
        <p className="text-slate-600 mb-6">该文件类型暂不支持在线预览</p>
        <button
          onClick={() => {
            window.open(previewUrl.replace('/preview', '/download'), '_blank');
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          下载文件
        </button>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resource?.resource_name || '资源预览'}
      size="large"
    >
      <div className="w-full">
        {renderPreview()}
      </div>
    </Modal>
  );
}
