import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  MapPin, 
  Car, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw 
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { reservationService } from '../../services/reservationService';
import { parkingService } from '../../services/parkingService';
import { Reservation, Parking, ReservationStatus } from '../../types';

export const AdminReservationsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [parkingFilter, setParkingFilter] = useState<string>('all');

  const { success, error } = useToast();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (parkingFilter !== 'all') params.parking_id = Number(parkingFilter);
      if (search.trim()) params.search = search.trim();

      const data = await reservationService.getReservations(params);
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchParkings = async () => {
      try {
        const data = isOwner ? await parkingService.getMyParkings() : await parkingService.getParkings();
        setParkings(data);
        if (isOwner && data.length > 0) {
          setParkingFilter(String(data[0].id));
        }
      } catch (err) {
        console.error('Error fetching parkings', err);
      }
    };
    fetchParkings();
  }, [isOwner]);

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, parkingFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReservations();
  };

  const handleChangeStatus = async (id: number, newStatus: ReservationStatus) => {
    try {
      if (newStatus === 'cancelled') {
        const res = await reservationService.cancelReservation(id, 'Cancelada por el administrador / operador');
        setReservations((prev) => prev.map((r) => (r.id === id ? res.reservation : r)));
        success(res.message || 'Reserva cancelada');
      } else {
        const res = await reservationService.changeStatus(id, newStatus);
        setReservations((prev) => prev.map((r) => (r.id === id ? res.reservation : r)));
        success(res.message || 'Estado actualizado');
      }
    } catch (err: any) {
      error(err.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-parkia-page-dark py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Historial y Control de Reservas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Consulta, filtra y modifica el estado de todas las reservas de la plataforma.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReservations}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Actualizar
          </Button>
        </div>

        <div className="space-y-6">
            
            {/* Filter controls */}
            <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-5 shadow-sm space-y-4 transition-colors">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por código PK-XXXXXX, patente o conductor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <Button type="submit" variant="primary">
                  Buscar
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Estado:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Finalizadas</option>
                    <option value="cancelled">Canceladas</option>
                    <option value="pending">Pendientes</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Estacionamiento:</span>
                  {isOwner && parkings.length <= 1 ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700" />
                      <span>{parkings[0]?.name || 'Tu Garaje'}</span>
                    </div>
                  ) : (
                    <select
                      value={parkingFilter}
                      onChange={(e) => setParkingFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      {!isOwner && <option value="all">Todos los estacionamientos</option>}
                      {parkings.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Tablet Portrait & Mobile Cards List (<lg) */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-parkia-line-dark bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm overflow-hidden transition-colors">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Cargando reservas...
                </div>
              ) : reservations.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No se encontraron reservas con los filtros aplicados.
                </div>
              ) : (
                reservations.map((res) => (
                  <div key={res.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm sm:text-base">
                            {res.booking_code}
                          </span>
                          <span className="font-mono font-bold text-navy-900 dark:text-white text-sm sm:text-base">
                            {res.vehicle_plate}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{res.user_name || 'Conductor'}</p>
                        <span className="text-xs text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 px-2.5 py-0.5 rounded-md inline-block mt-1">
                          {res.parking_name} • Plaza {res.space_code}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={res.status as any}>{res.status_display}</Badge>
                        {res.payment_status === 'refunded' && (
                          <span className="text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800 whitespace-nowrap">
                            ↩ Reembolsado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 dark:bg-parkia-page-dark p-3 rounded-2xl text-xs border border-slate-100 dark:border-parkia-line-dark">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Fecha y Horario</span>
                        <span className="font-bold text-slate-900 dark:text-white">{res.date}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">({res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)}hs)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Monto</span>
                        <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                          ${Number(res.total_price).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {res.status === 'confirmed' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-parkia-line-dark">
                        <button
                          type="button"
                          onClick={() => handleChangeStatus(res.id, 'completed')}
                          className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          <span>Finalizar Reserva</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChangeStatus(res.id, 'cancelled')}
                          className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-rose-200 dark:border-rose-800/60"
                        >
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table (>=lg) */}
            <div className="hidden lg:block bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm overflow-hidden transition-colors">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[850px] text-left text-xs">
                  <thead className="border-b border-slate-100 dark:border-parkia-line-dark text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-parkia-navy/60">
                    <tr>
                      <th className="py-4 px-4">Código</th>
                      <th className="py-4 px-3">Conductor</th>
                      <th className="py-4 px-3">Estacionamiento</th>
                      <th className="py-4 px-3">Fecha y Hora</th>
                      <th className="py-4 px-3">Plaza / Auto</th>
                      <th className="py-4 px-3">Total</th>
                      <th className="py-4 px-3">Estado</th>
                      <th className="py-4 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-parkia-line-dark text-slate-700 dark:text-slate-300 font-medium">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          Cargando reservas...
                        </td>
                      </tr>
                    ) : reservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No se encontraron reservas con los filtros aplicados.
                        </td>
                      </tr>
                    ) : (
                      reservations.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                            {res.booking_code}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="text-slate-900 dark:text-white block">{res.user_name || 'Conductor'}</strong>
                            <span className="text-[11px] text-slate-400">{res.user_email}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{res.parking_name}</span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="block font-bold text-slate-900 dark:text-white">{res.date}</span>
                            <span className="text-[11px] text-slate-400">
                              {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)} hs
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded mr-1">
                              {res.space_code}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {res.vehicle_plate}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-slate-900 dark:text-white">
                            ${Number(res.total_price).toLocaleString('es-AR')}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={res.status as any}>{res.status_display}</Badge>
                              {res.payment_status === 'refunded' && (
                                <span className="text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800 whitespace-nowrap">
                                  ↩ Reembolsado
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {res.status === 'confirmed' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleChangeStatus(res.id, 'completed')}
                                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60"
                                    title="Marcar como finalizada al salir"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Finalizar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleChangeStatus(res.id, 'cancelled')}
                                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800/60"
                                    title="Cancelar reserva"
                                  >
                                    <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                    <span>Cancelar</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};
