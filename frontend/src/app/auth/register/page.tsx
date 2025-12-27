"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { majorService, Major } from '@/services/major.service';
import { RegisterData } from '@/types/auth';
import { useEffect } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [majors, setMajors] = useState<Major[]>([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    major_id: 0,
    id_card: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const data = await majorService.getAll();
        setMajors(data.items || []);
      } catch (error) {
        console.error('Failed to fetch majors:', error);
      }
    };
    fetchMajors();
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('请填写所有必填项');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('两次密码输入不一致');
        return;
      }
      if (formData.password.length < 6) {
        setError('密码长度至少6位');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone || !formData.major_id) {
      setError('请填写所有必填项');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const registerData: RegisterData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone,
        major_id: formData.major_id,
        id_card: formData.id_card,
        role: 'student'
      };
      await authService.register(registerData);
      
      // Registration successful, redirect to login
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.detail || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" style={{animationDelay: '2s'}}></div>
        </div>
        
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
              开启学习新征程
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed mb-12">
              加入我们，获得专业的学习指导、丰富的课程资源，以及智能化的学习体验。
            </p>
            
            <div className="space-y-4">
              {[
                { icon: '🎓', text: '正规学历认证' },
                { icon: '👨‍🏫', text: '名师在线指导' },
                { icon: '📱', text: '随时随地学习' },
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

      {/* Right Side - Registration Form */}
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
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    step >= s 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    {s}
                  </div>
                  {s < 2 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                      step > s ? 'bg-blue-600' : 'bg-neutral-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm">
              <span className={step >= 1 ? 'text-blue-600 font-semibold' : 'text-neutral-500'}>账号信息</span>
              <span className={step >= 2 ? 'text-blue-600 font-semibold' : 'text-neutral-500'}>个人信息</span>
            </div>
          </div>
          
          {/* Form Container */}
          <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">学生注册</h2>
              <p className="text-neutral-500">已有账号？
                <Link href="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700 ml-1">
                  立即登录
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
              {/* Step 1: Account Info */}
              {step === 1 && (
                <>
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-neutral-700 mb-2">
                      用户名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="请输入用户名"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                      邮箱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                      密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="至少6位密码"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-700 mb-2">
                      确认密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="再次输入密码"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    下一步
                  </button>
                </>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-semibold text-neutral-700 mb-2">
                      真实姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="请输入真实姓名"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-neutral-700 mb-2">
                      手机号码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="请输入手机号"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="id_card" className="block text-sm font-semibold text-neutral-700 mb-2">
                      身份证号
                    </label>
                    <input
                      type="text"
                      id="id_card"
                      value={formData.id_card}
                      onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900"
                      placeholder="选填"
                    />
                  </div>

                  <div>
                    <label htmlFor="major_id" className="block text-sm font-semibold text-neutral-700 mb-2">
                      报读专业 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="major_id"
                      value={formData.major_id}
                      onChange={(e) => setFormData({ ...formData, major_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-neutral-900 bg-white appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right:0.5rem_center] bg-no-repeat pr-10"
                      required
                    >
                      <option value="0">请选择专业</option>
                      {majors.map((major) => (
                        <option key={major.id} value={major.id}>
                          {major.name} - {major.duration_years}年制 - ¥{major.tuition_fee}/年
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 border-2 border-neutral-300 text-neutral-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all"
                    >
                      上一步
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>注册中...</span>
                        </>
                      ) : (
                        '完成注册'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

