"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { examPaperService, ExamPaper } from '@/services/examPaper.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import Modal from '@/components/common/Modal';
import KnowledgeGraphTreeSelect from '@/components/teacher/KnowledgeGraphTreeSelect';

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
  const [compositionMode, setCompositionMode] = useState('manual');
  const [totalScore, setTotalScore] = useState(100);
  const [questionOrder, setQuestionOrder] = useState('fixed');
  const [optionOrder, setOptionOrder] = useState('fixed');
  const [knowledgePoint, setKnowledgePoint] = useState<string | null>(null);
  
  // 从localStorage获取教师ID
  const getTeacherId = (): number => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 1;
      }
    }
    return 1;
  };
  
  const teacherId = getTeacherId();

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
    setCompositionMode('manual');
    setTotalScore(100);
    setQuestionOrder('fixed');
    setOptionOrder('fixed');
    setKnowledgePoint(null);
  };

  const handleCreatePaper = async () => {
    if (!paperName.trim()) {
      alert('请输入试卷名称');
      return;
    }
    if (!knowledgePoint || !knowledgePoint.trim()) {
      alert('请选择关联知识点');
      return;
    }
    if (totalScore <= 0) {
      alert('试卷分值必须大于0');
      return;
    }
    
    try {
      await examPaperService.create(teacherId, {
        paper_name: paperName,
        composition_mode: compositionMode,
        total_score: totalScore,
        question_order: questionOrder,
        option_order: optionOrder,
        knowledge_point: knowledgePoint,
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
    setCompositionMode(paper.composition_mode);
    setTotalScore(paper.total_score);
    setQuestionOrder(paper.question_order);
    setOptionOrder(paper.option_order);
    setKnowledgePoint(paper.knowledge_point);
    setEditModalOpen(true);
  };

  const handleUpdatePaper = async () => {
    if (!editingPaper || !paperName.trim()) {
      alert('请输入试卷名称');
      return;
    }
    if (!knowledgePoint || !knowledgePoint.trim()) {
      alert('请选择关联知识点');
      return;
    }
    
    try {
      await examPaperService.update(editingPaper.id, teacherId, {
        paper_name: paperName,
        composition_mode: compositionMode,
        total_score: totalScore,
        question_order: questionOrder,
        option_order: optionOrder,
        knowledge_point: knowledgePoint,
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
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.teacher.examPaperBank?.title || '试卷卷库'}</h1>
              <p className="text-sm text-slate-600 mt-0.5">{t.teacher.examPaperBank?.subtitle || '管理和维护试卷'}</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setCreateModalOpen(true);
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/20 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {t.teacher.examPaperBank?.create || '新建试卷'}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t.teacher.examPaperBank?.searchPlaceholder || '搜索试卷名称...'}
                  className="w-80 pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span>共 {papers.length} 份试卷</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-3 border-slate-300 border-t-slate-900 mb-4"></div>
                <p className="text-sm text-slate-600">{t.common.loading}</p>
              </div>
            </div>
          ) : papers.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p className="text-slate-600 font-medium mb-1">{t.teacher.examPaperBank?.noPapers || '暂无试卷'}</p>
                <p className="text-sm text-slate-500">点击"新建试卷"开始创建</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper) => (
                <div
                  key={paper.id}
                  className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Paper Info */}
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200">
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-900 mb-1.5">{paper.paper_name}</h3>
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                            <span className="font-medium">{paper.total_score}</span>
                            <span className="text-slate-500">分</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="font-medium">{paper.question_count || 0}</span>
                            <span className="text-slate-500">题</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                            </svg>
                            <span className="text-slate-600">
                              {paper.composition_mode === 'manual' ? '手工组卷' : '智能组卷'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleViewPaper(paper)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                        title="查看"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                        查看
                      </button>
                      <button
                        onClick={() => handleEditPaper(paper)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                        title="编辑"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        编辑
                      </button>
                      <button
                        onClick={() => handleManageQuestions(paper)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                        title="维护试题"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                        </svg>
                        维护试题
                      </button>
                      <button
                        onClick={() => handleDeletePaper(paper)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                        title="删除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        删除
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
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              试卷名称 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              placeholder="请输入试卷名称"
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              关联知识点 <span className="text-red-600">*</span>
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={teacherId}
              value={knowledgePoint || undefined}
              onChange={(nodeName) => setKnowledgePoint(nodeName)}
              placeholder="请选择知识点"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                组卷模式 <span className="text-red-600">*</span>
              </label>
              <select
                value={compositionMode}
                onChange={(e) => setCompositionMode(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="manual">手工组卷</option>
                <option value="auto">智能组卷</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                试卷分值 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={totalScore}
                onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                试题顺序
              </label>
              <select
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选项顺序
              </label>
              <select
                value={optionOrder}
                onChange={(e) => setOptionOrder(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleCreatePaper}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              试卷名称 <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              placeholder="请输入试卷名称"
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              关联知识点 <span className="text-red-600">*</span>
            </label>
            <KnowledgeGraphTreeSelect
              teacherId={teacherId}
              value={knowledgePoint || undefined}
              onChange={(nodeName) => setKnowledgePoint(nodeName)}
              placeholder="请选择知识点"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                组卷模式 <span className="text-red-600">*</span>
              </label>
              <select
                value={compositionMode}
                onChange={(e) => setCompositionMode(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="manual">手工组卷</option>
                <option value="auto">智能组卷</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                试卷分值 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={totalScore}
                onChange={(e) => setTotalScore(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                试题顺序
              </label>
              <select
                value={questionOrder}
                onChange={(e) => setQuestionOrder(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选项顺序
              </label>
              <select
                value={optionOrder}
                onChange={(e) => setOptionOrder(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
              >
                <option value="fixed">固定</option>
                <option value="random">随机</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingPaper(null);
                resetForm();
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleUpdatePaper}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
                  <span className="text-slate-500">试卷分值：</span>
                  <span className="font-medium ml-2">{viewingPaper.total_score} 分</span>
                </div>
                <div>
                  <span className="text-slate-500">题目数量：</span>
                  <span className="font-medium ml-2">{(viewingPaper as any).questions?.length || 0} 道</span>
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

