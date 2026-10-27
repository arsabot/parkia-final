import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: SelectOption[];
  leftIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  hint,
  options,
  children,
  leftIcon,
  id: customId,
  className = '',
  containerClassName = '',
  disabled,
  required,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint && !error ? `${selectId}-hint` : undefined;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-bold text-slate-700 tracking-wide"
        >
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <span 
            className="absolute left-3.5 text-slate-400 pointer-events-none shrink-0 flex items-center z-10" 
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          className={`w-full min-h-[44px] py-2.5 pr-10 bg-slate-50 border rounded-xl text-sm font-bold text-slate-900 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:bg-white disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed ${
            leftIcon ? 'pl-11' : 'pl-3.5'
          } ${
            error 
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900' 
              : 'border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <span 
          className="absolute right-3.5 text-slate-400 pointer-events-none shrink-0 flex items-center" 
          aria-hidden="true"
        >
          <ChevronDown className="w-4 h-4" />
        </span>
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

Select.displayName = 'Select';
