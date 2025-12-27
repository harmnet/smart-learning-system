"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { studentService, StudentCourse, StudentProfile } from '@/services/student.service';
import { courseCoverService } from '@/services/courseCover.service';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentHomePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<StudentCourse[]>([]);
  const [newCourses, setNewCourses] = useState<StudentCourse[]>([]);
  const [learningData, setLearningData] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

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
      const userInfo = JSON.parse(userStr);
      if (userInfo.role !== 'student') {
        router.push('/auth/login');
        return;
      }
    } catch (e) {
      router.push('/auth/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, coursesData] = await Promise.all([
        studentService.getProfile(),
        studentService.getCourses()
      ]);
      setUser(profileData);
      setCourses(coursesData);
      
      // 模拟推荐课程数据（取前3个课程作为推荐）
      setRecommendedCourses(coursesData.slice(0, 3));
      
      // 模拟新上架课程数据（取后3个课程作为新课程）
      setNewCourses(coursesData.slice(-3));
      
      // 模拟最近一周学习数据
      const mockLearningData = [
        { day: '周一', studyCount: 3, studyDuration: 45 },
        { day: '周二', studyCount: 5, studyDuration: 75 },
        { day: '周三', studyCount: 2, studyDuration: 30 },
        { day: '周四', studyCount: 4, studyDuration: 60 },
        { day: '周五', studyCount: 6, studyDuration: 90 },
        { day: '周六', studyCount: 4, studyDuration: 50 },
        { day: '周日', studyCount: 3, studyDuration: 40 },
      ];
      setLearningData(mockLearningData);
      
      // 模拟老师互动数据
      const mockInteractions = [
        {
          id: 1,
          teacher: '李老师',
          course: '高等数学',
          message: '你的作业完成得很好，继续保持！',
          time: '2小时前',
          avatar: 'L'
        },
        {
          id: 2,
          teacher: '王教授',
          course: '数据结构',
          message: '上次课堂讨论很精彩，有些深入的问题我们可以课后交流。',
          time: '5小时前',
          avatar: 'W'
        },
        {
          id: 3,
          teacher: '张老师',
          course: '英语',
          message: '记得明天的口语测试，提前准备一下。',
          time: '1天前',
          avatar: 'Z'
        },
      ];
      setInteractions(mockInteractions);
      
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
      setCoursesLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  // 渲染课程卡片的辅助函数
  const renderCourseCard = (course: StudentCourse) => (
    <div
      key={course.id}
      onClick={() => router.push(`/student/courses/${course.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer overflow-hidden group"
    >
      {/* 课程封面 */}
      <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 overflow-hidden">
        {course.cover_image || course.cover_id ? (
          <img
            src={studentService.getCoverUrl(course.cover_image, course.cover_id)}
            alt={course.name || course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
        )}
        {/* 课程类型标签 */}
        {course.course_type && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              course.course_type === 'required' 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'
            }`}>
              {course.course_type === 'required' ? t.student.home.courses.required : t.student.home.courses.elective}
            </span>
          </div>
        )}
      </div>

      {/* 课程信息 */}
      <div className="p-6">
        <h3 className="text-lg font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {course.name || course.title}
        </h3>
        
        {/* 授课教师 */}
        {course.teachers && course.teachers.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-sm text-slate-600 truncate">
              {course.teachers[0]?.name || course.teachers[0]?.username}
              {course.teachers.length > 1 && ` ${t.common.etc}${course.teachers.length}${t.student.home.courses.teachers}`}
            </span>
          </div>
        )}

        {/* 课程信息 */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          {course.hours && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {course.hours}{t.student.home.courses.hours}
            </span>
          )}
          {course.credits && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {course.credits}{t.student.home.courses.credits}
            </span>
          )}
        </div>

        {/* 开始学习按钮 */}
        <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40">
          {t.student.home.courses.startLearning}
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-sm text-slate-500">{t.common.loading}</p>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-slate-900">{t.student.home.title}</span>
            </div>

            <div className="flex items-center gap-4">
              {/* 语言切换器 */}
              <LanguageSwitcher />
              
              {/* 通知图标 */}
              <button 
                className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                title={t.student.home.notifications}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* 用户信息 */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user?.full_name?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="hidden md:block">
                  <div className="text-sm font-semibold text-slate-900">{user?.full_name || user?.username}</div>
                  <div className="text-xs text-slate-500">{user?.class_name || '学生'}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 text-slate-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title={t.student.home.logout}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            {t.student.home.welcome}，{user?.full_name || user?.username}！
          </h1>
          <p className="text-lg text-slate-600">{t.student.home.welcomeMessage}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{courses.length}</div>
            <div className="text-sm text-slate-500">{t.student.home.stats.myCourses}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">0</div>
            <div className="text-sm text-slate-500">{t.student.home.stats.completed}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">0h</div>
            <div className="text-sm text-slate-500">{t.student.home.stats.studyTime}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">0</div>
            <div className="text-sm text-slate-500">{t.student.home.stats.certificates}</div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-900">{t.student.home.courses.title}</h2>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 animate-pulse">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-slate-200 rounded mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t.student.home.courses.noCourses}</h3>
              <p className="text-slate-500 mb-6">{t.student.home.courses.noCoursesMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(renderCourseCard)}
            </div>
          )}
        </div>

        {/* Recommended Courses */}
        {recommendedCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">{t.student.home.recommended.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedCourses.map(renderCourseCard)}
            </div>
          </div>
        )}

        {/* New Courses */}
        {newCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900">{t.student.home.newCourses.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newCourses.map(renderCourseCard)}
            </div>
          </div>
        )}

        {/* Learning Curve */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{t.student.home.learningCurve.title}</h2>
            {learningData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={learningData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="studyCount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name={t.student.home.learningCurve.studyCount}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="studyDuration" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name={t.student.home.learningCurve.studyDuration}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-500">
                {t.student.home.learningCurve.noData}
              </div>
            )}
          </div>
        </div>

        {/* Teacher Interactions */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6">{t.student.home.teacherInteraction.title}</h2>
            {interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    {/* 老师头像 */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {interaction.avatar}
                      </div>
                    </div>
                    
                    {/* 消息内容 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900">{interaction.teacher}</span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-sm text-blue-600">{interaction.course}</span>
                      </div>
                      <p className="text-slate-700 mb-2">{interaction.message}</p>
                      <span className="text-xs text-slate-500">{interaction.time}</span>
                    </div>
                    
                    {/* 回复按钮 */}
                    <button className="flex-shrink-0 self-start px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                      {t.student.home.teacherInteraction.send}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                {t.student.home.teacherInteraction.noInteractions}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

