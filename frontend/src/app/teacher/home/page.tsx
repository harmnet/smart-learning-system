"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, ClipboardCheck, MessageCircle, PencilLine, UploadCloud } from 'lucide-react';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import teacherService, { TeacherInfo } from '@/services/teacher.service';
import courseQAService from '@/services/courseQA.service';
import courseService, { Course } from '@/services/course.service';
import teachingResourceService, {
  ResourceStats,
  TeachingResource,
} from '@/services/teachingResource.service';
import { TeacherQACourseGroup, TeacherQASession } from '@/types/courseQA';

type UserInfo = {
  full_name?: string;
  name?: string;
  username?: string;
};

type TeacherHomeworkSubmissionItem = {
  student_name?: string;
  course_title?: string;
  homework_title?: string;
};

function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDateLabel(date: Date) {
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日 ${week[date.getDay()]}`;
}

function parseMaybeDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getInitials(name: string) {
  const n = (name || '').trim();
  if (!n) return '课';
  // 中文名取最后2个字，英文取首字母
  if (/^[\u4e00-\u9fa5]+$/.test(n)) {
    return n.slice(-2);
  }
  return n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function TeacherHomePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [teacher, setTeacher] = useState<TeacherInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pendingHomeworkTotal, setPendingHomeworkTotal] = useState(0);
  const [latestPendingHomework, setLatestPendingHomework] = useState<TeacherHomeworkSubmissionItem | null>(null);

  const [qaUnreadTotal, setQaUnreadTotal] = useState(0);
  const [latestUnreadQaSession, setLatestUnreadQaSession] = useState<(TeacherQASession & { course_id: number; course_name: string }) | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);

  const [resourceStats, setResourceStats] = useState<ResourceStats | null>(null);
  const [latestResources, setLatestResources] = useState<TeachingResource[]>([]);

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const me = await teacherService.getCurrentTeacher();
        if (cancelled) return;
        setTeacher(me);

        const teacherId = me.id;

        const [qaCourses, allCourses, stats, resources] = await Promise.all([
          courseQAService.getTeacherQASessions(),
          courseService.getAll(0, 100, undefined, teacherId, false),
          teachingResourceService.getStats(teacherId),
          teachingResourceService.getAll(teacherId, 0, 5),
        ]);

        if (cancelled) return;

        setPendingHomeworkTotal(0);
        setLatestPendingHomework(null);

        // B：未读消息总数
        const flatSessions: Array<TeacherQASession & { course_id: number; course_name: string }> = [];
        (qaCourses || []).forEach((course: TeacherQACourseGroup) => {
          (course.students || []).forEach((s) => {
            flatSessions.push({
              ...s,
              course_id: course.course_id,
              course_name: course.course_name,
            });
          });
        });

        const unreadTotal = flatSessions.reduce((sum, s) => sum + (s.unread_count || 0), 0);
        setQaUnreadTotal(unreadTotal);

        const latestUnread = flatSessions
          .filter((s) => (s.unread_count || 0) > 0)
          .sort((a, b) => {
            const ta = parseMaybeDate(a.latest_message_time)?.getTime() || 0;
            const tb = parseMaybeDate(b.latest_message_time)?.getTime() || 0;
            return tb - ta;
          })[0];
        setLatestUnreadQaSession(latestUnread ?? null);

        setCourses(allCourses || []);
        setResourceStats(stats);
        setLatestResources(resources || []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.response?.data?.detail || e?.message || '加载失败');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const teacherName =
    teacher?.full_name ||
    teacher?.username ||
    user?.full_name ||
    user?.name ||
    user?.username ||
    '老师';

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {formatDateLabel(new Date())}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                {teacherName}，今天一起把教学任务写得更漂亮
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                管理课程、批改作业、答疑互动与资源沉淀，全都在这里一笔完成。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/teacher/courses/new"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <PencilLine className="h-4 w-4" />
                  新建课程
                </Link>
                <Link
                  href="/teacher/exam-management"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  创建考试
                </Link>
                <Link
                  href="/teacher/resources"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                >
                  <UploadCloud className="h-4 w-4" />
                  上传资源
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-80">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <div className="text-xs font-semibold text-slate-500">今日重点</div>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>待批改作业</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {loading ? '—' : pendingHomeworkTotal}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    {latestPendingHomework
                      ? `${latestPendingHomework.homework_title} · ${latestPendingHomework.student_name}`
                      : '暂无待批改作业'}
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span>未读答疑</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {loading ? '—' : qaUnreadTotal}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    {latestUnreadQaSession
                      ? `${latestUnreadQaSession.course_name} · ${latestUnreadQaSession.student_name}`
                      : '暂无未读答疑'}
                  </div>
                  <div className="pt-3 text-xs text-slate-500">
                    资源累计 {loading ? '—' : resourceStats?.total ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: '待批改作业',
              value: loading ? '—' : pendingHomeworkTotal,
              hint: latestPendingHomework ? `${latestPendingHomework.student_name} · ${latestPendingHomework.homework_title}` : '进入批改中心查看',
              icon: <ClipboardCheck className="h-5 w-5" />,
              href: '/teacher/grading',
              tone: 'from-blue-600/10 to-blue-100/60 text-blue-700'
            },
            {
              title: '未读答疑',
              value: loading ? '—' : qaUnreadTotal,
              hint: latestUnreadQaSession ? `${latestUnreadQaSession.course_name} · ${latestUnreadQaSession.student_name}` : '进入答疑中心查看',
              icon: <MessageCircle className="h-5 w-5" />,
              href: '/teacher/qa',
              tone: 'from-amber-500/10 to-amber-100/70 text-amber-700'
            },
            {
              title: '课程数',
              value: loading ? '—' : courses.length,
              hint: courses.length ? `${courses[0]?.title || courses[0]?.name}` : '去创建第一门课程',
              icon: <BookOpen className="h-5 w-5" />,
              href: '/teacher/courses',
              tone: 'from-emerald-500/10 to-emerald-100/70 text-emerald-700'
            },
            {
              title: '教学资源',
              value: loading ? '—' : resourceStats?.total ?? 0,
              hint: latestResources[0]?.resource_name || '上传资源，积累素材',
              icon: <UploadCloud className="h-5 w-5" />,
              href: '/teacher/resources',
              tone: 'from-violet-500/10 to-violet-100/70 text-violet-700'
            }
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_44px_rgba(15,23,42,0.08)] transition"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone}`}>
                  {card.icon}
                </div>
                <span className="text-xs text-slate-400">进入 →</span>
              </div>
              <div className="mt-4 text-sm text-slate-500">{card.title}</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</div>
              <div className="mt-2 text-xs text-slate-400 line-clamp-1">{card.hint}</div>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">今日任务速览</h2>
                  <p className="text-xs text-slate-400 mt-1">聚焦最新提交与未读消息</p>
                </div>
                {loading ? (
                  <span className="text-xs text-slate-400">加载中...</span>
                ) : error ? (
                  <span className="text-xs text-rose-600">{error}</span>
                ) : null}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Link
                  href="/teacher/grading"
                  className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 hover:bg-blue-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">作业批改</p>
                    <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-semibold text-blue-700">
                      {loading ? '…' : pendingHomeworkTotal}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900 line-clamp-1">
                    {latestPendingHomework ? latestPendingHomework.homework_title : loading ? '正在加载…' : '暂无待批改作业'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {latestPendingHomework ? `${latestPendingHomework.course_title} · ${latestPendingHomework.student_name}` : '进入批改中心查看全部'}
                  </p>
                </Link>

                <Link
                  href="/teacher/qa"
                  className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 hover:bg-amber-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">答疑消息</p>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                      {loading ? '…' : qaUnreadTotal}
                    </span>
                  </div>
                  <p className="mt-3 text-lg font-semibold text-slate-900 line-clamp-1">
                    {latestUnreadQaSession ? latestUnreadQaSession.student_name : loading ? '正在加载…' : '暂无未读答疑'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                    {latestUnreadQaSession ? `${latestUnreadQaSession.course_name} · ${latestUnreadQaSession.latest_message_content}` : '进入答疑中心查看全部'}
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-800">课程管理</h2>
                <Link href="/teacher/courses" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  全部课程 →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-16 rounded-2xl bg-slate-100" />
                    <div className="h-16 rounded-2xl bg-slate-100" />
                    <div className="h-16 rounded-2xl bg-slate-100" />
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((c) => (
                    <Link
                      key={c.id}
                      href={`/teacher/courses/${c.id}/view`}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 hover:border-blue-200 hover:bg-blue-50/40 transition"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                        {getInitials(c.title || c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 line-clamp-1">{c.title || c.name}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {c.code ? `课程编号：${c.code}` : '点击进入课程'}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">进入</span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    暂无课程
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800">快捷通道</h2>
              <p className="text-xs text-slate-400 mt-1">一键进入高频任务</p>
              <div className="mt-4 space-y-3">
                <Link href="/teacher/courses/new" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  新建课程
                  <PencilLine className="h-4 w-4 text-slate-400" />
                </Link>
                <Link href="/teacher/exam-management" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  创建考试
                  <ClipboardCheck className="h-4 w-4 text-slate-400" />
                </Link>
                <Link href="/teacher/qa" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  处理答疑
                  <MessageCircle className="h-4 w-4 text-slate-400" />
                </Link>
                <Link href="/teacher/resources" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  资源库
                  <UploadCloud className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-800">教学资源</h2>
                  <p className="text-xs text-slate-400 mt-1">最近更新素材</p>
                </div>
                <Link href="/teacher/resources" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  全部 →
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-12 rounded-xl bg-slate-100" />
                    <div className="h-12 rounded-xl bg-slate-100" />
                    <div className="h-12 rounded-xl bg-slate-100" />
                    <div className="h-12 rounded-xl bg-slate-100" />
                  </div>
                ) : latestResources.length > 0 ? (
                  latestResources.map((r) => (
                    <Link
                      key={r.id}
                      href="/teacher/resources"
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                        {getInitials(r.resource_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-700">{r.resource_name}</p>
                        <p className="truncate text-xs text-slate-400">{r.original_filename}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    暂无教学资源
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </TeacherLayout>
  );
}
