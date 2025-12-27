"use client";

import { ReactNode } from 'react';
import TeacherSidebar from './TeacherSidebar';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

interface TeacherLayoutProps {
  children: ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 px-8 flex items-center justify-end bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

