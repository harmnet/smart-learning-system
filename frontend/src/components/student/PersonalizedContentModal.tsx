'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Sparkles, Loader2, History, RotateCcw } from 'lucide-react';
import personalizedLearningService, { PersonalizedContent, PersonalizedContentHistoryItem } from '@/services/personalizedLearning.service';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface PersonalizedContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceName: string;
}

type Step = 'loading' | 'empty' | 'viewing' | 'generating' | 'history';

const PersonalizedContentModal: React.FC<PersonalizedContentModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName
}) => {
  const [step, setStep] = useState<Step>('loading');
  const [content, setContent] = useState<PersonalizedContent | null>(null);
  const [history, setHistory] = useState<PersonalizedContentHistoryItem[]>([]);
  const startTimeRef = useRef<number>(0);
  const contentIdRef = useRef<number>(0);
  const dateFnsLocale = zhCN;

  // 处理 modal 打开
  useEffect(() => {
    if (isOpen) {
      // Modal 打开时记录开始时间
      startTimeRef.current = Date.now();
      loadContent();
    } else {
      // Modal 关闭时重置状态
      setStep('loading');
      setContent(null);
      setHistory([]);
      startTimeRef.current = 0;
      contentIdRef.current = 0;
    }
  }, [isOpen, resourceId]);

  // 当 content 加载完成时，保存 content ID
  useEffect(() => {
    if (content && content.id > 0) {
      contentIdRef.current = content.id;
    }
  }, [content]);

  // 增强版关闭函数：关闭前先记录学习时长
  const handleClose = () => {
    // 在关闭 modal 之前记录学习时长
    if (contentIdRef.current > 0 && startTimeRef.current > 0) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log('[PersonalizedContent] 记录学习时长:', { 
        resourceId, 
        contentId: contentIdRef.current, 
        durationSeconds 
      });
      if (durationSeconds > 5) { // 至少学习5秒才记录
        personalizedLearningService.recordStudyTime(resourceId, contentIdRef.current, durationSeconds);
      }
    }
    // 然后调用原始的 onClose
    onClose();
  };

  const loadContent = async () => {
    setStep('loading');
    try {
      const data = await personalizedLearningService.getContent(resourceId);
      if (data.id === 0 || !data.content) {
        setStep('empty');
      } else {
        setContent(data);
        setStep('viewing');
      }
    } catch (error: any) {
      console.error('Failed to load content:', error);
      toast.error(error.response?.data?.detail || '加载失败');
      setStep('empty');
    }
  };

  const handleGenerate = async () => {
    setStep('generating');
    
    // 使用异步轮询机制
    const pollInterval = 3000; // 3秒轮询一次
    const maxAttempts = 40; // 最多轮询40次（2分钟）
    let attempts = 0;
    
    try {
      // 启动生成任务
      const data = await personalizedLearningService.generateContent(resourceId);
      
      // 如果立即返回了结果（同步模式）
      if (data && data.content) {
        setContent(data);
        setStep('viewing');
        toast.success('个性化学习内容生成成功！');
        return;
      }
      
      // 异步模式：开始轮询
      const pollForResult = async () => {
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new Error('生成超时，请重试');
        }
        
        try {
          // 重新获取内容
          const result = await personalizedLearningService.getContent(resourceId);
          
          if (result && result.content && result.id > 0) {
            setContent(result);
            setStep('viewing');
            toast.success('个性化学习内容生成成功！');
          } else {
            // 继续轮询
            setTimeout(pollForResult, pollInterval);
          }
        } catch (error) {
          // 继续轮询
          setTimeout(pollForResult, pollInterval);
        }
      };
      
      // 延迟3秒后开始第一次轮询
      setTimeout(pollForResult, pollInterval);
      
    } catch (error: any) {
      console.error('Failed to generate content:', error);
      const errorMsg = error.response?.data?.detail || '生成失败';
      toast.error(errorMsg);
      setStep('empty');
    }
  };

  const loadHistory = async () => {
    try {
      const data = await personalizedLearningService.getHistory(resourceId);
      setHistory(data);
      setStep('history');
    } catch (error: any) {
      console.error('Failed to load history:', error);
      toast.error('加载历史记录失败');
    }
  };

  const viewHistoryItem = (item: PersonalizedContentHistoryItem) => {
    setContent({
      id: item.id,
      content: item.content,
      created_at: item.created_at,
      has_history: true,
      history_count: history.length
    });
    setStep('viewing');
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
            <p className="mt-4 text-slate-600">加载中...</p>
          </div>
        );

      case 'empty':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-violet-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">还没有生成个性化内容</h3>
            <p className="text-slate-600 mb-6 text-center max-w-md">
              点击下方按钮，AI将根据您的学习偏好和资源内容，为您生成个性化的学习材料
            </p>
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
              <Sparkles size={20} />
              生成个性化内容
            </button>
          </div>
        );

      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <Loader2 className="relative w-20 h-20 text-violet-500 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">AI正在生成个性化内容</h3>
            <div className="space-y-3 text-center max-w-md">
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
                <p>正在分析资源内容...</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <p>正在结合您的学习偏好...</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-slate-600">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                <p>正在生成个性化学习材料...</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-violet-50 rounded-xl border border-violet-200">
              <p className="text-sm text-violet-700 font-medium">💡 提示：生成过程约需30-90秒</p>
              <p className="text-xs text-slate-500 mt-1">您可以关闭窗口，稍后再查看生成结果</p>
            </div>
          </div>
        );

      case 'viewing':
        return (
          <div className="p-6">
            {content && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-500">
                    生成时间：{format(new Date(content.created_at), 'PPP HH:mm', { locale: dateFnsLocale })}
                  </p>
                  <div className="flex gap-2">
                    {content.has_history && (
                      <button
                        onClick={loadHistory}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <History size={16} />
                        查看历史
                      </button>
                    )}
                    <button
                      onClick={handleGenerate}
                      className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors flex items-center gap-2 text-sm"
                    >
                      <RotateCcw size={16} />
                      重新生成
                    </button>
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-lg">
                  <style jsx global>{`
                    .personalized-content h1 {
                      font-size: 2.5rem !important;
                      font-weight: 900 !important;
                      color: #7c3aed !important;
                      margin-top: 0 !important;
                      margin-bottom: 2rem !important;
                      padding-bottom: 1rem !important;
                      border-bottom: 4px solid #c4b5fd !important;
                      line-height: 1.2 !important;
                      text-align: center !important;
                    }
                    
                    .personalized-content h2 {
                      font-size: 2rem !important;
                      font-weight: 800 !important;
                      color: #8b5cf6 !important;
                      margin-top: 3rem !important;
                      margin-bottom: 1.5rem !important;
                      line-height: 1.3 !important;
                      border-left: 6px solid #8b5cf6 !important;
                      padding-left: 1rem !important;
                      background: linear-gradient(to right, #f5f3ff, transparent) !important;
                      padding-top: 0.5rem !important;
                      padding-bottom: 0.5rem !important;
                    }
                    
                    .personalized-content h3 {
                      font-size: 1.5rem !important;
                      font-weight: 700 !important;
                      color: #a855f7 !important;
                      margin-top: 2rem !important;
                      margin-bottom: 1rem !important;
                      line-height: 1.4 !important;
                    }
                    
                    .personalized-content h4 {
                      font-size: 1.25rem !important;
                      font-weight: 600 !important;
                      color: #c026d3 !important;
                      margin-top: 1.5rem !important;
                      margin-bottom: 0.75rem !important;
                    }
                    
                    .personalized-content p {
                      font-size: 1rem !important;
                      color: #334155 !important;
                      line-height: 2 !important;
                      margin-bottom: 1.25rem !important;
                      text-indent: 2em !important;
                      text-align: justify !important;
                    }
                    
                    .personalized-content strong {
                      color: #7c3aed !important;
                      font-weight: 800 !important;
                    }
                    
                    .personalized-content em {
                      color: #a855f7 !important;
                      font-style: normal !important;
                      font-weight: 600 !important;
                    }
                    
                    .personalized-content code {
                      color: #c026d3 !important;
                      background-color: #fae8ff !important;
                      padding: 0.25rem 0.5rem !important;
                      border-radius: 0.375rem !important;
                      font-size: 0.9em !important;
                      font-weight: 600 !important;
                    }
                    
                    .personalized-content pre {
                      background-color: #1e293b !important;
                      color: #e2e8f0 !important;
                      padding: 1.5rem !important;
                      border-radius: 0.75rem !important;
                      margin: 1.5rem 0 !important;
                      overflow-x: auto !important;
                      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
                    }
                    
                    .personalized-content pre code {
                      color: #e2e8f0 !important;
                      background-color: transparent !important;
                      padding: 0 !important;
                    }
                    
                    .personalized-content blockquote {
                      border-left: 4px solid #8b5cf6 !important;
                      background: linear-gradient(to right, #f5f3ff, #fae8ff) !important;
                      padding: 1rem 1.5rem !important;
                      margin: 1.5rem 0 !important;
                      border-radius: 0 0.75rem 0.75rem 0 !important;
                      font-style: normal !important;
                    }
                    
                    .personalized-content blockquote p {
                      text-indent: 0 !important;
                      margin-bottom: 0 !important;
                    }
                    
                    .personalized-content ul,
                    .personalized-content ol {
                      margin: 1rem 0 !important;
                      padding-left: 2rem !important;
                    }
                    
                    .personalized-content li {
                      margin-bottom: 0.75rem !important;
                      line-height: 1.8 !important;
                      color: #334155 !important;
                    }
                    
                    .personalized-content li p {
                      text-indent: 0 !important;
                      display: inline !important;
                      margin: 0 !important;
                    }
                    
                    .personalized-content a {
                      color: #8b5cf6 !important;
                      font-weight: 600 !important;
                      text-decoration: none !important;
                    }
                    
                    .personalized-content a:hover {
                      text-decoration: underline !important;
                      color: #a855f7 !important;
                    }
                  `}</style>
                  <div className="personalized-content">
                    <ReactMarkdown>{content.content}</ReactMarkdown>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-6 h-6 text-blue-500" />
                历史记录
              </h3>
              <button
                onClick={() => setStep('viewing')}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
              >
                返回
              </button>
            </div>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => viewHistoryItem(item)}
                  >
                    <p className="text-sm font-bold text-slate-700 mb-2">
                      {format(new Date(item.created_at), 'PPP HH:mm', { locale: dateFnsLocale })}
                    </p>
                    <div className="prose max-w-none text-slate-600 text-sm leading-relaxed line-clamp-3">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 py-10">暂无历史记录</p>
            )}
          </div>
        );

      default:
        return null;
    }
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
          <div className="fixed inset-0 bg-black bg-opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-white/70 text-left align-middle shadow-xl transition-all border border-white/50 backdrop-blur-xl">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-6 text-white">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">个性化学习内容</h2>
                        <p className="text-sm text-white/80">{resourceName}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                  {renderContent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PersonalizedContentModal;
