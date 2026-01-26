import React, { forwardRef } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}, ref) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-4 h-4 rounded border-slate-300 text-blue-600
            focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />
      </div>
      
      {label && (
        <div className="ml-2">
          <label className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-700'} ${error ? 'text-red-600' : ''}`}>
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {error && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
          
          {helperText && !error && (
            <p className="mt-1 text-xs text-slate-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
