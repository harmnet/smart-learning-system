'use client';

import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Sparkles, Loader2, History, RotateCcw, Check, XCircle, Award } from 'lucide-react';
import aiQuizService, { AIQuiz, QuizQuestion, AIQuizHistoryItem } from '@/services/aiQuiz.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface AIQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceName: string;
}

type Step = 'history' | 'generating' | 'answering' | 'submitting' | 'result';

const AIQuizModal: React.FC<AIQuizModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceName
}) => {
  const [step, setStep] = useState<Step>('history');
  const [quiz, setQuiz] = useState<AIQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [history, setHistory] = useState<AIQuizHistoryItem[]>([]);
  const startTimeRef = useRef<number>(0);
  const quizIdRef = useRef<number>(0);
  const dateFnsLocale = zhCN;

  // 处理 modal 打开
  useEffect(() => {
    if (isOpen) {
      // Modal 打开时记录开始时间
      startTimeRef.current = Date.now();
      // 打开modal时先加载历史记录，而不是直接生成题目
      loadHistory();
    } else {
      // Modal 关闭时重置状态
      setStep('history');
      setQuiz(null);
      setAnswers({});
      setHistory([]);
      startTimeRef.current = 0;
      quizIdRef.current = 0;
    }
  }, [isOpen, resourceId]);

  // 当 quiz 加载完成时，保存 quiz ID
  useEffect(() => {
    if (quiz && quiz.id > 0) {
      quizIdRef.current = quiz.id;
    }
  }, [quiz]);

  // 增强版关闭函数：关闭前先记录学习时长
  const handleClose = () => {
    // 在关闭 modal 之前记录学习时长
    if (quizIdRef.current > 0 && startTimeRef.current > 0) {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      console.log('[AIQuiz] 记录学习时长:', { 
        resourceId, 
        quizId: quizIdRef.current, 
        durationSeconds 
      });
      if (durationSeconds > 5) { // 至少学习5秒才记录
        aiQuizService.recordStudyTime(resourceId, quizIdRef.current, durationSeconds);
      }
    }
    // 然后调用原始的 onClose
    onClose();
  };

  const generateQuiz = async () => {
    setStep('generating');
    setAnswers({});
    try {
      const data = await aiQuizService.generateQuiz(resourceId);
      setQuiz(data);
      setStep('answering');
    } catch (error: any) {
      console.error('Failed to generate quiz:', error);
      const errorMsg = error.response?.data?.detail || '生成失败';
      toast.error(errorMsg);
      onClose();
    }
  };

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    // 检查是否全部答完
    const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);
    if (!allAnswered) {
      toast.error('请回答所有题目后再提交');
      return;
    }

    setStep('submitting');
    try {
      const result = await aiQuizService.submitQuiz(quiz.id, answers);
      setQuiz(result);
      setStep('result');
      toast.success('提交成功！');
    } catch (error: any) {
      console.error('Failed to submit quiz:', error);
      toast.error(error.response?.data?.detail || '提交失败');
      setStep('answering');
    }
  };

  const loadHistory = async () => {
    setStep('history');
    try {
      const data = await aiQuizService.getHistory(resourceId);
      setHistory(data);
    } catch (error: any) {
      console.error('Failed to load history:', error);
      toast.error('加载历史记录失败');
      // 即使加载失败，也显示空的历史页面
      setHistory([]);
    }
  };

  const viewHistoryDetail = async (quizId: number, isSubmitted: boolean) => {
    try {
      const data = await aiQuizService.getQuizDetail(quizId);
      setQuiz(data);
      setAnswers(data.user_answers || {});
      // 如果已提交，显示结果；否则进入答题状态
      setStep(isSubmitted ? 'result' : 'answering');
    } catch (error: any) {
      console.error('Failed to load quiz detail:', error);
      toast.error('加载测评详情失败');
    }
  };

  const retryQuiz = async () => {
    if (!quiz) return;
    
    try {
      // 调用后端API创建新的测评记录（题目相同）
      const newQuiz = await aiQuizService.retryQuiz(quiz.id);
      setQuiz(newQuiz);
      setAnswers({});
      setStep('answering');
      toast.success('开始重新答题！');
    } catch (error: any) {
      console.error('Failed to retry quiz:', error);
      toast.error('重新答题失败');
    }
  };

  const renderQuestion = (question: QuizQuestion, showAnswer: boolean = false) => {
    const userAnswer = showAnswer ? question.user_answer : answers[question.id];
    const isCorrect = question.is_correct;

    return (
      <div
        key={question.id}
        className={`bg-white/70 backdrop-blur-md rounded-2xl p-6 border ${
          showAnswer
            ? isCorrect
              ? 'border-green-300 bg-green-50/50'
              : 'border-red-300 bg-red-50/50'
            : 'border-white/50'
        } shadow-md mb-6`}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-lg font-bold text-slate-800 flex-1">
            {question.id}. {question.question}
          </h4>
          {showAnswer && (
            <div className="flex items-center gap-2 ml-4">
              {isCorrect ? (
                <span className="flex items-center gap-1 text-green-600 font-bold">
                  <Check size={20} />
                  正确
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-bold">
                  <XCircle size={20} />
                  错误
                </span>
              )}
            </div>
          )}
        </div>

        {/* Type Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            question.type === 'single' ? 'bg-blue-100 text-blue-700' :
            question.type === 'multiple' ? 'bg-purple-100 text-purple-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {question.type === 'single' ? '单选题' : question.type === 'multiple' ? '多选题' : '判断题'}
          </span>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const optionKey = option.startsWith('A.') || option.startsWith('B.') ? option[0] : option;
            const isUserAnswer = question.type === 'multiple' 
              ? Array.isArray(userAnswer) && userAnswer.includes(optionKey)
              : userAnswer === optionKey;
            const isCorrectAnswer = question.type === 'multiple'
              ? Array.isArray(question.correct_answer) && question.correct_answer.includes(optionKey)
              : question.correct_answer === optionKey;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border-2 transition-all ${
                  showAnswer
                    ? isCorrectAnswer
                      ? 'border-green-500 bg-green-50'
                      : isUserAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 bg-white'
                    : answers[question.id] === optionKey || 
                      (Array.isArray(answers[question.id]) && answers[question.id].includes(optionKey))
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-violet-300'
                }`}
                onClick={() => {
                  if (showAnswer) return;
                  if (question.type === 'multiple') {
                    const currentAnswers = (answers[question.id] as string[]) || [];
                    if (currentAnswers.includes(optionKey)) {
                      handleAnswerChange(question.id, currentAnswers.filter((a) => a !== optionKey));
                    } else {
                      handleAnswerChange(question.id, [...currentAnswers, optionKey]);
                    }
                  } else {
                    handleAnswerChange(question.id, optionKey);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 ${
                    question.type === 'multiple' ? 'rounded-md' : 'rounded-full'
                  } border-2 flex items-center justify-center transition-all ${
                    showAnswer
                      ? isCorrectAnswer
                        ? 'border-green-500 bg-green-500'
                        : isUserAnswer
                        ? 'border-red-500 bg-red-500'
                        : 'border-slate-300'
                      : answers[question.id] === optionKey ||
                        (Array.isArray(answers[question.id]) && answers[question.id].includes(optionKey))
                      ? 'border-violet-500 bg-violet-500'
                      : 'border-slate-300'
                  }`}>
                    {((showAnswer && (isCorrectAnswer || isUserAnswer)) ||
                      (!showAnswer &&
                        (answers[question.id] === optionKey ||
                          (Array.isArray(answers[question.id]) && answers[question.id].includes(optionKey))))) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-slate-700">{option}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation (only show after submission) */}
        {showAnswer && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-bold text-blue-900 mb-2">答案解析：</p>
            <p className="text-sm text-blue-800">{question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'history':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="w-6 h-6 text-blue-500" />
                测评历史
              </h3>
            </div>
            
            {/* 新测评按钮 */}
            <div className="mb-6">
              <button
                onClick={generateQuiz}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Sparkles className="w-6 h-6" />
                <span className="text-lg">开始新的AI测评</span>
              </button>
            </div>

            {/* 历史记录列表 */}
            {history.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-slate-200"></div>
                  <span className="text-sm text-slate-500">历史测评记录</span>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => viewHistoryDetail(item.id, item.is_submitted)}
                    className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-md cursor-pointer hover:shadow-xl hover:border-violet-300 hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-700">
                          {format(new Date(item.created_at), 'PPP HH:mm', { locale: dateFnsLocale })}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.question_count} 道题目
                        </p>
                      </div>
                      {item.is_submitted && item.score !== undefined ? (
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-2xl font-black ${
                              item.score >= 80 ? 'text-green-600' :
                              item.score >= 60 ? 'text-blue-600' :
                              'text-red-600'
                            }`}>
                              {item.score}分
                            </p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(item.submitted_at!), 'PPP HH:mm', { locale: dateFnsLocale })}
                            </p>
                          </div>
                          <div className="flex items-center text-violet-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                            未完成
                          </span>
                          <div className="flex items-center text-amber-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <History className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-2">还没有测评记录</p>
                <p className="text-sm text-slate-400">点击上方按钮开始第一次AI测评</p>
              </div>
            )}
          </div>
        );

      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI正在生成测评题目...</h3>
            <div className="space-y-2 text-center">
              <p className="text-slate-600">正在分析资源内容...</p>
              <p className="text-slate-600">正在结合您的学习特征...</p>
              <p className="text-slate-600">正在生成测评题目...</p>
            </div>
            <p className="text-sm text-slate-500 mt-6">预计需要10-30秒，请耐心等待</p>
          </div>
        );

      case 'answering':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">共5道题目，请认真作答</h3>
                <p className="text-sm text-slate-600 mt-1">
                  已答 {Object.keys(answers).length} / 5 题
                </p>
              </div>
              <button
                onClick={loadHistory}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                <History size={16} />
                测评历史
              </button>
            </div>
            {quiz && quiz.questions.map((q) => renderQuestion(q, false))}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== quiz?.questions.length}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Award size={20} />
                提交答案
              </button>
            </div>
          </div>
        );

      case 'submitting':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-16 h-16 text-green-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">正在提交并判题...</h3>
            <p className="text-slate-600">请稍候</p>
          </div>
        );

      case 'result':
        return (
          <div className="p-6">
            {/* Score Display */}
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-3xl p-8 text-white text-center mb-6 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center mx-auto mb-4">
                <Award className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-black mb-2">测评完成！</h3>
              <p className="text-5xl font-black my-4">
                {quiz?.score !== undefined && quiz?.score !== null ? quiz.score : 0} 分
              </p>
              <p className="text-lg opacity-90">
                {quiz && quiz.score !== undefined && quiz.score >= 80 ? '优秀！' : quiz && quiz.score !== undefined && quiz.score >= 60 ? '良好！' : '继续加油！'}
              </p>
            </div>

            {/* Questions with Answers */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-slate-800 mb-4">题目详情</h4>
              {quiz && quiz.questions.map((q) => renderQuestion(q, true))}
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <button
                onClick={retryQuiz}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
              >
                <RotateCcw size={20} />
                再做一次
              </button>
              <button
                onClick={generateQuiz}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
              >
                <Sparkles size={20} />
                新测评
              </button>
              <button
                onClick={loadHistory}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-2"
              >
                <History size={20} />
                返回历史
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 to-white/70 text-left align-middle shadow-xl transition-all border border-white/50 backdrop-blur-xl">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-fuchsia-600 to-pink-600 px-8 py-6 text-white">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black">AI智能测评</h2>
                        <p className="text-sm text-white/80">{resourceName}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 flex items-center justify-center"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto">
                  {renderContent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AIQuizModal;
