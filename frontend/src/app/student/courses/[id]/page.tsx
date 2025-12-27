'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import ResourcePreviewModal from '@/components/teacher/ResourcePreviewModal';
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
      'submit_homework': '提交作业'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-slate-500">加载中...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">Smart Learning</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Info Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Course Cover */}
            <div className="flex-shrink-0 w-full md:w-64 h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl overflow-hidden shadow-md">
              {course.cover_image ? (
                <img
                  src={course.cover_image}
                  alt={course.name || course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-400">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Course Details */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-slate-900 mb-3">{course.name || course.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-4">
                {course.course_type && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    course.course_type === 'required'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {course.course_type === 'required' ? '必修课' : '选修课'}
                  </span>
                )}
                {course.hours && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {course.hours}学时
                  </span>
                )}
                {course.credits && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                    {course.credits}学分
                  </span>
                )}
                {course.main_teacher_name && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    {course.main_teacher_name}
                  </span>
                )}
                {course.major_name && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    {course.major_name}
                  </span>
                )}
              </div>
              
              {course.introduction && (
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">课程简介</h3>
                  <p className="text-slate-700 leading-relaxed">{course.introduction}</p>
                </div>
              )}
              
              {course.objectives && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">授课目标</h3>
                  <p className="text-slate-700 leading-relaxed">{course.objectives}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('outline')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'outline'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                📚 课程大纲
              </button>
              <button
                onClick={() => setActiveTab('behaviors')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'behaviors'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                📝 学习记录
              </button>
              <button
                onClick={() => setActiveTab('duration')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'duration'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                📊 学习时长
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`flex-1 px-6 py-4 text-sm font-bold transition-colors ${
                  activeTab === 'scores'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                🎯 测评成绩
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
                      <div key={chapter.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex items-center justify-between w-full p-5 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <h3 className="text-lg font-bold text-slate-800">
                            {chapterIndex + 1}. {chapter.title}
                          </h3>
                          <svg
                            className={`w-5 h-5 text-slate-500 transform transition-transform ${
                              expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                        {expandedChapters.has(chapter.id) && (
                          <div className="p-4 bg-white border-t border-slate-200">
                            {chapter.sections && chapter.sections.length > 0 ? (
                              <div className="space-y-3">
                                {chapter.sections.map((section, sectionIndex) => (
                                  <div key={section.id} className="ml-4 border border-slate-100 rounded-lg overflow-hidden">
                                    <button
                                      onClick={() => toggleSection(section.id)}
                                      className="flex items-center justify-between w-full p-4 bg-white hover:bg-slate-50 transition-colors"
                                    >
                                      <h4 className="text-md font-semibold text-slate-700">
                                        {chapterIndex + 1}.{sectionIndex + 1} {section.title}
                                      </h4>
                                      <svg
                                        className={`w-4 h-4 text-slate-400 transform transition-transform ${
                                          expandedSections.has(section.id) ? 'rotate-90' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                      </svg>
                                    </button>
                                    {expandedSections.has(section.id) && (
                                      <div className="p-3 ml-4 bg-slate-50 border-t border-slate-100 space-y-2">
                                        {section.resources && section.resources.length > 0 ? (
                                          section.resources.map((resource) => (
                                            <button
                                              key={resource.id}
                                              onClick={() => handleResourceClick(resource)}
                                              className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
                                            >
                                              <span className="text-lg">📄</span>
                                              <span className="text-sm">{resource.name}</span>
                                            </button>
                                          ))
                                        ) : (
                                          <p className="text-sm text-slate-500 p-2">该小节暂无资源</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-500 p-4">该章节暂无小节内容</p>
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
    </div>
  );
}
