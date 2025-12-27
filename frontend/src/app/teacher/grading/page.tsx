"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Submission {
  id: number;
  studentName: string;
  studentId: string;
  assignment: string;
  course: string;
  submitDate: string;
  status: 'pending' | 'graded';
  score?: number;
  maxScore: number;
}

export default function TeacherGradingPage() {
  const [submissions] = useState<Submission[]>([
    { id: 1, studentName: '张三', studentId: '2024001', assignment: 'Web项目实战', course: 'Web开发基础', submitDate: '2024-11-26', status: 'pending', maxScore: 100 },
    { id: 2, studentName: '李四', studentId: '2024002', assignment: '数据结构作业', course: '数据结构与算法', submitDate: '2024-11-25', status: 'pending', maxScore: 100 },
    { id: 3, studentName: '王五', studentId: '2023015', assignment: '第一章测验', course: '计算机科学导论', submitDate: '2024-11-24', status: 'graded', score: 85, maxScore: 100 },
  ]);

  const [filter, setFilter] = useState<'all' | Submission['status']>('all');
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingModalOpen(true);
    setScore('');
    setFeedback('');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">教师工作台</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/teacher/resources" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                资源库
              </Link>
              <Link href="/teacher/courses" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                课程管理
              </Link>
              <Link href="/teacher/students" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                学生管理
              </Link>
              <Link href="/teacher/grading" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                批改作业
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <button className="p-2 text-neutral-600 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                王
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">作业批改</h1>
          <p className="text-neutral-600">查看学生作业提交，进行批改和评分</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: '待批改', value: submissions.filter(s => s.status === 'pending').length, icon: '⏳', color: 'from-neutral-500 to-neutral-600' },
            { label: '已批改', value: submissions.filter(s => s.status === 'graded').length, icon: '✅', color: 'from-blue-500 to-blue-600' },
            { label: '平均分', value: submissions.filter(s => s.score).length > 0 ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length) : 0, icon: '📊', color: 'from-blue-500 to-blue-600' },
            { label: '总提交', value: submissions.length, icon: '📝', color: 'from-blue-600 to-blue-700' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-100">
              <span className="text-3xl mb-3 block">{stat.icon}</span>
              <div className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: '全部', value: 'all' as const },
            { label: '待批改', value: 'pending' as const },
            { label: '已批改', value: 'graded' as const },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {submission.studentName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900">{submission.assignment}</h3>
                      {submission.status === 'pending' ? (
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold">待批改</span>
                      ) : (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">已批改</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
                      <span>学生: {submission.studentName} ({submission.studentId})</span>
                      <span>•</span>
                      <span>课程: {submission.course}</span>
                      <span>•</span>
                      <span>提交时间: {submission.submitDate}</span>
                    </div>
                  </div>
                </div>
                {submission.status === 'graded' && submission.score !== undefined && (
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-blue-600">{submission.score}</div>
                    <div className="text-sm text-neutral-500">/ {submission.maxScore}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleGrade(submission)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    submission.status === 'pending'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {submission.status === 'pending' ? '开始批改' : '查看批改'}
                </button>
                <button className="px-6 py-3 border-2 border-neutral-200 text-neutral-700 rounded-xl text-sm font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
                  查看作业
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <div className="text-xl font-semibold text-neutral-900 mb-2">暂无作业</div>
            <div className="text-neutral-500">当前没有需要批改的作业</div>
          </div>
        )}
      </main>

      {/* Grading Modal */}
      {gradingModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">批改作业</h2>
              <button
                onClick={() => setGradingModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Student Info */}
            <div className="bg-neutral-50 rounded-2xl p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-600">学生姓名:</span>
                  <span className="ml-2 font-semibold text-neutral-900">{selectedSubmission.studentName}</span>
                </div>
                <div>
                  <span className="text-neutral-600">学号:</span>
                  <span className="ml-2 font-semibold text-neutral-900">{selectedSubmission.studentId}</span>
                </div>
                <div>
                  <span className="text-neutral-600">作业名称:</span>
                  <span className="ml-2 font-semibold text-neutral-900">{selectedSubmission.assignment}</span>
                </div>
                <div>
                  <span className="text-neutral-600">提交时间:</span>
                  <span className="ml-2 font-semibold text-neutral-900">{selectedSubmission.submitDate}</span>
                </div>
              </div>
            </div>

            {/* Assignment Content */}
            <div className="mb-6">
              <h3 className="font-bold text-neutral-900 mb-3">作业内容</h3>
              <div className="bg-neutral-50 rounded-xl p-6 text-sm text-neutral-700">
                <p className="mb-4">这是学生提交的作业内容示例...</p>
                <div className="flex items-center gap-2 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>project.zip (2.5 MB)</span>
                </div>
              </div>
            </div>

            {/* Grading Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              alert('批改成功！');
              setGradingModalOpen(false);
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  评分 (满分 {selectedSubmission.maxScore}) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedSubmission.maxScore}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={`请输入分数 (0-${selectedSubmission.maxScore})`}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  批改意见 *
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="请输入批改意见和建议..."
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="flex-1 py-3 border-2 border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!score || !feedback}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交批改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

