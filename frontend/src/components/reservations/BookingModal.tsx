import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Car, 
  AlertCircle, 
  Info, 
  Layers, 
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { Parking } from '../../types';
import { reservationService } from '../../services/reservationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SpaceGrid } from './SpaceGrid';
import { AccessibleSpotCard } from './AccessibleSpotCard';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { PaymentCheckoutModal, PaymentMethod } from './PaymentCheckoutModal';
import { useSpaceLocksRealtime } from '../../hooks/useSpaceLocksRealtime';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking;
  onSuccess?: (reservation: any) => void;
}

const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'sess_default';
  try {
    let sid = sessionStorage.getItem('parkia_lock_session_id');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('parkia_lock_session_id', sid);
    }
    return sid;
  } catch {
    return 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  }
};

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  parking,
  onSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();
  const hasPermit = Boolean(user?.roles?.includes('disabled'));
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  // Stable session identifier for concurrency locks across reloads
  const sessionId = useRef<string>(getSessionId()).current;

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>(undefined);
  const [vehiclePlate, setVehiclePlate] = useState<string>('AA123BB');
  const [vehicleModel, setVehicleModel] = useState<string>('Auto Particular');
  const [isAccessibleRequested, setIsAccessibleRequested] = useState<boolean>(hasPermit);

  // Temporary Lock & Concurrency State
  const [activeLockId, setActiveLockId] = useState<number | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState<number>(300);
  const [isLocking, setIsLocking] = useState<boolean>(false);

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

  // Function to query availability with lock information
  const checkSlots = useCallback(async () => {
    if (!isOpen) return;
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
        session_id: sessionId,
        user_id: user?.id,
      });

      const spaces = res.spaces || [];
      setAvailableSpaces(spaces);
      setDurationHours(res.duration_hours || 1.0);
      setEstimatedPrice(res.estimated_price || Number(parking.price_per_hour));

      // Check if our currently selected space is locked by someone else
      if (selectedSpaceId) {
        const currentSpace = spaces.find((s: any) => s.id === selectedSpaceId);
        if (currentSpace && (currentSpace.is_locked_by_other || currentSpace.status === 'locked_by_other')) {
          toast('La plaza seleccionada fue tomada por otro usuario. Por favor elige otra.', 'warning');
          setSelectedSpaceId(undefined);
          setActiveLockId(null);
          setLockExpiresAt(null);
        }
      }
    } catch (err: any) {
      setValidationError(err.message || 'Error al comprobar disponibilidad');
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [isOpen, parking.id, date, startTime, endTime, sessionId, user?.id, selectedSpaceId, toast]);

  // Supabase Realtime synchronization across all tabs and devices
  const { broadcastLockChange } = useSpaceLocksRealtime({
    parkingId: parking.id,
    enabled: isOpen,
    onLockChange: () => {
      checkSlots();
    },
  });

  // Check slots on open or schedule change
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(checkSlots, 250);
    return () => clearTimeout(timer);
  }, [isOpen, date, startTime, endTime, checkSlots]);

  // Sync accessible request if user permit changes
  useEffect(() => {
    if (hasPermit) {
      setIsAccessibleRequested(true);
    }
  }, [hasPermit]);

  // Server-synchronized countdown timer
  useEffect(() => {
    if (!lockExpiresAt || !activeLockId) {
      setLockSecondsLeft(300);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const target = new Date(lockExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((target - now) / 1000));
      setLockSecondsLeft(diff);

      if (diff === 0) {
        toast('El tiempo de 5 minutos para completar la reserva ha expirado. La plaza fue liberada.', 'error');
        setActiveLockId(null);
        setLockExpiresAt(null);
        setSelectedSpaceId(undefined);
        broadcastLockChange();
        checkSlots();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt, activeLockId, broadcastLockChange, checkSlots, toast]);

  // Handle spot selection with atomic backend lock acquisition
  const handleSelectSpace = async (spaceId: number) => {
    if (spaceId === selectedSpaceId && activeLockId) return;

    try {
      setIsLocking(true);
      const res = await reservationService.acquireSpaceLock({
        space_id: spaceId,
        parking_id: parking.id,
        user_id: user?.id,
        session_id: sessionId,
        date,
        start_time: startTime,
        end_time: endTime,
      });

      if (!res.success) {
        toast(res.message, 'warning');
        checkSlots();
        return;
      }

      setActiveLockId(res.lock_id || null);
      setLockExpiresAt(res.expires_at || null);
      setSelectedSpaceId(spaceId);
      broadcastLockChange();
      checkSlots();
      toast(res.message, 'info');
    } catch (err: any) {
      toast(err.message || 'No se pudo seleccionar la plaza.', 'error');
      checkSlots();
    } finally {
      setIsLocking(false);
    }
  };

  // Handle releasing lock voluntarily
  const handleReleaseLock = async () => {
    if (!activeLockId) return;
    try {
      await reservationService.releaseSpaceLock({
        lock_id: activeLockId,
        session_id: sessionId,
        user_id: user?.id,
      });
      setActiveLockId(null);
      setLockExpiresAt(null);
      setSelectedSpaceId(undefined);
      broadcastLockChange();
      toast('Plaza liberada exitosamente.', 'info');
      checkSlots();
    } catch {
      setActiveLockId(null);
      setLockExpiresAt(null);
      setSelectedSpaceId(undefined);
      checkSlots();
    }
  };

  // Safe modal close: release lock if abandoning reservation
  const handleModalClose = async () => {
    if (activeLockId) {
      try {
        await reservationService.releaseSpaceLock({
          lock_id: activeLockId,
          session_id: sessionId,
          user_id: user?.id,
        });
        broadcastLockChange();
      } catch {
        // ignore
      }
    }
    setActiveLockId(null);
    setLockExpiresAt(null);
    setSelectedSpaceId(undefined);
    onClose();
  };

  // Handle accessible spot toggle
  const handleAccessibleChange = (checked: boolean) => {
    setIsAccessibleRequested(checked);
    if (checked) {
      const accSpace = availableSpaces.find((s: any) => (s.space_type === 'disabled' || s.is_accessible) && s.is_available && !s.is_locked_by_other);
      if (accSpace) {
        handleSelectSpace(accSpace.id);
      }
    } else {
      const stdSpace = availableSpaces.find((s: any) => s.space_type !== 'disabled' && !s.is_accessible && s.is_available && !s.is_locked_by_other);
      if (stdSpace) {
        handleSelectSpace(stdSpace.id);
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

    if (!selectedSpaceId) {
      toast('Por favor, selecciona una plaza disponible antes de continuar.', 'warning');
      return;
    }

    // Si es efectivo, se confirma la reserva directamente
    if (selectedMethod === 'Efectivo') {
      createReservationAndFinish('Efectivo', 'pending', 'confirmed');
    } else {
      // Para Mercado Pago, Tarjeta o MODO abrimos checkout interactivo
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
      let res: { message: string; reservation: any };

      if (activeLockId) {
        res = await reservationService.confirmReservationWithLock({
          lock_id: activeLockId,
          session_id: sessionId,
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
      } else {
        res = await reservationService.createReservation({
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
      }

      setActiveLockId(null);
      setLockExpiresAt(null);
      setSelectedSpaceId(undefined);
      broadcastLockChange();

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
        onClose={handleModalClose}
        title={
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span className="text-slate-900 dark:text-white">Reservar lugar en {parking.name}</span>
          </div>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Active Locking Timer Banner */}
          {activeLockId && lockExpiresAt && (
            <div className={`p-3.5 rounded-2xl border transition-all ${
              lockSecondsLeft <= 60 
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-950 dark:text-amber-200 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {lockSecondsLeft <= 60 ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold">
                    Tu plaza está protegida durante:{' '}
                    <span className="font-mono text-sm font-black tracking-wider">
                      {formatTimer(lockSecondsLeft)}
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReleaseLock}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Unlock className="w-3 h-3" />
                  Liberar plaza
                </button>
              </div>
              {lockSecondsLeft <= 60 && (
                <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 mt-1">
                  Atención: Quedan menos de 60 segundos para confirmar antes de que la plaza vuelva a estar disponible.
                </p>
              )}
            </div>
          )}

          {/* Info banner */}
          <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-100 dark:border-brand-900/60 flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-200">
            <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Tarifa por hora:</span> ${Number(parking.price_per_hour).toLocaleString('es-AR')}. 
              Al seleccionar una plaza, queda bloqueada exclusivamente para vos por 5 minutos.
            </div>
          </div>

          {/* Date & Time selection */}
          <div className="space-y-3">
            <div>
              <label htmlFor="booking-modal-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
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
                className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-modal-start" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Hora Entrada
                </label>
                <input
                  id="booking-modal-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px]"
                />
              </div>
              <div>
                <label htmlFor="booking-modal-end" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Hora Salida
                </label>
                <input
                  id="booking-modal-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px]"
                />
              </div>
            </div>
          </div>

          {/* Accessible spot request card */}
          <AccessibleSpotCard
            checked={isAccessibleRequested}
            onChange={handleAccessibleChange}
            hasPermit={hasPermit}
          />

          {/* Space Selector Visual Grid with Realtime state */}
          {availableSpaces.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  Elegir Plaza / Espacio
                </span>
                {isLocking && (
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 animate-pulse font-bold">
                    Protegiendo plaza...
                  </span>
                )}
              </label>
              <SpaceGrid
                spaces={availableSpaces}
                selectedId={selectedSpaceId}
                onSelect={handleSelectSpace}
                onSelectLocked={() => {
                  toast('Esta plaza acaba de ser seleccionada por otro usuario. Elegí otra plaza disponible.', 'warning');
                }}
                hasPermit={hasPermit}
              />
            </div>
          )}

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
            <div>
              <label htmlFor="booking-modal-plate" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
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
                className="w-full uppercase font-mono tracking-widest bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px]"
              />
            </div>
            <div>
              <label htmlFor="booking-modal-model" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Vehículo (Opcional)
              </label>
              <input
                id="booking-modal-model"
                type="text"
                placeholder="Ej: Toyota Corolla"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
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
            <Button type="button" variant="outline" onClick={handleModalClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="emerald"
              isLoading={isSubmitting || isCheckingAvailability || isLocking}
              disabled={!!validationError || !selectedSpaceId}
              className="flex-1 py-3.5 font-bold text-base shadow-lg shadow-emerald-500/20"
            >
              {selectedMethod === 'Efectivo' ? 'Confirmar Reserva' : 'Pagar y Reservar'}
            </Button>
          </div>

          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Cancelación gratuita • Plaza protegida en tiempo real</span>
          </p>
        </form>
      </Modal>

      {/* Interactive Payment Checkout Modal with synchronized lock expiration */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        method={selectedMethod}
        amount={estimatedPrice}
        parkingName={parking.name}
        durationHours={durationHours}
        lockExpiresAt={lockExpiresAt}
        onPaymentSuccess={async (details) => {
          await createReservationAndFinish(details.method, details.status, 'confirmed');
          setIsCheckoutOpen(false);
        }}
      />
    </>
  );
};
