"use client";

import Sidebar from './Sidebar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 px-8 flex items-center justify-end bg-[#F8FAFC] sticky top-0 z-40">
          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
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

