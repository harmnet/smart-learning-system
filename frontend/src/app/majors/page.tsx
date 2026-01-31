"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { majorService, Major } from '@/services/major.service';
import { useEnrollmentModal } from '@/contexts/EnrollmentModalContext';

export default function MajorsPage() {
  const { openModal } = useEnrollmentModal();
  const [majors, setMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const data = await majorService.getAll();
        setMajors(data.items || []);
      } catch (error) {
        console.error('Failed to fetch majors:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMajors();
  }, []);

  const filteredMajors = filter === 'all' 
    ? majors 
    : majors.filter(m => m.duration_years === parseInt(filter));

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navbar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Smart Learning</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                首页
              </Link>
              <Link href="/majors" className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                专业列表
              </Link>
              <Link href="/about" className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                关于我们
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                登录
              </Link>
              <button
                type="button"
                onClick={openModal}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30"
              >
                立即报名
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold mb-6">探索专业课程</h1>
            <p className="text-xl text-blue-100 mb-8">
              精选热门专业，系统化课程体系，助你实现职业梦想
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>正规学历认证</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>名师授课</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span>灵活学习</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-white border-b border-neutral-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">筛选：</span>
              <div className="flex gap-2">
                {[
                  { label: '全部', value: 'all' },
                  { label: '2年制', value: '2' },
                  { label: '3年制', value: '3' },
                  { label: '4年制', value: '4' },
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === item.value
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-sm text-neutral-500">
              共 {filteredMajors.length} 个专业
            </div>
          </div>
        </div>
      </section>

      {/* Majors Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-neutral-100 animate-pulse">
                  <div className="w-14 h-14 bg-neutral-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-neutral-200 rounded mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-6"></div>
                  <div className="flex justify-between pt-4 border-t border-neutral-200">
                    <div className="h-4 bg-neutral-200 rounded w-16"></div>
                    <div className="h-4 bg-neutral-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMajors.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <div className="text-xl font-semibold text-neutral-900 mb-2">暂无专业</div>
              <div className="text-neutral-500">请尝试其他筛选条件</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMajors.map((major, idx) => {
                const colors = [
                  { bg: 'bg-blue-50', icon: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:border-blue-300' },
                  { bg: 'bg-blue-50', icon: 'bg-gradient-to-br from-blue-600 to-blue-700', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:border-blue-300' },
                  { bg: 'bg-cyan-50', icon: 'bg-gradient-to-br from-cyan-500 to-cyan-600', text: 'text-cyan-600', border: 'border-cyan-100', hover: 'hover:border-cyan-300' },
                ];
                const color = colors[idx % 3];

                return (
                  <Link
                    key={major.id}
                    href={`/majors/${major.id}`}
                    className={`group bg-white rounded-2xl border ${color.border} ${color.hover} p-6 transition-all hover:shadow-xl`}
                  >
                    <div className={`w-14 h-14 ${color.icon} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>

                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mb-3">
                      {major.name}
                    </h3>

                    <p className="text-sm text-neutral-500 mb-6 line-clamp-2 leading-relaxed min-h-[40px]">
                      {major.description || "暂无简介"}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="text-xs font-medium text-neutral-500">{major.duration_years} 年制</span>
                      </div>
                      <span className={`text-base font-bold ${color.text}`}>¥{major.tuition_fee}/年</span>
                    </div>

                    <div className="mt-4">
                      <button className={`w-full py-2.5 ${color.bg} ${color.text} rounded-xl text-sm font-semibold hover:opacity-80 transition-all`}>
                        查看详情
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">准备好开始学习了吗？</h2>
          <p className="text-xl text-blue-100 mb-8">
            立即注册，开启你的学习之旅
          </p>
          <button
            type="button"
            onClick={openModal}
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-2xl hover:shadow-3xl hover:-translate-y-1"
          >
            立即报名
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="text-sm">
            © 2024 Smart Learning System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

