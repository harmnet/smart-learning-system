"use client";

import { useState, useEffect } from 'react';
import { examService, Exam } from '@/services/exam.service';
import { examPaperService, ExamPaper } from '@/services/examPaper.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';

export default function ExamManagementPage() {
  const { t } = useLanguage();
  const [exams, setExams] = useState<Exam[]>([]);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addStudentsModalOpen, setAddStudentsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Form states
  const [examPaperId, setExamPaperId] = useState<number | null>(null);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [earlyLoginMinutes, setEarlyLoginMinutes] = useState(15);
  const [lateForbiddenMinutes, setLateForbiddenMinutes] = useState(15);
  
  const teacherId = 1; // TODO: Get from auth context

  useEffect(() => {
    loadExams();
    loadPapers();
  }, [searchTerm, statusFilter]);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await examService.getAll(
        teacherId,
        0,
        100,
        searchTerm || undefined,
        statusFilter || undefined
      );
      setExams(data);
    } catch (error: any) {
      console.error('Failed to load exams:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载考试失败';
      alert(`错误: ${errorMessage}\n\n请检查：\n1. 后端服务是否运行在 http://localhost:8000\n2. 网络连接是否正常`);
    } finally {
      setLoading(false);
    }
  };

  const loadPapers = async () => {
    try {
      const data = await examPaperService.getAll(teacherId, 0, 100);
      setPapers(data);
    } catch (error: any) {
      console.error('Failed to load papers:', error);
    }
  };

  const resetForm = () => {
    setExamPaperId(null);
    setExamName('');
    setExamDate('');
    setStartTime('');
    setEndTime('');
    setCoverImage(null);
    setCoverPreview('');
    setEarlyLoginMinutes(15);
    setLateForbiddenMinutes(15);
  };

  const handleCreateExam = async () => {
    if (!examPaperId || !examName.trim() || !examDate || !startTime || !endTime) {
      alert('请填写所有必填字段');
      return;
    }
    
    // 组合日期和时间（确保时间格式为 HH:mm:ss）
    const startTimeFormatted = startTime.length === 5 ? `${startTime}:00` : startTime;
    const endTimeFormatted = endTime.length === 5 ? `${endTime}:00` : endTime;
    const startDateTime = `${examDate}T${startTimeFormatted}`;
    const endDateTime = `${examDate}T${endTimeFormatted}`;
    
    try {
      const result = await examService.create(teacherId, {
        exam_paper_id: examPaperId,
        exam_name: examName,
        exam_date: examDate,
        start_time: startDateTime,
        end_time: endDateTime,
        early_login_minutes: earlyLoginMinutes,
        late_forbidden_minutes: lateForbiddenMinutes,
      });
      
      // 上传封面
      if (coverImage) {
        await examService.uploadCover(result.id, teacherId, coverImage);
      }
      
      alert('考试创建成功');
      setCreateModalOpen(false);
      resetForm();
      loadExams();
    } catch (error: any) {
      console.error('Failed to create exam:', error);
      alert('创建失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteExam = async (exam: Exam) => {
    if (!confirm('确定要删除这个考试吗？')) return;
    try {
      await examService.delete(exam.id, teacherId);
      alert('考试删除成功');
      loadExams();
    } catch (error: any) {
      console.error('Failed to delete exam:', error);
      alert('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddStudents = (exam: Exam) => {
    setSelectedExam(exam);
    setAddStudentsModalOpen(true);
  };

  const handleExportGrades = async (exam: Exam) => {
    try {
      const result = await examService.exportGrades(exam.id, teacherId);
      alert(result.message || '成绩导出功能开发中');
    } catch (error: any) {
      console.error('Failed to export grades:', error);
      alert('导出失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      not_started: '未开始',
      in_progress: '考试中',
      ended: '考试结束',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      not_started: 'bg-blue-100 text-blue-600',
      in_progress: 'bg-green-100 text-green-600',
      ended: 'bg-slate-100 text-slate-600',
    };
    return colorMap[status] || 'bg-slate-100 text-slate-600';
  };

  const formatDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.teacher.examManagement?.title || '考试管理'}</h1>
              <p className="text-sm text-slate-500">{t.teacher.examManagement?.subtitle || '管理和维护考试'}</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="px-6 py-3 text-sm font-bold rounded-full transition-colors active:scale-95 text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {t.teacher.examManagement?.create || '新建考试'}
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.examManagement?.searchPlaceholder || '搜索考试名称...'}
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">全部状态</option>
              <option value="not_started">未开始</option>
              <option value="in_progress">考试中</option>
              <option value="ended">考试结束</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500">{t.teacher.examManagement?.noExams || '暂无考试'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-slate-900">{exam.exam_name}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(exam.status)}`}>
                          {getStatusText(exam.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="text-slate-500">试卷：</span>
                          <span className="font-medium ml-1">{exam.paper_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">考试日期：</span>
                          <span className="font-medium ml-1">{formatDateTime(exam.exam_date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">考试时间：</span>
                          <span className="font-medium ml-1">
                            {formatDateTime(exam.start_time)} - {formatDateTime(exam.end_time).split(' ')[1]}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">考生数量：</span>
                          <span className="font-medium ml-1">{exam.student_count} 人</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAddStudents(exam)}
                        className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        {t.teacher.examManagement?.addStudents || '添加考生'}
                      </button>
                      <button
                        onClick={() => handleExportGrades(exam)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        {t.teacher.examManagement?.exportGrades || '导出成绩'}
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        {t.teacher.examManagement?.delete || '删除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Exam Modal */}
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }} 
        title={t.teacher.examManagement?.createTitle || '新建考试'}
        size="lg"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              关联试卷 <span className="text-red-500">*</span>
            </label>
            <select
              value={examPaperId || ''}
              onChange={(e) => setExamPaperId(parseInt(e.target.value) || null)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择试卷</option>
              {papers.map((paper) => (
                <option key={paper.id} value={paper.id}>
                  {paper.paper_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              考试名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="请输入考试名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              考试日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                开始时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                结束时间 <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                step="1"
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              考试封面
            </label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm"
              />
              {coverPreview && (
                <img src={coverPreview} alt="封面预览" className="mt-3 max-w-xs rounded-lg" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                提前登录时间（分钟）
              </label>
              <input
                type="number"
                value={earlyLoginMinutes}
                onChange={(e) => setEarlyLoginMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                迟到禁止登录时间（分钟）
              </label>
              <input
                type="number"
                value={lateForbiddenMinutes}
                onChange={(e) => setLateForbiddenMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreateExam}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Students Modal */}
      <Modal 
        isOpen={addStudentsModalOpen} 
        onClose={() => {
          setAddStudentsModalOpen(false);
          setSelectedExam(null);
        }} 
        title={selectedExam ? `添加考生 - ${selectedExam.exam_name}` : '添加考生'}
        size="lg"
      >
        <div className="p-6">
          <p className="text-slate-500 mb-4">添加考生功能开发中...</p>
        </div>
      </Modal>
    </TeacherLayout>
  );
}

