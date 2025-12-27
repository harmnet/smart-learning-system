"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignment = {
    id: parseInt(params.id as string),
    title: 'Web项目实战',
    course: 'Web开发基础',
    dueDate: '2024-12-10',
    description: '请使用React开发一个简单的待办事项应用，要求包含添加、删除、标记完成等功能。',
    requirements: [
      '使用React Hooks进行状态管理',
      '实现响应式设计',
      '代码规范，注释清晰',
      '提交源代码压缩包'
    ],
    maxScore: 100,
    status: 'pending'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      alert('作业提交成功！');
      router.push('/assignments');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/assignments" className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="font-medium">返回作业列表</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        {/* Assignment Info */}
        <div className="bg-white rounded-2xl p-8 border border-neutral-100 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{assignment.title}</h1>
              <p className="text-neutral-600">{assignment.course}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-neutral-500 mb-1">截止时间</div>
              <div className="text-lg font-bold text-red-600">{assignment.dueDate}</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-neutral-900 mb-3">作业要求</h2>
            <p className="text-neutral-700 mb-4">{assignment.description}</p>
            <ul className="space-y-2">
              {assignment.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-neutral-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>满分: {assignment.maxScore}分</span>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        {assignment.status === 'pending' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-neutral-100">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">提交作业</h2>

            {/* Text Answer */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                作业说明 / 答案
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="在这里输入你的作业说明或答案..."
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                rows={8}
                required
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                附件上传
              </label>
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 text-neutral-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <div className="text-neutral-600 font-medium mb-1">点击上传文件</div>
                  <div className="text-sm text-neutral-400">支持 PDF, DOC, ZIP 等格式，最大50MB</div>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-sm font-medium text-neutral-900">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Link
                href="/assignments"
                className="flex-1 py-4 border-2 border-neutral-300 text-neutral-700 rounded-xl font-semibold text-center hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                取消
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || !answer.trim()}
                className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '提交中...' : '提交作业'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

