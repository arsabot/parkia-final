import React from 'react';

interface BadgeProps {
  variant?: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'info' | 'success';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  className = '',
  dot = true,
  pulse = false,
}) => {
  const styles: Record<string, { bg: string; dotColor: string }> = {
    available: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dotColor: 'bg-emerald-500' },
    occupied: { bg: 'bg-rose-50 text-rose-800 border-rose-200/80', dotColor: 'bg-rose-500' },
    reserved: { bg: 'bg-amber-50 text-amber-800 border-amber-200/80', dotColor: 'bg-amber-500' },
    maintenance: { bg: 'bg-slate-100 text-slate-800 border-slate-200', dotColor: 'bg-slate-500' },
    confirmed: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dotColor: 'bg-emerald-500' },
    pending: { bg: 'bg-amber-50 text-amber-800 border-amber-200/80', dotColor: 'bg-amber-500' },
    cancelled: { bg: 'bg-rose-50 text-rose-800 border-rose-200/80', dotColor: 'bg-rose-500' },
    completed: { bg: 'bg-teal-50 text-teal-800 border-teal-200/80', dotColor: 'bg-teal-600' },
    info: { bg: 'bg-brand-50 text-brand-900 border-brand-200/80', dotColor: 'bg-brand-600' },
    success: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dotColor: 'bg-emerald-500' },
  };

  const current = styles[variant] || styles.info;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.bg} ${className}`}
    >
      {dot && (
        <span 
          className={`w-1.5 h-1.5 rounded-full ${current.dotColor} shrink-0 ${pulse ? 'animate-pulse' : ''}`}
          aria-hidden="true" 
        />
      )}
      <span>{children}</span>
    </span>
  );
};
