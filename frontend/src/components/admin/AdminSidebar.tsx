import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Grid, 
  CalendarCheck, 
  ShieldCheck,
  ScanLine,
  Building2,
  Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const { user, isSuperAdmin, isOwner } = useAuth();

  // Links for Super Admin (Ariel - Administrador de la plataforma)
  const superAdminLinks = [
    { to: '/admin', label: 'Panel Global Plataforma', icon: LayoutDashboard, end: true },
    { to: '/admin/parkings', label: 'Alta y Baja de Garajes', icon: Car },
    { to: '/admin/gate', label: 'Control Accesos & QR', icon: ScanLine },
    { to: '/admin/spaces', label: 'Monitoreo de Plazas', icon: Grid },
    { to: '/admin/reservations', label: 'Todas las Reservas', icon: CalendarCheck },
  ];

  // Links for Parking Owner / Operator (Dueño del garaje)
  const ownerLinks = [
    { to: '/admin/gate', label: 'Cámara QR & Control Garita', icon: ScanLine, end: true },
    { to: '/admin/spaces', label: 'Plazas Vacantes en Vivo', icon: Grid },
    { to: '/admin/reservations', label: 'Caja & Historial Turnos', icon: CalendarCheck },
  ];

  const links = isSuperAdmin ? superAdminLinks : ownerLinks;

  return (
    <aside className="w-full lg:w-64 bg-white rounded-3xl border border-slate-100 p-4 shadow-sm shrink-0">
      <div className="flex items-center gap-3 px-3 py-4 mb-3 border-b border-slate-100">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-inner ${
          isSuperAdmin 
            ? 'bg-amber-50 text-amber-600 border border-amber-200/80' 
            : 'bg-teal-50 text-teal-700 border border-teal-200/80'
        }`}>
          {isSuperAdmin ? <Crown className="w-5 h-5 text-amber-500" /> : <Building2 className="w-5 h-5 text-teal-600" />}
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-navy-900 leading-tight">
            {isSuperAdmin ? 'Super Admin' : 'Portal Operador'}
          </h4>
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isSuperAdmin ? 'Gestor de Plataforma' : 'Garaje en Línea'}
          </span>
        </div>
      </div>

      {/* Role explanation pill */}
      <div className="mb-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed">
        {isSuperAdmin ? (
          <span>
            👑 <strong>Ariel:</strong> Alta, baja y control total de estacionamientos.
          </span>
        ) : (
          <span>
            🏢 <strong>Dueño:</strong> Escáner QR de garita, plazas vacantes y caja.
          </span>
        )}
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-md shadow-navy-950/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
