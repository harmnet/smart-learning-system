"use client";

import { useEffect, useMemo, useState } from 'react';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BookOpen, CheckCircle2, Clock, Filter, TrendingUp } from 'lucide-react';
import teacherService, { TeacherAnalyticsOverview } from '@/services/teacher.service';

type RangeKey = 'week' | 'month' | 'term';

export default function TeacherAnalyticsPage() {
  const [range, setRange] = useState<RangeKey>('month');
  const [analytics, setAnalytics] = useState<TeacherAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const overview = await teacherService.getAnalyticsOverview(range);
        setAnalytics(overview);
      } catch (err) {
        setError('加载学情数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [range]);

  const stats = [
    {
      label: '课程数量',
      value: analytics?.stats.total_courses ?? 0,
      icon: <BookOpen className="h-5 w-5 text-blue-600" />
    },
    {
      label: '学生人数',
      value: analytics?.stats.student_count ?? 0,
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />
    },
    {
      label: '完成率',
      value: `${analytics?.stats.avg_completion_rate ?? 0}%`,
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />
    },
    {
      label: '学习时长',
      value: `${analytics?.stats.study_hours ?? 0}h`,
      icon: <Clock className="h-5 w-5 text-blue-600" />
    }
  ];

  const learningTrend = useMemo(
    () =>
      (analytics?.learning_trend || []).map((item) => ({
        name: item.date,
        value: Number((item.study_duration / 60).toFixed(1))
      })),
    [analytics]
  );

  const courseProgress = useMemo(
    () =>
      (analytics?.course_progress || []).map((course) => ({
        name: course.course_name,
        studyMinutes: course.study_minutes || 0,
        studyCount: course.study_count || 0
      })),
    [analytics]
  );

  const maxStudyMinutes = useMemo(
    () => Math.max(1, ...courseProgress.map((course) => course.studyMinutes)),
    [courseProgress]
  );

  const maxStudyCount = useMemo(
    () => Math.max(1, ...courseProgress.map((course) => course.studyCount)),
    [courseProgress]
  );

  return (
    <TeacherLayout>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">学情分析</h1>
              <p className="text-sm text-slate-600 mt-1">基于学生学习行为与成绩，洞察课程学习状态</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Filter className="h-4 w-4 text-blue-600" />
                全部课程
              </div>
              {(['week', 'month', 'term'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    range === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {key === 'week' ? '近7天' : key === 'month' ? '近30天' : '本学期'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 flex items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <div className="text-sm text-slate-500">{error}</div>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
                    </div>
                    <div className="text-sm text-slate-600">{item.label}</div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">学习活跃趋势</h2>
                      <p className="text-xs text-slate-500 mt-1">活跃度按学习时长与学习次数综合</p>
                    </div>
                    <span className="text-xs text-slate-500">数据源：教师端学情分析</span>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={learningTrend}>
                        <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">成绩分布</h2>
                      <p className="text-xs text-slate-500 mt-1">阶段性测验成绩</p>
                    </div>
                  </div>
                  <div className="h-64">
                    {analytics?.score_distribution && analytics.score_distribution.some((item) => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.score_distribution}>
                          <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" />
                          <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-500">
                        暂无成绩数据
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">课程学习情况</h2>
                      <p className="text-xs text-slate-500 mt-1">学习时长与学习次数对比</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">总课程 {courseProgress.length} 门</span>
                  </div>
                  <div className="space-y-4">
                    {courseProgress.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                        暂无课程学习数据
                      </div>
                    ) : (
                      courseProgress.map((course, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-slate-900">{course.name}</div>
                            <div className="text-xs text-slate-500">{course.studyMinutes} 分钟</div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>学习时长</span>
                                <span>{course.studyMinutes} 分钟</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-blue-600 rounded-full"
                                  style={{ width: `${(course.studyMinutes / maxStudyMinutes) * 100}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>学习次数</span>
                                <span>{course.studyCount} 次</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-2 bg-blue-300 rounded-full"
                                  style={{ width: `${(course.studyCount / maxStudyCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">学习预警</h2>
                      <p className="text-xs text-slate-500 mt-1">需要重点关注的学生</p>
                    </div>
                    <span className="text-xs text-blue-600 font-semibold">{analytics?.risk_students.length ?? 0} 位</span>
                  </div>
                  {analytics?.risk_students && analytics.risk_students.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.risk_students.map((student) => (
                        <div key={student.student_id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{student.student_name}</div>
                              <div className="text-xs text-slate-500">{student.student_no || '暂无学号'}</div>
                            </div>
                            <div className="text-xs text-slate-500">{student.reason}</div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>学习进度</span>
                              <span>{student.progress}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-2 bg-rose-500 rounded-full" style={{ width: `${student.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                      暂无预警学生
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
