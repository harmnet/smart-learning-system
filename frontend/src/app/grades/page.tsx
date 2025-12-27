"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Grade {
  id: number;
  course: string;
  type: string;
  score: number;
  maxScore: number;
  date: string;
  teacher: string;
  semester: string;
}

export default function GradesPage() {
  const [grades] = useState<Grade[]>([
    { id: 1, course: '计算机科学导论', type: '期末考试', score: 85, maxScore: 100, date: '2024-11-20', teacher: '王老师', semester: '2024秋季' },
    { id: 2, course: '数据结构与算法', type: '期中考试', score: 92, maxScore: 100, date: '2024-11-15', teacher: '李老师', semester: '2024秋季' },
    { id: 3, course: 'Web开发基础', type: '平时作业', score: 88, maxScore: 100, date: '2024-11-10', teacher: '张老师', semester: '2024秋季' },
    { id: 4, course: '计算机科学导论', type: '平时作业', score: 90, maxScore: 100, date: '2024-10-25', teacher: '王老师', semester: '2024秋季' },
  ]);

  const [filter, setFilter] = useState<'all' | string>('all');

  const filteredGrades = filter === 'all' 
    ? grades 
    : grades.filter(g => g.course === filter);

  const courses = Array.from(new Set(grades.map(g => g.course)));
  const avgScore = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore * 100), 0) / grades.length) : 0;
  const totalCredits = courses.length * 4; // 假设每门课4学分

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-blue-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-neutral-600';
    return 'text-red-600';
  };

  const getScoreLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return '优秀';
    if (percentage >= 80) return '良好';
    if (percentage >= 70) return '中等';
    if (percentage >= 60) return '及格';
    return '不及格';
  };

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
              <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                我的学习
              </Link>
              <Link href="/assignments" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                作业
              </Link>
              <Link href="/grades" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                成绩
              </Link>
            </nav>

            <Link href="/dashboard" className="p-2 text-neutral-600 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">我的成绩</h1>
          <p className="text-neutral-600">查看你的课程成绩和学习表现</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="text-sm mb-2 text-blue-100">平均分</div>
            <div className="text-4xl font-bold mb-1">{avgScore}</div>
            <div className="text-xs text-blue-100">总体表现良好</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="text-sm mb-2 text-neutral-600">课程数量</div>
            <div className="text-3xl font-bold text-neutral-900 mb-1">{courses.length}</div>
            <div className="text-xs text-neutral-500">本学期</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="text-sm mb-2 text-neutral-600">总学分</div>
            <div className="text-3xl font-bold text-neutral-900 mb-1">{totalCredits}</div>
            <div className="text-xs text-neutral-500">已修学分</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-100">
            <div className="text-sm mb-2 text-neutral-600">成绩记录</div>
            <div className="text-3xl font-bold text-neutral-900 mb-1">{grades.length}</div>
            <div className="text-xs text-neutral-500">条记录</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Grades List */}
          <div className="lg:col-span-2">
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                全部课程
              </button>
              {courses.map((course) => (
                <button
                  key={course}
                  onClick={() => setFilter(course)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    filter === course
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>

            {/* Grades Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">课程名称</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">类型</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">成绩</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">等级</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">日期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredGrades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900">{grade.course}</div>
                          <div className="text-xs text-neutral-500">{grade.teacher}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{grade.type}</td>
                        <td className="px-6 py-4">
                          <div className={`text-2xl font-bold ${getScoreColor(grade.score, grade.maxScore)}`}>
                            {grade.score}
                          </div>
                          <div className="text-xs text-neutral-500">/ {grade.maxScore}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            getScoreLevel(grade.score, grade.maxScore) === '优秀' ? 'bg-blue-100 text-blue-700' :
                            getScoreLevel(grade.score, grade.maxScore) === '良好' ? 'bg-blue-100 text-blue-700' :
                            getScoreLevel(grade.score, grade.maxScore) === '中等' ? 'bg-neutral-100 text-neutral-700' :
                            'bg-neutral-100 text-neutral-700'
                          }`}>
                            {getScoreLevel(grade.score, grade.maxScore)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{grade.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Score Distribution */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 mb-6">
              <h3 className="font-bold text-neutral-900 mb-4">成绩分布</h3>
              <div className="space-y-4">
                {[
                  { label: '优秀 (90-100)', count: grades.filter(g => (g.score / g.maxScore * 100) >= 90).length, color: 'bg-blue-500' },
                  { label: '良好 (80-89)', count: grades.filter(g => (g.score / g.maxScore * 100) >= 80 && (g.score / g.maxScore * 100) < 90).length, color: 'bg-blue-500' },
                  { label: '中等 (70-79)', count: grades.filter(g => (g.score / g.maxScore * 100) >= 70 && (g.score / g.maxScore * 100) < 80).length, color: 'bg-neutral-500' },
                  { label: '及格 (60-69)', count: grades.filter(g => (g.score / g.maxScore * 100) >= 60 && (g.score / g.maxScore * 100) < 70).length, color: 'bg-neutral-500' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-neutral-700">{item.label}</span>
                      <span className="font-bold text-neutral-900">{item.count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all`}
                        style={{ width: `${grades.length > 0 ? (item.count / grades.length * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-neutral-900 mb-3">学期排名</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">15</div>
                <div className="text-sm text-neutral-600 mb-4">/ 120 名学生</div>
                <div className="text-xs text-neutral-500">前 12.5% 🎉</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

