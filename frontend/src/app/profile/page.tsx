"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: '张三',
    studentId: '2024001',
    major: '计算机科学与技术',
    class: '计科2401班',
    grade: '2024级',
    email: 'zhangsan@example.com',
    phone: '138****1234',
    idCard: '320***********1234',
    enrollmentDate: '2024-09-01',
    avatar: ''
  });

  const learningStats = {
    totalHours: 156,
    completedCourses: 2,
    ongoingCourses: 3,
    avgScore: 87,
    rank: 15,
    totalStudents: 120,
    certificates: 2,
    achievements: 8
  };

  const recentActivities = [
    { id: 1, type: 'course', title: '完成了《Web开发基础》第五章学习', time: '2小时前', icon: '📚' },
    { id: 2, type: 'assignment', title: '提交了《数据结构》课程作业', time: '5小时前', icon: '📝' },
    { id: 3, type: 'achievement', title: '获得"学习达人"成就', time: '1天前', icon: '🏆' },
    { id: 4, type: 'grade', title: '《计算机导论》期末成绩：85分', time: '2天前', icon: '📊' },
  ];

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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4">
                {profile.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">{profile.name}</h2>
              <p className="text-neutral-600 mb-4">{profile.studentId}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <span>{profile.major}</span>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
              >
                {isEditing ? '保存修改' : '编辑资料'}
              </button>
            </div>

            {/* Learning Stats */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-100">
              <h3 className="font-bold text-neutral-900 mb-4">学习统计</h3>
              <div className="space-y-4">
                {[
                  { label: '学习时长', value: `${learningStats.totalHours}h`, icon: '⏱️' },
                  { label: '完成课程', value: learningStats.completedCourses, icon: '✅' },
                  { label: '进行中', value: learningStats.ongoingCourses, icon: '📚' },
                  { label: '平均分', value: learningStats.avgScore, icon: '📊' },
                ].map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stat.icon}</span>
                      <span className="text-sm text-neutral-600">{stat.label}</span>
                    </div>
                    <span className="font-bold text-neutral-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranking */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-neutral-900 mb-3 text-center">班级排名</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-600 mb-2">{learningStats.rank}</div>
                <div className="text-sm text-neutral-600 mb-2">/ {learningStats.totalStudents} 名</div>
                <div className="text-xs text-neutral-500">前 {Math.round(learningStats.rank / learningStats.totalStudents * 100)}% 🎉</div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-neutral-900">基本信息</h3>
                {isEditing && (
                  <span className="text-sm text-blue-600">编辑模式</span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { label: '姓名', value: profile.name, key: 'name' },
                  { label: '学号', value: profile.studentId, key: 'studentId', disabled: true },
                  { label: '专业', value: profile.major, key: 'major', disabled: true },
                  { label: '班级', value: profile.class, key: 'class', disabled: true },
                  { label: '年级', value: profile.grade, key: 'grade', disabled: true },
                  { label: '邮箱', value: profile.email, key: 'email' },
                  { label: '手机号', value: profile.phone, key: 'phone' },
                  { label: '身份证号', value: profile.idCard, key: 'idCard', disabled: true },
                  { label: '入学日期', value: profile.enrollmentDate, key: 'enrollmentDate', disabled: true },
                ].map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      {field.label}
                    </label>
                    {isEditing && !field.disabled ? (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-neutral-50 rounded-xl text-neutral-900">
                        {field.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">我的成就</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '🏆', title: '优秀学员', desc: '成绩优异', unlocked: true },
                  { icon: '🔥', title: '学习达人', desc: '连续学习7天', unlocked: true },
                  { icon: '📚', title: '知识探索者', desc: '完成10门课程', unlocked: false },
                  { icon: '⭐', title: '满分王者', desc: '获得3次满分', unlocked: false },
                  { icon: '💪', title: '勤奋之星', desc: '学习100小时', unlocked: true },
                  { icon: '🎯', title: '目标达成', desc: '完成月度目标', unlocked: true },
                  { icon: '👑', title: '班级第一', desc: '排名第一', unlocked: false },
                  { icon: '🌟', title: '全勤奖', desc: '全勤一学期', unlocked: false },
                ].map((achievement, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border text-center transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-blue-50 to-blue-50 border-blue-100'
                        : 'bg-neutral-50 border-neutral-200 opacity-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="font-bold text-neutral-900 text-sm mb-1">{achievement.title}</div>
                    <div className="text-xs text-neutral-600">{achievement.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-8 border border-neutral-100">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">最近动态</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors">
                    <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 mb-1">{activity.title}</p>
                      <p className="text-xs text-neutral-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

