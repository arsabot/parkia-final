import React from 'react';
import '../../styles/auth-motion.css';

import { scorePassword } from './passwordScore';

const LEVELS = {
  1: { label: 'Débil', color: 'bg-rose-500', text: 'text-rose-600', hint: 'Usá 8+ caracteres y evitá palabras obvias.' },
  2: { label: 'Media', color: 'bg-amber-500', text: 'text-amber-600', hint: 'Sumá largo (12+) o un símbolo para hacerla fuerte.' },
  3: { label: 'Fuerte', color: 'bg-emerald-500', text: 'text-emerald-700', hint: 'Buena contraseña.' },
} as const;

export const PasswordStrength: React.FC<{ password: string; email?: string }> = ({ password, email }) => {
  const level = scorePassword(password, email);
  const current = level ? LEVELS[level] : null;

  return (
    <div className="space-y-2" aria-live="polite">
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
      <div className="pk-strength-label flex items-center justify-between gap-3 text-xs" data-visible={!!current}>
        <span className={`font-bold ${current?.text ?? ''}`}>{current ? `Seguridad: ${current.label}` : ' '}</span>
        <span className="text-slate-500">{current?.hint}</span>
      </div>
    </div>
  );
};
