'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, UserCircle, Loader2, AlertCircle, MessageCircle } from 'lucide-react';
import { CourseQAMessage, Teacher } from '@/types/courseQA';
import { courseQAService } from '@/services/courseQA.service';

interface CourseQAChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
}

// 使用 Message 类型作为别名，便于扩展临时消息
type Message = CourseQAMessage;

const CourseQAChatWindow: React.FC<CourseQAChatWindowProps> = ({
  isOpen,
  onClose,
  courseId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载消息列表
  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedMessages = await courseQAService.getMessages(courseId);
      setMessages(loadedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('加载消息失败:', err);
      setError('加载消息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载教师列表
  const loadTeachers = async () => {
    try {
      const loadedTeachers = await courseQAService.getTeachers(courseId);
      setTeachers(loadedTeachers);
    } catch (err: any) {
      console.error('加载教师列表失败:', err);
    }
  };

  // 初始化：加载会话和消息
  useEffect(() => {
    if (isOpen) {
      courseQAService.getSession(courseId)
        .then(() => {
          loadMessages();
          loadTeachers();
        })
        .catch((err: any) => {
          console.error('获取会话失败:', err);
          const errorMsg = err.response?.data?.detail || err.message || '获取会话失败';
          setError(errorMsg);
          // 如果是数据库表不存在的错误，显示更友好的提示
          if (errorMsg.includes('数据库表尚未创建') || errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
            setError('数据库表尚未创建，请联系管理员执行数据库迁移脚本');
          }
        });
    }
  }, [isOpen, courseId]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    const tempUserMessageId = Date.now(); // 临时ID
    setInputValue('');
    setSending(true);
    setError(null);

    // 立即显示用户消息
    const tempUserMessage: Message = {
      id: tempUserMessageId,
      session_id: 0,
      sender_id: 0,
      sender_type: 'student',
      content: content,
      message_type: 'text',
      is_sent_to_teacher: false,
      teacher_ids: [],
      ai_response_id: null,
      parent_message_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: '我'
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setTimeout(scrollToBottom, 100);

    // 显示AI加载动画
    const tempAIMessageId = Date.now() + 1;
    const tempAIMessage: Message = {
      id: tempAIMessageId,
      session_id: 0,
      sender_id: null,
      sender_type: 'ai',
      content: '思考中...',
      message_type: 'text',
      is_sent_to_teacher: false,
      teacher_ids: [],
      ai_response_id: null,
      parent_message_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: 'AI助手'
    };
    setMessages((prev) => [...prev, tempAIMessage]);
    setTimeout(scrollToBottom, 100);

    try {
      // 发送消息并获取AI回复
      const newMessages = await courseQAService.sendMessage(courseId, content);
      
      // 移除临时消息，添加真实消息
      setMessages((prev) => {
        const filtered = prev.filter(
          (msg) => msg.id !== tempUserMessageId && msg.id !== tempAIMessageId
        );
        return [...filtered, ...newMessages];
      });
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error('发送消息失败:', err);
      setError('发送消息失败，请稍后重试');
      // 移除临时消息
      setMessages((prev) =>
        prev.filter(
          (msg) => msg.id !== tempUserMessageId && msg.id !== tempAIMessageId
        )
      );
      setInputValue(content); // 恢复输入内容
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // 发送给教师
  const handleSendToTeacher = async (messageId: number, teacherIds: number[]) => {
    try {
      await courseQAService.sendToTeacher(courseId, messageId, teacherIds);
      // 更新消息状态
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, is_sent_to_teacher: true, teacher_ids: teacherIds }
            : msg
        )
      );
      setShowTeacherSelector(false);
      setSelectedMessageId(null);
    } catch (err: any) {
      console.error('发送给教师失败:', err);
      setError('发送给教师失败，请稍后重试');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 聊天窗口 */}
      <div className="relative w-full max-w-[600px] h-full max-h-[700px] rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-violet-100/50 bg-gradient-to-r from-violet-50/30 to-fuchsia-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">课程问答</h3>
              <p className="text-xs text-slate-500">AI助手随时为您解答</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
              <Bot className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-sm">还没有消息</p>
              <p className="text-xs mt-1">开始提问吧，AI助手会为您解答</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'student' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender_type === 'student'
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-none'
                      : message.sender_type === 'ai'
                      ? 'bg-white border border-violet-100 text-slate-800 rounded-bl-none'
                      : 'bg-blue-50 border border-blue-200 text-slate-800 rounded-bl-none'
                  } shadow-sm`}
                >
                  {/* 发送者信息 */}
                  <div className="flex items-center gap-2 mb-1">
                    {message.sender_type === 'ai' && (
                      <Bot className="w-4 h-4 text-violet-600" />
                    )}
                    {message.sender_type === 'teacher' && (
                      <UserCircle className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="text-xs font-medium opacity-80">
                      {message.sender_name || '未知用户'}
                    </span>
                  </div>

                  {/* 消息内容 */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content === '思考中...' ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI正在思考...
                      </span>
                    ) : (
                      message.content
                    )}
                  </p>

                  {/* 时间戳 */}
                  <p className="text-xs opacity-60 mt-2">
                    {new Date(message.created_at).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* 发送给教师按钮（学生消息显示，用于发送对应的AI回复） */}
                  {message.sender_type === 'student' &&
                    message.ai_response_id &&
                    (() => {
                      const aiReply = messages.find(m => m.id === message.ai_response_id);
                      return aiReply && !aiReply.is_sent_to_teacher;
                    })() && (
                      <button
                        onClick={() => {
                          // 将对应的AI回复消息ID设置为选中
                          setSelectedMessageId(message.ai_response_id!);
                          setShowTeacherSelector(true);
                        }}
                        className="mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors border border-white/30"
                      >
                        发送给老师
                      </button>
                    )}

                  {/* 学生消息对应的AI回复已发送给老师标识 */}
                  {message.sender_type === 'student' &&
                    message.ai_response_id &&
                    (() => {
                      const aiReply = messages.find(m => m.id === message.ai_response_id);
                      return aiReply && aiReply.is_sent_to_teacher;
                    })() && (
                      <div className="mt-2 text-xs text-white/70 flex items-center gap-1">
                        <span>✓ AI回复已发送给老师</span>
                      </div>
                    )}

                  {/* 已发送给教师标识（AI消息） */}
                  {message.sender_type === 'ai' &&
                    message.is_sent_to_teacher && (
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <span>✓ 已发送给老师</span>
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 教师选择器 */}
        {showTeacherSelector && (
          <div className="mx-4 mb-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-700 mb-2">选择要发送的教师：</p>
            {teachers.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">暂无相关教师</p>
            ) : (
              <>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <label
                      key={teacher.id}
                      className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded text-violet-600"
                        defaultChecked
                        data-teacher-id={teacher.id}
                      />
                      <span className="text-sm text-slate-700">{teacher.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (selectedMessageId) {
                        const checkboxes = document.querySelectorAll<HTMLInputElement>(
                          'input[type="checkbox"][data-teacher-id]'
                        );
                        const selectedTeacherIds = Array.from(checkboxes)
                          .filter((cb) => cb.checked)
                          .map((cb) => parseInt(cb.getAttribute('data-teacher-id') || '0'))
                          .filter((id) => id > 0);
                        
                        if (selectedTeacherIds.length > 0) {
                          handleSendToTeacher(selectedMessageId, selectedTeacherIds);
                        } else {
                          setError('请至少选择一位教师');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    发送
                  </button>
                  <button
                    onClick={() => {
                      setShowTeacherSelector(false);
                      setSelectedMessageId(null);
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 输入框 */}
        <div className="p-4 border-t border-violet-100/50 bg-white/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题..."
              rows={1}
              className="flex-1 px-4 py-3 bg-white border border-violet-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm resize-none max-h-32"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="p-3 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              aria-label="发送消息"
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
  );
};

export default CourseQAChatWindow;
