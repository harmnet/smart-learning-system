"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentHomeService, StudentDashboard, StudentExam, LearningCurve, TeacherInteraction } from '@/services/studentHome.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LearningProfileModal from '@/components/student/LearningProfileModal';

export default function StudentHomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [learningCurve, setLearningCurve] = useState<LearningCurve[]>([]);
  const [interactions, setInteractions] = useState<TeacherInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/auth/login');
      return;
    }

    // 验证用户角色
    try {
      const user = JSON.parse(userStr);
      setUserInfo(user);
      if (user.role !== 'student') {
        router.push('/auth/login');
        return;
      }
    } catch (e) {
      router.push('/auth/login');
      return;
    }

    loadAllData();
  }, [router]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      console.log('开始加载学生首页数据...');
      
      const [dashboardData, examsData, learningData, interactionsData] = await Promise.all([
        studentHomeService.getDashboard().catch(err => {
          console.error('Dashboard API error:', err);
          return { my_courses: [], recommended_courses: [], new_courses: [], stats: { total_courses: 0, completed_courses: 0, in_progress_courses: 0 } };
        }),
        studentHomeService.getMyExams().catch(err => {
          console.error('Exams API error:', err);
          return [];
        }),
        studentHomeService.getLearningCurve(7).catch(err => {
          console.error('Learning curve API error:', err);
          return [];
        }),
        studentHomeService.getInteractions(5).catch(err => {
          console.error('Interactions API error:', err);
          return [];
        })
      ]);
      
      console.log('Dashboard data:', dashboardData);
      console.log('My courses详细数据:', dashboardData.my_courses);
      console.log('New courses详细数据:', dashboardData.new_courses);
      console.log('Exams data:', examsData);
      console.log('Learning curve data:', learningData);
      console.log('Interactions data:', interactionsData);
      
      setDashboard(dashboardData);
      setExams(examsData);
      setLearningCurve(learningData);
      setInteractions(interactionsData);
    } catch (error: any) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleStartExam = (exam: StudentExam) => {
    if (exam.status === 'in_progress') {
      // 在新标签页打开考试
      window.open(`/student/exams/${exam.id}`, '_blank');
    }
  };

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-slate-100 text-slate-600';
      case 'in_progress':
        return 'bg-blue-100 text-blue-600';
      case 'expired':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getExamStatusText = (status: string) => {
    switch (status) {
      case 'not_started':
        return t.student.home.myExams.examNotStarted;
      case 'in_progress':
        return t.student.home.myExams.examInProgress;
      case 'expired':
        return t.student.home.myExams.examExpired;
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-xl animate-pulse"></div>
          </div>
          <p className="mt-6 text-slate-700 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-blue-50 to-pink-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-fuchsia-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      {/* Header with Glassmorphism */}
      <header className="relative backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-lg shadow-violet-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  Smart Learning
                </h1>
                <p className="text-xs text-slate-600 font-medium">{t.student.home.welcomeMessage}</p>
              </div>
            </div>

            {/* Center: Stats with Glass Effect */}
            <div className="flex items-center gap-4">
              {dashboard && (
                <>
                  <div className="group relative backdrop-blur-md bg-gradient-to-br from-violet-500/10 to-violet-600/10 hover:from-violet-500/20 hover:to-violet-600/20 rounded-2xl px-6 py-3 border border-violet-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="text-3xl font-bold bg-gradient-to-br from-violet-600 to-violet-800 bg-clip-text text-transparent">
                      {dashboard.stats.total_courses}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">{t.student.home.learningStats.totalCourses}</div>
                  </div>
                  <div className="group relative backdrop-blur-md bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 hover:from-fuchsia-500/20 hover:to-pink-600/20 rounded-2xl px-6 py-3 border border-fuchsia-200/50 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <div className="text-3xl font-bold bg-gradient-to-br from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                      {dashboard.stats.in_progress_courses}
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-1">{t.student.home.learningStats.inProgressCourses}</div>
                  </div>
                </>
              )}
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center gap-4">
              {userInfo && (
                <div className="flex items-center gap-3 backdrop-blur-md bg-white/50 rounded-2xl px-4 py-2 border border-white/50">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{userInfo.full_name || userInfo.username}</div>
                    <div className="text-xs text-slate-600 font-medium">
                      {dashboard?.class_info ? dashboard.class_info.class_name : t.student.home.welcome}
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative w-11 h-11 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold">
                        {(userInfo.full_name || userInfo.username || 'S').charAt(0).toUpperCase()}
                      </span>
                    </div>
                </div>
                </div>
              )}
                <button
                  onClick={handleLogout}
                className="group relative px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-red-600 backdrop-blur-md bg-white/50 hover:bg-red-50/80 rounded-xl border border-white/50 hover:border-red-200 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                <span className="relative z-10">{t.student.home.logout}</span>
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - 70% */}
          <div className="lg:col-span-2 space-y-6">
            {/* 我的课程 - Bento Grid Style */}
            <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-8 shadow-xl shadow-violet-100/50 hover:shadow-2xl hover:shadow-violet-200/50 transition-all duration-500">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-transparent to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                    {t.student.home.courses.title}
                  </h2>
        </div>
              </div>
              
              {dashboard && dashboard.my_courses.length > 0 ? (
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
                  {dashboard.my_courses.map((course, index) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group relative backdrop-blur-md bg-gradient-to-br from-white/90 to-white/70 rounded-2xl p-5 border border-white/50 hover:border-violet-300/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Hover Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-violet-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 transition-all duration-500 rounded-2xl"></div>
                      
                      {/* 悬停显示学习数据 */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md bg-gradient-to-br from-blue-50/95 to-violet-50/95 rounded-xl p-3 shadow-lg border border-violet-200/50 z-10">
                        <div className="text-xs font-semibold text-violet-700 mb-1.5">学习统计</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-slate-700 font-medium">
                              {course.study_minutes ? `${Math.round(course.study_minutes)} 分钟` : '未学习'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-slate-700 font-medium">
                              学习 {course.study_count || 0} 次
                            </span>
              </div>
            </div>
          </div>
          
                      <div className="relative flex gap-5">
                        {(course.cover_image || course.cover_id) ? (
                          <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                            <img
                              src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                              alt={course.title}
                              className="relative w-24 h-24 rounded-2xl object-cover ring-2 ring-white/50 group-hover:ring-violet-300 transition-all duration-500"
                            />
                          </div>
                        ) : (
                          <div className="relative flex-shrink-0 w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 group-hover:bg-clip-text transition-all duration-300 text-lg">
                            {course.title}
                          </h3>
                          {course.code && (
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{course.code}</div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {course.teacher_name && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-violet-50/80 px-2.5 py-1 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-xs font-medium text-violet-700">{course.teacher_name}</span>
                              </div>
                            )}
                            {course.credits && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-fuchsia-50/80 px-2.5 py-1 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-xs font-medium text-fuchsia-700">{course.credits} 学分</span>
                              </div>
                            )}
                            {course.course_type && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/80 px-2.5 py-1 rounded-lg">
                                <span className="text-xs font-medium text-blue-700">{course.course_type}</span>
                              </div>
                            )}
                            {course.is_public !== undefined && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-green-50/80 px-2.5 py-1 rounded-lg">
                                <span className="text-xs font-medium text-green-700">
                                  {course.is_public ? '公开课' : '私有课'}
                                </span>
                              </div>
                            )}
                            {course.major_name && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-amber-50/80 px-2.5 py-1 rounded-lg">
                                <span className="text-xs font-medium text-amber-700">{course.major_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
              </div>
            </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-slate-600">{t.student.home.courses.noCourses}</p>
          </div>
              )}
            </section>

            {/* 我的考试 */}
            <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-8 shadow-xl shadow-blue-100/50 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-md opacity-50"></div>
                    <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">{t.student.home.myExams.title}</h2>
                </div>
              </div>
              
              {exams.length > 0 ? (
                <div className="relative space-y-4">
                  {exams.slice(0, 5).map((exam, index) => (
                    <div
                      key={exam.id}
                      className="group relative backdrop-blur-md bg-gradient-to-br from-white/90 to-white/70 rounded-2xl p-5 border border-white/50 hover:border-blue-300/50 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-500/0 to-teal-500/0 group-hover:from-blue-500/5 group-hover:via-cyan-500/5 group-hover:to-teal-500/5 transition-all duration-500"></div>
                      
                      <div className="relative flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-slate-900 text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text transition-all duration-300">{exam.exam_name}</h3>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${getExamStatusColor(exam.status)} shadow-sm`}>
                              {getExamStatusText(exam.status)}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            {exam.course_name && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span>{exam.course_name}</span>
                              </div>
                            )}
                            {(exam.chapter_name || exam.section_name) && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>{exam.chapter_name}{exam.section_name ? ` / ${exam.section_name}` : ''}</span>
            </div>
                            )}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium text-slate-700">
                                  {new Date(exam.start_time).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{studentHomeService.formatTimeRemaining(exam.start_time, exam.end_time)}</span>
          </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>{exam.duration} {t.student.home.myExams.minutes}</span>
              </div>
            </div>
          </div>
        </div>
                        <button
                          onClick={() => handleStartExam(exam)}
                          disabled={exam.status !== 'in_progress'}
                          className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            exam.status === 'in_progress'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {exam.status === 'in_progress' ? t.student.home.myExams.startExam : t.student.home.myExams.viewExam}
                        </button>
                  </div>
                </div>
              ))}
            </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-600">{t.student.home.myExams.noExams}</p>
                </div>
              )}
            </section>

            {/* 你可能感兴趣的课程 */}
            {dashboard && dashboard.recommended_courses.length > 0 && (
              <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-8 shadow-xl shadow-green-100/50 hover:shadow-2xl hover:shadow-green-200/50 transition-all duration-500">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-green-500/20 via-transparent to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="relative flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl blur-md opacity-50"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">{t.student.home.recommended.title}</h2>
                  </div>
            </div>
                
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
                  {dashboard.recommended_courses.map((course, index) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group relative backdrop-blur-md bg-gradient-to-br from-white/90 to-white/70 rounded-2xl p-5 border border-white/50 hover:border-green-300/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-2"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/10 group-hover:to-emerald-500/10 transition-all duration-500"></div>
                      
                      {(course.cover_image || course.cover_id) ? (
                        <div className="relative mb-4 overflow-hidden rounded-2xl group-hover:scale-105 transition-transform duration-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-10"></div>
                          <img
                            src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                            alt={course.title}
                            className="w-full h-36 rounded-2xl object-cover ring-2 ring-white/50"
                          />
            </div>
          ) : (
                        <div className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
                          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
            </div>
          )}
                      <div className="relative">
                        <h3 className="font-bold text-slate-900 truncate text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-600 group-hover:to-emerald-600 group-hover:bg-clip-text transition-all duration-300">{course.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{course.introduction}</p>
                        <div className="space-y-2 mt-4">
                          {course.teacher_name && (
                            <div className="flex items-center gap-2 backdrop-blur-sm bg-green-50/80 px-3 py-1.5 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-xs font-medium text-green-700">{course.teacher_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {course.credits && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-emerald-50/80 px-2.5 py-1 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                                <span className="text-xs font-medium text-emerald-700">{course.credits} 学分</span>
                              </div>
                            )}
                            {course.learner_count !== undefined && (
                              <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/80 px-2.5 py-1 rounded-lg">
                                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-xs font-medium text-blue-700">{course.learner_count} 人</span>
        </div>
                            )}
            </div>
            </div>
            </div>
          </div>
                  ))}
                </div>
              </section>
        )}

            {/* 新上架课程 */}
            {dashboard && dashboard.new_courses.length > 0 && (
              <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-8 shadow-xl shadow-rose-100/50 hover:shadow-2xl hover:shadow-rose-200/50 transition-all duration-500">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-rose-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="relative flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl blur-md opacity-50"></div>
                      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent">{t.student.home.newCourses.title}</h2>
                  </div>
                </div>
                
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
                  {dashboard.new_courses.map((course, index) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group relative backdrop-blur-md bg-gradient-to-br from-white/90 to-white/70 rounded-2xl p-5 border border-white/50 hover:border-rose-300/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden hover:-translate-y-2"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* NEW Badge */}
                      <div className="absolute top-3 right-3 z-20 backdrop-blur-md bg-gradient-to-r from-rose-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                        NEW
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-pink-500/0 group-hover:from-rose-500/10 group-hover:to-pink-500/10 transition-all duration-500"></div>
                      
                      {(course.cover_image || course.cover_id) ? (
                        <div className="relative mb-4 overflow-hidden rounded-2xl group-hover:scale-105 transition-transform duration-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-10"></div>
                          <img
                            src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                            alt={course.title}
                            className="w-full h-36 rounded-2xl object-cover ring-2 ring-white/50"
                          />
                        </div>
                      ) : (
                        <div className="relative w-full h-36 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-500 flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-500">
                          <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <div className="relative">
                        <h3 className="font-bold text-slate-900 truncate text-lg group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-rose-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">{course.title}</h3>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-2 leading-relaxed">{course.introduction}</p>
                        <div className="space-y-2 mt-4">
                          {course.teacher_name && (
                            <div className="flex items-center gap-2 backdrop-blur-sm bg-rose-50/80 px-3 py-1.5 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="text-xs font-medium text-rose-700">{course.teacher_name}</span>
                            </div>
                          )}
                          {course.credits && (
                            <div className="flex items-center gap-1.5 backdrop-blur-sm bg-pink-50/80 px-2.5 py-1 rounded-lg">
                              <svg className="w-3.5 h-3.5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              <span className="text-xs font-medium text-pink-700">{course.credits} 学分</span>
                            </div>
                          )}
                        </div>
                      </div>
            </div>
                  ))}
            </div>
              </section>
            )}
          </div>

          {/* Right Panel - 30% */}
          <div className="lg:col-span-1 space-y-6">
            {/* 学习偏好测评按钮 */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="group relative w-full backdrop-blur-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white text-2xl animate-pulse">
                    🎯
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-white">学习偏好测评</h3>
                    <p className="text-sm text-white/80">了解您的学习习惯</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 学习曲线 */}
            <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-7 shadow-xl shadow-emerald-100/50 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-sm opacity-50"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">{t.student.home.learningCurve.title}</h3>
              </div>
              
              {learningCurve.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={learningCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                      dataKey="study_count" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', r: 3 }}
                      name="学习次数"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm text-slate-600">{t.student.home.learningCurve.noData}</p>
              </div>
            )}
            </section>

            {/* 老师互动 */}
            <section className="group relative backdrop-blur-xl bg-white/80 rounded-3xl border border-white/50 p-7 shadow-xl shadow-amber-100/50 hover:shadow-2xl hover:shadow-amber-200/50 transition-all duration-500">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 via-transparent to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="relative flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl blur-sm opacity-50"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
          </div>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">{t.student.home.teacherInteraction.title}</h3>
        </div>

            {interactions.length > 0 ? (
              <div className="relative space-y-3">
                {interactions.map((interaction, index) => (
                    <div
                      key={interaction.id}
                      className={`group relative backdrop-blur-md rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02] ${
                        interaction.is_read 
                          ? 'bg-white/60 border-white/50 hover:border-amber-200' 
                          : 'bg-gradient-to-br from-amber-50/90 to-orange-50/90 border-amber-200 shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {!interaction.is_read && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-sm opacity-50"></div>
                          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <span className="text-white text-sm font-bold">
                              {interaction.teacher_name.charAt(0)}
                            </span>
                          </div>
                      </div>
                        <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm font-bold text-slate-900">{interaction.teacher_name}</span>
                        <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-medium text-amber-700 backdrop-blur-sm bg-amber-50/50 px-2 py-0.5 rounded-lg">{interaction.course_name}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{interaction.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-slate-500 font-medium">
                              {new Date(interaction.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                      </div>
                    </div>
                      </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-slate-600">{t.student.home.teacherInteraction.noInteractions}</p>
              </div>
            )}
            </section>
          </div>
        </div>
      </div>

      {/* 学习偏好测评Modal */}
      <LearningProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
