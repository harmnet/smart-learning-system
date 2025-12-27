"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogout = () => {
    // 清除所有认证相关的数据
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    // 清除所有localStorage中以token相关的key
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('token') || key.toLowerCase().includes('auth')) {
        localStorage.removeItem(key);
      }
    });
    router.push('/auth/login');
  };

  const navItems = [
    { href: '/admin/organizations', label: t.nav.organizations, icon: '🏢' },
    { href: '/admin/majors', label: t.nav.majors, icon: '🎓' },
    { href: '/admin/classes', label: t.nav.classes, icon: '🏫' },
    { href: '/admin/students', label: t.nav.students, icon: '👨‍🎓' },
    { href: '/admin/teachers', label: t.nav.teachers, icon: '👨‍🏫' },
    { href: '/admin/dictionary', label: t.nav.dictionary, icon: '📖' },
    { href: '/admin/finance', label: t.nav.finance, icon: '💰' },
    { href: '/admin/course-covers', label: t.nav.courseCovers, icon: '🖼️' },
    { href: '/admin/llm-configs', label: t.nav.llmConfigs, icon: '🤖' },
  ];

  return (
    <aside className="w-64 h-screen bg-white flex flex-col fixed left-0 top-0 z-50 border-r border-neutral-100">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 mb-6 mt-2">
        <Link href="/" className="flex items-center gap-3 text-neutral-900 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg text-xl">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">Smart Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-neutral-100 mx-2 mb-2">
        <div className="flex items-center gap-3 w-full p-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border border-white shadow-sm flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-neutral-900 truncate">Admin User</div>
            <div className="text-xs text-neutral-500 truncate">admin@smart.edu</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}

