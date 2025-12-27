"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function DocumentPreviewPage() {
  const params = useParams();
  const documentType = params.type as string; // pdf, pptx, docx
  const documentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 模拟文档数据
  const documentData = {
    id: documentId,
    name: '第一章课件.pptx',
    type: documentType,
    url: 'https://example.com/document.pdf', // 实际应该从后端获取
    size: '5.2 MB',
    uploadDate: '2024-11-20'
  };

  useEffect(() => {
    // 模拟加载
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getPreviewUrl = () => {
    // 根据文档类型返回预览URL
    switch (documentType) {
      case 'pdf':
        // 直接使用浏览器内置PDF查看器
        return documentData.url;
      case 'pptx':
      case 'docx':
        // 使用Office Online Viewer或Google Docs Viewer
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentData.url)}`;
      default:
        return documentData.url;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch(type) {
      case 'pdf': return '📄';
      case 'pptx': return '📊';
      case 'docx': return '📝';
      default: return '📁';
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch(type) {
      case 'pdf': return 'PDF文档';
      case 'pptx': return 'PowerPoint演示文稿';
      case 'docx': return 'Word文档';
      default: return '文档';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Header */}
      <header className="bg-neutral-800 border-b border-neutral-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/learn/1" 
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-300 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </Link>
            
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getDocumentIcon(documentType)}</span>
              <div>
                <h1 className="text-white font-bold text-lg">{documentData.name}</h1>
                <p className="text-neutral-400 text-sm">{getDocumentTypeName(documentType)} · {documentData.size}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              下载
            </button>
            
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
              </svg>
              分享
            </button>
          </div>
        </div>
      </header>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        {loading ? (
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-neutral-400">正在加载文档...</p>
          </div>
        ) : error ? (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-2">文档加载失败</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
            {documentType === 'pdf' ? (
              // PDF预览 - 使用浏览器内置查看器
              <iframe
                src={`${getPreviewUrl()}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full"
                title="PDF预览"
              />
            ) : documentType === 'pptx' || documentType === 'docx' ? (
              // Office文档预览 - 使用Office Online Viewer
              <iframe
                src={getPreviewUrl()}
                className="w-full h-full"
                title="文档预览"
              />
            ) : (
              // 其他类型 - 显示下载提示
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <span className="text-6xl mb-4 block">{getDocumentIcon(documentType)}</span>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">无法预览此文档</h3>
                  <p className="text-neutral-600 mb-6">此文档类型不支持在线预览，请下载后查看</p>
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    下载文档
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-neutral-800 border-t border-neutral-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-neutral-400">
          <div className="flex items-center gap-6">
            <span>上传时间: {documentData.uploadDate}</span>
            <span>文件大小: {documentData.size}</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path>
              </svg>
            </button>
            <button className="hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path>
              </svg>
            </button>
            <button className="hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

