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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 pointer-events-none"></div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-slate-200/80 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Smart Learning</h1>
                <p className="text-xs text-slate-500">{t.student.home.welcomeMessage}</p>
              </div>
            </div>

            {/* Center: Stats */}
            <div className="hidden md:flex items-center gap-6">
              {dashboard && (
                <>
                  <div className="text-center px-4 py-2 rounded-xl border border-dashed border-slate-200 bg-white/80 shadow-sm">
                    <div className="text-2xl font-bold text-slate-900">{dashboard.stats.total_courses}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.student.home.learningStats.totalCourses}</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200/80"></div>
                  <div className="text-center px-4 py-2 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{dashboard.stats.in_progress_courses}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{t.student.home.learningStats.inProgressCourses}</div>
                  </div>
                </>
              )}
            </div>

            {/* Right: User Info and Logout */}
            <div className="flex items-center gap-3">
              {userInfo && (
                <div className="hidden sm:flex items-center gap-3 bg-white/80 rounded-xl px-3 py-2 border border-slate-200/80 shadow-sm">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {(userInfo.full_name || userInfo.username || 'S').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{userInfo.full_name || userInfo.username}</div>
                    <div className="text-xs text-slate-500">
                      {dashboard?.class_info ? dashboard.class_info.class_name : t.student.home.welcome}
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg border border-dashed border-slate-300 hover:border-red-200 transition-colors duration-200 cursor-pointer"
              >
                {t.student.home.logout}
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
            {/* 我的课程 */}
            <section className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100/80 shadow-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  {t.student.home.courses.title}
                </h2>
              </div>
              
              {dashboard && dashboard.my_courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboard.my_courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-blue-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(37,99,235,0.15)] transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex gap-4">
                        {(course.cover_image || course.cover_id) ? (
                          <img
                            src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                            alt={course.title}
                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-200/60"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                          {course.code && (
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{course.code}</div>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {course.teacher_name && (
                              <div className="flex items-center gap-1 text-xs text-slate-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>{course.teacher_name}</span>
                              </div>
                            )}
                            {course.credits && (
                              <div className="text-xs text-slate-500">
                                {course.credits} 学分
                              </div>
                            )}
                          </div>
                          {(course.study_minutes || course.study_count) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              {course.study_minutes && (
                                <span>{Math.round(course.study_minutes)} 分钟</span>
                              )}
                              {course.study_count && (
                                <span>学习 {course.study_count} 次</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-slate-600">{t.student.home.courses.noCourses}</p>
                </div>
              )}
            </section>

            {/* 我的考试 */}
            <section className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/80 shadow-sm">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{t.student.home.myExams.title}</h2>
              </div>
              
              {exams.length > 0 ? (
                <div className="space-y-3">
                  {exams.slice(0, 5).map((exam) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(79,70,229,0.15)] transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 truncate">{exam.exam_name}</h3>
                            <span className={`px-2 py-1 rounded-md text-xs font-medium border border-slate-200/60 ${getExamStatusColor(exam.status)}`}>
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
                            <div className="flex items-center gap-4 flex-wrap text-xs">
                              <span className="text-slate-500">
                                {new Date(exam.start_time).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                              </span>
                              <span className="text-slate-500">{exam.duration} {t.student.home.myExams.minutes}</span>
                            </div>
                          </div>
                        </div>
                        {exam.status === 'in_progress' && (
                          <button
                            onClick={() => handleStartExam(exam)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg border border-indigo-500/30 shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-md transition-colors duration-200 cursor-pointer flex-shrink-0"
                          >
                            {t.student.home.myExams.startExam}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-600">{t.student.home.myExams.noExams}</p>
                </div>
              )}
            </section>

            {/* 你可能感兴趣的课程 */}
            {dashboard && dashboard.recommended_courses.length > 0 && (
              <section className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/80 shadow-sm">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{t.student.home.recommended.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboard.recommended_courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-emerald-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(16,185,129,0.15)] transition-all duration-200 cursor-pointer"
                    >
                      {(course.cover_image || course.cover_id) ? (
                        <img
                          src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                          alt={course.title}
                          className="w-full h-32 rounded-xl object-cover mb-3 border border-slate-200/60"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 border border-emerald-500/30">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{course.introduction}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {course.teacher_name && <span>{course.teacher_name}</span>}
                        {course.credits && <span>· {course.credits} 学分</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 新上架课程 */}
            {dashboard && dashboard.new_courses.length > 0 && (
              <section className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)] hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)] transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100/80 shadow-sm">
                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{t.student.home.newCourses.title}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboard.new_courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => router.push(`/student/courses/${course.id}`)}
                      className="group relative bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:border-rose-300 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(244,63,94,0.18)] transition-all duration-200 cursor-pointer"
                    >
                      <div className="absolute top-2 right-2 bg-rose-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm border border-rose-400/40">
                        NEW
                      </div>
                      {(course.cover_image || course.cover_id) ? (
                        <img
                          src={studentHomeService.getCoverUrl(course.cover_image, course.cover_id)}
                          alt={course.title}
                          className="w-full h-32 rounded-xl object-cover mb-3 border border-slate-200/60"
                        />
                      ) : (
                        <div className="w-full h-32 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-3 border border-rose-500/30">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-rose-600 transition-colors mb-1">{course.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{course.introduction}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {course.teacher_name && <span>{course.teacher_name}</span>}
                        {course.credits && <span>· {course.credits} 学分</span>}
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
              className="group w-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 border border-white/30 shadow-[0_18px_45px_rgba(37,99,235,0.35)] hover:shadow-[0_22px_50px_rgba(37,99,235,0.45)] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-white">学习偏好测评</h3>
                    <p className="text-xs text-white/90">了解您的学习习惯</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* 学习曲线 */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100/80 shadow-sm">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{t.student.home.learningCurve.title}</h3>
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
                        borderRadius: '10px',
                        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)'
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
                <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm text-slate-600">{t.student.home.learningCurve.noData}</p>
              </div>
            )}
            </section>

            {/* 老师互动 */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100/80 shadow-sm">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900">{t.student.home.teacherInteraction.title}</h3>
              </div>

              {interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className={`relative rounded-2xl p-3 border shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition-colors duration-200 ${
                        interaction.is_read 
                          ? 'bg-white border-slate-200/80' 
                          : 'bg-amber-50 border-amber-200/80'
                      }`}
                    >
                      {!interaction.is_read && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {interaction.teacher_name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-slate-900">{interaction.teacher_name}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{interaction.course_name}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed mb-2">{interaction.message}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {new Date(interaction.created_at).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
