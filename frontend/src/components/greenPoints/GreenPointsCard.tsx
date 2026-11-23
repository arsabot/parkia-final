import React, { useState } from 'react';
import { 
  Sparkles, 
  Leaf, 
  Trees, 
  Accessibility, 
  ArrowRight, 
  Award, 
  Info, 
  CheckCircle2, 
  History, 
  Clock, 
  TrendingUp, 
  HelpCircle 
} from 'lucide-react';
import { GreenPointsSummary } from '../../types';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface GreenPointsCardProps {
  summary: GreenPointsSummary | null;
  loading?: boolean;
  onOpenInfoModal: () => void;
}

export const GreenPointsCard: React.FC<GreenPointsCardProps> = ({
  summary,
  loading = false,
  onOpenInfoModal,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  if (loading) {
    return (
      <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-200 dark:border-parkia-line-dark p-6 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const balance = summary?.balance ?? 0;
  const kmSaved = summary?.km_saved ?? 0;
  const co2Saved = summary?.co2_saved_kg ?? 0;
  const pointsToNext = summary?.points_to_next_discount ?? 100;
  const hasDiscount = summary?.has_discount_available ?? false;
  const progressPercent = Math.min(100, Math.round((balance % 100) || (hasDiscount ? 100 : 0)));

  const causes = summary?.causes;
  const totalEnv = causes?.total_donated_environment ?? 12500;
  const totalInc = causes?.total_donated_inclusion ?? 12500;

  return (
    <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden space-y-6">
      
      {/* Decorative backdrop glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Park for Good
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Tus Green Points e Impacto
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Premio a quienes reservan y van directo al estacionamiento, evitando dar vueltas y reduciendo emisiones de CO₂.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-100 bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            Ver Historial
          </button>
          <button
            onClick={onOpenInfoModal}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            Cómo funciona
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Green Points Balance */}
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-300 font-medium">Saldo de Puntos</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{balance}</span>
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Green Points</span>
            </div>

            {/* Progress bar to 100 points */}
            <div className="mt-2 space-y-1">
              <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${hasDiscount ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${hasDiscount ? 100 : progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 pt-0.5 font-medium">
                {hasDiscount ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    ¡Tenés 10% de descuento disponible en tu próxima reserva!
                  </span>
                ) : (
                  <span>
                    Te faltan <strong className="text-white font-bold">{pointsToNext}</strong> puntos para tu próximo 10% de descuento.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: CO2 Saved */}
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-300 font-medium">CO₂ No Emitido</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Leaf className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-300">{co2Saved}</span>
              <span className="text-xs text-slate-300 font-medium">kg de CO₂</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Ahorro estimado al ir directo sin dar vueltas en auto (1 kg por llegada directa).
            </p>
          </div>
        </div>

        {/* Card 3: KM Saved */}
        <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-300 font-medium">Distancia Ahorrada</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-300">{kmSaved}</span>
              <span className="text-xs text-slate-300 font-medium">km no conducidos</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Estimación de 5 km y ~20 min menos de tráfico por reserva directa en CABA.
            </p>
          </div>
        </div>

      </div>

      {/* Causes Impact Summary (BF1) */}
      <div className="bg-black/30 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Causas que apoyamos con Park for Good
            </span>
            <p className="text-xs text-slate-300 mt-0.5">
              El 5% de la comisión de Parkia en cada reserva se destina automáticamente a estas dos causas (sin costo extra para vos ni para el estacionamiento).
            </p>
          </div>
          <span className="text-[11px] font-bold bg-white/10 text-slate-300 px-2.5 py-1 rounded-full border border-white/10">
            Aporte automático por reserva
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Causa 1: Ambiente */}
          <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Trees className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Ambiente</span>
                <span className="text-[11px] text-slate-300 block">
                  Plantación de árboles nativos (PlantArg / Plantarse)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase">Total Donado</span>
              <span className="text-sm font-black text-emerald-400">
                ${totalEnv.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Causa 2: Inclusión */}
          <div className="p-3 bg-sky-950/50 rounded-xl border border-sky-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                <Accessibility className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Inclusión</span>
                <span className="text-[11px] text-slate-300 block">
                  Accesibilidad universal (Rumbos / Acceso Ya / TINC)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase">Total Donado</span>
              <span className="text-sm font-black text-sky-400">
                ${totalInc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <Modal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)}
        title="Historial de Green Points"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">Saldo actual disponible:</span>
            <strong className="text-base font-black text-emerald-600 dark:text-emerald-400">{balance} pts</strong>
          </div>

          {summary?.history && summary.history.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {summary.history.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 bg-white dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{item.created_at}</span>
                      {item.booking_code && (
                        <span>• Reserva: <strong>{item.booking_code}</strong></span>
                      )}
                    </div>
                  </div>

                  <span className={`text-sm font-black shrink-0 ${
                    item.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {item.points > 0 ? `+${item.points}` : item.points} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
              Aún no registras movimientos de Green Points. ¡Completá tu primera reserva con check-in para sumar 10 puntos!
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
};
