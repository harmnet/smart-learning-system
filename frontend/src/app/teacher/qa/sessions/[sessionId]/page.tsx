"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeacherLayout from '@/components/teacher/TeacherLayout';
import { courseQAService } from '@/services/courseQA.service';
import { CourseQAMessage } from '@/types/courseQA';
import { ArrowLeft, Send, Bot, UserCircle, Loader2, AlertCircle, MessageCircle, User, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TeacherQASessionPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLanguage();
  const sessionId = parseInt(params.sessionId as string);

  const [messages, setMessages] = useState<CourseQAMessage[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ name: string; no: string } | null>(null);
  const [courseInfo, setCourseInfo] = useState<{ id: number; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessionId) {
      loadMessages();
    }
  }, [sessionId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseQAService.getSessionMessages(sessionId);
      setMessages(response.messages);
      setStudentInfo({
        name: response.student_name,
        no: response.student_no
      });
      setCourseInfo({
        id: response.course_id,
        name: response.course_name
      });

      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('加载消息失败:', err);
      setError(err.response?.data?.detail || err.message || '加载消息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReply = async () => {
    if (!replyContent.trim() || sending) return;

    // 找到要回复的消息（通常是学生发送给教师的消息或AI回复）
    const messageToReply = messages
      .filter(m => m.is_sent_to_teacher)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!messageToReply || !courseInfo) {
      setError('无法确定要回复的消息');
      return;
    }

    const content = replyContent.trim();
    setReplyContent('');
    setSending(true);
    setError(null);

    try {
      const newMessage = await courseQAService.teacherReply(
        courseInfo.id,
        messageToReply.id,
        content
      );

      // 重新加载消息列表
      await loadMessages();
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('发送回复失败:', err);
      setError(err.response?.data?.detail || err.message || '发送回复失败，请稍后重试');
      setReplyContent(content); // 恢复输入内容
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleReply();
    }
  };


  return (
    <TeacherLayout>
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-5xl mx-auto">
          {/* 返回按钮和标题 */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.teacher.qa.backToList}</span>
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.teacher.qa.conversationDetail}</h1>
            <div className="flex items-center gap-4 text-slate-600">
              {courseInfo && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {t.teacher.qa.course}: {courseInfo.name}
                </span>
              )}
              {studentInfo && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {t.teacher.qa.student}: {studentInfo.name} {studentInfo.no && `(${studentInfo.no})`}
                </span>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* 对话窗口 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <MessageCircle className="w-16 h-16 mb-4 text-slate-300" />
                  <p className="text-sm">{t.teacher.qa.noMessages}</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'teacher' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        message.sender_type === 'teacher'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none shadow-md'
                          : message.sender_type === 'ai'
                          ? 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                          : 'bg-white border border-violet-100 text-slate-800 rounded-bl-none shadow-sm'
                      } transition-shadow hover:shadow-md`}
                    >
                      {/* 发送者信息 */}
                      <div className="flex items-center gap-2 mb-1">
                        {message.sender_type === 'ai' && (
                          <Bot className="w-4 h-4 text-violet-600" />
                        )}
                        {message.sender_type === 'teacher' && (
                          <UserCircle className="w-4 h-4 text-white/80" />
                        )}
                        {message.sender_type === 'student' && (
                          <User className="w-4 h-4 text-violet-600" />
                        )}
                        <span className={`text-xs font-medium ${
                          message.sender_type === 'teacher' ? 'text-white/80' : 'opacity-80'
                        }`}>
                          {message.sender_name || '未知用户'}
                        </span>
                      </div>

                      {/* 消息内容 */}
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        message.sender_type === 'teacher' ? 'text-white' : 'text-slate-800'
                      }`}>
                        {message.content}
                      </p>

                      {/* 时间戳 */}
                      <p className={`text-xs mt-2 ${
                        message.sender_type === 'teacher' ? 'text-white/60' : 'opacity-60'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 回复输入框 */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-end gap-3">
                <textarea
                  ref={inputRef}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.teacher.qa.replyPlaceholder}
                  rows={2}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  disabled={sending}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || sending}
                  className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  aria-label="发送回复"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
