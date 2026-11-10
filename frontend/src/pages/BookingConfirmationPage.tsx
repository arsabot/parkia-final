import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Copy, 
  MapPin, 
  Calendar, 
  Clock, 
  Car, 
  Layers, 
  Navigation, 
  ArrowRight,
  Download,
  Share2,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Reservation } from '../types';
import { reservationService } from '../services/reservationService';
import { Button } from '../components/common/Button';
import { QRCodeDisplay } from '../components/common/QRCodeDisplay';
import { PaymentCheckoutModal, PaymentMethod } from '../components/reservations/PaymentCheckoutModal';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [reservation, setReservation] = useState<Reservation | null>(
    (location.state as any)?.reservation || null
  );
  const [loading, setLoading] = useState(!reservation);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (!reservation && id) {
      reservationService.getReservationById(id)
        .then((data) => {
          setReservation(data);
          setLoading(false);
        })
        .catch(() => {
          navigate('/my-reservations');
        });
    }
  }, [id, reservation, navigate]);

  const copyCode = () => {
    if (reservation?.booking_code) {
      navigator.clipboard.writeText(reservation.booking_code);
      success('Código de reserva copiado al portapapeles');
    }
  };

  const handleOnlinePaymentComplete = async (details: { method: PaymentMethod; status: 'paid' | 'pending' }) => {
    if (!reservation) return;
    try {
      const updated = await reservationService.updatePayment(reservation.id, details.method, details.status);
      setReservation(updated);
      setIsCheckoutOpen(false);
      confetti({
        particleCount: 120,
        spread: 80,
      });
      success('¡Pago procesado con éxito!');
    } catch (err: any) {
      error(err.message || 'Error al actualizar el pago.');
    }
  };

  if (loading || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-parkia-page-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 dark:border-brand-400"></div>
      </div>
    );
  }

  const isPaid = reservation.payment_status === 'paid';
  const isCash = reservation.payment_method === 'Efectivo';
  const paymentMethodLabel = reservation.payment_method || 'Mercado Pago';

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${reservation.parking_name} ${reservation.parking_address}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-parkia-page-dark py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        
        {/* Top Success Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-scale-in">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isPaid ? '¡Pago y Reserva Confirmados!' : '¡Reserva Confirmada!'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {isPaid 
              ? 'Tu plaza está paga y garantizada. Presentá este código al llegar.'
              : isCash
              ? 'Tu plaza está reservada. Abonás en efectivo al ingresar en garita.'
              : 'Tu lugar está reservado. Podés pagar online con Mercado Pago o al llegar.'}
          </p>
        </div>

        {/* Digital Boarding Pass / Ticket Card */}
        <div className="bg-white dark:bg-parkia-card-dark rounded-3xl shadow-xl border border-slate-200 dark:border-parkia-line-dark overflow-hidden relative transition-colors">
          
          {/* Top Header of Ticket */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 text-white p-6 sm:p-7">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-brand-300 font-bold block">
                  Código de Reserva
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-2xl sm:text-3xl font-black tracking-wider text-amber-300">
                    {reservation.booking_code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Confirmada
                </span>
                {isPaid ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#009EE3]/20 text-[#009EE3] border border-[#009EE3]/30 uppercase">
                    ✓ Pagado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    {isCash ? 'Pago en garita' : 'Pendiente de pago'}
                  </span>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white line-clamp-1">{reservation.parking_name}</h3>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              {reservation.parking_address}, {reservation.parking_city}
            </p>
          </div>

          {/* Perforated Divider Visual */}
          <div className="relative flex items-center justify-between px-4 -my-3 z-10">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-parkia-page-dark -ml-7 shadow-inner" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 dark:border-parkia-line-dark mx-2" />
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-parkia-page-dark -mr-7 shadow-inner" />
          </div>

          {/* Ticket Details Body */}
          <div className="p-6 sm:p-7 space-y-6 bg-white dark:bg-parkia-card-dark transition-colors">
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <span className="text-xs text-slate-400 font-medium block">Fecha</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  {reservation.date}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block">Horario</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)} hs
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block">Plaza asignada</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    {reservation.space_code} ({reservation.space_floor})
                  </span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium block">Vehículo / Patente</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  {reservation.vehicle_plate}
                </span>
              </div>

              {/* Payment info item 1 */}
              <div>
                <span className="text-xs text-slate-400 font-medium block">Medio de pago</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  {paymentMethodLabel === 'Mercado Pago' && <Wallet className="w-4 h-4 text-[#009EE3]" />}
                  {paymentMethodLabel === 'Tarjeta Débito/Crédito' && <CreditCard className="w-4 h-4 text-indigo-500" />}
                  {paymentMethodLabel === 'MODO / Ualá' && <Smartphone className="w-4 h-4 text-teal-500" />}
                  {paymentMethodLabel === 'Efectivo' && <Banknote className="w-4 h-4 text-emerald-500" />}
                  <span>{paymentMethodLabel}</span>
                </span>
              </div>

              {/* Payment info item 2 */}
              <div>
                <span className="text-xs text-slate-400 font-medium block">Estado del pago</span>
                <span className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                  {isPaid ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Acreditado
                    </span>
                  ) : isCash ? (
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Banknote className="w-4 h-4 text-amber-500" /> Garita / Destino
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Pendiente
                    </span>
                  )}
                </span>
              </div>

            </div>

            {/* Pay now CTA if pending online */}
            {!isPaid && !isCash && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block">Tu reserva tiene pago pendiente</span>
                  <span>Podés completarlo con Mercado Pago para agilizar tu ingreso directo.</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCheckoutOpen(true)}
                  leftIcon={<Wallet className="w-4 h-4" />}
                  className="bg-[#009EE3] hover:bg-[#0081B8] text-white shrink-0 shadow-md"
                >
                  Pagar con Mercado Pago
                </Button>
              </div>
            )}

            {/* QR Code Ticket Access */}
            <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-parkia-card-dark rounded-2xl border border-slate-200 dark:border-parkia-line-dark text-center">
              <QRCodeDisplay
                value={reservation.booking_code}
                size={190}
                title="Pase Digital • Escanear al Ingreso / Egreso"
              />
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mt-3 font-medium">
                Mostrá este código QR en la garita o terminal de acceso al llegar para validar tu ingreso automático y registrar tu estadía.
              </p>
            </div>

            {/* Total Price Bar */}
            <div className="p-4 bg-slate-50 dark:bg-parkia-page-dark rounded-2xl border border-slate-200/80 dark:border-parkia-line-dark flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                  Total {isPaid ? 'Abonado' : 'Estimado'} ({reservation.total_hours} hs)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isPaid 
                    ? `✓ Abonado con ${paymentMethodLabel}`
                    : isCash
                    ? 'Pago directo en garita/salida'
                    : 'Abonar online o en garita'}
                </span>
              </div>
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ${Number(reservation.total_price).toLocaleString('es-AR')}
              </span>
            </div>

            {/* Actions Inside Ticket */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" className="w-full" leftIcon={<Navigation className="w-4 h-4" />}>
                  Cómo llegar (GPS)
                </Button>
              </a>

              <Link to="/my-reservations" className="flex-1">
                <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Ver mis reservas
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer helper */}
        <div className="text-center">
          <Link
            to="/search"
            className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
          >
            ← Buscar otro estacionamiento
          </Link>
        </div>

      </div>

      {/* Interactive payment checkout modal if user pays on confirmation screen */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        method={(reservation.payment_method as PaymentMethod) || 'Mercado Pago'}
        amount={Number(reservation.total_price)}
        parkingName={reservation.parking_name}
        durationHours={Number(reservation.total_hours)}
        onPaymentSuccess={handleOnlinePaymentComplete}
      />
    </div>
  );
};