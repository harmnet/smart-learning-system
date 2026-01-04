"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

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
        router.push('/admin/teachers');
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
    <div className="min-h-screen flex">
      {/* Left Side - Brand & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* 背景图片 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/login_bg.png')" }}
        >
          {/* 深色遮罩层以确保文字可读 */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/40"></div>
        </div>
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-white/30 transition-all">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <span className="text-2xl font-bold block leading-none">Smart Learning</span>
              <span className="text-sm text-blue-100">智慧学习平台</span>
            </div>
          </Link>
          
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              欢迎回来！
              <span className="block mt-2 text-3xl font-normal text-blue-100">继续您的学习之旅</span>
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-12">
              登录您的账户，访问专属课程内容，查看学习进度，与AI助教互动交流。
            </p>
            
            {/* 特色亮点 */}
            <div className="space-y-4">
              {[
                { icon: '📚', text: '海量优质课程资源' },
                { icon: '🤖', text: '24/7 智能学习助手' },
                { icon: '📊', text: '个性化学习分析' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-blue-100">
            © 2024 Smart Learning. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <span className="text-xl font-bold text-neutral-900 block leading-none">Smart Learning</span>
              <span className="text-xs text-neutral-500">智慧学习平台</span>
            </div>
          </Link>
          
          {/* Form Container */}
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">账号登录</h2>
              <p className="text-neutral-500">欢迎使用智慧学习平台</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900 placeholder-neutral-400"
                    placeholder="请输入用户名 / 手机号"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900 placeholder-neutral-400"
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 border-2 border-neutral-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-sm text-neutral-600 group-hover:text-neutral-900 transition-colors">记住我</span>
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
