'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ResourcePreviewModal from '@/components/teacher/ResourcePreviewModal';
import PersonalizedContentModal from '@/components/student/PersonalizedContentModal';
import AIQuizModal from '@/components/student/AIQuizModal';
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
  homework: any[];
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
  const [previewResource, setPreviewResource] = useState<CourseResource | null>(null);
  const [showPersonalizedModal, setShowPersonalizedModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<CourseResource | null>(null);
  const [activeTab, setActiveTab] = useState<'outline' | 'behaviors' | 'duration' | 'scores'>('outline');

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

  const handleResourceClick = (resource: CourseResource) => {
    // 将CourseResource转换为ResourcePreviewModal期望的格式
    // 后端已经返回了完整的资源信息，包括teacher_id和resource_type
    const previewResource: any = {
      id: resource.id,
      teacher_id: resource.teacher_id || 1,  // 后端应该返回teacher_id
      resource_name: resource.resource_name || resource.name,
      resource_type: resource.resource_type || resource.type || resource.file_type,  // 确保resource_type正确
      original_filename: resource.original_filename || resource.name,
      file_type: resource.file_type || resource.resource_type || resource.type,
      file_size: resource.file_size || 0
    };
    
    // 确保resource_type是小写，与ResourcePreviewModal的检查逻辑一致
    if (previewResource.resource_type) {
      previewResource.resource_type = previewResource.resource_type.toLowerCase();
    }
    
    setPreviewResource(previewResource);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-violet-600 border-r-fuchsia-600"></div>
          </div>
          <p className="mt-6 text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">加载精彩内容中...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-blue-100">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">课程未找到</h2>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 relative">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-xl bg-white/70 border-b border-white/50 sticky top-0 z-50 shadow-lg shadow-violet-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()} 
                className="group relative p-2 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <svg className="relative w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-11 h-11 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  {/* 2D扁平化书本图标 */}
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="4" width="14" height="16" rx="1" fill="white" opacity="0.9"/>
                    <rect x="7" y="4" width="10" height="16" rx="1" fill="white"/>
                    <line x1="12" y1="4" x2="12" y2="20" stroke="#8B5CF6" strokeWidth="1.5"/>
                    <rect x="9" y="8" width="2" height="1" rx="0.5" fill="#C084FC"/>
                    <rect x="9" y="11" width="2" height="1" rx="0.5" fill="#C084FC"/>
                    <rect x="13" y="8" width="2" height="1" rx="0.5" fill="#C084FC"/>
                    <rect x="13" y="11" width="2" height="1" rx="0.5" fill="#C084FC"/>
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">Smart Learning</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info Card */}
        <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 rounded-3xl border border-white/50 p-8 mb-8 shadow-2xl shadow-violet-100/50 hover:shadow-3xl hover:shadow-violet-200/50 transition-all duration-500 overflow-hidden">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative flex flex-col md:flex-row gap-8">
            {/* Course Cover */}
            <div className="relative flex-shrink-0 w-full md:w-80 h-48 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.name || course.title}
                  className="relative w-full h-full object-cover ring-2 ring-white/50 group-hover:ring-violet-300 transition-all duration-500"
                />
              ) : (
                <div className="relative w-full h-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-500 flex items-center justify-center">
                  {/* 2D扁平化书本图标 */}
                  <svg className="w-24 h-24" viewBox="0 0 80 80" fill="none">
                    <rect x="15" y="12" width="50" height="56" rx="3" fill="white" opacity="0.95"/>
                    <rect x="20" y="12" width="40" height="56" rx="3" fill="white"/>
                    <line x1="40" y1="12" x2="40" y2="68" stroke="#A855F7" strokeWidth="2"/>
                    <rect x="25" y="22" width="10" height="3" rx="1.5" fill="#C084FC"/>
                    <rect x="25" y="30" width="10" height="3" rx="1.5" fill="#C084FC"/>
                    <rect x="25" y="38" width="10" height="3" rx="1.5" fill="#C084FC"/>
                    <rect x="45" y="22" width="10" height="3" rx="1.5" fill="#E879F9"/>
                    <rect x="45" y="30" width="10" height="3" rx="1.5" fill="#E879F9"/>
                    <rect x="45" y="38" width="10" height="3" rx="1.5" fill="#E879F9"/>
                    <circle cx="40" cy="55" r="5" fill="#F0ABFC"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Course Details */}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-black bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent mb-4 leading-tight">
                {course.name || course.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {course.course_type && (
                  <div className="relative group/badge">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur opacity-0 group-hover/badge:opacity-50 transition-opacity"></div>
                    <span className={`relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-md ${
                      course.course_type === 'required'
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    }`}>
                      {/* 2D扁平化星星图标 */}
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1L9.5 6H14.5L10.5 9L12 14L8 11L4 14L5.5 9L1.5 6H6.5L8 1Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round"/>
                      </svg>
                      {course.course_type === 'required' ? '必修课' : '选修课'}
                    </span>
                  </div>
                )}
                {course.hours && (
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-violet-50/80 px-3 py-1.5 rounded-xl shadow-sm">
                    {/* 2D扁平化时钟图标 */}
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="7" fill="#8B5CF6" opacity="0.2"/>
                      <circle cx="8" cy="8" r="6" fill="#8B5CF6"/>
                      <path d="M8 4V8L10.5 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs font-semibold text-violet-700">{course.hours} 学时</span>
                  </div>
                )}
                {course.credits && (
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-fuchsia-50/80 px-3 py-1.5 rounded-xl shadow-sm">
                    {/* 2D扁平化奖章图标 */}
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="6" r="4" fill="#D946EF"/>
                      <path d="M5 9L4 14L8 12L12 14L11 9" fill="#D946EF" opacity="0.8"/>
                      <circle cx="8" cy="6" r="2" fill="white"/>
                    </svg>
                    <span className="text-xs font-semibold text-fuchsia-700">{course.credits} 学分</span>
                  </div>
                )}
                {course.main_teacher_name && (
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/80 px-3 py-1.5 rounded-xl shadow-sm">
                    {/* 2D扁平化教师图标 */}
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="4" r="3" fill="#3B82F6"/>
                      <path d="M3 14C3 11 5 9 8 9C11 9 13 11 13 14" fill="#3B82F6" opacity="0.8"/>
                      <rect x="7" y="12" width="2" height="2" rx="0.5" fill="white"/>
                    </svg>
                    <span className="text-xs font-semibold text-blue-700">{course.main_teacher_name}</span>
                  </div>
                )}
                {course.major_name && (
                  <div className="flex items-center gap-1.5 backdrop-blur-sm bg-amber-50/80 px-3 py-1.5 rounded-xl shadow-sm">
                    {/* 2D扁平化建筑图标 */}
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="5" width="10" height="9" rx="0.5" fill="#F59E0B"/>
                      <rect x="3" y="3" width="10" height="2" fill="#F59E0B" opacity="0.6"/>
                      <rect x="5" y="7" width="2" height="2" rx="0.5" fill="white"/>
                      <rect x="9" y="7" width="2" height="2" rx="0.5" fill="white"/>
                      <rect x="5" y="10" width="2" height="2" rx="0.5" fill="white"/>
                      <rect x="9" y="10" width="2" height="2" rx="0.5" fill="white"/>
                    </svg>
                    <span className="text-xs font-semibold text-amber-700">{course.major_name}</span>
                  </div>
                )}
              </div>
              
              {course.introduction && (
                <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 border border-violet-100/50">
                  <h3 className="flex items-center gap-2 text-base font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                    {/* 2D扁平化书本图标 */}
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="3" width="12" height="14" rx="1" fill="url(#book-gradient)"/>
                      <line x1="10" y1="3" x2="10" y2="17" stroke="white" strokeWidth="1"/>
                      <rect x="6" y="6" width="2" height="1" rx="0.5" fill="white" opacity="0.8"/>
                      <rect x="6" y="9" width="2" height="1" rx="0.5" fill="white" opacity="0.8"/>
                      <rect x="12" y="6" width="2" height="1" rx="0.5" fill="white" opacity="0.8"/>
                      <rect x="12" y="9" width="2" height="1" rx="0.5" fill="white" opacity="0.8"/>
                      <defs>
                        <linearGradient id="book-gradient" x1="4" y1="3" x2="16" y2="17">
                          <stop offset="0%" stopColor="#8B5CF6"/>
                          <stop offset="100%" stopColor="#D946EF"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    课程简介
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{course.introduction}</p>
                </div>
              )}
              
              {course.objectives && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-cyan-50/50 border border-blue-100/50">
                  <h3 className="flex items-center gap-2 text-base font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-2">
                    {/* 2D扁平化目标图标 */}
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" fill="url(#target-gradient)" opacity="0.3"/>
                      <circle cx="10" cy="10" r="5" fill="url(#target-gradient)" opacity="0.6"/>
                      <circle cx="10" cy="10" r="2" fill="url(#target-gradient)"/>
                      <defs>
                        <linearGradient id="target-gradient" x1="2" y1="2" x2="18" y2="18">
                          <stop offset="0%" stopColor="#3B82F6"/>
                          <stop offset="100%" stopColor="#06B6D4"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    授课目标
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-sm">{course.objectives}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 rounded-3xl border border-white/50 overflow-hidden shadow-2xl shadow-violet-100/50">
          <div className="relative border-b border-violet-100/50 p-2 bg-gradient-to-r from-violet-50/30 to-fuchsia-50/30">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('outline')}
                className={`group relative flex-1 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  activeTab === 'outline'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/50'
                    : 'text-slate-600 hover:bg-white/50 hover:text-violet-600'
                }`}
              >
                {activeTab === 'outline' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur-md opacity-50"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {/* 2D扁平化文档图标 */}
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <rect x="5" y="2" width="10" height="16" rx="1" fill={activeTab === 'outline' ? 'white' : '#8B5CF6'}/>
                    <line x1="7" y1="6" x2="13" y2="6" stroke={activeTab === 'outline' ? '#8B5CF6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                    <line x1="7" y1="9" x2="13" y2="9" stroke={activeTab === 'outline' ? '#8B5CF6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                    <line x1="7" y1="12" x2="11" y2="12" stroke={activeTab === 'outline' ? '#8B5CF6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  课程大纲
                </span>
              </button>
              <button
                onClick={() => setActiveTab('behaviors')}
                className={`group relative flex-1 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  activeTab === 'behaviors'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-600 hover:bg-white/50 hover:text-blue-600'
                }`}
              >
                {activeTab === 'behaviors' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur-md opacity-50"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {/* 2D扁平化笔记图标 */}
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="3" width="12" height="14" rx="1" fill={activeTab === 'behaviors' ? 'white' : '#3B82F6'}/>
                    <circle cx="6.5" cy="6" r="0.8" fill={activeTab === 'behaviors' ? '#3B82F6' : 'white'}/>
                    <line x1="8" y1="6" x2="14" y2="6" stroke={activeTab === 'behaviors' ? '#3B82F6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                    <circle cx="6.5" cy="9" r="0.8" fill={activeTab === 'behaviors' ? '#3B82F6' : 'white'}/>
                    <line x1="8" y1="9" x2="14" y2="9" stroke={activeTab === 'behaviors' ? '#3B82F6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                    <circle cx="6.5" cy="12" r="0.8" fill={activeTab === 'behaviors' ? '#3B82F6' : 'white'}/>
                    <line x1="8" y1="12" x2="14" y2="12" stroke={activeTab === 'behaviors' ? '#3B82F6' : 'white'} strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  学习记录
                </span>
              </button>
              <button
                onClick={() => setActiveTab('duration')}
                className={`group relative flex-1 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  activeTab === 'duration'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/50'
                    : 'text-slate-600 hover:bg-white/50 hover:text-green-600'
                }`}
              >
                {activeTab === 'duration' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-md opacity-50"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {/* 2D扁平化柱状图图标 */}
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="12" width="3" height="5" rx="0.5" fill={activeTab === 'duration' ? 'white' : '#10B981'}/>
                    <rect x="7" y="8" width="3" height="9" rx="0.5" fill={activeTab === 'duration' ? 'white' : '#10B981'}/>
                    <rect x="11" y="5" width="3" height="12" rx="0.5" fill={activeTab === 'duration' ? 'white' : '#10B981'}/>
                    <rect x="15" y="10" width="3" height="7" rx="0.5" fill={activeTab === 'duration' ? 'white' : '#10B981'}/>
                  </svg>
                  学习时长
                </span>
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`group relative flex-1 px-6 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                  activeTab === 'scores'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/50'
                    : 'text-slate-600 hover:bg-white/50 hover:text-amber-600'
                }`}
              >
                {activeTab === 'scores' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur-md opacity-50"></div>
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {/* 2D扁平化奖杯图标 */}
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                    <path d="M6 4H14V8C14 10.2 12.2 12 10 12C7.8 12 6 10.2 6 8V4Z" fill={activeTab === 'scores' ? 'white' : '#F59E0B'}/>
                    <rect x="3" y="4" width="2" height="3" rx="0.5" fill={activeTab === 'scores' ? 'white' : '#F59E0B'} opacity="0.7"/>
                    <rect x="15" y="4" width="2" height="3" rx="0.5" fill={activeTab === 'scores' ? 'white' : '#F59E0B'} opacity="0.7"/>
                    <rect x="8" y="12" width="4" height="3" rx="0.5" fill={activeTab === 'scores' ? 'white' : '#F59E0B'}/>
                    <rect x="6" y="15" width="8" height="2" rx="1" fill={activeTab === 'scores' ? 'white' : '#F59E0B'}/>
                  </svg>
                  测评成绩
                </span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Course Outline Tab */}
            {activeTab === 'outline' && (
              <div>
                {chapters.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    该课程暂无大纲内容
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chapters.map((chapter, chapterIndex) => (
                      <div key={chapter.id} className="group/chapter relative backdrop-blur-md bg-gradient-to-br from-white/80 to-white/60 border border-violet-100/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover/chapter:opacity-100 transition-opacity duration-300"></div>
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="relative flex items-center justify-between w-full p-6 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold shadow-lg">
                              {chapterIndex + 1}
                            </div>
                            <h3 className="text-lg font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                              {chapter.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3">
                            {chapter.sections && chapter.sections.length > 0 && (
                              <span className="px-3 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold">
                                {chapter.sections.length} 个小节
                              </span>
                            )}
                            <svg
                              className={`w-6 h-6 text-violet-600 transform transition-transform duration-300 ${
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
                          <div className="relative p-5 bg-gradient-to-br from-white/50 to-violet-50/30 border-t border-violet-100/50">
                            {chapter.sections && chapter.sections.length > 0 ? (
                              <div className="space-y-3">
                                {chapter.sections.map((section, sectionIndex) => (
                                  <div key={section.id} className="group/section ml-6 backdrop-blur-sm bg-white/70 border border-blue-100/50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                                    <button
                                      onClick={() => toggleSection(section.id)}
                                      className="flex items-center justify-between w-full p-4 transition-all duration-300"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                          {chapterIndex + 1}.{sectionIndex + 1}
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800">
                                          {section.title}
                                        </h4>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {section.resources && section.resources.length > 0 && (
                                          <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold">
                                            {section.resources.length} 个资源
                                          </span>
                                        )}
                                        <svg
                                          className={`w-5 h-5 text-blue-600 transform transition-transform duration-300 ${
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
                                      <div className="p-4 ml-6 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 border-t border-blue-100/50 space-y-2">
                                        {section.resources && section.resources.length > 0 ? (
                                          section.resources.map((resource) => (
                                            <div
                                              key={resource.id}
                                              className="relative flex items-center justify-between gap-3 w-full p-3 rounded-xl bg-white/70 border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-300"
                                            >
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                                                  {/* 2D扁平化文档图标 */}
                                                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                                    <rect x="7" y="4" width="10" height="16" rx="1" fill="white"/>
                                                    <path d="M17 4H15V2C15 1.4 14.6 1 14 1H10C9.4 1 9 1.4 9 2V4H7C6.4 4 6 4.4 6 5V19C6 19.6 6.4 20 7 20H17C17.6 20 18 19.6 18 19V5C18 4.4 17.6 4 17 4Z" fill="white" opacity="0.9"/>
                                                    <rect x="9" y="8" width="6" height="1" rx="0.5" fill="#3B82F6"/>
                                                    <rect x="9" y="11" width="6" height="1" rx="0.5" fill="#3B82F6"/>
                                                    <rect x="9" y="14" width="4" height="1" rx="0.5" fill="#3B82F6"/>
                                                  </svg>
                                                </div>
                                                <span className="text-sm font-medium text-slate-800 truncate">
                                                  {resource.name}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                  onClick={() => handleResourceClick(resource)}
                                                  className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                                >
                                                  查看
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setSelectedResource(resource);
                                                    setShowPersonalizedModal(true);
                                                  }}
                                                  className="px-3 py-1.5 bg-violet-500 text-white text-xs font-medium rounded-lg hover:bg-violet-600 transition-colors"
                                                >
                                                  个性化学习
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setSelectedResource(resource);
                                                    setShowQuizModal(true);
                                                  }}
                                                  className="px-3 py-1.5 bg-fuchsia-500 text-white text-xs font-medium rounded-lg hover:bg-fuchsia-600 transition-colors"
                                                >
                                                  AI测评
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-sm text-slate-500 p-3 text-center">该小节暂无资源</p>
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
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-6">学习行为记录</h2>
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
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-6">学习时长走势（最近30天）</h2>
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
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-6">测评成绩走势</h2>
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

      {previewResource && (
        <ResourcePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          resource={previewResource}
          previewUrl={previewResource?.file_url || previewResource?.file_path || ''}
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
    </div>
  );
}
