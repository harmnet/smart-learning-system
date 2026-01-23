'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import CourseQAChatWindow from './CourseQAChatWindow';

interface CourseQAFloatingButtonProps {
  courseId: number;
}

const CourseQAFloatingButton: React.FC<CourseQAFloatingButtonProps> = ({
  courseId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 浮动按钮 - 确保在右下角 */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/50 hover:shadow-xl hover:shadow-violet-500/60 transition-all duration-300 hover:scale-110 flex items-center justify-center cursor-pointer"
          aria-label="打开课程问答"
        >
        {/* 光晕效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"></div>
        
        {/* 图标 */}
        <MessageCircle className="relative w-7 h-7 text-white" />
        
        {/* 未读消息徽章（如果有） */}
        {/* 可以后续添加未读消息数量显示 */}
        </button>
      </div>

      {/* 聊天窗口 */}
      <CourseQAChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        courseId={courseId}
      />
    </>
  );
};

export default CourseQAFloatingButton;
