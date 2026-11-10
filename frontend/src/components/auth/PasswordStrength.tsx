import React from 'react';
import { Check, Circle } from 'lucide-react';
import '../../styles/auth-motion.css';

import { PASSWORD_RULES, scorePassword, strengthAdvice } from './passwordScore';

const LEVELS = {
  1: { label: 'Débil', color: 'bg-rose-500', text: 'text-rose-600' },
  2: { label: 'Media', color: 'bg-amber-500', text: 'text-amber-600' },
  3: { label: 'Fuerte', color: 'bg-emerald-500', text: 'text-emerald-700' },
} as const;

export const PasswordStrength: React.FC<{ password: string; email?: string }> = ({ password, email }) => {
  const level = scorePassword(password, email);
  const current = level ? LEVELS[level] : null;
  const advice = strengthAdvice(password, level);

  return (
    <div className="space-y-3 pt-1" aria-live="polite">
      <div className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((segment) => (
          <div key={segment} className="pk-strength-track">
            <div
              className={`pk-strength-fill ${current?.color ?? 'bg-slate-300'}`}
              data-on={level >= segment}
              style={{ transitionDelay: `${(segment - 1) * 40}ms` }}
            />
          </div>
        ))}
      </div>

      <p
        className="pk-strength-label flex items-baseline justify-between gap-4 text-xs"
        data-visible={!!current}
      >
        <span className={`font-bold ${current?.text ?? ''}`}>
          {current ? `Seguridad: ${current.label}` : ' '}
        </span>
        {advice && <span className="text-right text-slate-500">Consejo: {advice}</span>}
      </p>

      <ul className="space-y-2 border-t border-slate-100 pt-3" aria-label="Requisitos de la contraseña">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-2 text-xs transition-colors duration-150 ${
                ok ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {ok ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Circle className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
              <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};