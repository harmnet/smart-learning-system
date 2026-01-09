"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

// Load Google Fonts for professional typography
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 添加超时保护
    let timeoutId: NodeJS.Timeout | null = null;
    timeoutId = setTimeout(() => {
      setIsLoading(false);
      setError('请求超时，请检查网络连接或后端服务是否正常运行（http://localhost:8000）');
    }, 35000); // 35秒超时

    try {
      console.log('🚀 开始登录请求:', formData.username);
      const response = await authService.login(formData);
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.log('Login successful:', response);
      
      // Store token (use 'token' key to match api-client interceptor)
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('access_token', response.access_token);
      
      // Store user info
      const userInfo = response.user || { username: formData.username, role: 'student' };
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // Redirect based on user role
      const role = userInfo.role || 'student';
      console.log('User role:', role);
      
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'teacher') {
        router.push('/teacher/resources');
      } else if (role === 'student') {
        router.push('/student/home');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.error('Login failed:', err);
      console.error('Error details:', err.response);
      
      let errorMessage = '登录失败，请稍后重试';
      
      // 优先根据HTTP状态码判断错误类型
      if (err.response?.status === 401) {
        // 401: 用户名或密码错误
        errorMessage = '用户名或密码错误，请重新输入';
      } else if (err.response?.status === 403) {
        // 403: 账号被禁用
        errorMessage = '账号已被禁用，请联系管理员';
      } else if (err.response?.status === 404) {
        // 404: 用户不存在
        errorMessage = '用户不存在，请检查用户名';
      } else if (err.response?.status === 429) {
        // 429: 请求过于频繁
        errorMessage = '登录尝试过于频繁，请稍后再试';
      } else if (err.response?.status >= 500) {
        // 500+: 服务器错误
        errorMessage = '服务器错误，请稍后重试';
      } else if (err.response?.data?.detail) {
        // 如果后端返回了具体的错误信息
        errorMessage = err.response.data.detail;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        // 请求超时
        errorMessage = '请求超时，请检查网络连接';
      } else if (!err.response) {
        // 网络错误
        errorMessage = '无法连接到服务器，请检查网络连接';
      }
      
      setError(errorMessage);
      
      // 如果是401或403错误，清除可能存在的旧token
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      {/* Left Side - Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#2563EB]">
        {/* 背景图片 */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/images/login_bg.png')" }}
        />
        
        {/* 装饰性几何元素 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 right-32 w-40 h-40 bg-[#F97316]/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl group-hover:bg-white/30 transition-all duration-300 border border-white/30">
              <span className="text-white font-bold text-xl" style={{ fontFamily: "'Poppins', sans-serif" }}>S</span>
            </div>
            <div>
              <span className="text-2xl font-bold block leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Smart Learning</span>
              <span className="text-sm text-white/80 font-light">智慧学习平台</span>
            </div>
          </Link>
          
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
              欢迎回来！
              <span className="block mt-3 text-3xl font-normal text-white/90">继续您的学习之旅</span>
            </h1>
            <p className="text-lg text-white/80 leading-relaxed mb-12 font-light">
              登录您的账户，访问专属课程内容，查看学习进度，与AI助教互动交流。
            </p>
            
            {/* 特色亮点 - 使用简洁的图标和文字 */}
            <div className="space-y-3">
              {[
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ), 
                  text: '海量优质课程资源' 
                },
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ), 
                  text: '24/7 智能学习助手' 
                },
                { 
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ), 
                  text: '个性化学习分析' 
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/15 transition-all duration-300 group">
                  <div className="text-white group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <span className="font-medium text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-white/60 font-light">
            © 2025 Smart Learning. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-12 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>S</span>
            </div>
            <div>
              <span className="text-xl font-bold text-[#1E293B] block leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Smart Learning</span>
              <span className="text-xs text-[#64748B]">智慧学习平台</span>
            </div>
          </Link>
          
          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-10 transition-all duration-300 hover:shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-[#1E293B] mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>账号登录</h2>
              <p className="text-[#64748B] font-light">欢迎使用智慧学习平台</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-[#1E293B] mb-2">
                  用户名
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] placeholder-[#94A3B8] bg-white hover:border-[#CBD5E1]"
                    placeholder="请输入用户名 / 手机号"
                    required
                    aria-required="true"
                    aria-label="用户名输入框"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1E293B] mb-2">
                  密码
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none transition-all duration-200 text-[#1E293B] placeholder-[#94A3B8] bg-white hover:border-[#CBD5E1]"
                    placeholder="请输入密码"
                    required
                    aria-required="true"
                    aria-label="密码输入框"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 border-2 border-[#CBD5E1] rounded text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-colors"
                    aria-label="记住我"
                  />
                  <span className="text-sm text-[#64748B] group-hover:text-[#1E293B] transition-colors duration-200">记住我</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-[#2563EB] font-semibold hover:text-[#1E40AF] transition-colors duration-200">
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-semibold hover:from-[#1E40AF] hover:to-[#2563EB] transition-all duration-300 shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                style={{ fontFamily: "'Poppins', sans-serif" }}
                aria-label={isLoading ? "正在登录" : "立即登录"}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>登录中...</span>
                  </>
                ) : (
                  '立即登录'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
