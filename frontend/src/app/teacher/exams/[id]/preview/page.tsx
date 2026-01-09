"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { examPaperService, ExamPaperDetail } from '@/services/examPaper.service';

export default function ExamPreviewPage() {
  const params = useParams();
  const paperId = parseInt(params.id as string);
  
  const [paperDetail, setPaperDetail] = useState<ExamPaperDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setTeacherId(user.id);
    }
  }, []);

  useEffect(() => {
    if (paperId && teacherId !== null) {
      loadPaperDetail();
    }
  }, [paperId, teacherId]);

  const loadPaperDetail = async () => {
    try {
      setLoading(true);
      const data = await examPaperService.getById(paperId, teacherId);
      setPaperDetail(data);
    } catch (error: any) {
      console.error('Failed to load paper:', error);
      alert('加载试卷失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionOptions = (question: any) => {
    if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
      return (
        <div className="mt-4 space-y-2">
          {question.options?.map((option: any, index: number) => {
            const optionText = typeof option === 'string' ? option : option.option_text || option.text || '';
            return (
              <div key={index} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="flex-1 text-slate-700">{optionText}</div>
              </div>
            );
          })}
        </div>
      );
    }
    
    if (question.question_type === 'true_false') {
      return (
        <div className="mt-4 space-y-2">
          <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
              ✓
            </div>
            <div className="flex-1 text-slate-700">正确</div>
          </div>
          <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-sm font-medium text-slate-600">
              ✗
            </div>
            <div className="flex-1 text-slate-700">错误</div>
          </div>
        </div>
      );
    }
    
    if (question.question_type === 'fill_blank') {
      return (
        <div className="mt-4">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500">填空题答题区</p>
            <div className="mt-2 h-10 bg-white border border-slate-300 rounded"></div>
          </div>
        </div>
      );
    }
    
    if (question.question_type === 'short_answer' || question.question_type === 'essay') {
      return (
        <div className="mt-4">
          <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <p className="text-sm text-slate-500">
              {question.question_type === 'essay' ? '问答题答题区' : '简答题答题区'}
            </p>
            <div className="mt-2 h-32 bg-white border border-slate-300 rounded"></div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'single_choice': '单选题',
      'multiple_choice': '多选题',
      'true_false': '判断题',
      'fill_blank': '填空题',
      'short_answer': '简答题',
      'essay': '问答题',
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!paperDetail) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">试卷不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* 试卷头部 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h1 className="text-3xl font-black text-slate-900 mb-4">{paperDetail.paper_name}</h1>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <span className="text-slate-500">总分：</span>
                <span className="font-bold text-blue-600">{paperDetail.total_score} 分</span>
              </div>
              <div>
                <span className="text-slate-500">题目数量：</span>
                <span className="font-bold text-slate-900">{paperDetail.questions?.length || 0} 道</span>
              </div>
            </div>
          </div>

          {/* 考试说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-2">考试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 本试卷共 {paperDetail.questions?.length || 0} 道题目，总分 {paperDetail.total_score} 分</li>
              <li>• 请仔细阅读题目，认真作答</li>
              <li>• 单选题只能选择一个答案，多选题可选择多个答案</li>
              <li>• 本页面为预览模式，不可提交答案</li>
            </ul>
          </div>
        </div>

        {/* 题目列表 */}
        <div className="space-y-6">
          {paperDetail.questions?.map((q, index) => (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              {/* 题目头部 */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                      {getQuestionTypeLabel(q.question_type)}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {q.score} 分
                    </span>
                  </div>
                  <div className="text-lg text-slate-900 leading-relaxed">
                    {q.title}
                  </div>
                </div>
              </div>

              {/* 题目选项/答题区 */}
              {renderQuestionOptions(q)}

              {/* 知识点标签 */}
              {q.knowledge_point && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-500">知识点：</span>
                  <span className="text-xs text-blue-600 ml-1">{q.knowledge_point}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 底部操作栏 */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">本页面为预览模式，不可提交答案</p>
            <button
              onClick={() => window.close()}
              className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              关闭预览
            </button>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>数珩智学 - 智能教学管理系统</p>
        </div>
      </div>
    </div>
  );
}

