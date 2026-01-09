"use client";

import Sidebar from './Sidebar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('admin@smart.edu');
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.username || user.name || 'Admin');
        setUserEmail(user.email || 'admin@smart.edu');
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

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
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-8 flex items-center justify-end bg-[#F8FAFC] sticky top-0 z-40">
          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/80 transition-all group border border-transparent hover:border-neutral-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div 
                  className="text-left hidden md:block cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push('/admin');
                  }}
                >
                  <div className="text-sm font-medium text-neutral-700 hover:text-blue-600 transition-colors">{userName}</div>
                </div>
                <svg className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-neutral-100 py-2 z-50">
                    <div 
                      className="px-4 py-3 border-b border-neutral-100 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin');
                      }}
                    >
                      <div className="text-sm font-bold text-neutral-900">{userName}</div>
                      <div className="text-xs text-neutral-500 truncate">{userEmail}</div>
                      <div className="text-xs text-blue-600 mt-1">返回首页</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>{t.common.logout}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Floating Paper Style */}
        <main className="flex-1 px-8 pb-8 pt-2 overflow-y-auto">
          <div className="bg-white rounded-[2rem] min-h-full shadow-sm border border-neutral-100/50 p-8 transition-all">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

