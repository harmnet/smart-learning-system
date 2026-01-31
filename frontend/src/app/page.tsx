"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { majorService, Major } from '@/services/major.service';
import Banner from '@/components/Banner';
import { useEnrollmentModal } from '@/contexts/EnrollmentModalContext';

// Load Google Fonts for professional typography - Inter for modern UI
if (typeof window !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

export default function Home() {
  const { openModal } = useEnrollmentModal();
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
    <div className="min-h-screen bg-slate-950" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* 科技蓝动态背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/20 via-cyan-500/15 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-cyan-600/20 via-blue-500/15 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-blue-600/15 rounded-full blur-3xl animate-spin-slow"></div>
        {/* 网格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-20"></div>
      </div>

      {/* Glassmorphism Navbar */}
      <header className="fixed w-full top-0 z-50 backdrop-blur-xl bg-slate-900/50 border-b border-white/10">
        <div className="container mx-auto max-w-7xl h-20 flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group relative">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-60"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/50 group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-black text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>S</span>
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Smart Learning
              </span>
              <span className="text-xs text-slate-400 font-medium">智慧学习平台</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-2">
            {['首页', '专业列表', '师资力量', '关于我们'].map((item, idx) => (
              <Link 
                key={idx}
                href={idx === 0 ? '/' : `/${item}`} 
                className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm"
              aria-label="搜索"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <Link 
              href="/auth/login" 
              className="px-6 py-2.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 backdrop-blur-sm" 
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              登录
            </Link>
            <button
              type="button"
              onClick={() => openModal()}
              className="relative group px-7 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-300"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-xl opacity-100 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <span className="relative">立即报名</span>
            </button>
          </div>
        </div>

        {/* Glassmorphism Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 backdrop-blur-xl bg-slate-900/80 border-b border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-8">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索专业、课程、教师..."
                  className="w-full px-6 py-4 pr-14 bg-white/10 border-2 border-white/20 rounded-2xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none text-lg text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300"
                  autoFocus
                  aria-label="搜索输入框"
                />
                <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              {searchQuery && (
                <div className="max-w-2xl mx-auto mt-6">
                  <div className="text-sm text-slate-400 mb-4 font-semibold">搜索结果</div>
                  <div className="space-y-3">
                    {featuredMajors
                      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((major) => (
                        <Link
                          key={major.id}
                          href={`/majors/${major.id}`}
                          className="block p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300 border border-white/10 hover:border-violet-500/50 backdrop-blur-sm"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="font-bold text-white mb-1">{major.name}</div>
                          <div className="text-sm text-slate-400">{major.description}</div>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - 现代玻璃态设计 */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* 高端商业背景图片 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1920&q=80')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-transparent to-slate-950"></div>
        </div>
        <div className="container mx-auto max-w-7xl relative z-10 px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-20 items-center">
            {/* 左侧内容 */}
            <div className="max-w-2xl mb-16 lg:mb-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold mb-10 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 group">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">2024 秋季招生进行中</span>
              </div>
              
              {/* 主标题 */}
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                开启您的
                <span className="block mt-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                  终身学习之旅
                </span>
              </h1>
              
              {/* 副标题 */}
              <p className="text-xl text-slate-300 mb-12 leading-relaxed font-normal">
                融合前沿技术与教育智慧，打造沉浸式学习体验。
                <span className="block mt-3 text-slate-400">让每一次学习，都成为通往卓越的阶梯。</span>
              </p>
              
              {/* CTA按钮 */}
              <div className="flex flex-col sm:flex-row gap-5 mb-16">
                <Link 
                  href="/auth/register" 
                  className="group relative px-10 py-5 text-base font-bold text-white rounded-2xl transition-all duration-300 hover:scale-105" 
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-2xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    开始探索专业
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                  </span>
                </Link>
                <Link 
                  href="/about" 
                  className="px-10 py-5 backdrop-blur-md bg-white/10 border-2 border-white/20 text-white rounded-2xl text-base font-bold hover:bg-white/20 hover:border-cyan-400/50 transition-all duration-300 text-center" 
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  了解更多
                </Link>
              </div>
              
              {/* 统计数据 */}
              <div className="flex items-center gap-10">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                  <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>12K+</div>
                  <div className="text-sm text-slate-400 font-semibold">在线学员</div>
                </div>
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                  <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>50+</div>
                  <div className="text-sm text-slate-400 font-semibold">精品课程</div>
                </div>
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
                  <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>98%</div>
                  <div className="text-sm text-slate-400 font-semibold">满意度</div>
                </div>
              </div>
            </div>
            
            {/* 右侧Bento Grid - 商业化展示 */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                {/* 主学习卡片 */}
                <div className="col-span-2 group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-8 hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-60"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                        {/* 2D扁平化书籍图标 */}
                        <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 2h5v8l-2.5-1.5L6 12V4z"/>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="font-black text-white text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>计算机科学</div>
                      <div className="text-sm text-slate-400 font-semibold">正在学习中 · 本周</div>
                    </div>
                  </div>
                  
                  <div className="relative space-y-4 mb-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                      <span className="text-sm text-slate-300 font-semibold">学习进度</span>
                      <span className="text-lg font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>68%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                      <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-full transition-all duration-1000 shadow-lg shadow-cyan-500/50" style={{width: '68%'}}></div>
                    </div>
                  </div>
                  
                  <div className="relative grid grid-cols-3 gap-4">
                    {[
                      { num: '24', label: '已完成', color: 'from-emerald-500 to-teal-500' },
                      { num: '12', label: '进行中', color: 'from-blue-500 to-cyan-500' },
                      { num: '8', label: '待学习', color: 'from-slate-500 to-slate-600' }
                    ].map((stat, idx) => (
                      <div key={idx} className="relative group/stat">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl blur opacity-0 group-hover/stat:opacity-40 transition-opacity`}></div>
                        <div className="relative p-4 bg-white/5 backdrop-blur-sm rounded-2xl text-center border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                          <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.num}</div>
                          <div className="text-xs text-slate-400 font-semibold">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 成就卡片 */}
                <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-3xl p-6 hover:scale-[1.05] transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    {/* 2D扁平化奖杯图标 */}
                    <svg className="w-14 h-14 mb-3 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 2h12a1 1 0 011 1v3h2a2 2 0 012 2v3a5 5 0 01-5 5h-.17a7.001 7.001 0 01-13.66 0H4a5 5 0 01-5-5V8a2 2 0 012-2h2V3a1 1 0 011-1zm5 16.938A5.004 5.004 0 0017 14h1a3 3 0 003-3V8H5v3a3 3 0 003 3h1a5.004 5.004 0 006 4.938V20H9v2h6v-2h-4v-1.062z"/>
                    </svg>
                    <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>15</div>
                    <div className="text-sm text-slate-300 font-semibold">获得成就</div>
                  </div>
                </div>
                
                {/* 时间卡片 */}
                <div className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-cyan-500/30 rounded-3xl p-6 hover:scale-[1.05] transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    {/* 2D扁平化时钟图标 */}
                    <svg className="w-14 h-14 mb-3 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                    </svg>
                    <div className="text-3xl font-black text-white mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>42h</div>
                    <div className="text-sm text-slate-300 font-semibold">学习时长</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Majors Section - Glassmorphism卡片 */}
      <section className="relative py-32">
        {/* 商业化装饰背景 */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80')] bg-cover bg-center"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950"></div>
        </div>
        <div className="container mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          {apiError && process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-5 backdrop-blur-xl bg-amber-500/10 border border-amber-500/30 rounded-2xl text-sm text-amber-300 flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span><strong className="font-bold">开发提示:</strong> API 调用失败，当前显示模拟数据</span>
            </div>
          )}
          
          <div className="text-center max-w-4xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-full text-sm font-bold mb-8">
              <span className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></span>
              <span className="text-cyan-300">热门推荐</span>
            </div>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              精选专业课程
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              汇聚前沿学科，培养行业精英。每一个专业都经过精心打磨，助您实现职业突破。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 animate-pulse">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl mb-6"></div>
                  <div className="h-7 bg-white/10 rounded-xl mb-4"></div>
                  <div className="h-4 bg-white/10 rounded-lg mb-3"></div>
                  <div className="h-4 bg-white/10 rounded-lg w-3/4 mb-8"></div>
                  <div className="flex justify-between pt-5 border-t border-white/10">
                    <div className="h-4 bg-white/10 rounded-lg w-20"></div>
                    <div className="h-4 bg-white/10 rounded-lg w-24"></div>
                  </div>
                </div>
              ))
            ) : featuredMajors.map((major, idx) => {
              const themes = [
                { 
                  gradient: 'from-blue-600 via-cyan-500 to-blue-600',
                  glow: 'group-hover:shadow-cyan-500/20',
                  icon: (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 3H4c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zM4 19V7h16l.002 12H4z"/>
                      <path d="M9.293 9.293L5.586 13l3.707 3.707 1.414-1.414L8.414 13l2.293-2.293zm5.414 0l-1.414 1.414L15.586 13l-2.293 2.293 1.414 1.414L18.414 13z"/>
                    </svg>
                  ),
                  accent: 'text-cyan-300'
                },
                { 
                  gradient: 'from-slate-600 via-slate-500 to-slate-600',
                  glow: 'group-hover:shadow-slate-500/20',
                  icon: (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                    </svg>
                  ),
                  accent: 'text-slate-300'
                },
                { 
                  gradient: 'from-cyan-600 via-blue-500 to-cyan-600',
                  glow: 'group-hover:shadow-blue-500/20',
                  icon: (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                    </svg>
                  ),
                  accent: 'text-blue-300'
                },
                { 
                  gradient: 'from-slate-700 via-slate-600 to-slate-700',
                  glow: 'group-hover:shadow-slate-600/20',
                  icon: (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V9h7V2.99l7 3.51v2.5h-7v3.99z"/>
                    </svg>
                  ),
                  accent: 'text-slate-300'
                }
              ];
              const theme = themes[idx % 4];
              
              return (
                <div key={major.id} className={`group relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:scale-105 hover:border-white/40 transition-all duration-500 cursor-pointer hover:shadow-2xl ${theme.glow}`}>
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500`}></div>
                    <div className={`relative w-20 h-20 bg-gradient-to-br ${theme.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      {theme.icon}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`relative text-xl font-black text-white mb-4 group-hover:${theme.accent} transition-colors duration-300`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {major.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="relative text-sm text-slate-400 mb-8 line-clamp-2 leading-relaxed min-h-[42px]">
                    {major.description || "暂无简介"}
                  </p>
                  
                  {/* Footer */}
                  <div className="relative flex items-center justify-between pt-6 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span className="text-xs font-semibold text-slate-400">{major.duration_years} 年制</span>
                    </div>
                    <span className={`text-lg font-black ${theme.accent}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      ¥{major.tuition_fee}
                      <span className="text-sm font-medium text-slate-500">/年</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {!isLoading && featuredMajors.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-semibold">
              暂无专业数据
            </div>
          )}
          
          <div className="text-center mt-16">
            <Link 
              href="/majors" 
              className="group relative inline-flex items-center gap-3 px-10 py-5 text-base font-bold text-white transition-all duration-300 hover:scale-105" 
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <div className="absolute inset-0 backdrop-blur-xl bg-white/10 border-2 border-white/30 rounded-2xl group-hover:bg-white/20 group-hover:border-white/40 transition-all"></div>
              <span className="relative">查看全部专业</span>
              <svg className="relative w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features - Bento Grid特色功能 */}
      <section className="relative py-32">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ),
                title: "系统化课程体系",
                desc: "从基础到进阶的完整学习路径，每个知识点环环相扣，确保学习效果最大化。",
                gradient: "from-blue-600 to-cyan-500"
              },
              {
                icon: (
                  <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                ),
                title: "智能化学习助手",
                desc: "24小时在线答疑，智能推荐学习内容，个性化学习路径规划，让学习更高效。",
                gradient: "from-cyan-600 to-blue-500"
              },
              {
                icon: (
                  <svg className="w-11 h-11 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                ),
                title: "全流程数字管理",
                desc: "从报名到毕业的全生命周期管理，一站式解决教务、学习、考核所有需求。",
                gradient: "from-slate-600 to-slate-500"
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative overflow-hidden backdrop-blur-xl bg-white/5 border border-white/20 rounded-3xl p-8 hover:scale-[1.02] hover:border-white/40 transition-all duration-500 hover:shadow-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="relative">
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Glassmorphism Footer */}
      <footer className="relative py-20 backdrop-blur-xl bg-slate-900/50 border-t border-white/10">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-60"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-black text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>S</span>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-white block leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Smart Learning</span>
                  <span className="text-xs text-slate-400 font-semibold">智慧学习平台</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                致力于通过科技创新推动教育变革，让优质教育资源触手可及，帮助每一位学习者实现自我提升。
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-black text-white mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>平台</h4>
              <ul className="space-y-3 text-sm">
                {['浏览专业', '名师风采', '学费说明'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="text-slate-400 hover:text-white transition-colors duration-300 font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-white mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>支持</h4>
              <ul className="space-y-3 text-sm">
                {['帮助中心', '联系我们', '隐私政策'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="text-slate-400 hover:text-white transition-colors duration-300 font-medium">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400 font-medium">
              © 2026 Smart Learning System. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
              <span className="hover:text-white transition-colors cursor-pointer">ICP备案号</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="hover:text-white transition-colors cursor-pointer">服务条款</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
