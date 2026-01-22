"use client";

import { useEffect, useState } from 'react';
import DocumentViewer from '@/components/DocumentViewer';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { teacherService } from '@/services/teacher.service';
import {
  TeacherCourseOption,
  TeacherHomeworkGradeHistoryItem,
  TeacherHomeworkAIGradeResponse,
  TeacherHomeworkSubmissionDetail,
  TeacherHomeworkSubmissionItem,
} from '@/types/homework';

const inputStyle = 'w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm';
const selectStyle = 'w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm bg-white';

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getPreviewType = (fileName: string, fileType?: string | null) => {
  const normalized = (fileType || fileName).toLowerCase();
  if (normalized.includes('pdf') || normalized.endsWith('.pdf')) return 'pdf';
  if (normalized.includes('ppt') || normalized.endsWith('.ppt') || normalized.endsWith('.pptx')) return 'pptx';
  if (normalized.includes('doc') || normalized.endsWith('.doc') || normalized.endsWith('.docx')) return 'docx';
  return null;
};

export default function TeacherGradingPage() {
  const [courses, setCourses] = useState<TeacherCourseOption[]>([]);
  const [submissions, setSubmissions] = useState<TeacherHomeworkSubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchForm, setSearchForm] = useState({
    course_id: '',
    student_no: '',
    student_name: '',
    homework_title: '',
    status: 'all' as 'all' | 'submitted' | 'graded',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [gradingModalOpen, setGradingModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<TeacherHomeworkSubmissionDetail | null>(null);
  const [history, setHistory] = useState<TeacherHomeworkGradeHistoryItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);
  const [aiTargetId, setAiTargetId] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<TeacherHomeworkAIGradeResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; type: 'pdf' | 'pptx' | 'docx'; title: string } | null>(null);

  useEffect(() => {
    loadCourses();
    loadData();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await teacherService.getHomeworkCourses();
      setCourses(data);
    } catch (err: any) {
      setCourses([]);
    }
  };

  const buildParams = (params?: typeof searchForm) => {
    const form = params || searchForm;
    return {
      course_id: form.course_id ? Number(form.course_id) : undefined,
      student_no: form.student_no || undefined,
      student_name: form.student_name || undefined,
      homework_title: form.homework_title || undefined,
      status: form.status === 'all' ? undefined : form.status,
    };
  };

  const loadData = async (params?: typeof searchForm, page?: number) => {
    try {
      setLoading(true);
      setError(null);
      const currentPage = page || pagination.current;
      const skip = (currentPage - 1) * pagination.pageSize;
      const response = await teacherService.getHomeworkSubmissions({
        ...buildParams(params),
        skip,
        limit: pagination.pageSize,
      });
      setSubmissions(response.items);
      setPagination({
        ...pagination,
        current: currentPage,
        total: response.total || 0,
      });
    } catch (err: any) {
      setError(err.message || '加载作业失败');
      setSubmissions([]);
      setPagination({
        ...pagination,
        current: 1,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPagination({ ...pagination, current: 1 });
    loadData(searchForm, 1);
  };

  const handleReset = () => {
    const emptyForm = {
      course_id: '',
      student_no: '',
      student_name: '',
      homework_title: '',
      status: 'all' as const,
    };
    setSearchForm(emptyForm);
    setPagination({ ...pagination, current: 1 });
    loadData(emptyForm, 1);
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, current: page });
    loadData(searchForm, page);
  };

  const handleStatusChange = (status: 'all' | 'submitted' | 'graded') => {
    const nextForm = { ...searchForm, status };
    setSearchForm(nextForm);
    setPagination({ ...pagination, current: 1 });
    loadData(nextForm, 1);
  };

  const openSubmissionModal = async (submissionId: number) => {
    setGradingModalOpen(true);
    setSelectedSubmissionId(submissionId);
    setSelectedSubmission(null);
    setHistory([]);
    setModalError(null);
    setAiResult(null);
    setAiError(null);
    setAiGrading(false);
    setAiTargetId(null);
    setDetailLoading(true);
    setHistoryLoading(true);
    setScore('');
    setFeedback('');
    try {
      const [detail, historyResponse] = await Promise.all([
        teacherService.getHomeworkSubmissionDetail(submissionId),
        teacherService.getHomeworkSubmissionHistory(submissionId, { skip: 0, limit: 10 }),
      ]);
      setSelectedSubmission(detail);
      setHistory(historyResponse.items);
      setScore(detail.score !== null && detail.score !== undefined ? String(detail.score) : '');
      setFeedback(detail.teacher_comment || '');
    } catch (err: any) {
      setModalError(err.message || '加载作业详情失败');
    } finally {
      setDetailLoading(false);
      setHistoryLoading(false);
    }
  };

  const handleAiGrade = async (submissionId: number) => {
    await openSubmissionModal(submissionId);
    setAiTargetId(submissionId);
    setAiGrading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await teacherService.aiGradeHomeworkSubmission(submissionId);
      setAiResult(result);
      if (result.score !== null && result.score !== undefined) {
        setScore(String(result.score));
      }
      const nextFeedback = result.feedback || result.raw_result || '';
      if (nextFeedback) {
        setFeedback(nextFeedback);
      }
    } catch (err: any) {
      setAiError(err.message || 'AI批改失败');
    } finally {
      setAiGrading(false);
      setAiTargetId(null);
    }
  };

  const handleGradeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedSubmissionId) return;
    if (!score) return;
    try {
      setSubmitting(true);
      await teacherService.gradeHomeworkSubmission(selectedSubmissionId, {
        score: Number(score),
        teacher_comment: feedback || null,
      });
      const [detail, historyResponse] = await Promise.all([
        teacherService.getHomeworkSubmissionDetail(selectedSubmissionId),
        teacherService.getHomeworkSubmissionHistory(selectedSubmissionId, { skip: 0, limit: 10 }),
      ]);
      setSelectedSubmission(detail);
      setHistory(historyResponse.items);
      loadData(searchForm, pagination.current);
    } catch (err: any) {
      setModalError(err.message || '提交批改失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">作业批改</h1>
            <p className="text-sm text-slate-500">查看学生作业提交，进行批改和评分</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">课程名称</label>
              <select
                className={selectStyle}
                value={searchForm.course_id}
                onChange={(event) => setSearchForm({ ...searchForm, course_id: event.target.value })}
              >
                <option value="">全部课程</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">学号</label>
              <input
                type="text"
                className={inputStyle}
                value={searchForm.student_no}
                onChange={(event) => setSearchForm({ ...searchForm, student_no: event.target.value })}
                placeholder="请输入学号"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">学生姓名</label>
              <input
                type="text"
                className={inputStyle}
                value={searchForm.student_name}
                onChange={(event) => setSearchForm({ ...searchForm, student_name: event.target.value })}
                placeholder="请输入学生姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">作业名称</label>
              <input
                type="text"
                className={inputStyle}
                value={searchForm.homework_title}
                onChange={(event) => setSearchForm({ ...searchForm, homework_title: event.target.value })}
                placeholder="请输入作业名称"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                查询
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
              >
                重置
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: '全部', value: 'all' as const },
            { label: '待批改', value: 'submitted' as const },
            { label: '已批改', value: 'graded' as const },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                searchForm.status === tab.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {error && (
            <div className="px-6 py-4 bg-rose-50 text-rose-600 text-sm font-semibold">{error}</div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-4">课程 / 章节</th>
                  <th className="px-6 py-4">作业</th>
                  <th className="px-6 py-4">学生</th>
                  <th className="px-6 py-4">提交时间</th>
                  <th className="px-6 py-4">状态</th>
                  <th className="px-6 py-4">评分</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                        加载中
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && submissions.map((item) => (
                  <tr key={item.id} className="text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.course_title}</div>
                      <div className="text-slate-500">
                        {item.parent_chapter_title ? `${item.parent_chapter_title} / ` : ''}
                        {item.chapter_title || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.homework_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.student_name}</div>
                      <div className="text-slate-500">{item.student_no || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDateTime(item.submitted_at)}</td>
                    <td className="px-6 py-4">
                      {item.status === 'graded' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">已批改</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">待批改</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.score ?? '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleAiGrade(item.id)}
                          disabled={aiGrading}
                          className="px-4 py-2 text-sm font-semibold text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {aiGrading && aiTargetId === item.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-3 h-3 border-2 border-violet-300 border-t-transparent rounded-full animate-spin"></span>
                              AI批改中
                            </span>
                          ) : (
                            'AI批改'
                          )}
                        </button>
                        <button
                          onClick={() => openSubmissionModal(item.id)}
                          className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          {item.status === 'graded' ? '查看批改' : '开始批改'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && submissions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      暂无作业提交记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.total > 0 && (
            <div className="px-6 py-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-slate-500">
                显示 {((pagination.current - 1) * pagination.pageSize) + 1} - {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const showPages = 5;
                    let startPage = Math.max(1, pagination.current - Math.floor(showPages / 2));
                    let endPage = Math.min(totalPages, startPage + showPages - 1);
                    if (endPage - startPage < showPages - 1) {
                      startPage = Math.max(1, endPage - showPages + 1);
                    }
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="w-10 h-10 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="ellipsis1" className="px-2 text-slate-400">...</span>);
                      }
                    }
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-10 h-10 text-sm font-semibold rounded-full transition-colors ${
                            i === pagination.current
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="ellipsis2" className="px-2 text-slate-400">...</span>);
                      }
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="w-10 h-10 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={pagination.current >= totalPages}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {gradingModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">批改作业</h2>
              <button
                onClick={() => setGradingModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="mb-6 px-4 py-3 bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl">{modalError}</div>
            )}
            {aiError && (
              <div className="mb-6 px-4 py-3 bg-rose-50 text-rose-600 text-sm font-semibold rounded-xl">{aiError}</div>
            )}
            {aiGrading && (
              <div className="mb-6 px-4 py-3 bg-violet-50 text-violet-600 text-sm font-semibold rounded-xl">
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin"></span>
                  AI批改中
                </span>
              </div>
            )}
            {aiResult && !aiGrading && (
              <div className="mb-6 bg-violet-50 border border-violet-100 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-violet-700">AI批改结果</div>
                  {aiResult.score !== null && aiResult.score !== undefined && (
                    <div className="text-sm font-semibold text-violet-700">建议评分：{aiResult.score}</div>
                  )}
                </div>
                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {aiResult.feedback || aiResult.raw_result || '暂无AI批改内容'}
                </div>
              </div>
            )}

            {detailLoading && (
              <div className="py-10 text-center text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></span>
                  加载作业详情中
                </span>
              </div>
            )}

            {!detailLoading && selectedSubmission && (
              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">学生姓名:</span>
                      <span className="ml-2 font-semibold text-slate-900">{selectedSubmission.student.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">学号:</span>
                      <span className="ml-2 font-semibold text-slate-900">{selectedSubmission.student.student_no || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">课程名称:</span>
                      <span className="ml-2 font-semibold text-slate-900">{selectedSubmission.course.title || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">章节信息:</span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {selectedSubmission.chapter.parent_title ? `${selectedSubmission.chapter.parent_title} / ` : ''}
                        {selectedSubmission.chapter.title || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">作业名称:</span>
                      <span className="ml-2 font-semibold text-slate-900">{selectedSubmission.homework.title || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">提交时间:</span>
                      <span className="ml-2 font-semibold text-slate-900">{formatDateTime(selectedSubmission.submitted_at)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">作业内容</h3>
                  <div className="bg-slate-50 rounded-2xl p-6 text-sm text-slate-700">
                    {selectedSubmission.content ? (
                      <div className="whitespace-pre-wrap leading-relaxed">{selectedSubmission.content}</div>
                    ) : (
                      <div className="text-slate-500">学生未填写作业内容</div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">学生附件</h4>
                    {selectedSubmission.attachments.length === 0 && (
                      <div className="text-sm text-slate-500">暂无附件</div>
                    )}
                    <div className="space-y-3">
                      {selectedSubmission.attachments.map((attachment) => {
                        const previewType = getPreviewType(attachment.file_name, attachment.file_type);
                        return (
                          <div key={attachment.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{attachment.file_name}</div>
                              <div className="text-xs text-slate-500">{attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : '未知大小'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                              >
                                下载
                              </a>
                              {previewType && (
                                <button
                                  type="button"
                                  onClick={() => setPreview({ url: attachment.file_url, type: previewType, title: attachment.file_name })}
                                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                                >
                                  预览
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-4">作业要求附件</h4>
                    {selectedSubmission.homework_attachments.length === 0 && (
                      <div className="text-sm text-slate-500">暂无附件</div>
                    )}
                    <div className="space-y-3">
                      {selectedSubmission.homework_attachments.map((attachment) => {
                        const previewType = getPreviewType(attachment.file_name, attachment.file_type);
                        return (
                          <div key={attachment.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{attachment.file_name}</div>
                              <div className="text-xs text-slate-500">{attachment.file_size ? `${(attachment.file_size / 1024 / 1024).toFixed(2)} MB` : '未知大小'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={attachment.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                              >
                                下载
                              </a>
                              {previewType && (
                                <button
                                  type="button"
                                  onClick={() => setPreview({ url: attachment.file_url, type: previewType, title: attachment.file_name })}
                                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                                >
                                  预览
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-slate-700">评分历史</h4>
                    <span className="text-xs text-slate-500">{history.length} 条记录</span>
                  </div>
                  {historyLoading && (
                    <div className="text-sm text-slate-500">加载评分历史中</div>
                  )}
                  {!historyLoading && history.length === 0 && (
                    <div className="text-sm text-slate-500">暂无历史评分</div>
                  )}
                  {!historyLoading && history.length > 0 && (
                    <div className="space-y-3">
                      {history.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-100 rounded-xl px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <div className="font-semibold text-slate-900">评分 {item.score ?? '-'}</div>
                            <div className="text-slate-500">{formatDateTime(item.graded_at)}</div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">评分老师：{item.teacher_name}</div>
                          {item.teacher_comment && (
                            <div className="text-sm text-slate-600 mt-2">{item.teacher_comment}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleGradeSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">评分 *</label>
                    <input
                      type="number"
                      min="0"
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                      placeholder="请输入分数"
                      className={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">批改意见 *</label>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      placeholder="请输入批改意见和建议"
                      className={`${inputStyle} min-h-[140px] resize-none`}
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => setGradingModalOpen(false)}
                      className="flex-1 py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                    >
                      关闭
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !score || !feedback}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? '提交中...' : '提交批改'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[80vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">{preview.title}</div>
              <button
                onClick={() => setPreview(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <DocumentViewer url={preview.url} type={preview.type} title={preview.title} />
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
