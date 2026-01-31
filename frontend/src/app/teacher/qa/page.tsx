"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { courseQAService } from '@/services/courseQA.service';
import { TeacherQACourseGroup } from '@/types/courseQA';
import { MessageCircle, Clock, User, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TeacherQAPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<TeacherQACourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseQAService.getTeacherQASessions();
      setCourses(data);
    } catch (err: any) {
      console.error('加载问答列表失败:', err);
      setError(err.response?.data?.detail || err.message || '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return date.toLocaleDateString('zh-CN');
    } catch {
      return timeStr;
    }
  };

  const handleViewConversation = (sessionId: number) => {
    router.push(`/teacher/qa/sessions/${sessionId}`);
  };

  return (
    <TeacherLayout>
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.teacher.qa.title}</h1>
            <p className="text-slate-600">{t.teacher.qa.subtitle}</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* 加载状态 */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-slate-500 text-lg">{t.teacher.qa.noSessions}</p>
              <p className="text-slate-400 text-sm mt-2">{t.teacher.qa.noSessionsDesc}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-blue-200 transition-colors"
                >
                  {/* 课程标题 */}
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{course.course_name}</h2>
                        <p className="text-sm text-slate-500">{course.students.length}{t.teacher.qa.students}</p>
                      </div>
                    </div>
                  </div>

                  {/* 学生列表 */}
                  <div className="divide-y divide-slate-100">
                    {course.students.map((student) => (
                      <div
                        key={student.session_id}
                        onClick={() => handleViewConversation(student.session_id)}
                        className="px-6 py-4 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* 左侧：学生信息和消息内容 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-slate-900">{student.student_name}</span>
                                  <span className="text-sm text-slate-500">({student.student_no})</span>
                                  {student.unread_count > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                                      {student.unread_count}{t.teacher.qa.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {student.latest_message_content || '暂无消息'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 右侧：时间和操作 */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>{formatRelativeTime(student.latest_message_time)}</span>
                              </div>
                              <div className="text-xs text-slate-400">
                                共 {student.total_messages} 条消息
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
