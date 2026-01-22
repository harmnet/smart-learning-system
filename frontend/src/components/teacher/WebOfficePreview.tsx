'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface WebOfficePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceName: string;
}

interface TokenInfo {
  access_token: string;
  weboffice_url: string;
  refresh_token?: string;
  access_token_expired_time?: string;
  refresh_token_expired_time?: string;
}

const WebOfficePreview: React.FC<WebOfficePreviewProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载阿里云WebOffice SDK
  useEffect(() => {
    if (!isOpen) return;

    // 动态加载SDK脚本
    const loadSdk = async () => {
      // 检查SDK是否已加载
      if (window.aliyun) {
        setLoading(false);
        return;
      }
      
      // 检查是否已经有script标签在加载中
      if (document.querySelector('script[src="https://g.alicdn.com/IMM/office-js/1.1.19/aliyun-web-office-sdk.min.js"]')) {
        // 如果正在加载，等待它加载完成
        const checkLoaded = setInterval(() => {
          if (window.aliyun) {
            clearInterval(checkLoaded);
            setLoading(false);
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
        setLoading(false);
      };
      
      script.onerror = () => {
        setError('WebOffice SDK加载失败');
        setLoading(false);
      };

      document.head.appendChild(script);
    };

    loadSdk();
  }, [isOpen]);

  // 获取预览凭证
  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/resources/${resourceId}/weboffice-url?expires=3600&allow_export=true&allow_print=true&watermark=内部资料`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取预览凭证失败');
      }

      const data = await response.json();
      setTokenInfo(data);
      return data;
    } catch (err: any) {
      console.error('获取预览凭证失败:', err);
      setError(err.message || '获取预览凭证失败');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 刷新凭证
  const refreshToken = async () => {
    if (!tokenInfo?.refresh_token) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/teacher/resources/weboffice-refresh`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            access_token: tokenInfo.access_token,
            refresh_token: tokenInfo.refresh_token
          })
        }
      );

      if (!response.ok) {
        throw new Error('刷新凭证失败');
      }

      const data = await response.json();
      
      // 更新token
      setTokenInfo(prev => prev ? { ...prev, ...data } : null);
      
      // 更新SDK中的token
      if (instanceRef.current) {
        instanceRef.current.setToken({ token: data.access_token });
      }

      console.log('凭证刷新成功');
    } catch (err: any) {
      console.error('刷新凭证失败:', err);
      toast.error('凭证刷新失败，请重新打开预览');
    }
  };

  // 设置自动刷新
  const setupAutoRefresh = () => {
    // 清除之前的定时器
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // 每25分钟刷新一次（AccessToken有效期30分钟）
    refreshTimerRef.current = setInterval(() => {
      refreshToken();
    }, 25 * 60 * 1000);
  };

  // 初始化WebOffice
  const initWebOffice = async () => {
    if (!window.aliyun || !mountRef.current || !tokenInfo) return;

    try {
      // 销毁之前的实例
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁旧实例失败:', e);
        }
      }

      // 创建新实例
      const instance = window.aliyun.config({
        mount: mountRef.current,
        url: tokenInfo.weboffice_url
      });

      // 设置token
      instance.setToken({ token: tokenInfo.access_token });

      // 监听事件
      instance.on('ready', () => {
        console.log('WebOffice已就绪');
        setLoading(false);
      });

      instance.on('error', (error: any) => {
        console.error('WebOffice错误:', error);
        setError('文档预览出错');
      });

      instanceRef.current = instance;

      // 设置自动刷新
      setupAutoRefresh();
    } catch (err: any) {
      console.error('初始化WebOffice失败:', err);
      setError('初始化预览失败');
      setLoading(false);
    }
  };

  // 当对话框打开时获取凭证
  useEffect(() => {
    if (isOpen) {
      fetchToken();
    } else {
      // 关闭时清理
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁实例失败:', e);
        }
        instanceRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      setTokenInfo(null);
      setError(null);
      setLoading(true);
    }
  }, [isOpen, resourceId]);

  // 当token准备好且SDK已加载时初始化
  useEffect(() => {
    if (tokenInfo && window.aliyun && !loading) {
      // 延迟一下确保DOM已渲染
      setTimeout(() => {
        initWebOffice();
      }, 100);
    }
  }, [tokenInfo, loading]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁实例失败:', e);
        }
      }
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  // 重试
  const handleRetry = () => {
    setError(null);
    fetchToken();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-[95vw] h-[90vh] transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* 标题栏 */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                  <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 18v-2h8v2H8zm0-4v-2h8v2H8z"/>
                    </svg>
                    {resourceName}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* 内容区域 */}
                <div className="relative h-[calc(90vh-80px)]">
                  {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                      <p className="text-gray-600">正在加载文档预览...</p>
                    </div>
                  )}

                  {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                      <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                      <p className="text-gray-900 font-semibold mb-2">预览失败</p>
                      <p className="text-gray-600 mb-6 text-center max-w-md">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        重试
                      </button>
                    </div>
                  )}

                  {/* WebOffice挂载点 */}
                  <div
                    ref={mountRef}
                    className="w-full h-full"
                    style={{ display: loading || error ? 'none' : 'block' }}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default WebOfficePreview;
