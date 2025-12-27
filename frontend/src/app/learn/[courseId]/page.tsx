"use client";

import { useState } from 'react';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer';
import { 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  MessageSquare, 
  BookOpen, 
  ChevronLeft,
  Menu,
  Send
} from 'lucide-react';

// Mock Course Data
const courseData = {
  id: 1,
  title: "计算机科学导论",
  progress: 35,
  chapters: [
    {
      id: 1,
      title: "第一章：计算机发展史",
      lessons: [
        { id: 101, title: "1.1 计算工具的演变", type: "video", duration: "15:30", completed: true },
        { id: 102, title: "1.2 图灵机与冯诺依曼架构", type: "video", duration: "22:10", completed: true },
        { id: 103, title: "第一章课件下载", type: "doc", duration: "PDF", completed: false },
      ]
    },
    {
      id: 2,
      title: "第二章：二进制与数据表示",
      lessons: [
        { id: 201, title: "2.1 二进制基础", type: "video", duration: "18:45", completed: false },
        { id: 202, title: "2.2 字符编码 (ASCII & Unicode)", type: "video", duration: "20:00", completed: false },
      ]
    }
  ],
  resources: [
    { id: 1, name: "课程大纲.pdf", type: "pdf", size: "2.3 MB", downloadUrl: "#" },
    { id: 2, name: "第一章课件.pptx", type: "pptx", size: "5.1 MB", downloadUrl: "#" },
    { id: 3, name: "参考资料合集.zip", type: "zip", size: "15.8 MB", downloadUrl: "#" },
    { id: 4, name: "练习题答案.docx", type: "docx", size: "1.2 MB", downloadUrl: "#" },
  ]
};

