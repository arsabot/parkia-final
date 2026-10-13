import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingCircle, ShieldCheck, Zap, Smartphone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-navy-900 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                <ParkingCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-white leading-none">PARKIA</span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-0.5">ESTACIONA FÁCIL</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              La plataforma líder para encontrar, comparar y reservar lugares de estacionamiento en tiempo real antes de salir.
            </p>
            <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% Plazas aseguradas y confirmación inmediata
            </div>
          </div>

          {/* Conductores */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Conductores</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-white transition-colors">Buscar Estacionamiento</Link>
              </li>
              <li>
                <Link to="/my-reservations" className="hover:text-white transition-colors">Mis Reservas</Link>
              </li>
              <li>
                <Link to="/favorites" className="hover:text-white transition-colors">Mis Favoritos</Link>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">Cómo Funciona</a>
              </li>
            </ul>
          </div>

          {/* Estacionamientos adheridos */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Para Dueños & Garages</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">Panel de Control</Link>
              </li>
              <li>
                <Link to="/admin/parkings" className="hover:text-white transition-colors">Administrar Garages</Link>
              </li>
              <li>
                <Link to="/admin/spaces" className="hover:text-white transition-colors">Monitoreo de Plazas</Link>
              </li>
              <li>
                <a href="#beneficios-b2b" className="hover:text-white transition-colors">Adherir mi Estacionamiento</a>
              </li>
            </ul>
          </div>

          {/* Seguridad y Confianza */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Garantía Parkia</h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Espacios verificados y monitoreo 24hs con CCTV.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Confirmación instantánea con código QR/PK único.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Acceso rápido desde el móvil sin ticket físico.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PARKIA Mobility Technologies. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span>Privacidad</span>
            <span>Términos y Condiciones</span>
            <span>Contacto y Soporte</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
