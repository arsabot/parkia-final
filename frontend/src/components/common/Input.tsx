import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  type,
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

  const isPassword = type === 'password';
  const showToggle = isPassword && !rightIcon;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const resolvedType = showToggle && passwordVisible ? 'text' : type;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide"
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
          type={resolvedType}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          className={`pk-autofill-themed w-full min-h-[44px] py-2.5 bg-slate-50 dark:bg-[#465456] border rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#465456] disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-[#465456] disabled:cursor-not-allowed ${
            leftIcon ? 'pl-11' : 'pl-3.5'
          } ${
            rightIcon || showToggle ? 'pr-11' : 'pr-3.5'
          } ${
            error 
              ? 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:text-rose-200' 
              : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-500 focus:border-brand-500 focus:ring-brand-500/20'
          } ${isPassword ? 'pk-no-native-reveal' : ''} ${className}`}
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

        {showToggle && (
          <button
            type="button"
            onClick={() => setPasswordVisible((v) => !v)}
            aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={passwordVisible}
            aria-controls={inputId}
            className="absolute right-2 flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            {passwordVisible ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 animate-fade-in" role="alert">
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
