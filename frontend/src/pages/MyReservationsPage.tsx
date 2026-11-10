import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  Car, 
  Layers, 
  Navigation, 
  XCircle, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Frown,
  Calendar,
  QrCode,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';
import { Reservation } from '../types';
import { reservationService } from '../services/reservationService';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { CancelReservationModal } from '../components/reservations/CancelReservationModal';
import { PaymentCheckoutModal, PaymentMethod } from '../components/reservations/PaymentCheckoutModal';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export const MyReservationsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const [selectedForCancel, setSelectedForCancel] = useState<Reservation | null>(null);
  const [selectedForQr, setSelectedForQr] = useState<Reservation | null>(null);
  const [selectedForPayment, setSelectedForPayment] = useState<Reservation | null>(null);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservations();
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (details: { method: PaymentMethod; status: 'paid' | 'pending' }) => {
    if (!selectedForPayment) return;
    try {
      const updated = await reservationService.updatePayment(selectedForPayment.id, details.method, details.status);
      setReservations((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedForPayment(null);
      confetti({ particleCount: 110, spread: 75 });
      success('¡Pago procesado con éxito!');
    } catch (err: any) {
      error(err.message || 'Error al procesar el pago.');
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isAuthenticated) {
      fetchReservations();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const activeReservations = reservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'pending'
  );
  const pastReservations = reservations.filter(
    (r) => r.status === 'completed' || r.status === 'cancelled'
  );

  const displayedList = activeTab === 'active' ? activeReservations : pastReservations;
  const nextReservation = activeReservations[0] || null;

  const handleReservationCancelled = (updated: Reservation) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-parkia-page-dark py-10 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mis Reservas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestiona tus plazas de estacionamiento reservadas y revisa tu historial.
          </p>
        </div>

        {/* Featured Card: Next Reservation */}
        {nextReservation && (
          <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                    Próxima Reserva
                  </span>
                  {nextReservation.payment_status === 'paid' ? (
                    <span className="text-[11px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                      ✓ Pago Acreditado ({nextReservation.payment_method || 'Mercado Pago'})
                    </span>
                  ) : nextReservation.payment_method === 'Efectivo' ? (
                    <span className="text-[11px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Pago en Garita
                    </span>
                  ) : (
                    <span className="text-[11px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                      Pago Pendiente
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mt-2">
                  {nextReservation.parking_name}
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                  {nextReservation.parking_address}, {nextReservation.parking_city}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400 font-medium block">Código</span>
                <span className="font-mono text-xl font-black text-amber-300">
                  {nextReservation.booking_code}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 mb-6 text-xs">
              <div>
                <span className="text-slate-400 block">Fecha:</span>
                <strong className="text-white text-sm">{nextReservation.date}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Horario:</span>
                <strong className="text-white text-sm">
                  {nextReservation.start_time.slice(0, 5)} - {nextReservation.end_time.slice(0, 5)} hs
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Plaza:</span>
                <strong className="text-emerald-400 text-sm">
                  {nextReservation.space_code} ({nextReservation.space_floor})
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Total estimado:</span>
                <strong className="text-white text-sm">
                  ${Number(nextReservation.total_price).toLocaleString('es-AR')}
                </strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {nextReservation.status === 'confirmed' && nextReservation.payment_status !== 'paid' && nextReservation.payment_method !== 'Efectivo' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedForPayment(nextReservation)}
                    leftIcon={<Wallet className="w-4 h-4" />}
                    className="bg-[#009EE3] hover:bg-[#0081B8] text-white shadow-md cursor-pointer"
                  >
                    Pagar con Mercado Pago
                  </Button>
                )}

                <Button
                  variant="emerald"
                  size="sm"
                  leftIcon={<QrCode className="w-4 h-4" />}
                  onClick={() => setSelectedForQr(nextReservation)}
                >
                  Ver Pase QR
                </Button>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${nextReservation.parking_name} ${nextReservation.parking_address}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="sm" leftIcon={<Navigation className="w-4 h-4" />}>
                    GPS
                  </Button>
                </a>
              </div>

              <button
                onClick={() => setSelectedForCancel(nextReservation)}
                className="text-xs font-semibold text-rose-300 hover:text-rose-100 transition-colors"
              >
                Cancelar reserva
              </button>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-parkia-line-dark pb-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Activas ({activeReservations.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'past'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Historial ({pastReservations.length})
          </button>
        </div>

        {/* List of Reservations */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-white dark:bg-parkia-card-dark rounded-3xl animate-pulse" />
            <div className="h-32 bg-white dark:bg-parkia-card-dark rounded-3xl animate-pulse" />
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8" />}
            title={activeTab === 'active' ? 'No tienes reservas activas' : 'No hay historial de reservas'}
            description="Encuentra un estacionamiento en la zona que deseas y resérvalo con antelación."
            actionText="Buscar estacionamiento"
            onAction={() => navigate('/search')}
          />
        ) : (
          <div className="space-y-4">
            {displayedList.map((res) => (
              <div
                key={res.id}
                className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      #{res.booking_code}
                    </span>
                    <Badge variant={res.status as any}>{res.status_display}</Badge>
                    {res.payment_method && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {res.payment_method}
                      </span>
                    )}
                    {res.payment_status === 'refunded' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        ↩ Reembolsado
                      </span>
                    ) : res.payment_status === 'paid' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        ✓ Pagado
                      </span>
                    ) : res.payment_method === 'Efectivo' ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        En garita
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{res.parking_name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                    {res.parking_address}, {res.parking_city}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700 dark:text-slate-300 pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      {res.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      {res.start_time.slice(0, 5)} - {res.end_time.slice(0, 5)} hs
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      Plaza: <strong>{res.space_code}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                      {res.vehicle_plate}
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-parkia-line-dark shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">Total</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      ${Number(res.total_price).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {res.status === 'confirmed' && res.payment_status !== 'paid' && res.payment_method !== 'Efectivo' && (
                      <button
                        onClick={() => setSelectedForPayment(res)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#009EE3] hover:bg-[#0081B8] px-3 py-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                        title="Pagar con Mercado Pago"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Pagar
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedForQr(res)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Ver código QR"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-600" />
                      QR
                    </button>

                    {res.status === 'confirmed' && (
                      <button
                        onClick={() => setSelectedForCancel(res)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* QR Code Modal for Driver */}
      {selectedForQr && (
        <Modal
          isOpen={!!selectedForQr}
          onClose={() => setSelectedForQr(null)}
          title={`Pase Digital • #${selectedForQr.booking_code}`}
          maxWidth="sm"
        >
          <div className="text-center space-y-4">
            <QRCodeDisplay
              value={selectedForQr.booking_code}
              size={200}
              title="Escaneo en Garita / Molinete"
            />
            
            <div className="bg-slate-100/90 dark:bg-parkia-page-dark p-4 rounded-2xl border border-slate-200 dark:border-parkia-line-dark text-left text-xs space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-parkia-line-dark">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Estacionamiento</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-right max-w-[62%] truncate">
                  {selectedForQr.parking_name}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-parkia-line-dark">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Vehículo / Patente</span>
                <span className="font-mono text-slate-900 dark:text-white font-extrabold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {selectedForQr.vehicle_plate}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/80 dark:border-parkia-line-dark">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Fecha y Horario</span>
                <span className="text-slate-900 dark:text-white font-bold text-right">
                  {selectedForQr.date} • {selectedForQr.start_time.slice(0, 5)} - {selectedForQr.end_time.slice(0, 5)} hs
                </span>
              </div>

              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Plaza Asignada</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold border border-emerald-300 dark:border-emerald-800">
                  {selectedForQr.space_code}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Presentá este código al ingresar o salir. El operador o lector registrará automáticamente tu estadía y pago.
            </p>
          </div>
        </Modal>
      )}

      {/* Cancel Modal Instance */}
      {selectedForCancel && (
        <CancelReservationModal
          isOpen={!!selectedForCancel}
          onClose={() => setSelectedForCancel(null)}
          reservation={selectedForCancel}
          onCancelled={handleReservationCancelled}
        />
      )}

      {/* Payment Checkout Modal for Driver */}
      {selectedForPayment && (
        <PaymentCheckoutModal
          isOpen={!!selectedForPayment}
          onClose={() => setSelectedForPayment(null)}
          method={(selectedForPayment.payment_method as PaymentMethod) || 'Mercado Pago'}
          amount={Number(selectedForPayment.total_price)}
          parkingName={selectedForPayment.parking_name}
          durationHours={Number(selectedForPayment.total_hours)}
          onPaymentSuccess={handlePaymentComplete}
        />
      )}
    </div>
  );
};
