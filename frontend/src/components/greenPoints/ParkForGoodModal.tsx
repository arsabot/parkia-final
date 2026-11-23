import React from 'react';
import { 
  X, 
  Sparkles, 
  Leaf, 
  Trees, 
  Accessibility, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  MapPin, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { Modal } from '../common/Modal';

interface ParkForGoodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParkForGoodModal: React.FC<ParkForGoodModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="xl">
      <div className="space-y-8 p-1 sm:p-2 text-slate-800 dark:text-slate-100">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 -mx-6 -mt-6 p-6 sm:p-8 rounded-t-2xl text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Programa Park for Good
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Reservá, llegá directo y sumá Green Points
          </h2>
          <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Sabemos que dar vueltas buscando lugar para estacionar gasta tiempo y combustible, y genera emisiones de CO₂ que se pueden evitar. <strong>Park for Good</strong> es el programa de Parkia que premia a quienes reservan y van directo hacia el estacionamiento.
          </p>
        </div>

        {/* 1. Cómo funciona */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-xs font-black">1</span>
            Cómo funciona
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-1.5">
              <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase">Paso 1</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong>Reservá tu lugar</strong> en la app de Parkia antes de salir.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-1.5">
              <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase">Paso 2</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong>Llegá directo</strong> y mostrá tu código QR en la entrada de la garita.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-1.5">
              <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase">Paso 3</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong>Disfrutá tu estadía</strong>. Al finalizar la reserva se te suman automáticamente los Green Points.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-1.5">
              <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase">Paso 4</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong>Recibí tu descuento</strong>: Al llegar a 100 puntos, se aplica solo un 10% de descuento en tu próxima reserva.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-1.5">
              <span className="text-[11px] font-black text-brand-600 dark:text-brand-400 uppercase">Paso 5</span>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                <strong>Mirá tu impacto</strong> en "Mis reservas": tus puntos, CO₂ y km evitados, y el total destinado a las causas.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Cuánto ahorrás & 3. Cuándo se suman */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 inline-flex items-center justify-center text-xs font-black">2</span>
              Cuánto ahorrás por reserva directa
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Buscar estacionamiento en CABA lleva alrededor de <strong>20 minutos</strong>. En ese tiempo se recorren unos <strong>5 km</strong> y se emite <strong>1 kg de CO₂</strong>. Usamos ese valor de referencia para calcular tu ahorro estimado:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 bg-white dark:bg-parkia-card-dark rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">5 km</span>
                <span className="text-[10px] text-slate-500 font-medium">que no manejaste</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-parkia-card-dark rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">1 kg</span>
                <span className="text-[10px] text-slate-500 font-medium">CO₂ no emitido</span>
              </div>
              <div className="p-2.5 bg-white dark:bg-parkia-card-dark rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">10</span>
                <span className="text-[10px] text-slate-500 font-medium">Green Points</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              * Valores estimados e iguales para todas las reservas según referencias de Clarín e Iprofesional (MVP).
            </p>
          </section>

          <section className="p-5 bg-slate-50 dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-2xl space-y-3">
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 inline-flex items-center justify-center text-xs font-black">3</span>
              Cuándo se suman los puntos
            </h3>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>El personal del estacionamiento validó tu código QR al llegar.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Tu reserva finalizó en fecha y horario.</span>
              </li>
              <li className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Si reservás y no vas, o cancelás la reserva, no hay puntos. Si una reserva se reembolsa, sus puntos se descuentan sin saldo negativo.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* 4. Propuesta de valor "For Good" */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-xs font-black">4</span>
              Propuesta de valor "For Good": Las dos causas
            </h3>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              Cada causa recibe el 5% de la comisión de Parkia
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Una parte de la comisión de Parkia se destina a dos causas esenciales. <strong>Al usuario no se le cobra de más y el estacionamiento conserva intacta su parte (85%)</strong>. La donación y los descuentos salen 100% de la comisión de Parkia. Cada reserva aporta automáticamente sin que tengas que hacer ningún trámite.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Causa 1: Ambiente */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <Trees className="w-4 h-4 text-emerald-600" />
                Ambiente: Reforestación nativa
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apoyamos a ONGs ambientales para plantar árboles nativos en diversas regiones de Argentina, restaurando ecosistemas y absorbiendo CO₂.
              </p>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                Posibles ONGs aliadas: Plantarse, PlantArg.
              </div>
            </div>

            {/* Causa 2: Inclusión */}
            <div className="p-4 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-sm">
                <Accessibility className="w-4 h-4 text-sky-600" />
                Inclusión: Accesibilidad universal
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apoyamos a ONGs que trabajan por la accesibilidad de personas con discapacidad (visual, auditiva e intelectual, no solo motriz). Cumplir la ley es el piso: eliminamos barreras de señalización e información, proyectando esa accesibilidad también en la propia plataforma de Parkia.
              </p>
              <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold pt-1">
                Posibles ONGs aliadas: Fundación Rumbos, Fundación TINC, Acceso Ya.
              </div>
            </div>
          </div>
        </section>

        {/* 5. Preguntas Frecuentes */}
        <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-parkia-line-dark">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <HelpCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            Preguntas Frecuentes
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-parkia-card-dark rounded-xl border border-slate-200 dark:border-parkia-line-dark">
              <strong className="text-slate-900 dark:text-white block mb-1">
                ¿Para qué sirven los Green Points?
              </strong>
              <p className="text-slate-600 dark:text-slate-300">
                Con 100 puntos acumulados, se te aplica automáticamente un 10% de descuento en tu próxima reserva. Además, cada una de tus reservas aporta automáticamente a las dos causas (ambiente e inclusión), sin costo adicional para vos ni para el estacionamiento.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-parkia-card-dark rounded-xl border border-slate-200 dark:border-parkia-line-dark">
              <strong className="text-slate-900 dark:text-white block mb-1">
                ¿Park for Good compensa mi huella de carbono?
              </strong>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>No.</strong> Park for Good no compensa emisiones: premia que evites dar vueltas, que es donde se origina el CO₂ innecesario al buscar lugar. La donación a las causas es aparte: no se usa para compensar tus emisiones.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-parkia-card-dark rounded-xl border border-slate-200 dark:border-parkia-line-dark">
              <strong className="text-slate-900 dark:text-white block mb-1">
                ¿Los números son exactos?
              </strong>
              <p className="text-slate-600 dark:text-slate-300">
                Son estimaciones basadas en un valor de referencia según investigaciones de Clarín e Iprofesional (20 minutos de búsqueda = ~5 km recorridos y ~1 kg de CO₂ emitido), no mediciones telemétricas individuales de tu vehículo.
              </p>
            </div>
          </div>
        </section>

      </div>
    </Modal>
  );
};
