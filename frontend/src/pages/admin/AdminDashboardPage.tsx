import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Car, 
  CalendarCheck, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Layers,
  ArrowUpRight,
  Star
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { KPICard } from '../../components/admin/KPICard';
import { Badge } from '../../components/common/Badge';
import { adminService } from '../../services/adminService';
import { AdminDashboardData } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboardPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const stats = await adminService.getDashboardStats();
        setData(stats);
      } catch (err) {
        console.error('Error loading admin stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-parkia-page-dark py-8 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white dark:bg-parkia-card-dark rounded-3xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-white dark:bg-parkia-card-dark rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const { kpis, charts, recent_reservations } = data;
  const platformCommission = kpis.platform_commission ?? Math.round(Number(kpis.total_revenue) * 0.15);
  const ownerNetRevenue = kpis.owner_net_revenue ?? Math.round(Number(kpis.total_revenue) * 0.85);
  const todayPlatformCommission = kpis.today_platform_commission ?? Math.round(Number(kpis.today_revenue) * 0.15);
  const todayOwnerNetRevenue = kpis.today_owner_net_revenue ?? Math.round(Number(kpis.today_revenue) * 0.85);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-parkia-page-dark py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Panel de Control y Estadísticas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Supervisión en tiempo real de ocupación, reservas e ingresos de los estacionamientos.
          </p>
        </div>

        {/* Main Dashboard Area */}
        <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KPICard
                title="Reservas Totales"
                value={kpis.total_reservations}
                subtitle={`Hoy: +${kpis.today_reservations} reservas`}
                icon={CalendarCheck}
                variant="brand"
                trend={{ value: '+18%', isPositive: true }}
              />

              <KPICard
                title="Ocupación Actual"
                value={`${kpis.occupancy_rate}%`}
                subtitle={`${kpis.occupied_spaces} de ${kpis.total_spaces} plazas en uso`}
                icon={Layers}
                variant={kpis.occupancy_rate > 80 ? 'amber' : 'emerald'}
              />

              <KPICard
                title="Ingresos Estimados"
                value={`$${Number(kpis.total_revenue).toLocaleString('es-AR')}`}
                subtitle={`Hoy: $${Number(kpis.today_revenue).toLocaleString('es-AR')}`}
                icon={DollarSign}
                variant="emerald"
                trend={{ value: '+24%', isPositive: true }}
              />

              <KPICard
                title="Garages Activos"
                value={kpis.active_parkings}
                subtitle={`De ${kpis.total_parkings} registrados`}
                icon={Car}
                variant="blue"
              />
            </div>

            {/* Liquidación Financiera y Modelo de Negocio (15% Comisión Parkia / 85% Neto Dueño) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 rounded-3xl p-6 sm:p-7 border border-slate-800 dark:border-parkia-line-dark shadow-xl text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-white/10 mb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {isOwner ? 'Liquidación del Garaje' : 'Modelo de Negocio Parkia'}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      Tasa Estándar: 15% Comisión Plataforma • 85% Liquidación Dueño
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                    {isOwner ? 'Desglose Financiero y Ganancia Neta' : 'Liquidación y Distribución de Ingresos'}
                  </h2>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block font-medium">Volumen Total Procesado</span>
                  <span className="text-2xl font-black text-white">
                    ${Number(kpis.total_revenue).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Columna 1: Ingreso Bruto */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-xs text-slate-400 font-medium block">
                    {isOwner ? 'Cobros Brutos del Garaje' : 'Ingresos Brutos Plataforma'}
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    ${Number(kpis.total_revenue).toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    100% de reservas confirmadas y cobradas
                  </span>
                </div>

                {/* Columna 2: Comisión Super Admin Parkia */}
                <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-brand-300 font-bold">
                      {isOwner ? 'Comisión de Servicio Parkia (15%)' : 'Ganancia Super Admin (15%)'}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded">
                      {isOwner ? 'Deducido' : 'Ganancia Parkia'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-brand-300 mt-1 block">
                    {isOwner ? '-' : ''}${platformCommission.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-slate-300 mt-1 block">
                    {isOwner 
                      ? 'Tarifa por uso del software, pasarela y app'
                      : `Hoy: +$${todayPlatformCommission.toLocaleString('es-AR')} por comisiones`}
                  </span>
                </div>

                {/* Columna 3: Ganancia Neta Dueño */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-300 font-bold">
                      {isOwner ? 'Tu Ganancia Neta (85%)' : 'Total a Liquidar a Dueños (85%)'}
                    </span>
                    <span className="text-[10px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                      {isOwner ? 'A Cobrar' : 'Para Garajes'}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    ${ownerNetRevenue.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-slate-300 mt-1 block">
                    {isOwner 
                      ? 'Saldo neto disponible para transferencia bancaria'
                      : `Hoy: +$${todayOwnerNetRevenue.toLocaleString('es-AR')} a transferir`}
                  </span>
                </div>
              </div>
            </div>

            {/* Recharts: Row 1 - Daily Evolution & Peak Hours */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Chart 1: Daily Trend */}
              <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Reservas por Día</h3>
                    <p className="text-xs text-slate-400">Evolución de los últimos 7 días</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800/40">
                    Última semana
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.reservations_by_day} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                      <XAxis dataKey="day_name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="reservations" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRes)" name="Reservas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Peak Hours Occupancy */}
              <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Demanda por Franja Horaria</h3>
                    <p className="text-xs text-slate-400">Ocupación estimada según hora del día</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/40">
                    Horarios Pico
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.occupancy_by_hour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="occupancy" fill="#6366f1" radius={[6, 6, 0, 0]} name="Ocupación %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Row 2: Top Parkings & Status Breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Top Performing Garages (2 cols) */}
              <div className="xl:col-span-2 bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">Estacionamientos con Mayor Demanda</h3>
                <div className="space-y-3">
                  {charts.top_parkings.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-parkia-page-dark border border-slate-100 dark:border-parkia-line-dark flex items-center justify-between transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>{p.reservations_count} reservas</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            {p.rating} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" /> de valoración
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-slate-900 dark:text-white block">
                          ${Number(p.revenue).toLocaleString('es-AR')}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {p.occupancy_rate}% ocupación
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Distribution Pie Chart (1 col) */}
              <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base mb-2">Estado de Reservas</h3>
                  <p className="text-xs text-slate-400 mb-4">Proporción según estado actual</p>
                </div>

                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.status_distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {charts.status_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
                  {charts.status_distribution.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Recent Reservations: Cards on <lg, Table on >=lg */}
            <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Últimas Reservas Registradas</h3>
                <span className="text-xs text-slate-400">Total: {recent_reservations.length}</span>
              </div>

              {/* Tablet Portrait & Mobile Cards List (<lg) */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-parkia-line-dark">
                {recent_reservations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No hay reservas registradas.</p>
                ) : (
                  recent_reservations.map((res) => (
                    <div key={res.id} className="py-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm block">
                            {res.booking_code}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm block">
                            {res.user_name || res.user_email}
                          </span>
                          <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold block mt-0.5">
                            {res.parking_name} • Plaza {res.space_code}
                          </span>
                        </div>
                        <Badge variant={res.status as any}>{res.status_display}</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 dark:bg-parkia-page-dark p-2.5 rounded-xl text-xs border border-slate-100 dark:border-parkia-line-dark">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">
                          {res.date} ({res.start_time.slice(0, 5)} hs)
                        </span>
                        <span className="font-black text-slate-900 dark:text-white text-sm">
                          ${Number(res.total_price).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table (>=lg) */}
              <div className="hidden lg:block overflow-x-auto w-full">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="border-b border-slate-100 dark:border-parkia-line-dark text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Conductor</th>
                      <th className="py-3 px-3">Estacionamiento</th>
                      <th className="py-3 px-3">Fecha y Hora</th>
                      <th className="py-3 px-3">Plaza</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-parkia-line-dark text-slate-700 dark:text-slate-300 font-medium">
                    {recent_reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {res.booking_code}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {res.user_name || res.user_email}
                        </td>
                        <td className="py-3 px-3">{res.parking_name}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {res.date} ({res.start_time.slice(0, 5)} hs)
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {res.space_code}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          ${Number(res.total_price).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant={res.status as any}>{res.status_display}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};
