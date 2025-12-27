"use client";

import { useState } from 'react';
import Link from 'next/link';

interface Student {
  id: number;
  name: string;
  studentId: string;
  class: string;
  avgScore: number;
  attendance: number;
  assignments: { completed: number; total: number };
  lastActive: string;
}

export default function TeacherStudentsPage() {
  const [students] = useState<Student[]>([
    { id: 1, name: '张三', studentId: '2024001', class: '计科2401班', avgScore: 85, attendance: 95, assignments: { completed: 8, total: 10 }, lastActive: '2小时前' },
    { id: 2, name: '李四', studentId: '2024002', class: '计科2401班', avgScore: 92, attendance: 100, assignments: { completed: 10, total: 10 }, lastActive: '1天前' },
    { id: 3, name: '王五', studentId: '2024003', class: '计科2402班', avgScore: 78, attendance: 88, assignments: { completed: 7, total: 10 }, lastActive: '3天前' },
  ]);

  const [selectedClass, setSelectedClass] = useState<'all' | string>('all');
  const classes = Array.from(new Set(students.map(s => s.class)));

  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(s => s.class === selectedClass);

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
              <span className="text-xl font-bold text-neutral-900">教师工作台</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/teacher/resources" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                资源库
              </Link>
              <Link href="/teacher/courses" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                课程管理
              </Link>
              <Link href="/teacher/students" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                学生管理
              </Link>
              <Link href="/teacher/grading" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                批改作业
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <button className="p-2 text-neutral-600 hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                王
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">学生管理</h1>
          <p className="text-neutral-600">查看和管理班级学生的学习情况</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: '学生总数', value: students.length, icon: '👥', color: 'from-blue-500 to-blue-600' },
            { label: '平均分', value: Math.round(students.reduce((sum, s) => sum + s.avgScore, 0) / students.length), icon: '📊', color: 'from-blue-500 to-blue-600' },
            { label: '平均出勤', value: `${Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length)}%`, icon: '✅', color: 'from-blue-600 to-blue-700' },
            { label: '作业完成', value: `${Math.round(students.reduce((sum, s) => sum + (s.assignments.completed / s.assignments.total * 100), 0) / students.length)}%`, icon: '📝', color: 'from-neutral-500 to-neutral-600' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-100">
              <span className="text-3xl mb-3 block">{stat.icon}</span>
              <div className="text-2xl font-bold text-neutral-900 mb-1">{stat.value}</div>
              <div className="text-sm text-neutral-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Class Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedClass('all')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              selectedClass === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
            }`}
          >
            全部班级
          </button>
          {classes.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedClass === cls
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>

        {/* Students Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-neutral-900 text-lg mb-1">{student.name}</h3>
                  <p className="text-sm text-neutral-500 mb-1">{student.studentId}</p>
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                    {student.class}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">平均分</span>
                  <span className="font-bold text-blue-600">{student.avgScore}分</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">出勤率</span>
                  <span className="font-bold text-blue-600">{student.attendance}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">作业完成</span>
                  <span className="font-bold text-blue-600">{student.assignments.completed}/{student.assignments.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">最后活跃</span>
                  <span className="text-neutral-500">{student.lastActive}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors">
                  查看详情
                </button>
                <button className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

