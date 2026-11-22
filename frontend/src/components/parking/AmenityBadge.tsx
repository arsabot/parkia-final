import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Warehouse, 
  Accessibility, 
  Clock, 
  Droplets, 
  KeyRound 
} from 'lucide-react';

interface AmenityBadgeProps {
  type: 'covered' | 'security' | 'ev' | 'disabled' | '24hours' | 'wash' | 'valet';
  size?: 'sm' | 'md';
}

export const AmenityBadge: React.FC<AmenityBadgeProps> = ({ type, size = 'sm' }) => {
  const configs = {
    covered: { icon: Warehouse, label: 'Techado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    security: { icon: ShieldCheck, label: 'CCTV 24hs', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    ev: { icon: Zap, label: 'Carga EV', color: 'bg-amber-100 text-orange-700 border-amber-200' },
    disabled: { icon: Accessibility, label: 'Accesible', color: 'bg-violet-100 text-violet-700 border-violet-200' },
    '24hours': { icon: Clock, label: '24 Horas', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    wash: { icon: Droplets, label: 'Lavadero', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    valet: { icon: KeyRound, label: 'Valet Parking', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  };

  const item = configs[type];
  if (!item) return null;
  const Icon = item.icon;

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${item.color} ${sizeClasses}`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {item.label}
    </span>
  );
};
