'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DocumentPreview, { PreviewInfo } from '@/components/common/DocumentPreview';
import { teachingResourceService } from '@/services/teachingResource.service';
import PersonalizedContentModal from '@/components/student/PersonalizedContentModal';
import AIQuizModal from '@/components/student/AIQuizModal';
import StudentHomeworkModal from '@/components/student/StudentHomeworkModal';
import CourseQAFloatingButton from '@/components/student/CourseQAFloatingButton';
import { HomeworkItem } from '@/types/homework';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiClient from '@/lib/api-client';

interface Course {
  id: number;
  title: string;
  name: string;
  code: string;
  description?: string;
  course_type?: string;
  hours?: number;
  credits?: number;
  introduction?: string;
  objectives?: string;
  cover_image?: string;
  cover_id?: number;
  main_teacher_name?: string;
  major_name?: string;
}

interface CourseResource {
  id: number;
  type: string;
  name: string;
  file_type: string;
  file_url: string;
  link_url?: string;
  teacher_id?: number;  // 添加teacher_id字段
  resource_type?: string;  // 添加resource_type字段
  resource_name?: string;  // 添加resource_name字段
  original_filename?: string;  // 添加original_filename字段
  file_size?: number;  // 添加file_size字段
}

interface CourseSection {
  id: number;
  title: string;
  sort_order: number;
  resources: CourseResource[];
  exam_papers: any[];
  homework: HomeworkItem[];
}

interface CourseChapter {
  id: number;
  title: string;
  sort_order: number;
  sections: CourseSection[];
  exam_papers: any[];
}

interface LearningBehavior {
  id: number;
  behavior_type: string;
  description: string;
  duration_seconds: number;
  created_at: string;
  resource_type: string;
  resource_id: number;
  chapter_title: string;
}

interface StudyDuration {
  date: string;
  duration_minutes: number;
}

interface ExamScore {
  id: number;
  score: number;
  total_score: number;
  percentage: number;
  exam_date: string;
  exam_paper_title: string;
  exam_name: string;
}

