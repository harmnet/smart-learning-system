"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: number;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  maxScore: number;
}

export default function AssignmentsPage() {
  const [assignments] = useState<Assignment[]>([
    { id: 1, title: '第一章测验', course: '计算机科学导论', dueDate: '2024-12-01', status: 'graded', score: 85, maxScore: 100 },
    { id: 2, title: '数据结构作业', course: '数据结构与算法', dueDate: '2024-12-05', status: 'submitted', maxScore: 100 },
    { id: 3, title: 'Web项目实战', course: 'Web开发基础', dueDate: '2024-12-10', status: 'pending', maxScore: 100 },
  ]);

  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(a => a.status === filter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold">待提交</span>;
      case 'submitted':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">已提交</span>;
      case 'graded':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">已批改</span>;
    }
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
              <Link href="/assignments" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                作业
              </Link>
              <Link href="/courses" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                课程中心
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">我的作业</h1>
          <p className="text-neutral-600">管理和提交你的课程作业</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { label: '全部', value: 'all' as const },
            { label: '待提交', value: 'pending' as const },
            { label: '已提交', value: 'submitted' as const },
            { label: '已批改', value: 'graded' as const },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filter === tab.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-neutral-900">{assignment.title}</h3>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <p className="text-sm text-neutral-500">{assignment.course}</p>
                </div>
                {assignment.status === 'graded' && assignment.score !== undefined && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{assignment.score}</div>
                    <div className="text-sm text-neutral-500">/ {assignment.maxScore}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>截止日期: {assignment.dueDate}</span>
                </div>

                {assignment.status === 'pending' ? (
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
                  >
                    开始作业
                  </Link>
                ) : assignment.status === 'submitted' ? (
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="px-6 py-2.5 border-2 border-neutral-200 text-neutral-700 rounded-xl text-sm font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                  >
                    查看详情
                  </Link>
                ) : (
                  <Link
                    href={`/assignments/${assignment.id}`}
                    className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-all"
                  >
                    查看批改
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <div className="text-xl font-semibold text-neutral-900 mb-2">暂无作业</div>
            <div className="text-neutral-500">当前没有{filter === 'all' ? '' : filter === 'pending' ? '待提交的' : filter === 'submitted' ? '已提交的' : '已批改的'}作业</div>
          </div>
        )}
      </main>
    </div>
  );
}

