import React, { forwardRef } from 'react';

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  helperText?: string;
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  options: RadioOption[];
  direction?: 'horizontal' | 'vertical';
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  label,
  error,
  options,
  direction = 'vertical',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={`flex ${direction === 'horizontal' ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                ref={ref}
                type="radio"
                value={option.value}
                disabled={option.disabled || props.disabled}
                className={`
                  w-4 h-4 border-slate-300 text-blue-600
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer
                  ${error ? 'border-red-500' : ''}
                  ${className}
                `}
                {...props}
              />
            </div>
            
            <div className="ml-2">
              <label className={`text-sm font-medium ${option.disabled || props.disabled ? 'text-slate-400' : 'text-slate-700'}`}>
                {option.label}
              </label>
              {option.helperText && (
                <p className="text-xs text-slate-500 mt-0.5">{option.helperText}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

export default Radio;
