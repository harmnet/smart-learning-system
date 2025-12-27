"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: number;
  name: string;
  progress: number;
  total_chapters: number;
  completed_chapters: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '计算机科学导论', progress: 68, total_chapters: 12, completed_chapters: 8 },
    { id: 2, name: '数据结构与算法', progress: 45, total_chapters: 15, completed_chapters: 7 },
    { id: 3, name: 'Web开发基础', progress: 90, total_chapters: 10, completed_chapters: 9 },
  ]);
  const [stats, setStats] = useState({
    totalCourses: 8,
    completedCourses: 2,
    studyHours: 156,
    certificates: 2
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Get user info (mock for now)
    const userInfo = {
      name: '张三',
      major: '计算机科学与技术',
      studentId: '2024001',
      avatar: null
    };
    setUser(userInfo);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Smart Learning</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                我的学习
              </Link>
              <Link href="/courses" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                课程中心
              </Link>
              <Link href="/assignments" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                作业
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-neutral-600 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-neutral-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block">
                  <div className="text-sm font-semibold text-neutral-900">{user.name}</div>
                  <div className="text-xs text-neutral-500">{user.major}</div>
                </div>
                <button onClick={handleLogout} className="ml-2 p-2 text-neutral-600 hover:text-red-600 transition-colors">
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
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            你好，{user.name} 👋
          </h1>
          <p className="text-neutral-600">继续你的学习之旅，今天也要加油哦！</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: '学习课程', value: stats.totalCourses, icon: '📚', color: 'from-blue-500 to-blue-600' },
            { label: '已完成', value: stats.completedCourses, icon: '✅', color: 'from-blue-500 to-blue-600' },
            { label: '学习时长', value: `${stats.studyHours}h`, icon: '⏱️', color: 'from-blue-600 to-blue-700' },
            { label: '获得证书', value: stats.certificates, icon: '🏆', color: 'from-neutral-500 to-neutral-600' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl opacity-10`}></div>
              </div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Courses Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">我的课程</h2>
              <Link href="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                查看全部 →
              </Link>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <Link 
                  key={course.id} 
                  href={`/learn/${course.id}`}
                  className="block bg-white rounded-2xl p-6 border border-neutral-100 hover:border-blue-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-2">
                        {course.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                          </svg>
                          {course.completed_chapters}/{course.total_chapters} 章节
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{course.progress}%</div>
                      <div className="text-xs text-neutral-500">完成度</div>
                    </div>
                  </div>

                  <div className="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Streak */}
            <div className="bg-gradient-to-br from-neutral-500 to-blue-500 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🔥</span>
                <div>
                  <div className="text-3xl font-bold">7天</div>
                  <div className="text-sm text-neutral-100">连续学习</div>
                </div>
              </div>
              <p className="text-sm text-neutral-50">
                太棒了！继续保持每日学习的好习惯
              </p>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">待办事项</h3>
              <div className="space-y-3">
                {[
                  { title: '数据结构作业', due: '2天后', urgent: true },
                  { title: 'Web项目提交', due: '5天后', urgent: false },
                  { title: '算法测验', due: '1周后', urgent: false },
                ].map((task, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${task.urgent ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-900">{task.title}</div>
                      <div className="text-xs text-neutral-500">{task.due}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">快捷操作</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-sm font-medium text-neutral-700">查看课程表</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span className="text-sm font-medium text-neutral-700">下载学习资料</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-neutral-50 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                  <span className="text-sm font-medium text-neutral-700">联系老师</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

