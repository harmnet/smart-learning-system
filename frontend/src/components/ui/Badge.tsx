import React from 'react';

export interface BadgeProps {
  status?: 'success' | 'error' | 'warning' | 'info' | 'default';
  text: string;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  status = 'default',
  text,
  size = 'md',
  icon,
  className = '',
}) => {
  const statusClasses = {
    success: 'bg-green-100 text-green-700 border-green-200',
    error: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-md border
        ${statusClasses[status]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {text}
    </span>
  );
};

export default Badge;