export default function LearningPage({ params }: { params: { courseId: string } }) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'qa'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [currentLesson, setCurrentLesson] = useState(courseData.chapters[0].lessons[0]);
  const [videoProgress, setVideoProgress] = useState(0);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: '你好！我是你的 AI 助教。关于这节课《二进制基础》，你有什么不懂的地方吗？' }
  ]);
  const [qaList, setQaList] = useState([
    { id: 1, user: '张同学', question: '二进制转十进制的快速方法是什么？', answer: '可以使用权重法，从右到左依次乘以2的幂次...', time: '2小时前', replies: 3 },
    { id: 2, user: '李同学', question: 'ASCII和Unicode有什么区别？', answer: null, time: '5小时前', replies: 0 },
  ]);
  const [newQuestion, setNewQuestion] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // User message
    const newHistory = [...chatHistory, { role: 'user', content: chatMessage }];
    setChatHistory(newHistory);
    setChatMessage('');

    // Mock AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        role: 'ai', 
        content: '这是一个很好的问题。在计算机科学中，二进制是...... (AI 正在思考)' 
      }]);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-neutral-200 flex items-center px-4 justify-between z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-100 rounded-full text-neutral-500">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="font-bold text-neutral-800 truncate max-w-md">{courseData.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
            <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500" style={{ width: `${courseData.progress}%` }}></div>
            </div>
            <span>{courseData.progress}% 已完成</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 hover:bg-neutral-100 rounded-md"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Chapter List (Collapsible) */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} flex-shrink-0 bg-white border-r border-neutral-200 transition-all duration-300 overflow-y-auto`}>
          <div className="p-4">
            <h2 className="font-bold text-sm text-neutral-500 uppercase tracking-wider mb-4">课程目录</h2>
            <div className="space-y-4">
              {courseData.chapters.map(chapter => (
                <div key={chapter.id}>
                  <h3 className="font-medium text-neutral-900 mb-2 px-2 text-sm">{chapter.title}</h3>
                  <div className="space-y-1">
                    {chapter.lessons.map(lesson => (
                      <button 
                        key={lesson.id} 
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          lesson.id === currentLesson.id 
                            ? 'bg-brand-50 text-brand-700 font-medium' 
                            : 'hover:bg-neutral-50 text-neutral-600'
                        }`}
                      >
                        {lesson.completed ? (
                          <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
                        ) : (
                          lesson.type === 'video' ? <PlayCircle size={16} className="flex-shrink-0" /> : <FileText size={16} className="flex-shrink-0" />
                        )}
                        <span className="truncate">{lesson.title}</span>
                        <span className="ml-auto text-xs text-neutral-400 flex-shrink-0">{lesson.duration}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area - Video/Document */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-neutral-900 p-6">
          <div className="max-w-6xl mx-auto w-full">
            {/* Video Player */}
            {currentLesson.type === 'video' ? (
              <VideoPlayer
                videoUrl="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                courseId={parseInt(params.courseId)}
                chapterId={currentLesson.id}
                onProgressUpdate={(progress) => setVideoProgress(progress)}
              />
            ) : (
              <div className="aspect-video bg-neutral-800 rounded-xl flex items-center justify-center">
                <div className="text-center text-neutral-400">
                  <FileText size={64} className="mx-auto mb-4" />
                  <p>文档预览功能开发中...</p>
                </div>
              </div>
            )}

            {/* Lesson Info */}
            <div className="mt-6 bg-neutral-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{currentLesson.title}</h2>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <span>时长: {currentLesson.duration}</span>
                <span>•</span>
                <span>观看进度: {Math.round(videoProgress)}%</span>
                {currentLesson.completed && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-blue-400">
                      <CheckCircle size={16} />
                      已完成
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Course Resources */}
            <div className="mt-6 bg-neutral-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                课程资料
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {courseData.resources.map((resource) => {
                  const getIcon = (type: string) => {
                    switch(type) {
                      case 'pdf': return '📄';
                      case 'pptx': return '📊';
                      case 'docx': return '📝';
                      case 'zip': return '📦';
                      default: return '📁';
                    }
                  };

                  const canPreview = ['pdf', 'pptx', 'docx'].includes(resource.type);
                  
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center gap-3 p-4 bg-neutral-700 rounded-xl"
                    >
                      <span className="text-3xl">{getIcon(resource.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {resource.name}
                        </div>
                        <div className="text-sm text-neutral-400">{resource.size}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canPreview && (
                          <Link
                            href={`/preview/${resource.type}/${resource.id}`}
                            className="p-2 text-blue-400 hover:bg-neutral-600 rounded-lg transition-colors"
                            title="在线预览"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                          </Link>
                        )}
                        <a
                          href={resource.downloadUrl}
                          download
                          className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-600 rounded-lg transition-colors"
                          title="下载"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Copilot & Tools */}
        <div className="w-96 bg-white border-l border-neutral-200 flex flex-col flex-shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <MessageSquare size={16} /> AI 助教
            </button>
            <button 
              onClick={() => setActiveTab('qa')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'qa' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <MessageSquare size={16} /> 问答
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-neutral-500 hover:text-neutral-700'}`}
            >
              <BookOpen size={16} /> 笔记
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'chat' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-brand-600 text-white rounded-br-none' 
                          : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-neutral-200 bg-white">
                  <form onSubmit={handleSendMessage} className="relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="问点什么关于这节课的内容..."
                      className="w-full pl-4 pr-12 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                    />
                    <button 
                      type="submit"
                      disabled={!chatMessage.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-600 text-white rounded-lg disabled:opacity-50 hover:bg-brand-700 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : activeTab === 'qa' ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {qaList.map((qa) => (
                    <div key={qa.id} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {qa.user.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-neutral-900 text-sm">{qa.user}</span>
                            <span className="text-xs text-neutral-400">{qa.time}</span>
                          </div>
                          <p className="text-sm text-neutral-700 font-medium mb-2">{qa.question}</p>
                          {qa.answer ? (
                            <div className="mt-3 pl-4 border-l-2 border-blue-500 bg-white rounded-r-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={14} className="text-blue-500" />
                                <span className="text-xs font-semibold text-blue-600">老师回复</span>
                              </div>
                              <p className="text-sm text-neutral-600">{qa.answer}</p>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs text-neutral-600 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              等待老师回复...
                            </div>
                          )}
                          {qa.replies > 0 && (
                            <button className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium">
                              查看 {qa.replies} 条回复 →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-neutral-200 bg-white">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!newQuestion.trim()) return;
                    setQaList([{
                      id: Date.now(),
                      user: '我',
                      question: newQuestion,
                      answer: null,
                      time: '刚刚',
                      replies: 0
                    }, ...qaList]);
                    setNewQuestion('');
                  }} className="relative">
                    <textarea
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="在这里提出你的问题..."
                      className="w-full px-4 py-3 pr-12 border-2 border-neutral-200 rounded-xl resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
                      rows={3}
                    />
                    <button 
                      type="submit"
                      disabled={!newQuestion.trim()}
                      className="absolute right-2 bottom-2 p-2 bg-brand-600 text-white rounded-lg disabled:opacity-50 hover:bg-brand-700 transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-neutral-400 mt-10">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>暂无笔记，点击右上角添加</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

