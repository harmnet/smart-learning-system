"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { examPaperService, ExamPaperDetail, ExamPaperQuestion, AutoCompositionConfig } from '@/services/examPaper.service';
import { questionService, Question } from '@/services/question.service';
import { useLanguage } from '@/contexts/LanguageContext';
import TeacherLayout from '@/components/teacher/TeacherLayout';

export default function ManageExamQuestionsPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const paperId = parseInt(params.id as string);
  const teacherId = 1; // TODO: Get from auth context

  const [paperDetail, setPaperDetail] = useState<ExamPaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 手工组卷相关状态
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [questionScore, setQuestionScore] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // 智能组卷相关状态
  const [autoConfigs, setAutoConfigs] = useState<AutoCompositionConfig[]>([]);

  useEffect(() => {
    if (paperId) {
      loadPaperDetail();
    }
  }, [paperId]);

  useEffect(() => {
    if (paperDetail && paperDetail.composition_mode === 'manual') {
      loadAvailableQuestions();
    }
  }, [paperDetail, questionSearchTerm, questionTypeFilter]);

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
      const questions = await questionService.getAll(
        teacherId,
        0,
        1000,
        questionTypeFilter || undefined,
        undefined,
        questionSearchTerm || undefined
      );
      setAvailableQuestions(questions);
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
    
    try {
      const result = await examPaperService.addQuestion(paperId, teacherId, {
        question_id: selectedQuestionId,
        score: questionScore,
      });
      
      await loadPaperDetail();
      
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
          </div>
        </div>

        {/* 试卷信息栏 */}
        <div className="px-8 py-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-4 gap-6 text-sm">
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

        {/* 试题一览 */}
        {paperDetail.questions && paperDetail.questions.length > 0 && (
          <div className="px-8 py-4 bg-white border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-3">试题一览</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(typeStats).map(([type, indices]) => (
                <div key={type} className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-600">{questionTypeNames[type] || type}：</span>
                  <span className="text-sm font-bold text-blue-600 ml-1">
                    {indices.join('、')}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">（{indices.length}道）</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {paperDetail.composition_mode === 'manual' ? (
              /* 手工组卷 */
              <div className="grid grid-cols-2 gap-6">
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
                  </div>

                  {/* 题目列表 */}
                  {loadingQuestions ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                      {availableQuestions.map((q) => {
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
                            <div className="flex items-start justify-between">
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
                        );
                      })}
                    </div>
                  )}

                  {/* 添加按钮 */}
                  {selectedQuestionId && (
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <input
                        type="number"
                        step="0.01"
                        value={questionScore}
                        onChange={(e) => setQuestionScore(parseFloat(e.target.value) || 0)}
                        placeholder="分值"
                        className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={handleAddQuestionToPaper}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        添加到试卷
                      </button>
                    </div>
                  )}
                </div>

                {/* 右侧：试卷中的题目列表 */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    {t.teacher.examPaperBank?.manualComposition?.questionList || '题目列表'}
                  </h3>
                  
                  {paperDetail.questions && paperDetail.questions.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {paperDetail.questions.map((q, index) => (
                        <div key={q.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-blue-600">第 {index + 1} 题</span>
                              <span className="text-xs text-slate-500 px-2 py-1 bg-white rounded">
                                {questionTypeNames[q.question_type] || q.question_type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-900 line-clamp-2">{q.title}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={q.score}
                                onChange={(e) => {
                                  const newScore = parseFloat(e.target.value) || 0;
                                  handleUpdateQuestionScore(q.id, newScore);
                                }}
                                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                              />
                              <span className="text-sm text-slate-600">分</span>
                            </div>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              移除
                            </button>
                          </div>
                        </div>
                      ))}
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
                        <div key={q.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex-1">
                            <span className="text-sm font-medium text-blue-600">第 {index + 1} 题</span>
                            <span className="text-xs text-slate-500 ml-2">{questionTypeNames[q.question_type] || q.question_type}</span>
                            <p className="text-sm text-slate-900 mt-1 line-clamp-2">{q.title}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-sm text-slate-600">{q.score} 分</span>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
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
    </TeacherLayout>
  );
}

