"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examPaperService, ExamPaperDetail, ExamPaperQuestion, AutoCompositionConfig, QuestionTypeConfig, AIAssembleConfig } from '@/services/examPaper.service';
import { questionService, Question } from '@/services/question.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import KnowledgeGraphTreeSelect from '@/components/teacher/KnowledgeGraphTreeSelect';
import Modal from '@/components/common/Modal';

export default function ManageExamQuestionsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const paperId = parseInt(params.id as string);
  
  // 从localStorage获取教师ID
  const [teacherId, setTeacherId] = useState<number | null>(null);
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setTeacherId(user.id);
    }
  }, []);

  const [paperDetail, setPaperDetail] = useState<ExamPaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 手工组卷相关状态
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');
  const [knowledgePointFilter, setKnowledgePointFilter] = useState<string | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [questionScore, setQuestionScore] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // AI组卷相关状态
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiQuestionConfigs, setAiQuestionConfigs] = useState<QuestionTypeConfig[]>([]);
  const [aiPreviewQuestions, setAiPreviewQuestions] = useState<ExamPaperQuestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  
  // 右侧题目列表 - 选中的题目用于显示详情
  const [selectedPaperQuestionIndex, setSelectedPaperQuestionIndex] = useState<number | null>(null);
  
  // 智能组卷相关状态
  const [autoConfigs, setAutoConfigs] = useState<AutoCompositionConfig[]>([]);
  
  // 题目详情弹窗相关状态
  const [questionDetailModalOpen, setQuestionDetailModalOpen] = useState(false);
  const [selectedQuestionDetail, setSelectedQuestionDetail] = useState<Question | null>(null);
  const [loadingQuestionDetail, setLoadingQuestionDetail] = useState(false);

  // 当teacherId加载完成后再加载试卷详情
  useEffect(() => {
    if (paperId && teacherId !== null) {
      loadPaperDetail();
    }
  }, [paperId, teacherId]);

  useEffect(() => {
    if (paperDetail && paperDetail.composition_mode === 'manual' && teacherId !== null) {
      loadAvailableQuestions();
    }
  }, [paperDetail, questionSearchTerm, questionTypeFilter, knowledgePointFilter, teacherId]);
  
  // 当试卷详情加载后,自动设置知识点筛选为试卷的知识点
  useEffect(() => {
    if (paperDetail && !knowledgePointFilter) {
      setKnowledgePointFilter(paperDetail.knowledge_point);
    }
  }, [paperDetail]);

  const loadPaperDetail = async () => {
    try {
      setLoading(true);
      const detail = await examPaperService.getById(paperId, teacherId);
      setPaperDetail(detail);
      
      if (detail.composition_mode === 'auto') {
        setAutoConfigs([]);
      }
    } catch (error: any) {
      console.error('Failed to load paper detail:', error);
      alert('加载试卷详情失败: ' + (error.response?.data?.detail || error.message));
      router.push('/teacher/exams');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const result = await questionService.getAll(
        teacherId,
        0,
        1000,
        questionTypeFilter || undefined,
        knowledgePointFilter || undefined,
        questionSearchTerm || undefined
      );
      
      // 过滤掉已添加到试卷中的题目
      const addedQuestionIds = new Set(paperDetail?.questions?.map(q => q.id) || []);
      const filteredQuestions = (result.questions || []).filter(
        q => !addedQuestionIds.has(q.id)
      );
      
      setAvailableQuestions(filteredQuestions);
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      alert('加载题目失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestionToPaper = async () => {
    if (!paperDetail || !selectedQuestionId || questionScore <= 0) {
      alert('请选择题目并输入分值');
      return;
    }
    
    // 检查添加后是否会超过试卷总分值
    const currentTotal = calculateCurrentTotalScore();
    const newTotal = currentTotal + questionScore;
    if (newTotal > paperDetail.total_score) {
      alert(`添加失败！当前总分值 ${currentTotal.toFixed(2)} 分，添加 ${questionScore} 分后将超过试卷总分值 ${paperDetail.total_score} 分！`);
      return;
    }
    
    try {
      const result = await examPaperService.addQuestion(paperId, teacherId, {
        question_id: selectedQuestionId,
        score: questionScore,
      });
      
      await loadPaperDetail();
      
      // 自动选中最新添加的题目
      if (paperDetail.questions) {
        setSelectedPaperQuestionIndex(paperDetail.questions.length);
      }
      
      if (!result.score_match) {
        alert(`题目添加成功，但总分值 (${result.total_score}) 与试卷总分值 (${result.paper_total_score}) 不一致！`);
      } else {
        alert('题目添加成功');
      }
      
      setSelectedQuestionId(null);
      setQuestionScore(0);
    } catch (error: any) {
      console.error('Failed to add question:', error);
      alert('添加题目失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateQuestionScore = async (epqId: number, newScore: number) => {
    if (!paperDetail || newScore <= 0) {
      alert('分值必须大于0');
      return;
    }
    
    // 找到当前题目的原始分值
    const currentQuestion = paperDetail.questions?.find(q => q.id === epqId);
    if (!currentQuestion) {
      alert('未找到该题目');
      return;
    }
    
    // 计算如果更新后的新总分值
    const currentTotal = calculateCurrentTotalScore();
    const scoreDifference = newScore - currentQuestion.score;
    const newTotal = currentTotal + scoreDifference;
    
    // 检查是否超过试卷总分值
    if (newTotal > paperDetail.total_score) {
      alert(`更新失败！当前总分值 ${currentTotal.toFixed(2)} 分，修改后总分值将为 ${newTotal.toFixed(2)} 分，超过试卷总分值 ${paperDetail.total_score} 分！`);
      return;
    }
    
    try {
      const result = await examPaperService.updateQuestion(paperId, epqId, teacherId, {
        score: newScore,
      });
      
      await loadPaperDetail();
      
      if (!result.score_match) {
        alert(`分值更新成功，但总分值 (${result.total_score}) 与试卷总分值 (${result.paper_total_score}) 不一致！`);
      } else {
        alert('分值更新成功');
      }
    } catch (error: any) {
      console.error('Failed to update question score:', error);
      alert('更新分值失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRemoveQuestion = async (epqId: number) => {
    if (!paperDetail || !confirm('确定要从试卷中移除这道题目吗？')) return;
    
    try {
      await examPaperService.removeQuestion(paperId, epqId, teacherId);
      await loadPaperDetail();
      alert('题目移除成功');
    } catch (error: any) {
      console.error('Failed to remove question:', error);
      alert('移除题目失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // 加载题目详情
  const handleViewQuestionDetail = async (questionId: number) => {
    try {
      setLoadingQuestionDetail(true);
      setQuestionDetailModalOpen(true);
      const detail = await questionService.getOne(questionId, teacherId);
      setSelectedQuestionDetail(detail);
    } catch (error: any) {
      console.error('Failed to load question detail:', error);
      alert('加载题目详情失败: ' + (error.response?.data?.detail || error.message));
      setQuestionDetailModalOpen(false);
    } finally {
      setLoadingQuestionDetail(false);
    }
  };

  // 一键清空所有试题
  const handleClearAllQuestions = async () => {
    if (!paperDetail) return;
    if (!confirm('确定要清空试卷中的所有题目吗？此操作不可恢复！')) return;
    
    try {
      await examPaperService.clearAllQuestions(paperId, teacherId);
      await loadPaperDetail();
      setSelectedPaperQuestionIndex(null);
      alert('试卷题目已全部清空');
    } catch (error: any) {
      console.error('Failed to clear questions:', error);
      alert('清空试题失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  // AI组卷预览
  const handleAIAssemble = async () => {
    if (!paperDetail || aiQuestionConfigs.length === 0) {
      alert('请至少添加一个题型配置');
      return;
    }
    
    const totalScore = aiQuestionConfigs.reduce((sum, config) => 
      sum + (config.count * config.score_per_question), 0
    );
    
    if (totalScore > paperDetail.total_score) {
      alert(`配置的总分值 (${totalScore}) 超过试卷总分值 (${paperDetail.total_score})！`);
      return;
    }
    
    try {
      setAiLoading(true);
      const result = await examPaperService.aiAssemble(paperId, teacherId, {
        question_configs: aiQuestionConfigs
      });
      setAiPreviewQuestions(result.questions);
      alert(`AI组卷成功！共选择了 ${result.questions.length} 道题目，总分值 ${result.total_score} 分`);
    } catch (error: any) {
      console.error('Failed to AI assemble:', error);
      alert('AI组卷失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAiLoading(false);
    }
  };

  // 确认AI组卷结果
  const handleConfirmAIAssemble = async () => {
    if (!paperDetail || aiPreviewQuestions.length === 0) {
      alert('没有可添加的题目');
      return;
    }
    
    try {
      setAiLoading(true);
      const questions = aiPreviewQuestions.map(q => ({
        question_id: q.id,
        score: q.score
      }));
      
      await examPaperService.confirmAIAssemble(paperId, teacherId, { questions });
      await loadPaperDetail();
      setAiModalOpen(false);
      setAiQuestionConfigs([]);
      setAiPreviewQuestions([]);
      alert('AI组卷完成！题目已添加到试卷');
    } catch (error: any) {
      console.error('Failed to confirm AI assemble:', error);
      alert('确认AI组卷失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddAutoConfig = () => {
    setAutoConfigs([...autoConfigs, {
      question_type: 'single_choice',
      count: 1,
      score_per_question: 5,
    }]);
  };

  const handleRemoveAutoConfig = (index: number) => {
    setAutoConfigs(autoConfigs.filter((_, i) => i !== index));
  };

  const handleUpdateAutoConfig = (index: number, field: string, value: any) => {
    const newConfigs = [...autoConfigs];
    (newConfigs[index] as any)[field] = value;
    setAutoConfigs(newConfigs);
  };

  const handleAutoCompose = async () => {
    if (!paperDetail || autoConfigs.length === 0) {
      alert('请至少添加一个组卷配置');
      return;
    }
    
    const totalScore = autoConfigs.reduce((sum, config) => 
      sum + (config.count * config.score_per_question), 0
    );
    
    if (Math.abs(totalScore - paperDetail.total_score) > 0.01) {
      alert(`配置的总分值 (${totalScore}) 与试卷总分值 (${paperDetail.total_score}) 不一致！`);
      return;
    }
    
    try {
      await examPaperService.autoCompose(paperId, teacherId, autoConfigs);
      await loadPaperDetail();
      alert('智能组卷成功');
    } catch (error: any) {
      console.error('Failed to auto compose:', error);
      alert('智能组卷失败: ' + (error.response?.data?.detail || error.message));
    }
  };

  const calculateCurrentTotalScore = () => {
    if (!paperDetail || !paperDetail.questions) return 0;
    return paperDetail.questions.reduce((sum, q) => sum + q.score, 0);
  };
  
  // 检查是否可以添加题目(基于分值限制)
  const canAddQuestion = (score: number) => {
    if (!paperDetail) return false;
    const currentTotal = calculateCurrentTotalScore();
    return currentTotal + score <= paperDetail.total_score;
  };
  
  // 判断分值是否已满
  const isScoreFull = () => {
    if (!paperDetail) return false;
    return Math.abs(calculateCurrentTotalScore() - paperDetail.total_score) < 0.01;
  };

  const calculateAutoConfigTotalScore = () => {
    return autoConfigs.reduce((sum, config) => 
      sum + (config.count * config.score_per_question), 0
    );
  };

  // 统计题目类型和序号
  const getQuestionTypeStats = () => {
    if (!paperDetail || !paperDetail.questions) return {};
    const stats: { [key: string]: number[] } = {};
    paperDetail.questions.forEach((q, index) => {
      const type = q.question_type;
      if (!stats[type]) {
        stats[type] = [];
      }
      stats[type].push(index + 1); // 题目序号（从1开始）
    });
    return stats;
  };

  const questionTypeNames: { [key: string]: string } = {
    single_choice: '单选题',
    multiple_choice: '多选题',
    true_false: '判断题',
    fill_blank: '填空题',
    qa: '问答题',
    short_answer: '简答题',
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!paperDetail) {
    return (
      <TeacherLayout>
        <div className="h-full flex items-center justify-center">
          <p className="text-slate-500">试卷不存在</p>
        </div>
      </TeacherLayout>
    );
  }

  const typeStats = getQuestionTypeStats();

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.push('/teacher/exams')}
                className="mb-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                返回试卷列表
              </button>
              <h1 className="text-2xl font-black text-slate-900 mb-1">{paperDetail.paper_name}</h1>
              <p className="text-sm text-slate-500">维护试题</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.open(`/teacher/exams/${paperId}/preview`, '_blank')}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                预览试卷
              </button>
              <button
                onClick={() => setAiModalOpen(true)}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                AI一键组卷
              </button>
            </div>
          </div>
        </div>

        {/* 试卷信息栏 */}
        <div className="px-8 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-5 gap-6 text-sm">
            <div>
              <span className="text-slate-600">关联知识点：</span>
              <span className="font-medium ml-2">{paperDetail.knowledge_point}</span>
            </div>
            <div>
              <span className="text-slate-600">组卷模式：</span>
              <span className="font-medium ml-2">
                {paperDetail.composition_mode === 'manual' ? '手工组卷' : '智能组卷'}
              </span>
            </div>
            <div>
              <span className="text-slate-600">试卷总分值：</span>
              <span className="font-medium ml-2">{paperDetail.total_score} 分</span>
            </div>
            <div>
              <span className="text-slate-600">当前总分值：</span>
              <span className={`font-medium ml-2 ${
                Math.abs(calculateCurrentTotalScore() - paperDetail.total_score) < 0.01
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                {calculateCurrentTotalScore().toFixed(2)} 分
              </span>
            </div>
            <div>
              <span className="text-slate-600">题目总数：</span>
              <span className="font-medium ml-2">{paperDetail.questions?.length || 0} 道</span>
            </div>
          </div>
        </div>


        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="h-full">
            {paperDetail.composition_mode === 'manual' ? (
              /* 手工组卷 */
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* 左侧：添加题目 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {t.teacher.examPaperBank?.manualComposition?.addQuestion || '添加题目'}
                  </h3>
                  
                  {/* 搜索和筛选 */}
                  <div className="space-y-3 mb-4">
                    <input
                      type="text"
                      value={questionSearchTerm}
                      onChange={(e) => setQuestionSearchTerm(e.target.value)}
                      placeholder="搜索题目..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <select
                      value={questionTypeFilter}
                      onChange={(e) => setQuestionTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="">全部题型</option>
                      <option value="single_choice">单选题</option>
                      <option value="multiple_choice">多选题</option>
                      <option value="true_false">判断题</option>
                      <option value="fill_blank">填空题</option>
                      <option value="qa">问答题</option>
                      <option value="short_answer">简答题</option>
                    </select>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5">知识点筛选</label>
                      <KnowledgeGraphTreeSelect
                        teacherId={teacherId}
                        value={knowledgePointFilter || undefined}
                        onChange={(nodeName) => setKnowledgePointFilter(nodeName)}
                        placeholder="筛选知识点(默认为试卷知识点)"
                      />
                    </div>
                  </div>

                  {/* 题目列表 */}
                  {loadingQuestions ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {availableQuestions.map((q, index) => {
                        const isInPaper = paperDetail.questions?.some(pq => pq.question_id === q.id);
                        return (
                          <div
                            key={q.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedQuestionId === q.id
                                ? 'border-blue-500 bg-blue-50'
                                : isInPaper
                                ? 'border-slate-200 bg-slate-50 opacity-60'
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                            onClick={() => {
                              if (!isInPaper) {
                                setSelectedQuestionId(q.id);
                                setQuestionScore(5);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {/* 序号 */}
                              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-700 font-bold text-sm rounded">
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-slate-900 line-clamp-2">{q.title}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                    <span>{questionTypeNames[q.question_type] || q.question_type}</span>
                                    {q.knowledge_point && <span>• {q.knowledge_point}</span>}
                                  </div>
                                </div>
                                {isInPaper && (
                                  <span className="text-xs text-green-600 font-medium ml-2">已添加</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 添加按钮 */}
                  {selectedQuestionId && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className={`border rounded-lg p-4 ${
                        isScoreFull() 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">
                              题目分值:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={questionScore}
                              onChange={(e) => setQuestionScore(parseFloat(e.target.value) || 0)}
                              placeholder="请输入分值"
                              disabled={isScoreFull()}
                              className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                            />
                            <span className="text-sm text-slate-600">分</span>
                          </div>
                          <button
                            onClick={handleAddQuestionToPaper}
                            disabled={!questionScore || questionScore <= 0 || isScoreFull() || !canAddQuestion(questionScore)}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                          >
                            添加到试卷
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {isScoreFull() ? (
                            <span className="text-yellow-700">
                              ⚠️ 试卷分值已满 ({calculateCurrentTotalScore().toFixed(2)} / {paperDetail?.total_score} 分)，无法继续添加题目
                            </span>
                          ) : !canAddQuestion(questionScore) && questionScore > 0 ? (
                            <span className="text-orange-600">
                              ⚠️ 添加 {questionScore} 分后将超过试卷总分值 {paperDetail?.total_score} 分，请调整分值
                            </span>
                          ) : (
                            <span>💡 提示: 请先设置题目分值，分值必须大于0</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧：试卷中的题目列表 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {t.teacher.examPaperBank?.manualComposition?.questionList || '题目列表'}
                    </h3>
                    {paperDetail.questions && paperDetail.questions.length > 0 && (
                      <button
                        onClick={handleClearAllQuestions}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        一键清空试题
                      </button>
                    )}
                  </div>
                  
                  {paperDetail.questions && paperDetail.questions.length > 0 ? (
                    <div className="space-y-4">
                      {/* 题目序号网格 */}
                      <div>
                        <p className="text-sm text-slate-600 mb-3">点击序号查看题目详情</p>
                        <div className="grid grid-cols-10 gap-2">
                          {paperDetail.questions.map((q, index) => (
                            <button
                              key={q.id}
                              onClick={() => setSelectedPaperQuestionIndex(index)}
                              className={`
                                h-10 rounded-lg font-medium text-sm transition-all duration-200
                                ${selectedPaperQuestionIndex === index
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:shadow-md'
                                }
                              `}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 选中题目的详细信息 */}
                      {selectedPaperQuestionIndex !== null && paperDetail.questions[selectedPaperQuestionIndex] && (
                        <div className="border-t border-slate-200 pt-4">
                          {(() => {
                            const q = paperDetail.questions[selectedPaperQuestionIndex];
                            return (
                              <div className="space-y-4">
                                {/* 题目头部 */}
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-blue-600">
                                      第 {selectedPaperQuestionIndex + 1} 题
                                    </span>
                                    <span className="px-4 py-2 text-base font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg shadow-md">
                                      {questionTypeNames[q.question_type] || q.question_type}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                      <span className="text-sm font-medium text-slate-700">分值:</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={q.score}
                                        onChange={(e) => {
                                          const newScore = parseFloat(e.target.value) || 0;
                                          handleUpdateQuestionScore(q.id, newScore);
                                        }}
                                        className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-slate-600">分</span>
                                    </div>
                                    <button
                                      onClick={() => {
                                        handleRemoveQuestion(q.id);
                                        setSelectedPaperQuestionIndex(null);
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                      移除此题
                                    </button>
                                  </div>
                                </div>

                                {/* 题目内容 */}
                                <div className="bg-slate-50 rounded-lg p-4">
                                  <h4 className="text-sm font-bold text-slate-700 mb-2">题目内容</h4>
                                  <p className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                                    {q.title}
                                  </p>
                                </div>

                                {/* 题目选项 (如果有) */}
                                {q.options && q.options.length > 0 && (
                                  <div className="bg-slate-50 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-slate-700 mb-3">题目选项</h4>
                                    <div className="space-y-2">
                                      {q.options.map((option, idx) => {
                                        const optionLabel = String.fromCharCode(65 + idx);
                                        const isCorrect = option.is_correct;
                                        return (
                                          <div 
                                            key={idx} 
                                            className={`flex items-start gap-3 p-3 rounded transition-colors ${
                                              isCorrect 
                                                ? 'bg-green-50 border border-green-200' 
                                                : 'hover:bg-white'
                                            }`}
                                          >
                                            <span className={`text-base font-bold min-w-[28px] ${
                                              isCorrect ? 'text-green-700' : 'text-blue-600'
                                            }`}>
                                              {optionLabel}.
                                            </span>
                                            <span className={`text-base flex-1 ${
                                              isCorrect ? 'text-green-900 font-medium' : 'text-slate-900'
                                            }`}>
                                              {option.option_text}
                                            </span>
                                            {isCorrect && (
                                              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                                                ✓ 正确答案
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* 答案解析 */}
                                {q.explanation && (
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-amber-800 mb-2">答案解析</h4>
                                    <p className="text-base text-amber-900 leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* 默认提示 */}
                      {selectedPaperQuestionIndex === null && (
                        <div className="text-center py-8 text-slate-500 border-t border-slate-200">
                          <p className="text-sm">👆 请点击上方序号查看题目详情</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <p>暂无题目，请从左侧添加题目</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* 智能组卷 */
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {t.teacher.examPaperBank?.autoComposition?.title || '智能组卷'}
                </h3>
                
                {/* 组卷配置 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-slate-900">{t.teacher.examPaperBank?.autoComposition?.config || '组卷配置'}</h4>
                    <button
                      onClick={handleAddAutoConfig}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {t.teacher.examPaperBank?.autoComposition?.addConfig || '添加配置'}
                    </button>
                  </div>

                  {autoConfigs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                      <p>请添加组卷配置</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {autoConfigs.map((config, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <select
                            value={config.question_type}
                            onChange={(e) => handleUpdateAutoConfig(index, 'question_type', e.target.value)}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm"
                          >
                            <option value="single_choice">单选题</option>
                            <option value="multiple_choice">多选题</option>
                            <option value="true_false">判断题</option>
                            <option value="fill_blank">填空题</option>
                            <option value="qa">问答题</option>
                            <option value="short_answer">简答题</option>
                          </select>
                          <input
                            type="number"
                            value={config.count}
                            onChange={(e) => handleUpdateAutoConfig(index, 'count', parseInt(e.target.value) || 0)}
                            placeholder="数量"
                            className="w-32 px-4 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={config.score_per_question}
                            onChange={(e) => handleUpdateAutoConfig(index, 'score_per_question', parseFloat(e.target.value) || 0)}
                            placeholder="每题分值"
                            className="w-40 px-4 py-2 border border-slate-300 rounded-lg text-sm"
                          />
                          <span className="text-sm font-medium text-slate-700 min-w-[80px]">
                            = {(config.count * config.score_per_question).toFixed(2)} 分
                          </span>
                          <button
                            onClick={() => handleRemoveAutoConfig(index)}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                      
                      {/* 总分值显示 */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">
                            {t.teacher.examPaperBank?.autoComposition?.totalScore || '小计'}：
                          </span>
                          <span className={`text-lg font-bold ${
                            Math.abs(calculateAutoConfigTotalScore() - paperDetail.total_score) < 0.01
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {calculateAutoConfigTotalScore().toFixed(2)} / {paperDetail.total_score} 分
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 执行组卷按钮 */}
                {autoConfigs.length > 0 && (
                  <div className="flex justify-end mb-6">
                    <button
                      onClick={handleAutoCompose}
                      className="px-8 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      执行智能组卷
                    </button>
                  </div>
                )}

                {/* 试卷中的题目列表 */}
                {paperDetail.questions && paperDetail.questions.length > 0 && (
                  <div className="border-t border-slate-200 pt-6">
                    <h4 className="font-medium text-slate-900 mb-4">题目列表</h4>
                    <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {paperDetail.questions.map((q, index) => (
                        <div 
                          key={q.id} 
                          className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => handleViewQuestionDetail(q.id)}
                        >
                          <div className="flex-1">
                            <span className="text-sm font-medium text-blue-600">第 {index + 1} 题</span>
                            <span className="text-xs text-slate-500 ml-2">{questionTypeNames[q.question_type] || q.question_type}</span>
                            <p className="text-sm text-slate-900 mt-1 line-clamp-2">{q.title}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-slate-600">{q.score} 分</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveQuestion(q.id);
                              }}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI组卷模态框 */}
      <Modal
        isOpen={aiModalOpen}
        onClose={() => !aiLoading && setAiModalOpen(false)}
        title="AI一键组卷"
        size="lg"
      >
        <div className="p-6">
          {/* 试卷信息 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">知识点:</span>
                <span className="font-medium text-slate-900">{paperDetail?.knowledge_point}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">试卷总分:</span>
                <span className="font-medium text-slate-900">{paperDetail?.total_score} 分</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">已配置总分:</span>
                <span className={`font-medium ${
                  aiQuestionConfigs.reduce((sum, cfg) => sum + (cfg.count * cfg.score_per_question), 0) > (paperDetail?.total_score || 0)
                    ? 'text-red-600' : 'text-green-600'
                }`}>
                  {aiQuestionConfigs.reduce((sum, cfg) => sum + (cfg.count * cfg.score_per_question), 0).toFixed(2)} 分
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">剩余可用分数:</span>
                <span className="font-medium text-blue-600">
                  {((paperDetail?.total_score || 0) - aiQuestionConfigs.reduce((sum, cfg) => sum + (cfg.count * cfg.score_per_question), 0)).toFixed(2)} 分
                </span>
              </div>
            </div>
          </div>

          {/* 题型配置 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-900">题型配置</h4>
              <button
                onClick={() => setAiQuestionConfigs([...aiQuestionConfigs, {
                  question_type: 'single_choice',
                  count: 5,
                  score_per_question: 2
                }])}
                disabled={aiLoading}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg disabled:opacity-50"
              >
                + 添加题型
              </button>
            </div>

            <div className="space-y-3">
              {aiQuestionConfigs.map((config, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <select
                    value={config.question_type}
                    onChange={(e) => {
                      const newConfigs = [...aiQuestionConfigs];
                      newConfigs[index].question_type = e.target.value;
                      setAiQuestionConfigs(newConfigs);
                    }}
                    disabled={aiLoading}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="single_choice">单选题</option>
                    <option value="multiple_choice">多选题</option>
                    <option value="true_false">判断题</option>
                    <option value="fill_blank">填空题</option>
                    <option value="qa">问答题</option>
                    <option value="short_answer">简答题</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">数量:</span>
                    <input
                      type="number"
                      min="1"
                      value={config.count}
                      onChange={(e) => {
                        const newConfigs = [...aiQuestionConfigs];
                        newConfigs[index].count = parseInt(e.target.value) || 1;
                        setAiQuestionConfigs(newConfigs);
                      }}
                      disabled={aiLoading}
                      className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">每题:</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={config.score_per_question}
                      onChange={(e) => {
                        const newConfigs = [...aiQuestionConfigs];
                        newConfigs[index].score_per_question = parseFloat(e.target.value) || 1;
                        setAiQuestionConfigs(newConfigs);
                      }}
                      disabled={aiLoading}
                      className="w-16 px-2 py-1.5 text-sm border border-slate-300 rounded text-center"
                    />
                    <span className="text-xs text-slate-600">分</span>
                  </div>
                  <button
                    onClick={() => setAiQuestionConfigs(aiQuestionConfigs.filter((_, i) => i !== index))}
                    disabled={aiLoading}
                    className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              ))}
              {aiQuestionConfigs.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-4">
                  请点击"添加题型"按钮添加配置
                </p>
              )}
            </div>
          </div>

          {/* 预览结果 */}
          {aiPreviewQuestions.length > 0 && (
            <div className="mb-6 border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-3">预览结果 ({aiPreviewQuestions.length} 道题目)</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {aiPreviewQuestions.map((q, index) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-slate-900">第 {index + 1} 题 ({q.question_type})</span>
                      <span className="text-blue-600">{q.score} 分</span>
                    </div>
                    <p className="text-slate-700 mt-1 line-clamp-2">{q.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              onClick={() => {
                setAiModalOpen(false);
                setAiQuestionConfigs([]);
                setAiPreviewQuestions([]);
              }}
              disabled={aiLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 disabled:opacity-50"
            >
              取消
            </button>
            {aiPreviewQuestions.length === 0 ? (
              <button
                onClick={handleAIAssemble}
                disabled={aiLoading || aiQuestionConfigs.length === 0}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                AI组卷
              </button>
            ) : (
              <button
                onClick={handleConfirmAIAssemble}
                disabled={aiLoading}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {aiLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                确认添加到试卷
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* 题目详情模态框 */}
      <Modal
        isOpen={questionDetailModalOpen}
        onClose={() => {
          setQuestionDetailModalOpen(false);
          setSelectedQuestionDetail(null);
        }}
        title="题目详情"
        size="lg"
      >
        <div className="p-6">
          {loadingQuestionDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-slate-600">加载中...</span>
            </div>
          ) : selectedQuestionDetail ? (
            <div className="space-y-4">
              {/* 题目类型和分值 */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
                  {questionTypeNames[selectedQuestionDetail.question_type] || selectedQuestionDetail.question_type}
                </span>
                <span className="text-sm text-slate-600">
                  知识点: <span className="font-medium text-slate-900">{selectedQuestionDetail.knowledge_point || '未分类'}</span>
                </span>
              </div>

              {/* 题目内容 */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-2">题目</h4>
                <p className="text-base text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {selectedQuestionDetail.title}
                </p>
              </div>

              {/* 选项（单选题、多选题、判断题） */}
              {['single_choice', 'multiple_choice', 'true_false'].includes(selectedQuestionDetail.question_type) && 
                selectedQuestionDetail.options && selectedQuestionDetail.options.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">选项</h4>
                  <div className="space-y-2">
                    {selectedQuestionDetail.options.map((option, index) => {
                      const isCorrect = option.is_correct;
                      return (
                        <div 
                          key={index}
                          className={`flex items-start p-3 rounded-lg border ${
                            isCorrect 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium mr-3 flex-shrink-0 ${
                            isCorrect 
                              ? 'bg-green-600 text-white' 
                              : 'bg-slate-300 text-slate-700'
                          }`}>
                            {option.option_label}
                          </span>
                          <span className="text-slate-900 flex-1">
                            {option.option_text}
                            {isCorrect && (
                              <span className="ml-2 text-xs font-medium text-green-700">(正确答案)</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 正确答案（填空题、问答题、简答题） */}
              {!['single_choice', 'multiple_choice', 'true_false'].includes(selectedQuestionDetail.question_type) && 
                selectedQuestionDetail.answer && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">正确答案</h4>
                  <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {Array.isArray(selectedQuestionDetail.answer) 
                        ? selectedQuestionDetail.answer.join(', ')
                        : selectedQuestionDetail.answer}
                    </p>
                  </div>
                </div>
              )}

              {/* 解析 */}
              {selectedQuestionDetail.explanation && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">题目解析</h4>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {selectedQuestionDetail.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* 难度等级 */}
              {selectedQuestionDetail.difficulty !== undefined && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-slate-600">难度:</span>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    selectedQuestionDetail.difficulty === 1 
                      ? 'bg-green-100 text-green-700'
                      : selectedQuestionDetail.difficulty === 2
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedQuestionDetail.difficulty === 1 
                      ? '简单' 
                      : selectedQuestionDetail.difficulty === 2
                      ? '中等'
                      : '困难'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              未找到题目详情
            </div>
          )}

          {/* 关闭按钮 */}
          <div className="flex justify-end pt-6 border-t border-slate-200 mt-6">
            <button
              onClick={() => {
                setQuestionDetailModalOpen(false);
                setSelectedQuestionDetail(null);
              }}
              className="px-6 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </Modal>
    </TeacherLayout>
  );
}

