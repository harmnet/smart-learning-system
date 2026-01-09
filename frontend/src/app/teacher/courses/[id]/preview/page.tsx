"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import courseOutlineService, { CoursePreview, ChapterPreview, SectionPreview } from '@/services/courseOutline.service';
import { useToast } from '@/hooks/useToast';

export default function CoursePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);
  const { toast } = useToast();

  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPreview();
  }, [courseId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const data = await courseOutlineService.getCoursePreview(courseId);
      setPreview(data);
      // 默认展开所有章
      const allChapterIds = new Set(data.outline.map(ch => ch.id));
      setExpandedChapters(allChapterIds);
    } catch (error: any) {
      console.error('Failed to load preview:', error);
      toast.error('加载预览失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const getRuleText = (rule: any) => {
    if (!rule || rule.rule_type === 'none') {
      return '无条件';
    }
    
    if (rule.rule_type === 'completion') {
      return `完成上一章节${rule.completion_percentage}%`;
    }
    
    if (rule.rule_type === 'exam') {
      return '通过上一章节测验';
    }
    
    return '未设置';
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">加载中...</p>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  if (!preview) {
    return (
      <TeacherLayout>
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-600">未找到课程信息</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              返回
            </button>
          </div>
        </div>
      </TeacherLayout>
    );
  }

  const getCategoryText = (category: string) => {
    const map: Record<string, string> = {
      'general': '通识课',
      'professional_foundation': '专业基础课',
      'professional_core': '专业核心课',
      'expansion': '拓展课',
      'elective': '选修课'
    };
    return map[category] || category;
  };

  const getEnrollmentTypeText = (type: string) => {
    const map: Record<string, string> = {
      'required': '必修课',
      'elective': '选修课',
      'retake': '重修课'
    };
    return map[type] || type;
  };

  return (
    <TeacherLayout>
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white shadow-sm">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              退出预览
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-slate-900">{preview.course.title}</h1>
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    <span className="font-medium">预览模式</span>
                  </div>
                </div>
                
                {/* 课程标签 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {preview.course.course_category && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">
                      {getCategoryText(preview.course.course_category)}
                    </span>
                  )}
                  {preview.course.enrollment_type && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                      {getEnrollmentTypeText(preview.course.enrollment_type)}
                    </span>
                  )}
                  {preview.course.credits !== null && preview.course.credits !== undefined && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                      {preview.course.credits} 学分
                    </span>
                  )}
                  {preview.course.major && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                      适用专业：{preview.course.major.name}
                    </span>
                  )}
                </div>

                {/* 授课教师 */}
                {preview.course.teacher && (
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>授课教师：{preview.course.teacher.name}</span>
                  </div>
                )}
              </div>

              {/* 课程封面 */}
              {preview.course.cover_url && (
                <div className="ml-6">
                  <img 
                    src={preview.course.cover_url} 
                    alt={preview.course.title}
                    className="w-48 h-32 object-cover rounded-lg shadow-md border border-slate-200"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="flex-1 overflow-y-auto py-8">
          <div className="max-w-6xl mx-auto px-8">
            {/* 课程简介 */}
            {preview.course.introduction && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  课程简介
                </h2>
                <p className="text-slate-700 leading-relaxed">{preview.course.introduction}</p>
              </div>
            )}

            {/* 授课目标 */}
            {preview.course.objectives && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                  授课目标
                </h2>
                <p className="text-slate-700 leading-relaxed">{preview.course.objectives}</p>
              </div>
            )}

            {/* 课程大纲 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                课程大纲
              </h2>

              {preview.outline.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p className="text-slate-600">该课程暂无章节内容</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preview.outline.map((chapter: ChapterPreview, index: number) => (
                    <div key={chapter.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Chapter Header */}
                      <div 
                        onClick={() => toggleChapter(chapter.id)}
                        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">{chapter.title}</h3>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="text-slate-500">
                                  规则: <span className="text-blue-600">{getRuleText(chapter.learning_rule)}</span>
                                </span>
                                {chapter.knowledge_graph && (
                                  <span className="text-slate-500">
                                    知识图谱: <span className="text-green-600">{chapter.knowledge_graph.graph_name}</span>
                                  </span>
                                )}
                                {chapter.exam_papers.length > 0 && (
                                  <span className="text-slate-500">
                                    考试: <span className="text-purple-600">{chapter.exam_papers.length}个</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-slate-400 transition-transform ${expandedChapters.has(chapter.id) ? 'rotate-90' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Sections */}
                      {expandedChapters.has(chapter.id) && chapter.sections.length > 0 && (
                        <div className="border-t border-slate-200 bg-white">
                          {chapter.sections.map((section: SectionPreview, sIndex: number) => (
                            <div key={section.id} className="border-b border-slate-200 last:border-b-0">
                              <div className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className="w-7 h-7 bg-slate-200 rounded flex items-center justify-center text-slate-600 text-xs font-medium mt-0.5">
                                    {index + 1}.{sIndex + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-base font-semibold text-slate-900 mb-2">{section.title}</h4>
                                    
                                    <div className="flex flex-wrap gap-2 mb-2">
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                        {getRuleText(section.learning_rule)}
                                      </span>
                                      {section.knowledge_graph && (
                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                          {section.knowledge_graph.graph_name}
                                          {section.knowledge_graph.node_name && ` - ${section.knowledge_graph.node_name}`}
                                        </span>
                                      )}
                                    </div>

                                    {/* Resources */}
                                    {(section.resources.length > 0 || section.exam_papers.length > 0) && (
                                      <div className="space-y-1.5">
                                        {section.resources.map((resource) => (
                                          <div key={resource.id} className="flex items-center gap-2 text-slate-600 text-xs">
                                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <span>{resource.resource_type === 'teaching_resource' ? '教学资源' : '参考资料'}</span>
                                          </div>
                                        ))}
                                        {section.exam_papers.map((exam) => (
                                          <div key={exam.id} className="flex items-center gap-2 text-slate-600 text-xs">
                                            <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                            </svg>
                                            <span>考试: {exam.exam_paper_name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {expandedChapters.has(chapter.id) && chapter.sections.length === 0 && (
                        <div className="p-4 text-center text-slate-500 text-xs bg-white border-t border-slate-200">
                          该章暂无小节
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}

