import React, { useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { shake } from './motion';
import '../../styles/auth-motion.css';

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  /** Cambiá este número para disparar el shake (ej: cada submit con error). */
  shakeSignal?: number;
  children?: React.ReactNode; // ej: medidor de fuerza debajo del input
}

export const PasswordField = React.forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, shakeSignal = 0, children, id, required, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const [visible, setVisible] = useState(false);
    const fieldRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (shakeSignal > 0) shake(fieldRef.current);
    }, [shakeSignal]);

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
          {label}
          {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
        </label>

        <div ref={fieldRef} className="relative flex items-center">
          <Lock className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            spellCheck={false}
            autoCapitalize="none"
            className={`pk-autofill-themed w-full min-h-[44px] pl-12 pr-12 py-2 bg-slate-50 dark:bg-[#465456] border rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#465456] transition-[border-color,background-color,box-shadow] duration-150 pk-no-native-reveal ${
              error
                ? 'border-rose-300 dark:border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-500 focus:border-brand-500 focus:ring-brand-500/20'
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            className="pk-eye absolute right-2"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            aria-controls={inputId}
          >
            <Eye className="w-4 h-4" data-show={!visible} aria-hidden="true" />
            <EyeOff className="w-4 h-4" data-show={visible} aria-hidden="true" />
          </button>
        </div>

        <div className="pk-collapse" data-open={!!error}>
          <div>
            <p id={errorId} role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          </div>
        </div>

        {children}
      </div>
    );
  },
);

PasswordField.displayName = 'PasswordField';