export default function StudentCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<CourseChapter[]>([]);
  const [learningBehaviors, setLearningBehaviors] = useState<LearningBehavior[]>([]);
  const [studyDurations, setStudyDurations] = useState<StudyDuration[]>([]);
  const [examScores, setExamScores] = useState<ExamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInfo, setPreviewInfo] = useState<PreviewInfo | null>(null);
  const [previewResourceName, setPreviewResourceName] = useState<string>('');
  const [showPersonalizedModal, setShowPersonalizedModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<CourseResource | null>(null);
  const [activeTab, setActiveTab] = useState<'outline' | 'behaviors' | 'duration' | 'scores'>('outline');
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // 并行加载所有数据
      const [courseRes, outlineRes, behaviorsRes, durationRes, scoresRes] = await Promise.all([
        fetch(`${apiUrl}/courses/${courseId}`, { headers }),
        fetch(`${apiUrl}/student/courses/${courseId}/outline`, { headers }),
        fetch(`${apiUrl}/student/learning/courses/${courseId}/learning-behaviors?limit=20`, { headers }),
        fetch(`${apiUrl}/student/learning/courses/${courseId}/study-duration?days=30`, { headers }),
        fetch(`${apiUrl}/student/learning/courses/${courseId}/exam-scores?limit=10`, { headers })
      ]);
      
      if (courseRes.ok) {
        const courseData = await courseRes.json();
        setCourse(courseData);
      }
      
      if (outlineRes.ok) {
        const outlineData = await outlineRes.json();
        setChapters(outlineData);
      }
      
      if (behaviorsRes.ok) {
        const behaviorsData = await behaviorsRes.json();
        setLearningBehaviors(behaviorsData);
      }
      
      if (durationRes.ok) {
        const durationData = await durationRes.json();
        setStudyDurations(durationData);
      }
      
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setExamScores(scoresData);
      }
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleResourceClick = async (resource: CourseResource) => {
    try {
      // 设置资源名称
      setPreviewResourceName(resource.resource_name || resource.name);
      
      // 获取预览信息（传递teacher_id）
      const previewInfo = await teachingResourceService.getOfficePreviewUrl(resource.id, resource.teacher_id);
      
      console.log('获取到的预览信息:', previewInfo);
      
      // 转换为PreviewInfo格式（包含access_token等字段）
      const fullPreviewInfo: PreviewInfo = {
        preview_url: previewInfo.preview_url,
        download_url: previewInfo.download_url,
        preview_type: previewInfo.preview_type as 'weboffice' | 'pdf' | 'download' | 'direct',
        resource_type: previewInfo.resource_type,
        file_name: previewInfo.file_name,
        // 如果后端返回了token信息，也包含进来
        ...(previewInfo.access_token && {
          access_token: previewInfo.access_token,
          refresh_token: previewInfo.refresh_token,
          access_token_expired_time: previewInfo.access_token_expired_time,
          refresh_token_expired_time: previewInfo.refresh_token_expired_time,
        })
      };
      
      console.log('完整预览信息:', fullPreviewInfo);
      
      setPreviewInfo(fullPreviewInfo);
      setShowPreviewModal(true);
      
      // 记录学习行为
      recordBehavior({
        chapter_id: null,
        resource_id: resource.id,
        resource_type: resource.type,
        behavior_type: 'view_resource',
        description: `查看资源: ${resource.name}`,
        duration_seconds: 0
      });
    } catch (error: any) {
      console.error('获取预览信息失败:', error);
      alert('获取预览信息失败: ' + (error.message || '未知错误'));
    }
  };

  const recordBehavior = async (behaviorData: any) => {
    try {
      await apiClient.post(`/student/learning/courses/${courseId}/record-behavior`, behaviorData);
    } catch (error) {
      console.error('Failed to record behavior:', error);
    }
  };

  const getBehaviorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'view_resource': '查看资源',
      'complete_section': '完成小节',
      'take_exam': '参加考试',
      'submit_homework': '提交作业',
      'view_personalized_content': '个性化学习',
      'take_ai_quiz': 'AI测评'
    };
    return labels[type] || type;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">课程未找到</h2>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()} 
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">Smart Learning</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Course Cover */}
            <div className="flex-shrink-0 w-full md:w-64 h-40 rounded-lg overflow-hidden">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.name || course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Course Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                {course.name || course.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {course.course_type && (
                  <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                    course.course_type === 'required'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {course.course_type === 'required' ? '必修课' : '选修课'}
                  </span>
                )}
                {course.hours && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-700">{course.hours} 学时</span>
                  </div>
                )}
                {course.credits && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-700">{course.credits} 学分</span>
                  </div>
                )}
                {course.main_teacher_name && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-xs font-medium text-slate-700">{course.main_teacher_name}</span>
                  </div>
                )}
                {course.major_name && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-md">
                    <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="text-xs font-medium text-slate-700">{course.major_name}</span>
                  </div>
                )}
              </div>
              
              {course.introduction && (
                <div className="mb-3 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    课程简介
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{course.introduction}</p>
                </div>
              )}
              
              {course.objectives && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    授课目标
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{course.objectives}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab('outline')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  activeTab === 'outline'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  课程大纲
                </span>
              </button>
              <button
                onClick={() => setActiveTab('behaviors')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  activeTab === 'behaviors'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  学习记录
                </span>
              </button>
              <button
                onClick={() => setActiveTab('duration')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  activeTab === 'duration'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  学习时长
                </span>
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                  activeTab === 'scores'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  测评成绩
                </span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Course Outline Tab */}
            {activeTab === 'outline' && (
              <div className="p-6">
                {chapters.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    该课程暂无大纲内容
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((chapter, chapterIndex) => (
                      <div key={chapter.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex items-center justify-between w-full p-4 transition-colors duration-200 cursor-pointer hover:bg-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                              {chapterIndex + 1}
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {chapter.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {chapter.sections && chapter.sections.length > 0 && (
                              <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                {chapter.sections.length} 个小节
                              </span>
                            )}
                            <svg
                              className={`w-5 h-5 text-slate-600 transform transition-transform duration-200 ${
                                expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        </button>
                        {expandedChapters.has(chapter.id) && (
                          <div className="p-4 bg-white border-t border-slate-200">
                            {chapter.sections && chapter.sections.length > 0 ? (
                              <div className="space-y-2 ml-4">
                                {chapter.sections.map((section, sectionIndex) => (
                                  <div key={section.id} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                                    <button
                                      onClick={() => toggleSection(section.id)}
                                      className="flex items-center justify-between w-full p-3 transition-colors duration-200 cursor-pointer hover:bg-slate-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                          {chapterIndex + 1}.{sectionIndex + 1}
                                        </div>
                                        <h4 className="text-sm font-medium text-slate-800">
                                          {section.title}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {section.resources && section.resources.length > 0 && (
                                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                                            {section.resources.length} 个资源
                                          </span>
                                        )}
                                        <svg
                                          className={`w-4 h-4 text-slate-600 transform transition-transform duration-200 ${
                                            expandedSections.has(section.id) ? 'rotate-90' : ''
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                      </div>
                                    </button>
                                    {expandedSections.has(section.id) && (
                                      <div className="p-3 ml-4 bg-white border-t border-slate-200 space-y-2">
                                        {section.resources && section.resources.length > 0 ? (
                                          section.resources.map((resource) => (
                                            <div
                                              key={resource.id}
                                              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                                            >
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-800 truncate">
                                                  {resource.name}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                  onClick={() => handleResourceClick(resource)}
                                                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                                                >
                                                  查看
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setSelectedResource(resource);
                                                    setShowPersonalizedModal(true);
                                                  }}
                                                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 cursor-pointer"
                                                >
                                                  个性化
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setSelectedResource(resource);
                                                    setShowQuizModal(true);
                                                  }}
                                                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors duration-200 cursor-pointer"
                                                >
                                                  AI测评
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-sm text-slate-500 p-3 text-center">该小节暂无资源</p>
                                        )}

                                        {/* 课后作业列表 */}
                                        {section.homework && section.homework.length > 0 && (
                                          <div className="mt-4 pt-4 border-t border-slate-200">
                                            <h5 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                              </svg>
                                              课后作业
                                            </h5>
                                            <div className="space-y-2">
                                              {section.homework.map((hw) => (
                                                <div
                                                  key={hw.id}
                                                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 hover:shadow-sm transition-all duration-200"
                                                >
                                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                      </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                      <p className="text-sm font-medium text-slate-800 truncate">{hw.title}</p>
                                                      <div className="flex items-center gap-2 mt-1">
                                                        {hw.deadline && (
                                                          <span className={`text-xs ${new Date(hw.deadline) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                                                            截止: {new Date(hw.deadline).toLocaleDateString('zh-CN')}
                                                          </span>
                                                        )}
                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                          hw.submission_status === 'graded' ? 'bg-green-100 text-green-700' :
                                                          hw.submission_status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                                          hw.submission_status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                                          'bg-slate-100 text-slate-600'
                                                        }`}>
                                                          {hw.submission_status === 'graded' ? `已批改 ${hw.score !== null ? hw.score + '分' : ''}` :
                                                           hw.submission_status === 'submitted' ? '已提交' :
                                                           hw.submission_status === 'draft' ? '草稿' : '未开始'}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <button
                                                    onClick={() => {
                                                      setSelectedHomeworkId(hw.id);
                                                      setShowHomeworkModal(true);
                                                    }}
                                                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer ${
                                                      hw.submission_status === 'not_started' || hw.submission_status === 'draft'
                                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                  >
                                                    {hw.submission_status === 'not_started' ? '开始作业' :
                                                     hw.submission_status === 'draft' ? '继续完成' : '查看详情'}
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 p-4 text-center">该章节暂无小节内容</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Learning Behaviors Tab */}
            {activeTab === 'behaviors' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">学习行为记录</h2>
                {learningBehaviors.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    暂无学习记录
                  </div>
                ) : (
                  <div className="space-y-3">
                    {learningBehaviors.map((behavior) => (
                      <div key={behavior.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                {getBehaviorTypeLabel(behavior.behavior_type)}
                              </span>
                              {behavior.chapter_title && (
                                <span className="text-sm text-slate-600">
                                  {behavior.chapter_title}
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 mb-1">{behavior.description}</p>
                            {behavior.duration_seconds > 0 && (
                              <p className="text-sm text-slate-500">
                                时长: {formatDuration(behavior.duration_seconds)}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 whitespace-nowrap ml-4">
                            {new Date(behavior.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Study Duration Tab */}
            {activeTab === 'duration' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">学习时长走势（最近30天）</h2>
                {studyDurations.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    暂无学习时长数据
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studyDurations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis label={{ value: '学习时长（分钟）', angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                          formatter={(value: number) => [`${value}分钟`, '学习时长']}
                        />
                        <Bar dataKey="duration_minutes" fill="#3b82f6" name="学习时长" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Exam Scores Tab */}
            {activeTab === 'scores' && (
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6">测评成绩走势</h2>
                {examScores.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    暂无测评成绩数据
                  </div>
                ) : (
                  <>
                    <div className="h-96 mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[...examScores].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="exam_date" 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis domain={[0, 100]} label={{ value: '成绩（%）', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString('zh-CN')}
                            formatter={(value: number) => [`${value}%`, '得分率']}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={2} name="得分率" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-3">
                      {examScores.map((score) => (
                        <div key={score.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 mb-1">
                                {score.exam_paper_title || score.exam_name}
                              </h4>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <span>得分: {score.score} / {score.total_score}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  score.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                  score.percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {score.percentage}%
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-slate-500 whitespace-nowrap ml-4">
                              {new Date(score.exam_date).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {previewInfo && (
        <DocumentPreview
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewInfo(null);
          }}
          previewInfo={previewInfo}
          resourceName={previewResourceName}
        />
      )}

      {selectedResource && (
        <PersonalizedContentModal
          isOpen={showPersonalizedModal}
          onClose={() => {
            setShowPersonalizedModal(false);
            // 关闭弹窗后重新加载数据以刷新学习记录
            loadData();
          }}
          resourceId={selectedResource.id}
          resourceName={selectedResource.resource_name || selectedResource.name}
        />
      )}

      {selectedResource && (
        <AIQuizModal
          isOpen={showQuizModal}
          onClose={() => {
            setShowQuizModal(false);
            // 关闭弹窗后重新加载数据以刷新学习记录和测评成绩
            loadData();
          }}
          resourceId={selectedResource.id}
          resourceName={selectedResource.resource_name || selectedResource.name}
        />
      )}

      {/* 作业详情Modal */}
      <StudentHomeworkModal
        isOpen={showHomeworkModal}
        onClose={() => {
          setShowHomeworkModal(false);
          setSelectedHomeworkId(null);
        }}
        homeworkId={selectedHomeworkId}
        onSubmitSuccess={() => {
          // 提交成功后刷新数据
          loadData();
        }}
      />

      {/* 课程问答浮动按钮 */}
      <CourseQAFloatingButton courseId={courseId} />
    </div>
  );
}
