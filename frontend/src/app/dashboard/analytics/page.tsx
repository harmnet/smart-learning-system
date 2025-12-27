"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  const stats = {
    totalStudyTime: 156,
    completedCourses: 2,
    avgScore: 87,
    streak: 7,
    weeklyData: [
      { day: '周一', hours: 3.5 },
      { day: '周二', hours: 2.8 },
      { day: '周三', hours: 4.2 },
      { day: '周四', hours: 3.1 },
      { day: '周五', hours: 2.5 },
      { day: '周六', hours: 5.0 },
      { day: '周日', hours: 4.5 },
    ],
    courseProgress: [
      { name: '计算机科学导论', progress: 68, score: 85 },
      { name: '数据结构与算法', progress: 45, score: 82 },
      { name: 'Web开发基础', progress: 90, score: 92 },
    ]
  };

  const maxHours = Math.max(...stats.weeklyData.map(d => d.hours));

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              <span className="font-medium">返回仪表盘</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">学习数据分析</h1>
          <p className="text-neutral-600">深入了解你的学习情况和进步轨迹</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: '学习时长', value: `${stats.totalStudyTime}h`, icon: '⏱️', color: 'from-blue-500 to-blue-600', change: '+12%' },
            { label: '完成课程', value: stats.completedCourses, icon: '✅', color: 'from-blue-500 to-blue-600', change: '+2' },
            { label: '平均分数', value: stats.avgScore, icon: '📊', color: 'from-blue-600 to-blue-700', change: '+5分' },
            { label: '连续学习', value: `${stats.streak}天`, icon: '🔥', color: 'from-neutral-500 to-neutral-600', change: '保持中' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div className="text-3xl font-bold text-neutral-900 mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Study Time Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 border border-neutral-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">学习时长统计</h2>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="space-y-4">
              {stats.weeklyData.map((data, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium text-neutral-600">{data.day}</div>
                  <div className="flex-1 h-10 bg-neutral-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-end pr-3 transition-all duration-500"
                      style={{ width: `${(data.hours / maxHours) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white">{data.hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200 text-sm text-neutral-600">
              <div className="flex items-center justify-between">
                <span>本周总计</span>
                <span className="font-bold text-neutral-900">
                  {stats.weeklyData.reduce((sum, d) => sum + d.hours, 0).toFixed(1)} 小时
                </span>
              </div>
            </div>
          </div>

          {/* Course Progress */}
          <div className="bg-white rounded-2xl p-8 border border-neutral-100">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">课程进度</h2>
            <div className="space-y-6">
              {stats.courseProgress.map((course, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-900">{course.name}</span>
                    <span className="text-sm font-bold text-blue-600">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    平均分: <span className="font-semibold text-neutral-700">{course.score}分</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-8 bg-white rounded-2xl p-8 border border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">学习成就</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: '🏆', title: '优秀学员', desc: '成绩优异' },
              { icon: '🔥', title: '学习达人', desc: '连续学习7天' },
              { icon: '📚', title: '知识探索者', desc: '完成10门课程' },
              { icon: '⭐', title: '满分王者', desc: '获得3次满分' },
            ].map((achievement, idx) => (
              <div key={idx} className="p-6 bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl border border-blue-100 text-center">
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <div className="font-bold text-neutral-900 mb-1">{achievement.title}</div>
                <div className="text-xs text-neutral-600">{achievement.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

