"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { examPaperService, ExamPaper } from '@/services/examPaper.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';

export default function ExamPapersPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<ExamPaper | null>(null);
  const [viewingPaper, setViewingPaper] = useState<ExamPaper | null>(null);
  
  // Form states
  const [paperName, setPaperName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [minSubmitMinutes, setMinSubmitMinutes] = useState(30);
  const [compositionMode, setCompositionMode] = useState('manual');
  const [totalScore, setTotalScore] = useState(100);
  const [questionOrder, setQuestionOrder] = useState('fixed');
  const [optionOrder, setOptionOrder] = useState('fixed');
  
  const teacherId = 1; // TODO: Get from auth context

  useEffect(() => {
    loadPapers();
  }, [searchTerm]);

  const loadPapers = async () => {
    try {
      setLoading(true);
      const data = await examPaperService.getAll(
        teacherId,
        0,
        100,
        searchTerm || undefined
      );
      setPapers(data);
    } catch (error: any) {
      console.error('Failed to load papers:', error);
      const errorMessage = error.response?.data?.detail || error.message || '加载试卷失败';
      alert(`错误: ${errorMessage}\n\n请检查：\n1. 后端服务是否运行在 http://localhost:8000\n2. 网络连接是否正常`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaperName('');
    setDurationMinutes(120);
    setMinSubmitMinutes(30);
    setCompositionMode('manual');
    setTotalScore(100);
    setQuestionOrder('fixed');
    setOptionOrder('fixed');
  };

  const handleCreatePaper = async () => {
    if (!paperName.trim()) {
      alert('请输入试卷名称');
      return;
    }
    if (durationMinutes <= 0) {
      alert('考试时长必须大于0');
      return;
    }
    if (minSubmitMinutes <= 0 || minSubmitMinutes > durationMinutes) {
      alert('最短交卷时长必须大于0且小于等于考试时长');
      return;
    }
    if (totalScore <= 0) {
      alert('试卷分值必须大于0');
      return;
    }
    
    try {
      await examPaperService.create(teacherId, {
        paper_name: paperName,
        duration_minutes: durationMinutes,
        min_submit_minutes: minSubmitMinutes,
        composition_mode: compositionMode,
        total_score: totalScore,
        question_order: questionOrder,
        option_order: optionOrder,
      });
      alert('试卷创建成功');
      setCreateModalOpen(false);
      resetForm();
      loadPapers();
    } catch (error: any) {
      console.error('Failed to create paper:', error);
      alert('创建失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleEditPaper = (paper: ExamPaper) => {
    setEditingPaper(paper);
    setPaperName(paper.paper_name);
    setDurationMinutes(paper.duration_minutes);
    setMinSubmitMinutes(paper.min_submit_minutes);
    setCompositionMode(paper.composition_mode);
    setTotalScore(paper.total_score);
    setQuestionOrder(paper.question_order);
    setOptionOrder(paper.option_order);
    setEditModalOpen(true);
  };

  const handleUpdatePaper = async () => {
    if (!editingPaper || !paperName.trim()) {
      alert('请输入试卷名称');
      return;
    }
    
    try {
      await examPaperService.update(editingPaper.id, teacherId, {
        paper_name: paperName,
        duration_minutes: durationMinutes,
        min_submit_minutes: minSubmitMinutes,
        composition_mode: compositionMode,
        total_score: totalScore,
        question_order: questionOrder,
        option_order: optionOrder,
      });
      alert('试卷更新成功');
      setEditModalOpen(false);
      setEditingPaper(null);
      resetForm();
      loadPapers();
    } catch (error: any) {
      console.error('Failed to update paper:', error);
      alert('更新失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeletePaper = async (paper: ExamPaper) => {
    if (!confirm('确定要删除这个试卷吗？')) return;
    try {
      await examPaperService.delete(paper.id, teacherId);
      alert('试卷删除成功');
      loadPapers();
    } catch (error: any) {
      console.error('Failed to delete paper:', error);
      alert('删除失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleViewPaper = async (paper: ExamPaper) => {
    try {
      const detail = await examPaperService.getById(paper.id, teacherId);
      setViewingPaper(detail as any);
      setViewModalOpen(true);
    } catch (error: any) {
      console.error('Failed to load paper detail:', error);
      alert('加载试卷详情失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleManageQuestions = (paper: ExamPaper) => {
    router.push(`/teacher/exams/${paper.id}/manage`);
  };


  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{t.teacher.examPaperBank?.title || '试卷卷库'}</h1>
              <p className="text-sm text-slate-500">{t.teacher.examPaperBank?.subtitle || '管理和维护试卷'}</p>
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
              {t.teacher.examPaperBank?.create || '新建试卷'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.examPaperBank?.searchPlaceholder || '搜索试卷名称...'}
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {loading ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
            </div>
          ) : papers.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-12 text-center">
              <p className="text-slate-500">{t.teacher.examPaperBank?.noPapers || '暂无试卷'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{paper.paper_name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                        <div>
                          <span className="text-slate-500">考试时长：</span>
                          <span className="font-medium">{paper.duration_minutes} 分钟</span>
                        </div>
                        <div>
                          <span className="text-slate-500">试卷分值：</span>
                          <span className="font-medium">{paper.total_score} 分</span>
                        </div>
                        <div>
                          <span className="text-slate-500">题目数量：</span>
                          <span className="font-medium">{paper.question_count || 0} 道</span>
                        </div>
                        <div>
                          <span className="text-slate-500">组卷模式：</span>
                          <span className="font-medium">
                            {paper.composition_mode === 'manual' ? '手工组卷' : '智能组卷'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleViewPaper(paper)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {t.teacher.examPaperBank?.view || '查看'}
                      </button>
                      <button
                        onClick={() => handleEditPaper(paper)}
                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        {t.teacher.examPaperBank?.edit || '编辑'}
                      </button>
                      <button
                        onClick={() => handleManageQuestions(paper)}
                        className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        {t.teacher.examPaperBank?.manageQuestions || '维护试题'}
                      </button>
                      <button
                        onClick={() => handleDeletePaper(paper)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        {t.teacher.examPaperBank?.delete || '删除'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal 
        isOpen={createModalOpen} 
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }} 
        title={t.teacher.examPaperBank?.createTitle || '新建试卷'}
        size="lg"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              试卷名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              placeholder="请输入试卷名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                考试时长（分钟） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                最短交卷时长（分钟） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={minSubmitMinutes}
                onChange={(e) => setMinSubmitMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              组卷模式 <span className="text-red-500">*</span>
            </label>
            <select
              value={compositionMode}
              onChange={(e) => setCompositionMode(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="manual">手工组卷</option>
              <option value="auto">智能组卷</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              试卷分值 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={totalScore}
              onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                试题顺序
              </label>
              <select
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                选项顺序
              </label>
              <select
                value={optionOrder}
                onChange={(e) => setOptionOrder(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
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
              onClick={handleCreatePaper}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.create}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal - 使用相同的表单 */}
      <Modal 
        isOpen={editModalOpen} 
        onClose={() => {
          setEditModalOpen(false);
          setEditingPaper(null);
          resetForm();
        }} 
        title={t.teacher.examPaperBank?.editTitle || '编辑试卷'}
        size="lg"
      >
        <div className="p-6">
          {/* 与Create Modal相同的表单内容 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              试卷名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              placeholder="请输入试卷名称"
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                考试时长（分钟） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                最短交卷时长（分钟） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={minSubmitMinutes}
                onChange={(e) => setMinSubmitMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              组卷模式 <span className="text-red-500">*</span>
            </label>
            <select
              value={compositionMode}
              onChange={(e) => setCompositionMode(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="manual">手工组卷</option>
              <option value="auto">智能组卷</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              试卷分值 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={totalScore}
              onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                试题顺序
              </label>
              <select
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                选项顺序
              </label>
              <select
                value={optionOrder}
                onChange={(e) => setOptionOrder(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingPaper(null);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdatePaper}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t.common.save}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal - 查看试卷详情 */}
      <Modal 
        isOpen={viewModalOpen} 
        onClose={() => {
          setViewModalOpen(false);
          setViewingPaper(null);
        }} 
        title={viewingPaper?.paper_name || '查看试卷'}
        size="xl"
        maxHeight="90vh"
      >
        <div className="p-6">
          {viewingPaper && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">考试时长：</span>
                  <span className="font-medium ml-2">{viewingPaper.duration_minutes} 分钟</span>
                </div>
                <div>
                  <span className="text-slate-500">试卷分值：</span>
                  <span className="font-medium ml-2">{viewingPaper.total_score} 分</span>
                </div>
              </div>
              
              {(viewingPaper as any).questions && (viewingPaper as any).questions.length > 0 ? (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">题目列表</h4>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(viewingPaper as any).questions.map((q: any, index: number) => (
                      <div key={q.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="font-medium text-blue-600">第 {index + 1} 题（{q.score} 分）</span>
                          <span className="text-sm text-slate-500">{q.question_type}</span>
                        </div>
                        <p className="text-slate-900 mb-2">{q.title}</p>
                        {q.options && q.options.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {q.options.map((opt: any, optIndex: number) => (
                              <div key={opt.id} className={`text-sm ${opt.is_correct ? 'text-green-600 font-medium' : 'text-slate-600'}`}>
                                {String.fromCharCode(65 + optIndex)}. {opt.option_text}
                                {opt.is_correct && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">暂无题目</p>
              )}
            </div>
          )}
        </div>
      </Modal>

    </TeacherLayout>
  );
}

