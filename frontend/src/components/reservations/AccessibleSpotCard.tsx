import React from 'react';
import { Accessibility } from 'lucide-react';

interface AccessibleSpotCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasPermit?: boolean;
}

export const AccessibleSpotCard: React.FC<AccessibleSpotCardProps> = ({
  checked,
  onChange,
  hasPermit,
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
        checked
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 ring-2 ring-blue-500/20'
          : 'bg-slate-50/80 dark:bg-parkia-page-dark border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
        <Accessibility className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-sm font-bold text-slate-900 dark:text-white">
            Necesito un cajón accesible
          </span>
          {hasPermit && (
            <span className="text-[10px] font-extrabold uppercase bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
              CUD Verificado
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
          Te reservamos un cajón más ancho, cerca de la salida y sin escaleras. Mostrá tu credencial al llegar: no te pedimos documentos en la app.
        </p>
      </div>
    </div>
  );
};
