"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Major } from '@/services/major.service';

export default function MajorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [major, setMajor] = useState<Major | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    const mockMajor: Major = {
      id: parseInt(params.id as string),
      name: '计算机科学与技术',
      description: '深入学习算法、编程与系统架构，掌握未来核心技术能力。培养具有扎实计算机科学理论基础和实践能力的高级专门人才。',
      tuition_fee: 5200,
      duration_years: 4,
      organization_id: 1
    };
    
    setTimeout(() => {
      setMajor(mockMajor);
      setIsLoading(false);
    }, 500);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!major) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <div className="text-2xl font-bold text-neutral-900 mb-2">专业不存在</div>
          <Link href="/majors" className="text-blue-600 hover:text-blue-700">
            返回专业列表
          </Link>
        </div>
      </div>
    );
  }

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

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-5 py-2 text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">
                登录
              </Link>
              <Link href="/auth/register" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30">
                立即报名
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center gap-2 text-blue-100 mb-4">
            <Link href="/" className="hover:text-white transition-colors">首页</Link>
            <span>/</span>
            <Link href="/majors" className="hover:text-white transition-colors">专业列表</Link>
            <span>/</span>
            <span className="text-white">{major.name}</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{major.name}</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            {major.description}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}
              <div className="bg-white rounded-2xl p-8 border border-neutral-100">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">专业概况</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    本专业培养具有良好的科学素养，系统地掌握计算机科学与技术包括计算机硬件、软件与应用的基本理论、基本知识和基本技能的高级专门科学技术人才。
                  </p>
                  <p className="text-neutral-600 leading-relaxed">
                    学生将学习计算机科学的基本理论和知识，接受从事研究与应用计算机的基本训练，具有研究和开发计算机系统的基本能力。
                  </p>
                </div>
              </div>

              {/* Curriculum */}
              <div className="bg-white rounded-2xl p-8 border border-neutral-100">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">核心课程</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    '程序设计基础',
                    '数据结构与算法',
                    '计算机组成原理',
                    '操作系统',
                    '计算机网络',
                    '数据库系统',
                    '软件工程',
                    '人工智能导论',
                  ].map((course, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-neutral-900">{course}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Prospects */}
              <div className="bg-white rounded-2xl p-8 border border-neutral-100">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">就业方向</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: '软件开发工程师', icon: '💻' },
                    { title: '系统架构师', icon: '🏗️' },
                    { title: '数据工程师', icon: '📊' },
                    { title: 'AI工程师', icon: '🤖' },
                    { title: '网络安全专家', icon: '🔒' },
                    { title: '技术经理', icon: '👔' },
                  ].map((career, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 border border-neutral-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all">
                      <span className="text-3xl">{career.icon}</span>
                      <span className="font-medium text-neutral-900">{career.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Card */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-100 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    ¥{major.tuition_fee}
                    <span className="text-lg text-neutral-500 font-normal">/年</span>
                  </div>
                  <div className="text-sm text-neutral-500">学制 {major.duration_years} 年</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-600">总学费</span>
                    <span className="font-bold text-neutral-900">¥{major.tuition_fee * major.duration_years}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-600">招生人数</span>
                    <span className="font-bold text-neutral-900">100人</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                    <span className="text-sm text-neutral-600">剩余名额</span>
                    <span className="font-bold text-blue-600">68人</span>
                  </div>
                </div>

                <Link
                  href="/auth/register"
                  className="block w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-center hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 mb-3"
                >
                  立即报名
                </Link>

                <button className="w-full py-3 border-2 border-neutral-200 text-neutral-700 rounded-xl font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
                  咨询客服
                </button>
              </div>

              {/* Features */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">专业特色</h3>
                <div className="space-y-3">
                  {[
                    { icon: '🎓', text: '正规学历认证' },
                    { icon: '👨‍🏫', text: '名师授课' },
                    { icon: '💼', text: '就业指导' },
                    { icon: '📱', text: '在线学习' },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-2xl">{feature.icon}</span>
                      <span className="text-sm font-medium text-neutral-700">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Majors */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-8">相关专业推荐</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: '软件工程', fee: 5500, years: 4 },
              { name: '人工智能', fee: 6800, years: 4 },
              { name: '数据科学', fee: 6200, years: 4 },
            ].map((related, idx) => (
              <Link
                key={idx}
                href={`/majors/${idx + 2}`}
                className="block bg-neutral-50 rounded-2xl p-6 border border-neutral-200 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{related.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{related.years}年制</span>
                  <span className="font-bold text-blue-600">¥{related.fee}/年</span>
                </div>
              </Link>
            ))}
          </div>
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

