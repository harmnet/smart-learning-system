import React from 'react';

export interface CardProps {
  title?: string;
  extra?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  extra,
  loading = false,
  children,
  className = '',
  bodyClassName = '',
  hoverable = false,
  bordered = true,
}) => {
  const cardClasses = `
    bg-white rounded-xl
    ${bordered ? 'border border-slate-200' : ''}
    ${hoverable ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : 'shadow-sm'}
    ${className}
  `;
  
  return (
    <div className={cardClasses}>
      {(title || extra) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          {title && (
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          )}
          {extra && <div>{extra}</div>}
        </div>
      )}
      
      <div className={`p-6 ${bodyClassName}`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Card;
