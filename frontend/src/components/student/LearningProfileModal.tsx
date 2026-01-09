'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, History, RotateCcw } from 'lucide-react';
import { assessmentQuestions, openQuestion } from '@/config/learningAssessmentQuestions';
import learningProfileService, { LearningProfile, Assessment } from '@/services/learningProfile.service';
import toast from 'react-hot-toast';

interface LearningProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'loading' | 'questionnaire' | 'submitting' | 'result' | 'history';

export default function LearningProfileModal({ isOpen, onClose }: LearningProfileModalProps) {
  const [step, setStep] = useState<Step>('loading');
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openResponse, setOpenResponse] = useState('');
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 1; // 每次只显示一道题目

  // 加载档案数据
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setStep('loading');
      const data = await learningProfileService.getProfile();
      setProfile(data);

      if (data.has_profile && data.latest_assessment) {
        // 已有档案，显示最新评价
        setCurrentAssessment(data.latest_assessment);
        setStep('result');
      } else {
        // 首次测评，显示问卷
        setStep('questionnaire');
        setAnswers({});
        setOpenResponse('');
        setCurrentPage(0);
      }
    } catch (error: any) {
      toast.error(`加载档案失败: ${error.message}`);
      onClose();
    }
  };

  const handleStartNewAssessment = () => {
    setAnswers({});
    setOpenResponse('');
    setCurrentPage(0);
    setStep('questionnaire');
  };

  const handleViewHistory = () => {
    setStep('history');
  };

  const handleBackToResult = () => {
    setStep('result');
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // 验证所有题目都已回答
    const allAnswered = assessmentQuestions.every(q => answers[q.id]);
    if (!allAnswered) {
      toast.error('请完成所有题目后再提交');
      return;
    }

    try {
      setStep('submitting');
      const result = await learningProfileService.submitAssessment({
        answers,
        open_response: openResponse || undefined
      });

      setCurrentAssessment(result);
      setStep('result');
      toast.success('测评提交成功！');
      
      // 重新加载档案数据
      await loadProfile();
    } catch (error: any) {
      toast.error(`提交失败: ${error.message}`);
      setStep('questionnaire');
    }
  };

  const currentQuestions = assessmentQuestions.slice(
    currentPage * questionsPerPage,
    (currentPage + 1) * questionsPerPage
  );
  const totalPages = Math.ceil(assessmentQuestions.length / questionsPerPage) + 1; // +1 for open question
  const progress = (Object.keys(answers).length / assessmentQuestions.length) * 100;
  
  // 判断当前是否在开放题页面
  const isOpenQuestionPage = currentPage === assessmentQuestions.length;
  
  // 获取当前用户的标签
  const currentTags = currentAssessment?.tags || profile?.latest_assessment?.tags || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white via-violet-50/30 to-fuchsia-50/30 shadow-2xl animate-scaleIn">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-6 text-white">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black">学习偏好测评</h2>
                  {currentTags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {currentTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-white/30 backdrop-blur-md rounded-full text-sm font-bold border border-white/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-white/80">了解您的学习习惯和偏好特点</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* Loading State */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-slate-600">加载中...</p>
            </div>
          )}

          {/* Questionnaire State */}
          {step === 'questionnaire' && (
            <div className="p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-slate-800">
                    {isOpenQuestionPage 
                      ? `补充说明（选填）` 
                      : `第 ${currentPage + 1} / ${assessmentQuestions.length} 题`
                    }
                  </span>
                  <span className="text-sm font-medium text-violet-600">
                    {isOpenQuestionPage ? '100%' : `${Math.round(progress)}%`} 完成
                  </span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-500 rounded-full"
                    style={{ width: isOpenQuestionPage ? '100%' : `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-8">
                {!isOpenQuestionPage ? (
                  // 显示单选题
                  currentQuestions.map((question, idx) => (
                    <div key={question.id} className="backdrop-blur-md bg-white/80 rounded-2xl p-8 border border-white/50 shadow-xl animate-fadeIn">
                      <h3 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
                        {question.question}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {question.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleAnswerChange(question.id, option.id)}
                            className={`px-4 py-3 rounded-xl border-2 transition-all duration-300 text-left ${
                              answers[question.id] === option.id
                                ? 'border-violet-500 bg-gradient-to-r from-violet-50 to-fuchsia-50 shadow-md transform scale-102'
                                : 'border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
                                answers[question.id] === option.id
                                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {option.id}
                              </div>
                              <span className={`font-medium text-sm ${
                                answers[question.id] === option.id ? 'text-violet-700' : 'text-slate-600'
                              }`}>
                                {option.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // 显示开放题
                  <div className="backdrop-blur-md bg-white/80 rounded-2xl p-8 border border-white/50 shadow-xl animate-fadeIn">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        ✍️
                      </span>
                      {openQuestion.question}
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      这道题为选填题，您可以分享更多关于您学习习惯的想法或困惑
                    </p>
                    <textarea
                      value={openResponse}
                      onChange={(e) => setOpenResponse(e.target.value)}
                      placeholder={openQuestion.placeholder}
                      className="w-full h-40 p-4 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:outline-none resize-none transition-all text-slate-700"
                      maxLength={200}
                    />
                    <div className="mt-2 text-right text-sm text-slate-500">
                      {openResponse.length}/200 字
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:border-violet-300 hover:shadow-md transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft size={20} />
                  上一题
                </button>

                <div className="text-sm text-slate-500 font-medium">
                  {isOpenQuestionPage 
                    ? '选填题，可跳过' 
                    : (answers[currentQuestions[0]?.id] ? '✓ 已回答' : '请选择答案')
                  }
                </div>

                {isOpenQuestionPage ? (
                  // 开放题页面 - 显示提交按钮
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length !== assessmentQuestions.length}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Sparkles size={20} />
                    提交测评
                  </button>
                ) : (
                  // 单选题页面 - 显示下一题按钮
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={!answers[currentQuestions[0]?.id]}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    下一题
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Submitting State */}
          {step === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
              <p className="mt-6 text-lg font-bold text-slate-700">AI正在生成您的专属评价...</p>
              <p className="mt-2 text-sm text-slate-500">这可能需要几秒钟，请耐心等待</p>
            </div>
          )}

          {/* Result State */}
          {step === 'result' && currentAssessment && (
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-3xl mb-4 animate-bounce">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text mb-2">
                  测评完成！
                </h3>
                <p className="text-slate-600">
                  测评时间: {new Date(currentAssessment.created_at).toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="backdrop-blur-md bg-white/90 rounded-2xl p-8 border border-white/50 shadow-xl">
                <h4 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Sparkles className="text-violet-600" />
                  AI评价报告
                </h4>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {currentAssessment.ai_evaluation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleStartNewAssessment}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  重新测评
                </button>
                {profile && profile.total_assessments > 1 && (
                  <button
                    onClick={handleViewHistory}
                    className="flex-1 px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:border-violet-300 hover:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <History size={20} />
                    查看历史({profile.total_assessments}次)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* History State */}
          {step === 'history' && profile && (
            <div className="p-8">
              <button
                onClick={handleBackToResult}
                className="mb-6 px-4 py-2 rounded-lg bg-white border-2 border-slate-200 text-slate-700 font-medium hover:border-violet-300 transition-all flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                返回
              </button>

              <h3 className="text-xl font-bold text-slate-900 mb-6">
                测评历史 (共{profile.total_assessments}次)
              </h3>

              <div className="space-y-4">
                {profile.history.map((assessment, idx) => (
                  <div
                    key={assessment.id}
                    className="backdrop-blur-md bg-white/90 rounded-xl p-6 border border-white/50 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      setCurrentAssessment(assessment);
                      setStep('result');
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-violet-600">
                        第{profile.total_assessments - idx}次测评
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(assessment.created_at).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-slate-700 line-clamp-3">
                      {assessment.ai_evaluation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
