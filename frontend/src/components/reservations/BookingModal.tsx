import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  DollarSign,
  Layers,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { Parking, ParkingSpace } from '../../types';
import { reservationService } from '../../services/reservationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SpaceGrid, defaultSpace } from './SpaceGrid';
import { AccessibleSpotCard } from './AccessibleSpotCard';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentCheckoutModal, PaymentMethod } from './PaymentCheckoutModal';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking;
  onSuccess?: (reservation: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  parking,
  onSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();
  // Solo quien tiene la credencial verificada por un admin puede elegir plazas accesibles
  const hasPermit = Boolean(user?.roles?.includes('disabled'));
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>(undefined);
  const [vehiclePlate, setVehiclePlate] = useState<string>('AA123BB');
  const [vehicleModel, setVehicleModel] = useState<string>('Auto Particular');
  const [isAccessibleRequested, setIsAccessibleRequested] = useState<boolean>(hasPermit);

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Mercado Pago');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Availability & Loading State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([]);
  const [durationHours, setDurationHours] = useState<number>(2.0);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(Number(parking.price_per_hour) * 2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync accessible request if user permit changes
  useEffect(() => {
    if (hasPermit) {
      setIsAccessibleRequested(true);
    }
  }, [hasPermit]);

  // Check dynamic availability whenever time slot or date changes
  useEffect(() => {
    if (!isOpen) return;

    const checkSlots = async () => {
      setValidationError(null);
      if (startTime >= endTime) {
        setValidationError('La hora de salida debe ser posterior a la de entrada.');
        return;
      }

      try {
        setIsCheckingAvailability(true);
        const res = await reservationService.checkAvailability({
          parking_id: parking.id,
          date,
          start_time: startTime,
          end_time: endTime,
        });

        const spaces = res.spaces || [];
        setAvailableSpaces(spaces);
        setDurationHours(res.duration_hours || 1.0);
        setEstimatedPrice(res.estimated_price || Number(parking.price_per_hour));

        // Auto select space respecting accessible preference
        if (isAccessibleRequested) {
          const accSpace = spaces.find((s: any) => (s.space_type === 'disabled' || s.is_accessible) && s.is_available);
          if (accSpace) {
            setSelectedSpaceId(accSpace.id);
            return;
          }
        }

        const firstFree = defaultSpace(spaces);
        if (firstFree && !selectedSpaceId) {
          setSelectedSpaceId(firstFree.id);
        }
      } catch (err: any) {
        setValidationError(err.message || 'Error al comprobar disponibilidad');
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    const timer = setTimeout(checkSlots, 300);
    return () => clearTimeout(timer);
  }, [isOpen, parking.id, date, startTime, endTime, isAccessibleRequested]);

  // Handle accessible spot toggle
  const handleAccessibleChange = (checked: boolean) => {
    setIsAccessibleRequested(checked);
    if (checked) {
      const accSpace = availableSpaces.find((s: any) => (s.space_type === 'disabled' || s.is_accessible) && s.is_available);
      if (accSpace) {
        setSelectedSpaceId(accSpace.id);
      }
    } else {
      const stdSpace = availableSpaces.find((s: any) => s.space_type !== 'disabled' && !s.is_accessible && s.is_available);
      if (stdSpace) {
        setSelectedSpaceId(stdSpace.id);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast('Debes iniciar sesión para realizar una reserva', 'info');
      navigate('/login');
      return;
    }

    if (validationError) return;

    // Si es efectivo, se confirma la reserva directamente sin pasar por pasarela online
    if (selectedMethod === 'Efectivo') {
      createReservationAndFinish('Efectivo', 'pending', 'confirmed');
    } else {
      // Para Mercado Pago, Tarjeta o MODO/Ualá abrimos el modal interactivo de checkout
      setIsCheckoutOpen(true);
    }
  };

  const createReservationAndFinish = async (
    method: PaymentMethod,
    paymentStatus: 'paid' | 'pending',
    reservationStatus: 'confirmed' | 'pending' = 'confirmed'
  ) => {
    try {
      setIsSubmitting(true);
      const res = await reservationService.createReservation({
        parking: parking.id,
        space: selectedSpaceId,
        vehicle_plate: vehiclePlate.toUpperCase().trim(),
        vehicle_model: vehicleModel.trim(),
        date,
        start_time: startTime,
        end_time: endTime,
        payment_method: method,
        payment_status: paymentStatus,
        status: reservationStatus,
      });

      // Celebration effect
      confetti({
        particleCount: 110,
        spread: 75,
        origin: { y: 0.6 },
      });

      if (paymentStatus === 'paid') {
        success('¡Pago acreditado y reserva confirmada!');
      } else {
        success('¡Reserva confirmada con éxito! Abonás al ingresar.');
      }

      onClose();

      if (onSuccess) {
        onSuccess(res.reservation);
      } else {
        navigate(`/booking/confirmation/${res.reservation.id}`, { state: { reservation: res.reservation } });
      }
    } catch (err: any) {
      error(err.message || 'No se pudo completar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="text-slate-900 dark:text-white">Reservar lugar en {parking.name}</span>
          </div>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          
          {/* Info banner */}
          <div className="p-3.5 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-100 dark:border-brand-900/60 flex items-start gap-3 text-xs text-brand-900 dark:text-brand-200">
            <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tarifa por hora:</span> ${Number(parking.price_per_hour).toLocaleString('es-AR')}. 
              Tu espacio quedará reservado de inmediato con garantía de lugar.
            </div>
          </div>

          {/* Date & Time selection */}
          <div className="space-y-4">
            <div>
              <label htmlFor="booking-modal-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                Fecha de Reserva
              </label>
              <input
                id="booking-modal-date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-modal-start" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Hora Entrada
                </label>
                <input
                  id="booking-modal-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>
              <div>
                <label htmlFor="booking-modal-end" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Hora Salida
                </label>
                <input
                  id="booking-modal-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>
            </div>
          </div>

          {/* Accessible spot request card matching mockups 6 & 7 */}
          <AccessibleSpotCard
            checked={isAccessibleRequested}
            onChange={handleAccessibleChange}
            hasPermit={hasPermit}
          />

          {/* Space Selector Visual Grid */}
          {availableSpaces.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Elegir Plaza / Espacio
                </span>
              </label>
              <SpaceGrid
                spaces={availableSpaces}
                selectedId={selectedSpaceId}
                onSelect={setSelectedSpaceId}
                hasPermit={hasPermit}
              />
            </div>
          )}

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
            <div>
              <label htmlFor="booking-modal-plate" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                Patente / Matrícula
              </label>
              <input
                id="booking-modal-plate"
                type="text"
                placeholder="Ej: AA 123 BB"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                required
                className="w-full uppercase font-mono tracking-widest bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="booking-modal-model" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Vehículo (Opcional)
              </label>
              <input
                id="booking-modal-model"
                type="text"
                placeholder="Ej: Toyota Corolla"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Payment Method Selector matching mockups 6 & 7 */}
          <div className="pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={setSelectedMethod}
            />
          </div>

          {/* Validation error message */}
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Price & Summary breakdown */}
          <div className="p-4 bg-slate-900 dark:bg-parkia-page-dark border border-slate-800 dark:border-parkia-line-dark rounded-2xl text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-xs text-slate-400 block font-medium">
                Duración: <strong className="text-white">{durationHours.toFixed(1)} hs</strong> • {selectedMethod}
              </span>
              <span className="text-xs text-slate-400">
                {selectedMethod === 'Efectivo' ? 'Abonás en garita al ingresar:' : 'Total a pagar ahora:'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">
                ${estimatedPrice.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="emerald"
              isLoading={isSubmitting || isCheckingAvailability}
              disabled={!!validationError}
              className="flex-1 py-3.5 font-bold text-base shadow-lg shadow-emerald-500/20"
            >
              {selectedMethod === 'Efectivo' ? 'Confirmar Reserva' : 'Pagar y Reservar'}
            </Button>
          </div>

          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Cancelación gratuita • Confirmación instantánea</span>
          </p>
        </form>
      </Modal>

      {/* Interactive Payment Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        method={selectedMethod}
        amount={estimatedPrice}
        parkingName={parking.name}
        durationHours={durationHours}
        onPaymentSuccess={async (details) => {
          await createReservationAndFinish(details.method, details.status, 'confirmed');
          setIsCheckoutOpen(false);
        }}
      />
    </>
  );
};