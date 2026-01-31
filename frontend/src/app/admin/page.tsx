"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminDashboardService, DashboardStatistics } from '@/services/adminDashboard.service';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminDashboardService.getDashboardStatistics();
      setStatistics(data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
      setError(err.message || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 bg-emerald-50';
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      case 'error':
        return 'text-rose-600 bg-rose-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return t.admin.dashboard.systemHealth.healthy;
      case 'warning':
        return t.admin.dashboard.systemHealth.warning;
      case 'error':
        return t.admin.dashboard.systemHealth.error;
      default:
        return status;
    }
  };

  const getStatusDot = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-rose-600 text-lg mb-4">❌ {error || '数据加载失败'}</div>
          <button
            onClick={loadStatistics}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const statisticsCards = [
    {
      title: t.admin.dashboard.statistics.teachers,
      value: statistics.teachers_count,
      link: '/admin/teachers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.students,
      value: statistics.students_count,
      link: '/admin/students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.majors,
      value: statistics.majors_count,
      link: '/admin/majors',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.classes,
      value: statistics.classes_count,
      link: '/admin/classes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.courses,
      value: statistics.courses_count,
      link: '/admin/courses',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.exams,
      value: statistics.exams_count,
      link: '/admin/exams',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.activeToday,
      value: statistics.active_users_today,
      link: '#',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.statistics.activeWeek,
      value: statistics.active_users_week,
      link: '#',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
  ];

  const quickActions = [
    {
      title: t.admin.dashboard.quickActions.addTeacher,
      link: '/admin/teachers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.quickActions.addStudent,
      link: '/admin/students',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.quickActions.createMajor,
      link: '/admin/majors',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.quickActions.manageClasses,
      link: '/admin/classes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.quickActions.courseCovers,
      link: '/admin/course-covers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: t.admin.dashboard.quickActions.llmConfigs,
      link: '/admin/llm-configs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {new Date().toLocaleDateString()}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {t.admin.dashboard.welcome}，{t.admin.dashboard.title}
            </h1>
            <p className="mt-3 text-sm text-slate-600">系统概览与数据统计</p>
          </div>
          <div className="w-full lg:w-80">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <div className="text-xs font-semibold text-slate-500">今日重点</div>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span>{t.admin.dashboard.statistics.activeToday}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {statistics.active_users_today.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t.admin.dashboard.statistics.activeWeek}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {statistics.active_users_week.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statisticsCards.map((card, index) => (
          <div
            key={index}
            onClick={() => card.link !== '#' && router.push(card.link)}
            className={`bg-white border border-slate-200/80 rounded-3xl p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)] transition ${
              card.link !== '#' ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              {t.admin.dashboard.trends.newUsers}
            </h3>
            <span className="text-xs text-slate-500">{t.admin.dashboard.trends.last30Days}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={statistics.new_users_trend}>
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
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0f172a" 
                strokeWidth={2}
                dot={{ fill: '#0f172a', r: 3 }}
                activeDot={{ r: 5 }}
                name="新增用户"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              {t.admin.dashboard.systemHealth.title}
            </h3>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/70 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {t.admin.dashboard.systemHealth.database}
                  </p>
                  <p className={`text-xs font-medium ${getStatusColor(statistics.system_health.database_status)} px-2 py-0.5 rounded-md inline-block mt-0.5`}>
                    {getStatusText(statistics.system_health.database_status)}
                  </p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusDot(statistics.system_health.database_status)}`} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/70 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {t.admin.dashboard.systemHealth.api}
                  </p>
                  <p className={`text-xs font-medium ${getStatusColor(statistics.system_health.api_status)} px-2 py-0.5 rounded-md inline-block mt-0.5`}>
                    {getStatusText(statistics.system_health.api_status)}
                  </p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusDot(statistics.system_health.api_status)}`} />
            </div>

            {statistics.system_health.storage_usage !== null && statistics.system_health.storage_usage !== undefined && (
              <div className="p-3 rounded-2xl border border-slate-200/70 bg-slate-50/70">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {t.admin.dashboard.systemHealth.storage}
                    </p>
                    <p className="text-xs text-slate-600">
                      {statistics.system_health.storage_usage}% {t.admin.dashboard.systemHealth.used}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      statistics.system_health.storage_usage < 70 ? 'bg-emerald-500' :
                      statistics.system_health.storage_usage < 90 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${statistics.system_health.storage_usage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {t.admin.dashboard.trends.activity}
          </h3>
          <span className="text-xs text-slate-500">{t.admin.dashboard.trends.last30Days}</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={statistics.user_activity_trend}>
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
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar 
              dataKey="count" 
              fill="#475569" 
              radius={[4, 4, 0, 0]}
              name="活跃用户"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {t.admin.dashboard.quickActions.title}
          </h3>
          <span className="text-xs text-slate-500">Quick</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.link)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-slate-300 shadow-sm transition"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                {action.icon}
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
