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
  Layers
} from 'lucide-react';
import { Parking, ParkingSpace } from '../../types';
import { reservationService } from '../../services/reservationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SpaceGrid, defaultSpace } from './SpaceGrid';
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

  // Availability & Loading State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([]);
  const [durationHours, setDurationHours] = useState<number>(2.0);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(Number(parking.price_per_hour) * 2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

        setAvailableSpaces(res.spaces || []);
        setDurationHours(res.duration_hours || 1.0);
        setEstimatedPrice(res.estimated_price || Number(parking.price_per_hour));

        // Auto select first available space if none chosen
        const firstFree = defaultSpace(res.spaces || []);
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
  }, [isOpen, parking.id, date, startTime, endTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast('Debes iniciar sesión para realizar una reserva', 'info');
      navigate('/login');
      return;
    }

    if (validationError) return;

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
      });

      // Celebration effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      success('¡Reserva confirmada con éxito!');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-600" />
          <span>Reservar lugar en {parking.name}</span>
        </div>
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Info banner */}
        <div className="p-3.5 bg-brand-50 rounded-2xl border border-brand-100 flex items-start gap-3 text-xs text-brand-900">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Tarifa por hora:</span> ${Number(parking.price_per_hour).toLocaleString('es-AR')}. 
            Tu espacio quedará reservado de inmediato con garantía de lugar.
          </div>
        </div>

        {/* Date & Time selection */}
        <div className="space-y-4">
          <div>
            <label htmlFor="booking-modal-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-teal-600" aria-hidden="true" />
              Fecha de Reserva
            </label>
            <input
              id="booking-modal-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="booking-modal-start" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" aria-hidden="true" />
                Hora Entrada
              </label>
              <input
                id="booking-modal-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="booking-modal-end" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" aria-hidden="true" />
                Hora Salida
              </label>
              <input
                id="booking-modal-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>
          </div>
        </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="booking-modal-plate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-teal-600" aria-hidden="true" />
              Patente / Matrícula
            </label>
            <input
              id="booking-modal-plate"
              type="text"
              placeholder="Ej: AA 123 BB"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              required
              className="w-full uppercase font-mono tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="booking-modal-model" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Vehículo (Opcional)
            </label>
            <input
              id="booking-modal-model"
              type="text"
              placeholder="Ej: Toyota Corolla"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
            />
          </div>
        </div>

        {/* Validation error message */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Price & Summary breakdown */}
        <div className="p-4 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-slate-400 block font-medium">
              Duración estimada: <strong className="text-white">{durationHours.toFixed(1)} hs</strong>
            </span>
            <span className="text-xs text-slate-400">Total a pagar en destino:</span>
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
            className="flex-1 py-3.5 font-bold text-base"
          >
            Confirmar Reserva
          </Button>
        </div>
      </form>
    </Modal>
  );
};
