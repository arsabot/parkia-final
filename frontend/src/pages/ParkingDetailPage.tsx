import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Phone, 
  Heart, 
  Share2, 
  ShieldCheck, 
  Zap, 
  Warehouse, 
  Accessibility, 
  Droplets, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Car,
  Layers
} from 'lucide-react';
import { Parking, ParkingSpace } from '../types';
import { parkingService } from '../services/parkingService';
import { reservationService } from '../services/reservationService';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { RatingStars } from '../components/parking/RatingStars';
import { AmenityBadge } from '../components/parking/AmenityBadge';
import { LeafletMap } from '../components/map/LeafletMap';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { SpaceGrid, defaultSpace } from '../components/reservations/SpaceGrid';
import { AccessibleSpotCard } from '../components/reservations/AccessibleSpotCard';
import { PaymentMethodSelector } from '../components/reservations/PaymentMethodSelector';
import { PaymentCheckoutModal, PaymentMethod } from '../components/reservations/PaymentCheckoutModal';
import confetti from 'canvas-confetti';

export const ParkingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated, user } = useAuth();
  // Solo quien tiene la credencial verificada por un admin puede elegir plazas accesibles
  const hasPermit = Boolean(user?.roles?.includes('disabled'));
  const { toast, success, error } = useToast();

  const [parking, setParking] = useState<Parking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Booking widget form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | undefined>(undefined);
  const [vehiclePlate, setVehiclePlate] = useState<string>('AA123BB');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [isAccessibleRequested, setIsAccessibleRequested] = useState<boolean>(hasPermit);

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Mercado Pago');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  
  // Real time availability & price
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([]);
  const [durationHours, setDurationHours] = useState<number>(3.0);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await parkingService.getParkingById(id);
        setParking(data);
        setSelectedImage(data.image_url);
        setEstimatedPrice(Number(data.price_per_hour) * 3);
      } catch (err: any) {
        error('No se pudo encontrar el estacionamiento.');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, navigate]);

  // Sync accessible request if user permit changes
  useEffect(() => {
    if (hasPermit) {
      setIsAccessibleRequested(true);
    }
  }, [hasPermit]);

  // Check dynamic availability when date/time changes
  useEffect(() => {
    if (!parking) return;

    const checkSlots = async () => {
      setValidationError(null);
      if (startTime >= endTime) {
        setValidationError('La hora de salida debe ser posterior a la de entrada.');
        return;
      }

      try {
        setIsChecking(true);
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
        setIsChecking(false);
      }
    };

    const timer = setTimeout(checkSlots, 300);
    return () => clearTimeout(timer);
  }, [parking, date, startTime, endTime, isAccessibleRequested]);

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

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast('Debes iniciar sesión para realizar una reserva', 'info');
      navigate('/login');
      return;
    }

    if (!parking || validationError) return;

    if (selectedMethod === 'Efectivo') {
      createReservationAndFinish('Efectivo', 'pending', 'confirmed');
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const createReservationAndFinish = async (
    method: PaymentMethod,
    paymentStatus: 'paid' | 'pending',
    reservationStatus: 'confirmed' | 'pending' = 'confirmed'
  ) => {
    if (!parking) return;
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

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      if (paymentStatus === 'paid') {
        success('¡Pago acreditado y reserva confirmada!');
      } else {
        success('¡Reserva confirmada con éxito! Abonás en garita al ingresar.');
      }

      navigate(`/booking/confirmation/${res.reservation.id}`, { state: { reservation: res.reservation } });
    } catch (err: any) {
      error(err.message || 'No se pudo completar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !parking) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-96 w-full rounded-3xl mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const favorited = isFavorite(parking.id);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la búsqueda
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFavorite(parking.id)}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold ${
                favorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
              <span>{favorited ? 'Guardado' : 'Guardar en Favoritos'}</span>
            </button>
          </div>
        </div>

        {/* Top Header Information */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 border border-brand-200">
                  {parking.city}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  {parking.is_24_hours
                    ? 'Abierto 24 Horas'
                    : `${parking.opening_time ? parking.opening_time.slice(0, 5) : '08:00'} a ${parking.closing_time ? parking.closing_time.slice(0, 5) : '22:00'} hs`}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {parking.name}
              </h1>

              <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                {parking.address}
              </p>
            </div>

            {/* Rating & Capacity */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <RatingStars rating={parking.rating} reviewsCount={parking.reviews_count} size="md" />
                <span className="text-xs text-slate-400 block mt-1">
                  Capacidad: <strong>{parking.capacity}</strong> plazas
                </span>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          <div className="pt-6">
            <div className="w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-100 mb-3">
              <img
                src={selectedImage}
                alt={parking.name}
                className="w-full h-full object-cover"
              />
            </div>
            {parking.gallery && parking.gallery.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {parking.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                      selectedImage === img ? 'border-brand-600 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Details (Left) + Booking Widget (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Features, Description, Map */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* Description */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Descripción del Estacionamiento</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {parking.description || 'Estacionamiento moderno con vigilancia y excelente ubicación céntrica.'}
              </p>

              {parking.phone && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>Contacto directo: {parking.phone}</span>
                </div>
              )}
            </div>

            {/* Amenities & Services */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Servicios e Instalaciones</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {parking.is_covered && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                    <Warehouse className="w-5 h-5 text-blue-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Techado</h5>
                      <span className="text-[10px] text-slate-500">Protección clima</span>
                    </div>
                  </div>
                )}
                {parking.has_security && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">CCTV 24hs</h5>
                      <span className="text-[10px] text-slate-500">Monitoreo activo</span>
                    </div>
                  </div>
                )}
                {parking.has_ev_charging && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Carga EV</h5>
                      <span className="text-[10px] text-slate-500">Autos eléctricos</span>
                    </div>
                  </div>
                )}
                {parking.has_disabled_access && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                    <Accessibility className="w-5 h-5 text-purple-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Accesible</h5>
                      <span className="text-[10px] text-slate-500">Rampa y plazas bajas</span>
                    </div>
                  </div>
                )}
                {parking.has_car_wash && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center gap-3">
                    <Droplets className="w-5 h-5 text-cyan-600" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Lavadero</h5>
                      <span className="text-[10px] text-slate-500">Servicio opcional</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Ubicación Geográfica</h3>
              <p className="text-xs text-slate-500 mb-4">{parking.address}, {parking.city}</p>
              <div className="h-72 rounded-2xl overflow-hidden">
                <LeafletMap
                  parkings={[parking]}
                  selectedParkingId={parking.id}
                  center={[parking.latitude, parking.longitude]}
                  zoom={16}
                />
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Booking Card Form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-200 dark:border-parkia-line-dark p-6 sm:p-7 shadow-xl shadow-slate-900/5 transition-colors">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-parkia-line-dark mb-5">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Tarifa Oficial</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    ${Number(parking.price_per_hour).toLocaleString('es-AR')}
                    <span className="text-xs text-slate-500 font-normal"> / hora</span>
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {parking.available_spaces} lugares libres
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label htmlFor="detail-booking-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    Fecha de Entrada
                  </label>
                  <input
                    id="detail-booking-date"
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
                    <label htmlFor="detail-booking-start" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      Entrada
                    </label>
                    <input
                      id="detail-booking-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="detail-booking-end" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      Salida
                    </label>
                    <input
                      id="detail-booking-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Accessible spot request card */}
                <AccessibleSpotCard
                  checked={isAccessibleRequested}
                  onChange={handleAccessibleChange}
                  hasPermit={hasPermit}
                />

                {/* Space Picker */}
                {availableSpaces.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                        Plaza asignada
                      </span>
                    </label>
                    <SpaceGrid
                      spaces={availableSpaces}
                      selectedId={selectedSpaceId}
                      onSelect={setSelectedSpaceId}
                      hasPermit={hasPermit}
                      gridClassName="grid-cols-4 max-h-36"
                      showFloor={false}
                    />
                  </div>
                )}

                {/* Vehicle plate & model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="detail-booking-plate" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                      Patente
                    </label>
                    <input
                      id="detail-booking-plate"
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      required
                      placeholder="AA 123 BB"
                      className="w-full uppercase font-mono tracking-widest bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="detail-booking-model" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Vehículo
                    </label>
                    <input
                      id="detail-booking-model"
                      type="text"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ej: Toyota Corolla"
                      className="w-full bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[40px]"
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

                {validationError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="p-4 bg-slate-900 dark:bg-parkia-page-dark border border-slate-800 dark:border-parkia-line-dark rounded-2xl text-white space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Duración ({durationHours.toFixed(1)} hs):</span>
                    <strong className="text-white font-medium">{selectedMethod}</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-800 dark:border-parkia-line-dark pt-2">
                    <span className="font-semibold">
                      {selectedMethod === 'Efectivo' ? 'Abonás en garita:' : 'Total a pagar:'}
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      ${estimatedPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="emerald"
                  isLoading={isSubmitting || isChecking}
                  disabled={!!validationError}
                  className="w-full py-3.5 font-bold text-base shadow-lg shadow-emerald-600/25"
                >
                  {selectedMethod === 'Efectivo' ? 'Confirmar Reserva' : 'Pagar y Reservar'}
                </Button>

                <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 font-medium inline-flex items-center justify-center gap-1.5 w-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cancelación gratuita • Confirmación instantánea</span>
                </p>
              </form>
            </div>
          </div>

        </div>

      </div>

      {/* Interactive Payment Checkout Modal */}
      {parking && (
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
      )}
    </div>
  );
};
