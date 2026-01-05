"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { majorService, Major } from '@/services/major.service';
import Banner from '@/components/Banner';

// Load Google Fonts for professional typography
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

export default function Home() {
  const [featuredMajors, setFeaturedMajors] = useState<Major[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const data = await majorService.getAll();
        console.log("Fetched majors:", data);
        setFeaturedMajors((data.items || []).slice(0, 4));
      } catch (error: any) {
        console.error("Failed to fetch majors", error);
        setApiError(error.message || 'API 调用失败');
        setFeaturedMajors([
          { id: 1, name: "计算机科学与技术", description: "深入学习算法、编程与系统架构，掌握未来核心技术能力", tuition_fee: 5200, duration_years: 4, organization_id: 1 },
          { id: 2, name: "人工智能", description: "探索机器学习与数据挖掘前沿，培养新一代 AI 工程师", tuition_fee: 6800, duration_years: 4, organization_id: 1 },
          { id: 3, name: "软件工程", description: "企业级软件开发与项目管理，打造专业技术团队", tuition_fee: 5500, duration_years: 4, organization_id: 1 },
          { id: 4, name: "数字媒体艺术", description: "技术与艺术的完美融合，创造令人惊叹的视觉体验", tuition_fee: 5800, duration_years: 4, organization_id: 1 },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMajors();
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      {/* Navbar - 极简专业导航栏 */}
      <header className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="container-custom h-20 flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-[#2563EB]/40 group-hover:scale-105 transition-all duration-300">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>S</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#1E293B] block leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Smart Learning</span>
              <span className="text-xs text-[#64748B] font-light">智慧学习平台</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {['首页', '专业列表', '师资力量', '关于我们'].map((item, idx) => (
              <Link 
                key={idx}
                href={idx === 0 ? '/' : `/${item}`} 
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] rounded-lg transition-all duration-200"
              aria-label="搜索"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-[#64748B] hover:text-[#2563EB] transition-colors duration-200" style={{ fontFamily: "'Poppins', sans-serif" }}>
              登录
            </Link>
            <Link href="/auth/register" className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl text-sm font-medium hover:from-[#1E40AF] hover:to-[#2563EB] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/40" style={{ fontFamily: "'Poppins', sans-serif" }}>
              立即报名
            </Link>
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="container-custom px-6 lg:px-8 py-6">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索专业、课程、教师..."
                  className="w-full px-6 py-4 pr-12 border-2 border-[#E2E8F0] rounded-xl focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 outline-none text-lg text-[#1E293B] placeholder-[#94A3B8] transition-all duration-200"
                  autoFocus
                  aria-label="搜索输入框"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              {searchQuery && (
                <div className="max-w-2xl mx-auto mt-4">
                  <div className="text-sm text-[#64748B] mb-3 font-medium">搜索结果</div>
                  <div className="space-y-2">
                    {featuredMajors
                      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((major) => (
                        <Link
                          key={major.id}
                          href={`/majors/${major.id}`}
                          className="block p-4 bg-[#F8FAFC] hover:bg-[#EFF6FF] rounded-xl transition-all duration-200 border border-transparent hover:border-[#BFDBFE]"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="font-semibold text-[#1E293B]">{major.name}</div>
                          <div className="text-sm text-[#64748B] mt-1">{major.description}</div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Banner Section - 轮播图 */}
      <section className="pt-24 pb-12 bg-[#F8FAFC]">
        <div className="container-custom px-6 lg:px-8">
          <Banner />
        </div>
      </section>

      {/* Hero Section - 简洁专业的英雄区 */}
      <section className="py-24 lg:py-32 relative overflow-hidden bg-gradient-to-br from-[#F8FAFC] via-white to-[#F8FAFC]">
        {/* 装饰性几何元素 - 极简风格 */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl"></div>
        
        <div className="container-custom relative z-10 px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] rounded-full text-sm font-semibold mb-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse"></span>
                <span className="bg-gradient-to-r from-[#2563EB] to-[#3B82F6] bg-clip-text text-transparent">2024 秋季招生进行中</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[#1E293B] mb-6 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                开启您的
                <span className="block mt-2 bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
                  终身学习之旅
                </span>
              </h1>
              
              <p className="text-xl text-[#64748B] mb-10 leading-relaxed font-light">
                融合前沿技术与教育智慧，打造沉浸式学习体验。
                <span className="block mt-2">让每一次学习，都成为通往卓越的阶梯。</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/auth/register" className="px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-semibold hover:from-[#1E40AF] hover:to-[#2563EB] hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-[#2563EB]/30 hover:shadow-xl hover:shadow-[#2563EB]/40 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  开始探索专业
                </Link>
                <Link href="/about" className="px-8 py-4 border-2 border-[#E2E8F0] text-[#1E293B] rounded-xl font-semibold hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition-all duration-300 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  了解更多
                </Link>
              </div>
              
              <div className="flex items-center gap-12">
                <div>
                  <div className="text-3xl font-bold text-[#1E293B] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>12,000+</div>
                  <div className="text-sm text-[#64748B]">在线学员</div>
                </div>
                <div className="w-px h-12 bg-[#E2E8F0]"></div>
                <div>
                  <div className="text-3xl font-bold text-[#1E293B] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>50+</div>
                  <div className="text-sm text-[#64748B]">精品课程</div>
                </div>
                <div className="w-px h-12 bg-[#E2E8F0]"></div>
                <div>
                  <div className="text-3xl font-bold text-[#1E293B] mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>98%</div>
                  <div className="text-sm text-[#64748B]">满意度</div>
                </div>
              </div>
            </div>
            
            {/* 右侧视觉元素 - 简洁专业的设计 */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* 主卡片 */}
                <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-[#E2E8F0] hover:shadow-[#2563EB]/10 transition-shadow duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-[#1E293B]" style={{ fontFamily: "'Poppins', sans-serif" }}>计算机科学</div>
                      <div className="text-sm text-[#64748B]">正在学习中</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl">
                      <span className="text-sm text-[#64748B]">学习进度</span>
                      <span className="text-sm font-semibold text-[#2563EB]" style={{ fontFamily: "'Poppins', sans-serif" }}>68%</span>
                    </div>
                    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full transition-all duration-500" style={{width: '68%'}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#EFF6FF] rounded-xl text-center hover:bg-[#DBEAFE] transition-colors duration-200">
                      <div className="text-lg font-bold text-[#2563EB]" style={{ fontFamily: "'Poppins', sans-serif" }}>24</div>
                      <div className="text-xs text-[#64748B]">已完成</div>
                    </div>
                    <div className="p-3 bg-[#EFF6FF] rounded-xl text-center hover:bg-[#DBEAFE] transition-colors duration-200">
                      <div className="text-lg font-bold text-[#2563EB]" style={{ fontFamily: "'Poppins', sans-serif" }}>12</div>
                      <div className="text-xs text-[#64748B]">进行中</div>
                    </div>
                    <div className="p-3 bg-[#EFF6FF] rounded-xl text-center hover:bg-[#DBEAFE] transition-colors duration-200">
                      <div className="text-lg font-bold text-[#2563EB]" style={{ fontFamily: "'Poppins', sans-serif" }}>8</div>
                      <div className="text-xs text-[#64748B]">待学习</div>
                    </div>
                  </div>
                </div>
                
                {/* 浮动装饰元素 - 极简风格 */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/20 rounded-2xl blur-2xl"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/20 to-[#2563EB]/20 rounded-2xl blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Majors Section - 简洁专业的卡片 */}
      <section className="py-24 bg-white relative">
        <div className="container-custom px-6 lg:px-8">
          {apiError && process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl text-sm text-[#92400E] flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span><strong>开发提示:</strong> API 调用失败，当前显示模拟数据</span>
            </div>
          )}
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-4 py-1.5 bg-[#EFF6FF] text-[#2563EB] rounded-full text-sm font-semibold mb-4">
              热门推荐
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-[#1E293B] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              精选专业课程
            </h2>
            <p className="text-lg text-[#64748B] font-light">
              汇聚前沿学科，培养行业精英。每一个专业都经过精心打磨，助您实现职业突破。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-[#F8FAFC] rounded-xl p-6 animate-pulse">
                  <div className="w-14 h-14 bg-[#E2E8F0] rounded-xl mb-4"></div>
                  <div className="h-6 bg-[#E2E8F0] rounded-lg mb-3"></div>
                  <div className="h-4 bg-[#E2E8F0] rounded mb-2"></div>
                  <div className="h-4 bg-[#E2E8F0] rounded w-3/4 mb-6"></div>
                  <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
                    <div className="h-4 bg-[#E2E8F0] rounded w-16"></div>
                    <div className="h-4 bg-[#E2E8F0] rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : featuredMajors.map((major, idx) => {
              const colors = [
                { icon: 'from-[#2563EB] to-[#3B82F6]', text: 'text-[#2563EB]', border: 'border-[#DBEAFE]', hover: 'hover:border-[#2563EB]' },
                { icon: 'from-[#1E40AF] to-[#2563EB]', text: 'text-[#1E40AF]', border: 'border-[#BFDBFE]', hover: 'hover:border-[#1E40AF]' },
                { icon: 'from-[#06B6D4] to-[#3B82F6]', text: 'text-[#06B6D4]', border: 'border-[#CFFAFE]', hover: 'hover:border-[#06B6D4]' },
                { icon: 'from-[#2563EB] to-[#06B6D4]', text: 'text-[#2563EB]', border: 'border-[#DBEAFE]', hover: 'hover:border-[#2563EB]' },
              ];
              const color = colors[idx % 4];
              
              return (
                <div key={major.id} className={`group bg-white rounded-xl border ${color.border} ${color.hover} p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                  <div className={`w-14 h-14 bg-gradient-to-br ${color.icon} rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  
                  <h3 className={`text-lg font-bold text-[#1E293B] mb-3 group-hover:${color.text} transition-colors duration-300`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {major.name}
                  </h3>
                  
                  <p className="text-sm text-[#64748B] mb-6 line-clamp-2 leading-relaxed min-h-[40px]">
                    {major.description || "暂无简介"}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-xs font-medium text-[#64748B]">{major.duration_years} 年制</span>
                    </div>
                    <span className={`text-base font-bold ${color.text}`} style={{ fontFamily: "'Poppins', sans-serif" }}>¥{major.tuition_fee}/年</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!isLoading && featuredMajors.length === 0 && (
            <div className="text-center py-12 text-[#64748B]">
              暂无专业数据
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/majors" className="inline-flex items-center gap-2 text-[#2563EB] font-semibold hover:text-[#1E40AF] hover:gap-3 transition-all duration-300 group" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <span>查看全部专业</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features - 特色功能 */}
      <section className="py-24 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="container-custom px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                ),
                title: "系统化课程体系",
                desc: "从基础到进阶的完整学习路径，每个知识点环环相扣，确保学习效果最大化。",
                color: "from-[#2563EB] to-[#06B6D4]"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                ),
                title: "智能化学习助手",
                desc: "24小时在线答疑，智能推荐学习内容，个性化学习路径规划，让学习更高效。",
                color: "from-[#1E40AF] to-[#2563EB]"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                ),
                title: "全流程数字管理",
                desc: "从报名到毕业的全生命周期管理，一站式解决教务、学习、考核所有需求。",
                color: "from-[#2563EB] to-[#10B981]"
              }
            ].map((feature, idx) => (
              <div key={idx} className="group">
                <div className="bg-white rounded-xl p-8 border border-[#E2E8F0] hover:border-[#2563EB]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>{feature.title}</h3>
                  <p className="text-[#64748B] leading-relaxed font-light">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - 简洁专业的页脚 */}
      <footer className="bg-[#1E293B] text-[#CBD5E1] py-16">
        <div className="container-custom px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB] to-[#3B82F6] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>S</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white block leading-none" style={{ fontFamily: "'Poppins', sans-serif" }}>Smart Learning</span>
                  <span className="text-xs text-[#94A3B8]">智慧学习平台</span>
                </div>
              </div>
              <p className="text-[#94A3B8] text-sm max-w-sm leading-relaxed font-light">
                致力于通过科技创新推动教育变革，让优质教育资源触手可及，帮助每一位学习者实现自我提升。
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>平台</h4>
              <ul className="space-y-3 text-sm">
                {['浏览专业', '名师风采', '学费说明'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="hover:text-[#3B82F6] transition-colors duration-200">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>支持</h4>
              <ul className="space-y-3 text-sm">
                {['帮助中心', '联系我们', '隐私政策'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="hover:text-[#3B82F6] transition-colors duration-200">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#334155] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[#94A3B8] font-light">
              © 2025 Smart Learning System. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-[#94A3B8]">
              <span>ICP备案号</span>
              <span>•</span>
              <span>服务条款</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
