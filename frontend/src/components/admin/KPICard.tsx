import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'brand' | 'emerald' | 'amber' | 'blue';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'brand',
  trend,
}) => {
  const variantStyles = {
    brand: { 
      iconBg: 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border-brand-100 dark:border-brand-800/40', 
      borderHover: 'hover:border-brand-300 dark:hover:border-brand-500/50' 
    },
    emerald: { 
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/40', 
      borderHover: 'hover:border-emerald-300 dark:hover:border-emerald-500/50' 
    },
    amber: { 
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/40', 
      borderHover: 'hover:border-amber-300 dark:hover:border-amber-500/50' 
    },
    blue: { 
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40', 
      borderHover: 'hover:border-blue-300 dark:hover:border-blue-500/50' 
    },
  };

  const current = variantStyles[variant];

  return (
    <div className={`bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm hover:shadow-md transition-all ${current.borderHover}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${current.iconBg} shadow-inner`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-3xl font-black text-navy-900 dark:text-white tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
              trend.isPositive 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40' 
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5">{subtitle}</p>}
    </div>
  );
};
