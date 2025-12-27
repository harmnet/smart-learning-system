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
      
      let errorMessage = '登录失败，请检查用户名和密码';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接或后端服务是否正常运行';
      } else if (!err.response) {
        errorMessage = '网络错误，请检查后端服务是否正常运行（http://localhost:8000）';
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
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        {/* 装饰背景 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/10 rounded-full"></div>
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
              <p className="text-neutral-500">还没有账号？
                <Link href="/auth/register" className="text-blue-600 font-semibold hover:text-blue-700 ml-1">
                  立即注册
                </Link>
              </p>
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

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">或使用其他方式登录</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all group">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">GitHub</span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-300 hover:bg-neutral-50 transition-all group">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C7.099 2.188 5.785 3.515 5.785 5.12c0 1.606 1.314 2.933 2.906 2.933s2.906-1.327 2.906-2.933c0-1.605-1.314-2.932-2.906-2.932zm11.624 0C18.723 2.188 17.41 3.515 17.41 5.12c0 1.606 1.314 2.933 2.905 2.933 1.592 0 2.906-1.327 2.906-2.933 0-1.605-1.314-2.932-2.906-2.932zM8.691 8.982C7.099 8.982 5.785 10.31 5.785 11.915c0 1.606 1.314 2.933 2.906 2.933s2.906-1.327 2.906-2.933c0-1.605-1.314-2.933-2.906-2.933zm11.624 0c-1.592 0-2.906 1.328-2.906 2.933 0 1.606 1.314 2.933 2.906 2.933 1.592 0 2.906-1.327 2.906-2.933 0-1.605-1.314-2.933-2.906-2.933zM8.691 15.776c-1.592 0-2.906 1.328-2.906 2.934 0 1.605 1.314 2.932 2.906 2.932s2.906-1.327 2.906-2.932c0-1.606-1.314-2.934-2.906-2.934zm11.624 0c-1.592 0-2.906 1.328-2.906 2.934 0 1.605 1.314 2.932 2.906 2.932 1.592 0 2.906-1.327 2.906-2.932 0-1.606-1.314-2.934-2.906-2.934z"/>
                </svg>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">微信</span>
              </button>
            </div>
          </div>

          {/* Test Account Hint */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-sm">
                <div className="font-semibold text-blue-900 mb-1">测试账号</div>
                <div className="text-blue-700 space-y-1">
                  <div>管理员 - 用户名: <code className="bg-blue-100 px-2 py-0.5 rounded">admin</code> / 密码: <code className="bg-blue-100 px-2 py-0.5 rounded">admin123</code></div>
                  <div>教师 - 手机号: <code className="bg-blue-100 px-2 py-0.5 rounded">13800138002</code> / 密码: <code className="bg-blue-100 px-2 py-0.5 rounded">12345678</code></div>
                  <div className="text-xs text-blue-600 mt-2">💡 支持使用用户名或手机号登录</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
