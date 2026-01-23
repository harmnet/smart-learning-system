'use client';

import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/components/common/Modal';
import { Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';

// 阿里云WebOffice SDK类型声明
declare global {
  interface Window {
    aliyun: {
      config: (options: { mount: HTMLElement; url: string }) => {
        setToken: (config: { token: string }) => void;
        on: (event: string, callback: Function) => void;
        destroy: () => void;
      };
    };
  }
}

export interface PreviewInfo {
  preview_url: string;
  download_url?: string;
  preview_type: 'weboffice' | 'pdf' | 'download' | 'direct';
  resource_type: string;
  file_name?: string;
  access_token?: string;
  refresh_token?: string;
  access_token_expired_time?: string;
  refresh_token_expired_time?: string;
}

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  previewInfo: PreviewInfo | null;
  resourceName?: string;
  onError?: (error: string) => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  isOpen,
  onClose,
  previewInfo,
  resourceName,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const mountRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const readyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  // 加载阿里云WebOffice SDK
  useEffect(() => {
    if (!isOpen || !previewInfo || previewInfo.preview_type !== 'weboffice') {
      return;
    }

    const loadSdk = async () => {
      // 检查SDK是否已加载
      if (window.aliyun) {
        setSdkLoaded(true);
        return;
      }

      // 检查是否已经有script标签在加载中
      const existingScript = document.querySelector(
        'script[src="https://g.alicdn.com/IMM/office-js/1.1.19/aliyun-web-office-sdk.min.js"]'
      );
      
      if (existingScript) {
        // 如果正在加载，等待它加载完成
        const checkLoaded = setInterval(() => {
          if (window.aliyun) {
            clearInterval(checkLoaded);
            setSdkLoaded(true);
          }
        }, 100);
        return;
      }

      // 动态加载SDK脚本
      const script = document.createElement('script');
      script.src = 'https://g.alicdn.com/IMM/office-js/1.1.19/aliyun-web-office-sdk.min.js';
      script.async = true;

      script.onload = () => {
        console.log('阿里云WebOffice SDK加载成功');
        setSdkLoaded(true);
      };

      script.onerror = () => {
        const errorMsg = 'WebOffice SDK加载失败';
        setError(errorMsg);
        setLoading(false);
        if (onError) onError(errorMsg);
      };

      document.head.appendChild(script);
    };

    loadSdk();
  }, [isOpen, previewInfo, onError]);

  // 初始化WebOffice
  const initWebOffice = async () => {
    if (!window.aliyun || !mountRef.current || !previewInfo) {
      console.warn('WebOffice初始化条件不满足:', {
        hasAliyun: !!window.aliyun,
        hasMountRef: !!mountRef.current,
        hasPreviewInfo: !!previewInfo
      });
      return;
    }

    try {
      console.log('开始初始化WebOffice，预览信息:', {
        preview_url: previewInfo.preview_url,
        preview_type: previewInfo.preview_type,
        has_access_token: !!previewInfo.access_token,
        resource_type: previewInfo.resource_type
      });
      
      // 销毁之前的实例和清理observer
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁旧实例失败:', e);
        }
        instanceRef.current = null;
      }
      
      // 清理之前的observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // 创建新实例
      console.log('创建WebOffice实例，URL:', previewInfo.preview_url);
      const instance = window.aliyun.config({
        mount: mountRef.current,
        url: previewInfo.preview_url,
      });

      // 设置token（如果有）
      if (previewInfo.access_token) {
        console.log('设置access_token');
        instance.setToken({ token: previewInfo.access_token });
      } else {
        console.warn('没有access_token，可能会导致预览失败');
      }

      // 保存实例引用
      instanceRef.current = instance;

      console.log('WebOffice实例已创建，开始监听内容加载', {
        url: previewInfo.preview_url,
        mountElement: mountRef.current
      });

      // 注意：新版本SDK已弃用 'ready' 事件，完全依赖DOM检测和超时机制
      // 参考：https://wwo.wps.cn/docs/front-end/basic-usage/events/intro/
      
      // 延迟一下再开始检测，给WebOffice一些初始化时间
      setTimeout(() => {
        if (mountRef.current) {
          console.log('延迟检查：挂载点状态', {
            childrenCount: mountRef.current.children.length,
            innerHTML: mountRef.current.innerHTML.substring(0, 100)
          });
        }
      }, 500);

      // 监听error事件（如果支持）
      try {
        instance.on('error', (err: any) => {
          console.error('WebOffice错误:', err);
          if (readyTimeoutRef.current) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
          }
          if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
          }
          const errorMsg = '文档预览出错: ' + (err?.message || '未知错误');
          setError(errorMsg);
          setLoading(false);
          if (onError) onError(errorMsg);
        });
      } catch (e) {
        console.warn('error事件监听失败:', e);
      }

      // 设置超时：如果10秒后还没有检测到内容，认为已经加载完成
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
      readyTimeoutRef.current = setTimeout(() => {
        console.log('WebOffice加载超时，假设已就绪');
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
        // 检查挂载点是否有内容
        if (mountRef.current) {
          const childrenCount = mountRef.current.children.length;
          const iframes = mountRef.current.querySelectorAll('iframe');
          console.log('超时检查结果:', {
            childrenCount,
            iframeCount: iframes.length,
            mountElement: mountRef.current,
            innerHTML: mountRef.current.innerHTML.substring(0, 200) // 只显示前200字符
          });
          
          // 即使超时，如果有内容，也清除loading状态
          if (childrenCount > 0) {
            console.log('超时但检测到内容，清除loading状态');
            setLoading(false);
          } else {
            console.warn('超时且未检测到内容，可能加载失败');
            // 仍然清除loading，让用户看到实际情况
            setLoading(false);
          }
        } else {
          console.warn('超时时mountRef.current为null');
          setLoading(false);
        }
      }, 10000); // 增加到10秒
      
      // 使用MutationObserver检测DOM变化，如果检测到内容加载，提前清除超时
      if (mountRef.current) {
        let checkCount = 0;
        const maxChecks = 20; // 最多检查20次（约2秒）
        
        const observer = new MutationObserver((mutations) => {
          if (mountRef.current) {
            // 检查是否有iframe元素（WebOffice通常使用iframe）
            const iframes = mountRef.current.querySelectorAll('iframe');
            const hasContent = mountRef.current.children.length > 0;
            
            if (hasContent) {
              checkCount++;
              console.log(`检测到WebOffice内容（检查次数: ${checkCount}）`, {
                childrenCount: mountRef.current.children.length,
                iframeCount: iframes.length
              });
              
              // 如果有iframe，检查iframe是否已加载
              if (iframes.length > 0) {
                const firstIframe = iframes[0] as HTMLIFrameElement;
                // 检查iframe是否有src或已加载
                if (firstIframe.src || firstIframe.contentWindow) {
                  console.log('检测到WebOffice iframe已加载');
                  if (readyTimeoutRef.current) {
                    clearTimeout(readyTimeoutRef.current);
                    readyTimeoutRef.current = null;
                  }
                  setLoading(false);
                  observer.disconnect();
                  observerRef.current = null;
                  return;
                }
              }
              
              // 如果检查次数足够多，认为内容已加载（即使iframe还没完全加载）
              if (checkCount >= 3) {
                console.log('检测到WebOffice内容已加载（通过多次检查确认）');
                if (readyTimeoutRef.current) {
                  clearTimeout(readyTimeoutRef.current);
                  readyTimeoutRef.current = null;
                }
                setLoading(false);
                observer.disconnect();
                observerRef.current = null;
                return;
              }
              
              // 如果检查次数过多，停止观察（避免无限检查）
              if (checkCount >= maxChecks) {
                console.log('达到最大检查次数，停止观察');
                observer.disconnect();
                observerRef.current = null;
              }
            }
          }
        });
        
        observer.observe(mountRef.current, {
          childList: true,
          subtree: true,
          attributes: true, // 监听属性变化（如iframe的src）
        });
        
        // 保存observer引用到独立的ref
        observerRef.current = observer;
      }
    } catch (err: any) {
      console.error('初始化WebOffice失败:', err);
      const errorMsg = '初始化预览失败: ' + (err.message || '未知错误');
      setError(errorMsg);
      setLoading(false);
      if (onError) onError(errorMsg);
    }
  };

  // 当WebOffice预览准备好时初始化
  useEffect(() => {
    if (
      isOpen &&
      previewInfo?.preview_type === 'weboffice' &&
      sdkLoaded &&
      previewInfo.preview_url &&
      mountRef.current
    ) {
      // 延迟一下确保DOM已渲染
      setTimeout(() => {
        initWebOffice();
      }, 100);
    }
  }, [isOpen, previewInfo, sdkLoaded]);

  // 清理资源
  useEffect(() => {
    if (!isOpen) {
      // 清理observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // 清理实例
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁实例失败:', e);
        }
        instanceRef.current = null;
      }
      
      // 清理定时器
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
        readyTimeoutRef.current = null;
      }
      setError(null);
      setLoading(true);
      setSdkLoaded(false);
    }
  }, [isOpen]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 清理observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // 清理实例
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁实例失败:', e);
        }
        instanceRef.current = null;
      }
      
      // 清理定时器
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current);
      }
    };
  }, []);

  const renderPreview = () => {
    if (!previewInfo) {
      return (
        <div className="w-full h-[70vh] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">预览信息不可用</p>
          </div>
        </div>
      );
    }

    const { preview_type, preview_url, download_url, resource_type } = previewInfo;
    const normalizedType = resource_type.toLowerCase();

    // WebOffice预览
    if (preview_type === 'weboffice') {
      // 检查是否有必要的预览信息
      if (!preview_url) {
        return (
          <div className="w-full h-[70vh] flex items-center justify-center">
            <div className="text-center p-6">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-semibold mb-2">预览信息不完整</p>
              <p className="text-gray-600 mb-6">缺少WebOffice预览URL</p>
              {download_url && (
                <a
                  href={download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载文件
                </a>
              )}
            </div>
          </div>
        );
      }
      
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
          {/* WebOffice挂载点 - 必须始终可见，否则SDK无法正确初始化 */}
          <div
            ref={mountRef}
            className="w-full h-full"
            style={{ 
              visibility: error ? 'hidden' : 'visible',
              opacity: error ? 0 : 1
            }}
          />
          
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20 pointer-events-none">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">正在加载WebOffice预览...</p>
                <p className="text-slate-500 text-sm mt-2">首次加载可能需要一些时间...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-30">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-gray-900 font-semibold mb-2">预览失败</p>
              <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
              {download_url && (
                <a
                  href={download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载文件
                </a>
              )}
            </div>
          )}
        </div>
      );
    }

    // PDF预览
    if (preview_type === 'pdf' || normalizedType === 'pdf') {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
          <iframe
            src={preview_url}
            className="w-full h-full border-0"
            title="PDF Preview"
            onLoad={() => {
              console.log('PDF预览加载完成');
              setLoading(false);
            }}
            onError={(e) => {
              console.error('PDF预览加载失败:', e);
              const errorMsg = 'PDF加载失败，请检查文件是否存在';
              setError(errorMsg);
              setLoading(false);
              if (onError) onError(errorMsg);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
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

    // Direct预览 - 直接在iframe中打开URL（用于OSS WebOffice预览等）
    if (preview_type === 'direct') {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden relative">
          <iframe
            src={preview_url}
            className="w-full h-full border-0"
            title={resourceName || '文档预览'}
            onLoad={() => setLoading(false)}
            onError={(e) => {
              const errorMsg = '预览加载失败';
              setError(errorMsg);
              setLoading(false);
              if (onError) onError(errorMsg);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">正在加载预览...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-30">
              <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-gray-900 font-semibold mb-2">预览失败</p>
              <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
              {download_url && (
                <a
                  href={download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  下载文件
                </a>
              )}
            </div>
          )}
        </div>
      );
    }

    // 图片预览
    if (['image', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(normalizedType)) {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
          <img
            src={preview_url}
            alt={resourceName || '图片预览'}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={(e) => {
              const errorMsg = '图片加载失败';
              setError(errorMsg);
              setLoading(false);
              if (onError) onError(errorMsg);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          )}
        </div>
      );
    }

    // 视频预览
    if (['video', 'mp4', 'webm', 'ogg'].includes(normalizedType)) {
      return (
        <div className="w-full h-[70vh] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-4">
          <video
            src={preview_url}
            controls
            className="max-w-full max-h-full"
            onLoadedData={() => setLoading(false)}
            onError={(e) => {
              const errorMsg = '视频加载失败';
              setError(errorMsg);
              setLoading(false);
              if (onError) onError(errorMsg);
            }}
          />
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          )}
        </div>
      );
    }

    // 其他类型：提供下载链接
    return (
      <div className="w-full h-[70vh] flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">不支持在线预览</p>
          <p className="text-gray-600 mb-6">该文件类型不支持在线预览，请下载后查看</p>
          {download_url && (
            <a
              href={download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              下载文件
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={resourceName || previewInfo?.file_name || '文档预览'}
      size="xl"
      maxHeight="90vh"
    >
      <div className="-mx-6 -my-4">{renderPreview()}</div>
    </Modal>
  );
};

export default DocumentPreview;
