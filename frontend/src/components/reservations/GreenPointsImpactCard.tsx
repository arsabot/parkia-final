import React, { useState } from 'react';
import {
  Car,
  Cloud,
  Tag,
  TreePine,
  Accessibility,
  AlertCircle,
  RefreshCw,
  Info,
  Leaf,
  History,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useGreenPoints } from '../../hooks/useGreenPoints';
import { Modal } from '../common/Modal';

interface GreenPointsImpactCardProps {
  className?: string;
  isHowItWorksOpen?: boolean;
  onHowItWorksOpen?: () => void;
  onHowItWorksClose?: () => void;
}

export const GreenPointsImpactCard: React.FC<GreenPointsImpactCardProps> = ({
  className = '',
  isHowItWorksOpen: externalOpen,
  onHowItWorksOpen: externalOpenCallback,
  onHowItWorksClose: externalClose
}) => {
  const { balance, transactions, loading, error, pointsNeeded, hasDiscount, refetch } = useGreenPoints();
  const [internalHowItWorksOpen, setInternalHowItWorksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isModalOpen = externalOpen !== undefined ? externalOpen : internalHowItWorksOpen;
  const handleCloseModal = externalClose || (() => setInternalHowItWorksOpen(false));

  // 1. Estado de Carga
  if (loading) {
    return (
      <div className={`rounded-3xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-white/10 p-6 sm:p-8 animate-pulse ${className}`}>
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-white/5"></div>
      </div>
    );
  }

  // 2. Estado de Error
  if (error || !balance) {
    return (
      <div className={`rounded-3xl bg-white dark:bg-[#0B1327] border border-rose-500/30 p-5 sm:p-6 text-rose-600 dark:text-rose-300 flex items-center justify-between gap-4 shadow-sm ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <p className="text-sm font-semibold">
            {error || 'No pudimos cargar tus Green Points en este momento.'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  // Progreso hacia los 100 puntos
  const threshold = balance.nextDiscountThreshold || 100;
  const progressPercent = Math.min(100, Math.round((balance.points / threshold) * 100));

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-[#A3E635]/40 shadow-xl dark:shadow-[0_0_35px_rgba(163,230,53,0.12)] p-6 sm:p-7 md:p-8 transition-all duration-300 hover:border-emerald-500/50 dark:hover:border-[#A3E635]/70 hover:shadow-2xl dark:hover:shadow-[0_0_45px_rgba(163,230,53,0.18)] ${className}`}
      >
        {/* Resplandor ambiental suave */}
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-emerald-400/5 dark:bg-[#A3E635]/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-teal-400/5 dark:bg-[#A3E635]/5 blur-3xl" />

        {/* ============================================================== */}
        {/* CABECERA DE LA TARJETA: Tag + Botones Ver Historial y Cómo funciona */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-white/5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-[#A3E635] bg-emerald-50 dark:bg-[#A3E635]/10 border border-emerald-300 dark:border-[#A3E635]/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#A3E635] animate-pulse" />
              Park for Good
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Conducción sustentable
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121D36] hover:bg-slate-100 dark:hover:bg-[#1A284A] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A3E635]" />
              Ver Historial
            </button>
            <button
              onClick={() => {
                if (externalOpenCallback) externalOpenCallback();
                else setInternalHowItWorksOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121D36] hover:bg-slate-100 dark:hover:bg-[#1A284A] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-[#A3E635]" />
              ¿Cómo funciona?
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECCIÓN SUPERIOR: 2 Columnas balanceadas                       */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch relative z-10">
          
          {/* COLUMNA IZQUIERDA: Puntos, Barra y Descuento */}
          <div className="lg:col-span-7 flex flex-col justify-between pr-0 lg:pr-8 lg:border-r lg:border-slate-200/80 lg:dark:border-white/10 space-y-4">
            
            {/* Encabezado: Icono Hoja + Título + Puntos */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#121D36] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                <Leaf className="w-7 h-7 text-emerald-600 dark:text-[#A3E635]" />
              </div>

              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                  Tus Green Points e Impacto
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Premio a quienes reservan y van directo al estacionamiento, reduciendo emisiones de CO₂.
                </p>
                
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                    {balance.points}
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-[#A3E635]">
                    GP
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Progreso */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-3.5 bg-slate-100 dark:bg-[#121D36] rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 dark:from-[#84cc16] dark:to-[#A3E635] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(163,230,53,0.3)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Meta para descuento: 100 GP</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {balance.points} / {threshold} GP
                </span>
              </div>
            </div>

            {/* Píldora de Descuento */}
            <div className="rounded-2xl bg-slate-50 dark:bg-[#121D36]/80 border border-emerald-500/25 dark:border-[#A3E635]/30 p-3 flex items-center gap-3 shadow-sm">
              <Tag className="w-4 h-4 text-emerald-600 dark:text-[#A3E635] shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                {hasDiscount ? (
                  <>
                    ¡Tenés un <strong className="text-emerald-600 dark:text-[#A3E635] font-bold">10% de descuento</strong> listo para usar en tu próxima reserva!
                  </>
                ) : (
                  <>
                    Te faltan <strong className="text-emerald-600 dark:text-[#A3E635] font-bold">{pointsNeeded} puntos</strong> para tu próximo <strong className="text-emerald-600 dark:text-[#A3E635] font-bold">10% de descuento</strong>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* COLUMNA DERECHA: 2 Sub-tarjetas de Movilidad (CO2 y Distancia con explicación) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">
            
            {/* Sub-tarjeta 1: CO2 */}
            <div className="flex-1 rounded-2xl p-4 bg-slate-50/80 dark:bg-[#121D36]/80 hover:bg-slate-100/80 dark:hover:bg-[#121D36] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <div className="relative flex items-center justify-center">
                    <Cloud className="w-7 h-7 text-emerald-600 dark:text-[#A3E635]" />
                    <span className="absolute text-[8px] font-black text-emerald-700 dark:text-[#A3E635] top-[9px]">
                      CO₂
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                    {balance.co2Saved} <span className="text-base font-bold text-slate-500 dark:text-slate-300">kg CO₂</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Ahorro estimado al ir directo sin dar vueltas en auto (1 kg por llegada directa).
                  </p>
                </div>
              </div>
              <div title="1 reserva completada = 1 kg de CO₂ evitado" className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Info className="w-4 h-4" />
              </div>
            </div>

            {/* Sub-tarjeta 2: Distancia y Tráfico */}
            <div className="flex-1 rounded-2xl p-4 bg-slate-50/80 dark:bg-[#121D36]/80 hover:bg-slate-100/80 dark:hover:bg-[#121D36] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                  <Car className="w-6 h-6 text-emerald-600 dark:text-[#A3E635]" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                    {balance.kmSaved} <span className="text-base font-bold text-slate-500 dark:text-slate-300">km</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Estimación de 5 km y ~20 min menos de tráfico por reserva directa en CABA.
                  </p>
                </div>
              </div>
              <div title="Basado en informes de movilidad urbana CABA" className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Info className="w-4 h-4" />
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* FRANJA INFERIOR CONTINUA: Causas que apoyamos + Explicación   */}
        {/* ============================================================== */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/10 relative z-10">
          
          {/* Encabezado de Causas con Píldora de aporte automático */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                Causas que apoyamos con Park for Good
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                El 5% de la comisión de Parkia en cada reserva se destina automáticamente a estas dos causas (sin costo extra para vos ni para el estacionamiento).
              </p>
            </div>
            <span className="self-start sm:self-auto inline-flex items-center text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-[#A3E635] bg-emerald-50 dark:bg-[#A3E635]/10 border border-emerald-300 dark:border-[#A3E635]/30 px-2.5 py-0.5 rounded-full shrink-0">
              Aporte automático por reserva
            </span>
          </div>

          {/* Tarjetas de Causas (Ambiente e Inclusión) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3">
            {/* Causa 1: Ambiente */}
            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50/80 dark:bg-[#121D36]/80 hover:bg-slate-100/80 dark:hover:bg-[#121D36] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                <TreePine className="w-5 h-5 text-emerald-600 dark:text-[#A3E635]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ambiente</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Plantación de árboles nativos (PlantArg / Plantarse)
                </p>
              </div>
            </div>

            {/* Causa 2: Inclusión */}
            <div className="rounded-2xl p-3.5 sm:p-4 bg-slate-50/80 dark:bg-[#121D36]/80 hover:bg-slate-100/80 dark:hover:bg-[#121D36] border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#0B1327] border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                <Accessibility className="w-5 h-5 text-emerald-600 dark:text-[#A3E635]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inclusión</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Accesibilidad universal (Rumbos / Acceso Ya / TINC)
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer académico */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4">
            Calculado con las reservas del sistema, que en esta versión son de demostración. No se transfirió dinero real a ninguna ONG.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ¿Cómo funciona?                                         */}
      {/* ============================================================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="¿Cómo funciona Park for Good?"
        maxWidth="lg"
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm font-sans">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Buscar estacionamiento en la ciudad genera demoras y emisiones de CO₂ evitables. 
            Park for Good es el programa de Parkia que premia a quienes reservan y van directo hacia el estacionamiento.
          </p>

          <div className="space-y-3 mt-3">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-[#A3E635] flex items-center justify-center shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white block text-sm">Reservá tu lugar en Parkia</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Llegá al estacionamiento y mostrá tu código QR en la entrada.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-[#A3E635] flex items-center justify-center shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white block text-sm">Disfrutá tu reserva y sumá puntos</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Cuando la reserva termina con QR validado, sumás <strong>10 Green Points</strong>, <strong>5 km</strong> que no manejaste y <strong>1 kg de CO₂</strong> que no emitiste.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-[#A3E635] flex items-center justify-center shrink-0 font-bold text-xs">
                3
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white block text-sm">Recibí tu descuento</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Al llegar a 100 puntos, se te aplica automáticamente un <strong>10% de descuento</strong> en tu próxima reserva.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-[#A3E635] flex items-center justify-center shrink-0 font-bold text-xs">
                4
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white block text-sm">Propuesta de valor For Good</strong>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Una parte de la comisión de Parkia se destina a ONGs ambientales (plantar árboles nativos) y de accesibilidad e inclusión. Sin ningún costo extra para vos ni para el estacionamiento.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL: Ver Historial de Green Points                            */}
      {/* ============================================================== */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="Historial de Green Points"
        maxWidth="lg"
      >
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm font-sans">
          
          {/* Resumen superior del modal */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121D36] border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Saldo total</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {balance.points} <span className="text-emerald-600 dark:text-[#A3E635] text-base">GP</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Impacto acumulado</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {balance.co2Saved} kg CO₂ evitados · {balance.kmSaved} km ahorrados
              </span>
            </div>
          </div>

          {/* Lista de transacciones */}
          <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-80 overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                Aún no registraste transacciones de Green Points.
              </p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-[#A3E635]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#A3E635]" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {tx.parkingName || 'Reserva con QR verificado'}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(tx.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })} · {tx.co2EarnedKg} kg CO₂ · {tx.kmEarned} km
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-600 dark:text-[#A3E635] bg-emerald-50 dark:bg-[#A3E635]/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-[#A3E635]/30 shrink-0">
                    +{tx.pointsEarned} GP
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
