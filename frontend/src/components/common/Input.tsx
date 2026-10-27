import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id: customId,
  className = '',
  containerClassName = '',
  disabled,
  required,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-bold text-slate-700 tracking-wide"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span 
            className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0 flex items-center" 
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          className={`w-full min-h-[44px] py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:bg-white disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-11' : 'pl-3.5'
          } ${
            rightIcon ? 'pr-11' : 'pr-3.5'
          } ${
            error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900' 
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <span 
            className="absolute right-3.5 text-slate-400 shrink-0 flex items-center" 
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-semibold text-rose-600 flex items-center gap-1 animate-fade-in" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs font-medium text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
