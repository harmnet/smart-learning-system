"use client";

import { useState, useEffect } from 'react';
import { examService, ExamDetail } from '@/services/exam.service';
import { examPaperService } from '@/services/examPaper.service';
import { useParams } from 'next/navigation';
import { decodeUnicode } from '@/utils/unicode';

export default function ExamPreviewPage() {
  const params = useParams();
  const examId = parseInt(params.id as string);
  
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [paperDetail, setPaperDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  
  const getTeacherId = (): number => {
    const teacherIdStr = localStorage.getItem('teacher_id') || localStorage.getItem('user_id');
    return teacherIdStr ? parseInt(teacherIdStr) : 1;
  };
  
  useEffect(() => {
    loadExamData();
  }, [examId]);
  
  const loadExamData = async () => {
    try {
      setLoading(true);
      const teacherId = getTeacherId();
      
      // 加载考试信息
      const examData = await examService.getById(examId, teacherId);
      setExam(examData);
      
      // 加载试卷详情
      const paperData = await examPaperService.getById(examData.exam_paper_id, teacherId);
      setPaperDetail(paperData);
    } catch (err: any) {
      console.error('Failed to load exam data:', err);
      setError('加载考试数据失败');
    } finally {
      setLoading(false);
    }
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
  
  const getQuestionTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      single_choice: '单选题',
      multiple_choice: '多选题',
      true_false: '判断题',
      fill_blank: '填空题',
      short_answer: '简答题',
      essay: '问答题',
    };
    return typeMap[type] || type;
  };
  
  // 按题型分组题目
  const groupQuestionsByType = (questions: any[]) => {
    const groups: { [key: string]: any[] } = {};
    questions.forEach((q) => {
      if (!groups[q.question_type]) {
        groups[q.question_type] = [];
      }
      groups[q.question_type].push(q);
    });
    return groups;
  };
  
  // 滚动到指定题目
  const scrollToQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
    const element = document.getElementById(`question-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (error || !exam || !paperDetail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || '考试数据不存在'}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            关闭窗口
          </button>
        </div>
      </div>
    );
  }
  
  const questionGroups = paperDetail?.questions ? groupQuestionsByType(paperDetail.questions) : {};
  
  // 获取背景图片URL
  const backgroundImage = exam?.cover_image ? examService.getCoverUrl(exam.cover_image) : '';
  
  return (
    <div 
      className="min-h-screen py-8"
      style={{
        backgroundColor: backgroundImage ? 'transparent' : '#f8fafc',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex gap-6">
        {/* 左侧：考试内容 */}
        <div className="flex-1">
          {/* 考试头部信息 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{decodeUnicode(exam.exam_name)}</h1>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
              <div>
                <span className="font-medium">考试时间：</span>
                {formatDateTime(exam.start_time)} - {formatDateTime(exam.end_time).split(' ')[1]}
              </div>
              <div>
                <span className="font-medium">总分：</span>
                {paperDetail.total_score} 分
              </div>
            </div>
          </div>
          
          {/* 考试说明 */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-blue-900 mb-3">考试说明</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• 本页面为教师预览页面，学生考试时的实际页面将包含答题功能</li>
              <li>• 考试总时长：{Math.round((new Date(exam.end_time).getTime() - new Date(exam.start_time).getTime()) / 60000)} 分钟</li>
              <li>• 最早交卷时间：{exam.minimum_submission_minutes} 分钟</li>
              <li>• 考试开始前 {exam.early_login_minutes} 分钟可以登录</li>
              <li>• 考试开始后 {exam.late_forbidden_minutes} 分钟将不允许进入</li>
            </ul>
            </div>
          </div>
          
          {/* 试卷题目列表 - 按题型分类 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">试卷题目</h2>
            
            {paperDetail.questions && paperDetail.questions.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(questionGroups).map(([type, questions]: [string, any]) => (
                  <div key={type} className="border-b border-slate-200 pb-8 last:border-b-0">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                        {getQuestionTypeText(type)}
                      </span>
                      <span className="text-sm text-slate-500">
                        （共 {questions.length} 题）
                      </span>
                    </h3>
                    
                    <div className="space-y-6">
                      {questions.map((q: any) => {
                        const globalIndex = paperDetail.questions.findIndex((pq: any) => pq.id === q.id);
                        return (
                          <div 
                            key={q.id} 
                            id={`question-${globalIndex}`}
                            className={`border-l-4 pl-6 py-4 transition-colors ${
                              selectedQuestionIndex === globalIndex 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-slate-200'
                            }`}
                          >
                            {/* 题目标题 */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {globalIndex + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="text-sm text-slate-600 font-medium">
                                    {q.score} 分
                                  </span>
                                </div>
                                <div className="text-slate-900 text-base leading-relaxed whitespace-pre-wrap">
                                  {q.title || q.question_text}
                                </div>
                              </div>
                            </div>
                            
                            {/* 选项（单选题、多选题、判断题） */}
                            {['single_choice', 'multiple_choice', 'true_false'].includes(q.question_type) && q.options && q.options.length > 0 && (
                              <div className="ml-12 space-y-2">
                                {q.options.map((option: any, optIndex: number) => (
                                  <div
                                    key={optIndex}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 transition-colors"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center text-xs font-medium text-slate-600">
                                      {option.option_label || String.fromCharCode(65 + optIndex)}
                                    </span>
                                    <span className="flex-1 text-slate-700">{option.option_text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                暂无题目
              </div>
            )}
          </div>
          
          {/* 底部操作按钮 */}
          <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            打印试卷
          </button>
            <button
              onClick={() => window.close()}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              关闭预览
            </button>
          </div>
        </div>
        
        {/* 右侧：题目一览 */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">题目一览</h3>
              
              {paperDetail?.questions && paperDetail.questions.length > 0 ? (
                <div>
                  {/* 题目总数和分数 */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">题目总数</span>
                      <span className="font-bold text-blue-900">{paperDetail.questions.length} 题</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-blue-700">总分</span>
                      <span className="font-bold text-blue-900">{paperDetail.total_score} 分</span>
                    </div>
                  </div>
                  
                  {/* 按题型显示题目 */}
                  {Object.entries(questionGroups).map(([type, questions]: [string, any]) => (
                    <div key={type} className="mb-4">
                      <div className="text-sm font-medium text-slate-700 mb-2">
                        {getQuestionTypeText(type)} ({questions.length})
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {questions.map((q: any) => {
                          const globalIndex = paperDetail.questions.findIndex((pq: any) => pq.id === q.id);
                          return (
                            <button
                              key={q.id}
                              onClick={() => scrollToQuestion(globalIndex)}
                              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                                selectedQuestionIndex === globalIndex
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700'
                              }`}
                            >
                              {globalIndex + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  暂无题目
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

