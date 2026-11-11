import React from 'react';
import { PaymentMethod } from './PaymentCheckoutModal';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const methods: Array<{ id: PaymentMethod; label: string }> = [
    { id: 'Mercado Pago', label: 'Mercado Pago' },
    { id: 'MODO / Ualá', label: 'MODO o Ualá' },
    { id: 'Tarjeta Débito/Crédito', label: 'Tarjeta de débito o crédito' },
    { id: 'Efectivo', label: 'Efectivo (Rapipago o Pago Fácil)' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
        Medio de pago
      </label>

      <div className="space-y-2">
        {methods.map((m) => {
          const isSelected = selectedMethod === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onSelectMethod(m.id)}
              className={`px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between min-h-[46px] ${
                isSelected
                  ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/90 shadow-xs ring-1 ring-slate-900/10 dark:ring-white/20'
                  : 'border-slate-200 dark:border-parkia-line-dark hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-parkia-card-dark'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-400'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950" />}
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {m.label}
                </span>
              </div>

              {m.id === 'Mercado Pago' && (
                <span className="text-[11px] font-bold text-[#009EE3] bg-[#009EE3]/10 px-2 py-0.5 rounded-md">
                  Recomendado
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

