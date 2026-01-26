import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  showCount = false,
  maxLength,
  className = '',
  disabled,
  value,
  ...props
}, ref) => {
  const textareaClasses = `
    w-full px-4 py-2 text-sm
    bg-white border rounded-lg
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
    resize-none
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-300'}
  `;
  
  const currentLength = typeof value === 'string' ? value.length : 0;
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={`${textareaClasses} ${className}`}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      
      <div className="flex items-center justify-between mt-1">
        <div className="flex-1">
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          
          {helperText && !error && (
            <p className="text-xs text-slate-500">{helperText}</p>
          )}
        </div>
        
        {showCount && maxLength && (
          <p className={`text-xs ${currentLength > maxLength ? 'text-red-600' : 'text-slate-500'}`}>
            {currentLength} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
