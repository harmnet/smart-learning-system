"use client";

import { useState } from 'react';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import apiClient from '@/lib/api-client';

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
  const [aiGrading, setAiGrading] = useState(false);
  const [aiTargetId, setAiTargetId] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiResult, setAiResult] = useState<{ score?: number; comment?: string; summary?: string; llm_config_name?: string } | null>(null);
  const stats = [
    {
      label: '待批改',
      value: submissions.filter(s => s.status === 'pending').length,
      icon: (
        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: '已批改',
      value: submissions.filter(s => s.status === 'graded').length,
      icon: (
        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      label: '平均分',
      value: submissions.filter(s => s.score).length > 0
        ? Math.round(submissions.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / submissions.filter(s => s.score).length)
        : 0,
      icon: (
        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 12h2m-1-8v4m0 12v-4m8-4h-4M8 12H4m15.364 6.364l-2.828-2.828M8.464 8.464L5.636 5.636m12.728 0l-2.828 2.828M8.464 15.536l-2.828 2.828" />
        </svg>
      )
    },
    {
      label: '总提交',
      value: submissions.length,
      icon: (
        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      )
    }
  ];

  const filteredSubmissions = filter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === filter);

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradingModalOpen(true);
    setScore('');
    setFeedback('');
  };

  const handleAiGrade = async (submissionId: number) => {
    try {
      setAiGrading(true);
      setAiTargetId(submissionId);
      const response = await apiClient.post(`/teacher/homeworks/submissions/${submissionId}/ai-grade`);
      setAiResult(response.data || null);
      setAiModalOpen(true);
    } catch (err: any) {
      alert('AI批改失败: ' + (err?.response?.data?.detail || err?.message || '未知错误'));
    } finally {
      setAiGrading(false);
      setAiTargetId(null);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">作业批改</h1>
            <p className="mt-1 text-sm text-slate-600">查看学生作业提交，进行批改、评分与AI辅助批改</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
              </div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
          </div>
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {submission.studentName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-neutral-900">{submission.assignment}</h3>
                      {submission.status === 'pending' ? (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">待批改</span>
                      ) : (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">已批改</span>
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
                    <div className="text-3xl font-semibold text-blue-600">{submission.score}</div>
                    <div className="text-sm text-neutral-500">/ {submission.maxScore}</div>
                  </div>
                )}
              </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleGrade(submission)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                      submission.status === 'pending'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {submission.status === 'pending' ? '开始批改' : '查看批改'}
                  </button>
                  <button
                    onClick={() => handleAiGrade(submission.id)}
                    disabled={aiGrading}
                    className="px-6 py-3 border border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiGrading && aiTargetId === submission.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-blue-200 border-t-transparent rounded-full animate-spin"></span>
                        AI批改中
                      </span>
                    ) : (
                      'AI批改'
                    )}
                  </button>
                  <button className="px-6 py-3 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold bg-white hover:border-slate-300 transition-all">
                    查看作业
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-12 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-white flex items-center justify-center border border-slate-200">
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-neutral-900 mb-2">暂无作业</div>
              <div className="text-neutral-500">当前没有需要批改的作业</div>
            </div>
          )}
        </section>
      </div>
      {/* Grading Modal */}
      {gradingModalOpen && selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
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
            <div className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
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
              <div className="bg-slate-50 rounded-xl p-6 text-sm text-neutral-700 border border-slate-200">
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
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
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none resize-none"
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setGradingModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-slate-300 transition-all"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!score || !feedback}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交批改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {aiModalOpen && aiResult && (
        <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900">AI批改结果</h3>
              <button
                onClick={() => setAiModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">建议评分</div>
                  <div className="text-2xl font-semibold text-blue-600 mt-1">{aiResult?.score ?? '-'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-600">模型来源</div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">{aiResult?.llm_config_name || '—'}</div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900 mb-2">评语</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult?.comment || '—'}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900 mb-2">要点总结</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult?.summary || '—'}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    if (aiResult?.score !== undefined) setScore(String(aiResult.score));
                    if (aiResult?.comment) setFeedback(aiResult.comment);
                    setAiModalOpen(false);
                    setGradingModalOpen(true);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  应用到批改表单
                </button>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-slate-300 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
