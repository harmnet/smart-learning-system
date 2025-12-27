"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { majorService, Major } from '@/services/major.service';
import Banner from '@/components/Banner';

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
    <div className="min-h-screen">
      {/* Navbar - 精致导航栏 */}
      <header className="fixed w-full top-0 z-50 glass border-b border-white/20">
        <div className="container-custom h-20 flex items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-neutral-900 block leading-none">Smart Learning</span>
              <span className="text-xs text-neutral-500">智慧学习平台</span>
            </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-1">
            {['首页', '专业列表', '师资力量', '关于我们'].map((item, idx) => (
              <Link 
                key={idx}
                href={idx === 0 ? '/' : `/${item}`} 
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
              登录
            </Link>
            <Link href="/auth/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30">
              立即报名
            </Link>
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-xl">
            <div className="container-custom px-6 lg:px-8 py-6">
              <div className="relative max-w-2xl mx-auto">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索专业、课程、教师..."
                  className="w-full px-6 py-4 pr-12 border-2 border-neutral-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-lg"
                  autoFocus
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              
              {searchQuery && (
                <div className="max-w-2xl mx-auto mt-4">
                  <div className="text-sm text-neutral-500 mb-3">搜索结果</div>
                  <div className="space-y-2">
                    {featuredMajors
                      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((major) => (
                        <Link
                          key={major.id}
                          href={`/majors/${major.id}`}
                          className="block p-4 bg-neutral-50 hover:bg-blue-50 rounded-xl transition-colors"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="font-semibold text-neutral-900">{major.name}</div>
                          <div className="text-sm text-neutral-500 mt-1">{major.description}</div>
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
      <section className="pt-24 pb-12 bg-neutral-50">
        <div className="container-custom px-6 lg:px-8">
          <Banner />
        </div>
      </section>

      {/* Hero Section - 精美英雄区 */}
      <section className="py-24 lg:py-32 relative overflow-hidden gradient-mesh">
        {/* 装饰元素 */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" style={{animationDelay: '3s'}}></div>
        
        <div className="container-custom relative z-10 px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-blue-100 rounded-full text-sm font-semibold mb-8 shadow-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">2024 秋季招生进行中</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 mb-6 leading-tight">
                开启您的
                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-700 bg-clip-text text-transparent animate-gradient">
                  终身学习之旅
                </span>
              </h1>
              
              <p className="text-xl text-neutral-600 mb-10 leading-relaxed">
                融合前沿技术与教育智慧，打造沉浸式学习体验。
                <span className="block mt-2">让每一次学习，都成为通往卓越的阶梯。</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/auth/register" className="btn-primary text-center">
                  开始探索专业
                </Link>
                <Link href="/about" className="btn-outline text-center">
                  了解更多
                </Link>
              </div>
              
              <div className="flex items-center gap-12">
                <div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">12,000+</div>
                  <div className="text-sm text-neutral-500">在线学员</div>
                </div>
                <div className="w-px h-12 bg-neutral-200"></div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">50+</div>
                  <div className="text-sm text-neutral-500">精品课程</div>
                </div>
                <div className="w-px h-12 bg-neutral-200"></div>
                <div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">98%</div>
                  <div className="text-sm text-neutral-500">满意度</div>
                </div>
              </div>
            </div>
            
            {/* 右侧视觉元素 - 更精美的设计 */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* 主卡片 */}
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-neutral-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">计算机科学</div>
                      <div className="text-sm text-neutral-500">正在学习中</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <span className="text-sm text-neutral-600">学习进度</span>
                      <span className="text-sm font-semibold text-blue-600">68%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{width: '68%'}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-center">
                      <div className="text-lg font-bold text-blue-600">24</div>
                      <div className="text-xs text-neutral-600">已完成</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-center">
                      <div className="text-lg font-bold text-blue-600">12</div>
                      <div className="text-xs text-neutral-600">进行中</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-center">
                      <div className="text-lg font-bold text-blue-600">8</div>
                      <div className="text-xs text-neutral-600">待学习</div>
                    </div>
                  </div>
                </div>
                
                {/* 浮动装饰卡片 */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl shadow-xl opacity-20 blur-sm"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl opacity-20 blur-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Majors Section - 精美卡片 */}
      <section className="py-24 bg-white relative">
        <div className="container-custom px-6 lg:px-8">
          {apiError && process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm text-neutral-800 flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span><strong>开发提示:</strong> API 调用失败，当前显示模拟数据</span>
            </div>
          )}
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
              热门推荐
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-6">
              精选专业课程
            </h2>
            <p className="text-lg text-neutral-600">
              汇聚前沿学科，培养行业精英。每一个专业都经过精心打磨，助您实现职业突破。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-neutral-50 rounded-2xl p-6 animate-pulse">
                  <div className="w-14 h-14 bg-neutral-200 rounded-2xl mb-4"></div>
                  <div className="h-6 bg-neutral-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-6"></div>
                  <div className="flex justify-between pt-4 border-t border-neutral-200">
                    <div className="h-4 bg-neutral-200 rounded w-16"></div>
                    <div className="h-4 bg-neutral-200 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : featuredMajors.map((major, idx) => {
              const colors = [
                { bg: 'bg-blue-50', icon: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-100' },
                { bg: 'bg-blue-50', icon: 'bg-gradient-to-br from-blue-600 to-blue-700', text: 'text-blue-600', border: 'border-blue-100' },
                { bg: 'bg-cyan-50', icon: 'bg-gradient-to-br from-cyan-500 to-cyan-600', text: 'text-cyan-600', border: 'border-cyan-100' },
                { bg: 'bg-blue-50', icon: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-blue-600', border: 'border-blue-100' },
              ];
              const color = colors[idx % 4];
              
              return (
                <div key={major.id} className={`group bg-white rounded-2xl border ${color.border} p-6 card-hover cursor-pointer`}>
                  <div className={`w-14 h-14 ${color.icon} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-bold text-neutral-900 mb-3 group-hover:text-blue-600 transition-colors">
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
                </div>
              );
            })}
          </div>
          
          {!isLoading && featuredMajors.length === 0 && (
            <div className="text-center py-12 text-neutral-500">
              暂无专业数据
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link href="/majors" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all group">
              <span>查看全部专业</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features - 特色功能 */}
      <section className="py-24 bg-gradient-to-b from-neutral-50 to-white">
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
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                ),
                title: "智能化学习助手",
                desc: "24小时在线答疑，智能推荐学习内容，个性化学习路径规划，让学习更高效。",
                color: "from-blue-600 to-blue-500"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                ),
                title: "全流程数字管理",
                desc: "从报名到毕业的全生命周期管理，一站式解决教务、学习、考核所有需求。",
                color: "from-blue-500 to-emerald-500"
              }
            ].map((feature, idx) => (
              <div key={idx} className="group">
                <div className="bg-white rounded-2xl p-8 border border-neutral-100 hover:border-neutral-200 transition-all card-hover">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:shadow-xl transition-all`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - 精致页脚 */}
      <footer className="bg-neutral-900 text-neutral-300 py-16">
        <div className="container-custom px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-white block leading-none">Smart Learning</span>
                  <span className="text-xs text-neutral-500">智慧学习平台</span>
                </div>
              </div>
              <p className="text-neutral-400 text-sm max-w-sm leading-relaxed">
                致力于通过科技创新推动教育变革，让优质教育资源触手可及，帮助每一位学习者实现自我提升。
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">平台</h4>
              <ul className="space-y-3 text-sm">
                {['浏览专业', '名师风采', '学费说明'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="hover:text-blue-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">支持</h4>
              <ul className="space-y-3 text-sm">
                {['帮助中心', '联系我们', '隐私政策'].map((item, idx) => (
                  <li key={idx}>
                    <Link href={`/${item}`} className="hover:text-blue-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-neutral-500">
              © 2024 Smart Learning System. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
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
