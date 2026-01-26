import React, { forwardRef } from 'react';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(({
  label,
  helperText,
  size = 'md',
  className = '',
  disabled,
  checked,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: { container: 'w-8 h-4', toggle: 'w-3 h-3', translate: 'translate-x-4' },
    md: { container: 'w-11 h-6', toggle: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { container: 'w-14 h-7', toggle: 'w-6 h-6', translate: 'translate-x-7' },
  };
  
  const currentSize = sizeClasses[size];
  
  return (
    <div className="flex items-start gap-3">
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          ref={ref}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          checked={checked}
          {...props}
        />
        <div
          className={`
            ${currentSize.container}
            bg-slate-300 rounded-full
            peer peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
            peer-checked:bg-blue-600
            peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
            transition-colors duration-200
            ${className}
          `}
        >
          <div
            className={`
              ${currentSize.toggle}
              absolute left-0.5 top-1/2 -translate-y-1/2
              bg-white rounded-full shadow-md
              transition-transform duration-200
              ${checked ? currentSize.translate : 'translate-x-0.5'}
            `}
          ></div>
        </div>
      </label>
      
      {(label || helperText) && (
        <div>
          {label && (
            <div className={`text-sm font-medium ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
              {label}
            </div>
          )}
          {helperText && (
            <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;
