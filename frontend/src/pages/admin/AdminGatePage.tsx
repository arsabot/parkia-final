import React, { useState, useEffect } from 'react';
import { 
  ScanLine, 
  ArrowDownRight, 
  ArrowUpRight, 
  DollarSign, 
  Car, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw,
  CreditCard,
  Banknote,
  PlusCircle,
  FileText,
  Camera,
  Keyboard,
  Smartphone,
  Receipt,
  ShieldCheck,
  Check,
  Sparkles
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { parkingService } from '../../services/parkingService';
import { Reservation, Parking } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { CameraQrScanner } from '../../components/common/CameraQrScanner';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const AdminGatePage: React.FC = () => {
  const { success, error, info } = useToast();
  const { isSuperAdmin, isOwner, user } = useAuth();

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<number | 'all'>('all');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [gatePage, setGatePage] = useState<number>(1);
  const [gatePageSize, setGatePageSize] = useState<number>(10);

  // QR Scan / Code Search state
  const [qrCodeInput, setQrCodeInput] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [verifiedReservation, setVerifiedReservation] = useState<Reservation | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Terminal Mode: 'auto' (Detección inteligente), 'in' (Solo Ingreso), 'out' (Solo Egreso)
  const [qrMode, setQrMode] = useState<'auto' | 'in' | 'out'>('auto');

  // Last action quick confirmation banner
  const [lastFeedback, setLastFeedback] = useState<{
    type: 'in' | 'out';
    bookingCode: string;
    plate: string;
    driverName: string;
    spaceCode: string;
    method: string;
    amount: number;
    time: string;
  } | null>(null);

  // Helper: Visual representation of payment methods
  const getPaymentMethodDisplay = (method?: string) => {
    const m = (method || 'Mercado Pago').toLowerCase();
    if (m.includes('mercado') || m.includes('mp')) {
      return {
        name: 'Mercado Pago (Online)',
        icon: <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />,
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        tagColor: 'text-sky-400'
      };
    }
    if (m.includes('tarjeta') || m.includes('debito') || m.includes('débito') || m.includes('credito') || m.includes('crédito') || m.includes('card')) {
      return {
        name: method || 'Tarjeta Débito / Crédito',
        icon: <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />,
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        tagColor: 'text-purple-400'
      };
    }
    if (m.includes('transferencia')) {
      return {
        name: 'Transferencia Bancaria',
        icon: <Receipt className="w-4 h-4 text-indigo-400 shrink-0" />,
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        tagColor: 'text-indigo-400'
      };
    }
    return {
      name: method || 'Efectivo en Garita',
      icon: <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tagColor: 'text-emerald-400'
    };
  };

  // Helper: Calculate elapsed stay duration
  const getElapsedTime = (checkInIso?: string) => {
    if (!checkInIso) return null;
    const inDate = new Date(checkInIso).getTime();
    const now = Date.now();
    const diffMinutes = Math.max(1, Math.floor((now - inDate) / 60000));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes}m`;
  };

  // Direct Walk-In Entry Modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);
  const [walkInParkingId, setWalkInParkingId] = useState<number>(1);
  const [walkInPlate, setWalkInPlate] = useState<string>('');
  const [walkInModel, setWalkInModel] = useState<string>('');
  const [walkInHours, setWalkInHours] = useState<number>(1);
  const [walkInMethod, setWalkInMethod] = useState<string>('Efectivo');
  const [walkInNotes, setWalkInNotes] = useState<string>('');
  const [submittingWalkIn, setSubmittingWalkIn] = useState<boolean>(false);

  // Check out modal state
  const [checkoutTarget, setCheckoutTarget] = useState<Reservation | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<string>('Efectivo');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [processingCheckout, setProcessingCheckout] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parkingList, resList] = await Promise.all([
        isOwner ? parkingService.getMyParkings() : parkingService.getParkings(),
        reservationService.getReservations()
      ]);
      setParkings(parkingList);
      if (parkingList.length > 0) {
        if (isOwner) {
          // El dueño solo opera su propio estacionamiento asignado
          setSelectedParkingId(parkingList[0].id);
          setWalkInParkingId(parkingList[0].id);
        } else if (selectedParkingId === 'all') {
          setWalkInParkingId(parkingList[0].id);
        }
      }
      setReservations(resList);
    } catch (err: any) {
      error('Error al cargar datos del sistema de control.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isOwner]);

  // Reset page when parking selection changes
  useEffect(() => {
    setGatePage(1);
  }, [selectedParkingId]);

  // Filter reservations based on selected parking
  const filteredReservations = reservations.filter((r) => {
    if (selectedParkingId === 'all') return true;
    return r.parking === selectedParkingId;
  });

  // KPI calculations
  const checkedInList = filteredReservations.filter((r) => r.check_in_time && !r.check_out_time);
  const checkedOutToday = filteredReservations.filter((r) => r.check_out_time);
  const totalMoneyCollected = filteredReservations
    .filter((r) => r.payment_status === 'paid' || r.status === 'completed')
    .reduce((acc, curr) => acc + Number(curr.total_price), 0);

  // Process and verify booking code
  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      error('Por favor ingresa o escanea un código QR.');
      return;
    }
    // Clean code: extract PK-XXXXXX pattern if URL or text
    const match = codeToVerify.match(/PK-[A-Z0-9]+/i);
    const code = match ? match[0].toUpperCase() : codeToVerify.trim().toUpperCase();

    try {
      setVerifying(true);
      const res = await reservationService.verifyQr(code);
      const reservation = res.reservation;
      setVerifiedReservation(reservation);
      setQrCodeInput(code);
      setLastFeedback(null);

      const isEgreso = reservation.check_in_time && !reservation.check_out_time;
      const isCompletado = !!reservation.check_out_time;
      const paymentInfo = getPaymentMethodDisplay(reservation.payment_method);

      if (isCompletado) {
        info(`El vehículo ${reservation.vehicle_plate} ya completó su egreso anteriormente.`);
      } else if (isEgreso) {
        if (qrMode === 'in') {
          info(`Atención: Vehículo ${reservation.vehicle_plate} ya se encuentra adentro. Modo Egreso activado.`);
        } else {
          success(`¡QR de EGRESO validado! Vehículo: ${reservation.vehicle_plate} • Pago: ${paymentInfo.name}`);
        }
      } else {
        if (qrMode === 'out') {
          info(`Atención: Vehículo ${reservation.vehicle_plate} aún no ingresó. Modo Ingreso activado.`);
        } else {
          success(`¡QR de INGRESO validado! Vehículo: ${reservation.vehicle_plate} • Pago: ${paymentInfo.name}`);
        }
      }
    } catch (err: any) {
      error(err.message || `No se encontró ninguna reserva para el código "${code}".`);
      setVerifiedReservation(null);
    } finally {
      setVerifying(false);
    }
  };

  // Handle Manual Form Submit
  const handleVerifyQr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await verifyCode(qrCodeInput);
  };

  // Handle Camera QR Scan Result
  const handleCameraScanSuccess = async (decodedText: string) => {
    await verifyCode(decodedText);
  };

  // Handle Quick Check-In (Ingreso)
  const handleCheckIn = async (res: Reservation, customMethod?: string) => {
    try {
      setActionLoading(true);
      const methodToUse = customMethod || res.payment_method || 'Mercado Pago';
      const updated = await reservationService.checkIn(res.id, {
        payment_method: methodToUse,
      });
      const paymentInfo = getPaymentMethodDisplay(methodToUse);
      success(`¡Ingreso validado! Vehículo ${res.vehicle_plate} ingresó a Plaza ${res.space_code}.`);
      setLastFeedback({
        type: 'in',
        bookingCode: res.booking_code,
        plate: res.vehicle_plate,
        driverName: res.user_name,
        spaceCode: res.space_code,
        method: paymentInfo.name,
        amount: Number(res.total_price),
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs'
      });
      setVerifiedReservation(null);
      setQrCodeInput('');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Error al registrar ingreso.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Direct Check-Out (Egreso y Cobro) directly from the QR Terminal module
  const handleDirectCheckOut = async (res: Reservation, customMethod?: string, notes?: string) => {
    try {
      setActionLoading(true);
      const methodToUse = customMethod || res.payment_method || 'Mercado Pago';
      const updated = await reservationService.checkOut(res.id, {
        payment_method: methodToUse,
        notes: notes || ''
      });
      const paymentInfo = getPaymentMethodDisplay(methodToUse);
      success(`¡Egreso validado! Vehículo ${res.vehicle_plate} salió. Plaza ${res.space_code} liberada.`);
      setLastFeedback({
        type: 'out',
        bookingCode: res.booking_code,
        plate: res.vehicle_plate,
        driverName: res.user_name,
        spaceCode: res.space_code,
        method: paymentInfo.name,
        amount: Number(res.total_price),
        time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + ' hs'
      });
      setVerifiedReservation(null);
      setQrCodeInput('');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Error al registrar egreso.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Modal Check-Out (Egreso y Cobro desde tabla)
  const handleConfirmCheckOut = async () => {
    if (!checkoutTarget) return;
    try {
      setProcessingCheckout(true);
      await handleDirectCheckOut(checkoutTarget, checkoutMethod, checkoutNotes);
      setCheckoutTarget(null);
    } finally {
      setProcessingCheckout(false);
    }
  };

  // Handle Direct Walk-In (Ingreso manual directo)
  const handleCreateWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInPlate.trim()) {
      error('Ingresa la patente del vehículo.');
      return;
    }
    try {
      setSubmittingWalkIn(true);
      const created = await reservationService.registerWalkIn({
        parking_id: walkInParkingId,
        vehicle_plate: walkInPlate.trim().toUpperCase(),
        vehicle_model: walkInModel.trim(),
        hours: walkInHours,
        payment_method: walkInMethod,
        notes: walkInNotes
      });
      success(created.message || 'Ingreso registrado exitosamente.');
      setIsWalkInOpen(false);
      setWalkInPlate('');
      setWalkInModel('');
      setWalkInNotes('');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Error al registrar ingreso directo.');
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-parkia-page-dark py-8 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Operations Area */}
        <div className="space-y-8 animate-fade-in">
            
            {/* Header and Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                    Módulo de Operación y Garita
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {isSuperAdmin ? 'Super Admin' : 'Panel de Dueño'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                  Control de Accesos, Cámara QR & Caja
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Utiliza la cámara de tu tablet o teléfono para validar pases QR, registrar entradas/salidas y controlar la recaudación en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Parking selector filter */}
                {isOwner && parkings.length <= 1 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Garaje: <strong>{parkings[0]?.name || 'Tu Garaje'}</strong></span>
                    <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                      Asignado
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedParkingId}
                    onChange={(e) => setSelectedParkingId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="text-xs font-semibold bg-white dark:bg-parkia-card-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  >
                    {!isOwner && <option value="all">Todos los Estacionamientos</option>}
                    {parkings.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  variant="emerald"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => setIsWalkInOpen(true)}
                >
                  Ingreso Directo
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                  onClick={loadData}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Autos actualmente dentro */}
              <div className="bg-white dark:bg-parkia-card-dark p-5 rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Vehículos Adentro</span>
                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                    {checkedInList.length}
                  </span>
                  <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5" /> En estadía activa
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
              </div>

              {/* Egresos completados */}
              <div className="bg-white dark:bg-parkia-card-dark p-5 rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Egresos Registrados</span>
                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                    {checkedOutToday.length}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Salidas exitosas
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Recaudación Total en Caja */}
              <div className="bg-white dark:bg-parkia-card-dark p-5 rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Recaudación Bruta</span>
                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                    ${totalMoneyCollected.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                    {isOwner ? (
                      <span>Neto Garaje (85%): <strong>${Math.round(totalMoneyCollected * 0.85).toLocaleString('es-AR')}</strong></span>
                    ) : (
                      <span>Comisión Parkia (15%): <strong>${Math.round(totalMoneyCollected * 0.15).toLocaleString('es-AR')}</strong></span>
                    )}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Reservas Pendientes de Ingreso */}
              <div className="bg-white dark:bg-parkia-card-dark p-5 rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm flex items-center justify-between transition-colors">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Por Ingresar (Hoy)</span>
                  <span className="text-2xl font-black text-navy-900 dark:text-white mt-1 block">
                    {filteredReservations.filter((r) => r.status === 'confirmed' && !r.check_in_time).length}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> Con reserva confirmada
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* QR Scanner & Unified Ingreso / Egreso Validation Station */}
            <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-teal-900/40">
              <div className="max-w-4xl">
                {/* Header & Mode Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <ScanLine className="w-5 h-5 animate-pulse" />
                    </span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        Control de Ingreso & Egreso QR
                      </h2>
                      <p className="text-xs text-slate-300">
                        Validación rápida de entradas y salidas en el mismo módulo con código de reserva.
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="inline-flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setQrMode('auto')}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                        qrMode === 'auto'
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Auto (Detecta In/Out)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode('in')}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                        qrMode === 'in'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Solo Ingreso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode('out')}
                      className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                        qrMode === 'out'
                          ? 'bg-sky-600 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Solo Egreso</span>
                    </button>
                  </div>
                </div>

                {/* Primary Action Row: Camera Button + Manual input */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <Button
                    type="button"
                    variant="emerald"
                    onClick={() => setIsCameraScannerOpen(true)}
                    className="px-6 py-3.5 text-sm font-bold shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Abrir Cámara Escáner</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-700/60 rounded-full ml-1">
                      Tablet / Móvil
                    </span>
                  </Button>

                  <div className="text-slate-400 text-xs font-semibold text-center sm:text-left">
                    o ingresa el código / patente:
                  </div>

                  <form onSubmit={handleVerifyQr} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej: PK-892401 o AF 342 KL..."
                        value={qrCodeInput}
                        onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-10 pr-3 py-3 text-white placeholder-slate-400 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      isLoading={verifying}
                      className="px-5 text-xs font-bold text-white border-white/30 hover:bg-white/10"
                    >
                      Validar
                    </Button>
                  </form>
                </div>

                {/* Quick Testing Demo Buttons for Ingreso and Egreso */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-300">
                  <span className="font-semibold text-slate-400 shrink-0">Probar rápido:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Entry (Ingreso) test buttons */}
                    {filteredReservations
                      .filter((r) => !r.check_in_time && r.status === 'confirmed')
                      .slice(0, 2)
                      .map((r) => {
                        const mInfo = getPaymentMethodDisplay(r.payment_method);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => verifyCode(r.booking_code)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 px-2.5 py-1 rounded-xl border border-emerald-500/30 transition-colors cursor-pointer"
                            title={`Validar Ingreso para ${r.vehicle_plate}`}
                          >
                            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{r.booking_code}</span>
                            <span className="text-[10px] text-emerald-200">({r.vehicle_plate} • {mInfo.name.split(' ')[0]})</span>
                          </button>
                        );
                      })}

                    {/* Exit (Egreso) test buttons */}
                    {filteredReservations
                      .filter((r) => r.check_in_time && !r.check_out_time)
                      .slice(0, 2)
                      .map((r) => {
                        const mInfo = getPaymentMethodDisplay(r.payment_method);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => verifyCode(r.booking_code)}
                            className="inline-flex items-center gap-1.5 font-mono text-xs bg-sky-950/70 hover:bg-sky-900/90 text-sky-300 px-2.5 py-1 rounded-xl border border-sky-500/30 transition-colors cursor-pointer"
                            title={`Validar Egreso para ${r.vehicle_plate}`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span>{r.booking_code}</span>
                            <span className="text-[10px] text-sky-200">({r.vehicle_plate} • {mInfo.name.split(' ')[0]})</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Instant Feedback Banner from Last Action */}
                {lastFeedback && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 animate-fade-in flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
                        {lastFeedback.type === 'in' ? (
                          <ArrowDownRight className="w-6 h-6" />
                        ) : (
                          <ArrowUpRight className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          {lastFeedback.type === 'in' ? '¡Ingreso Validado! Barrera Abierta 🚗' : '¡Egreso Validado! Plaza Liberada 🏁'}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 uppercase">
                            {lastFeedback.time}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Vehículo <strong className="text-white font-mono">{lastFeedback.plate}</strong> ({lastFeedback.driverName}) • Plaza <strong className="text-teal-300">{lastFeedback.spaceCode}</strong> {lastFeedback.type === 'in' ? 'ocupada' : 'ahora vacante'} • Método de Pago: <strong className="text-emerald-300">{lastFeedback.method}</strong> (${lastFeedback.amount.toLocaleString('es-AR')})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastFeedback(null)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Verified QR Detail Box (Unified for Ingreso and Egreso) */}
              {verifiedReservation && (() => {
                const isPendingEntry = !verifiedReservation.check_in_time && verifiedReservation.status !== 'cancelled';
                const isInsideStay = !!verifiedReservation.check_in_time && !verifiedReservation.check_out_time;
                const isCompleted = !!verifiedReservation.check_out_time;
                const paymentInfo = getPaymentMethodDisplay(verifiedReservation.payment_method);
                const isPaid = verifiedReservation.payment_status === 'paid' || (!verifiedReservation.payment_status && verifiedReservation.status === 'confirmed');
                const elapsedStay = getElapsedTime(verifiedReservation.check_in_time);

                return (
                  <div className="mt-6 pt-6 border-t border-white/15 bg-white/10 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/20 animate-fade-in space-y-4">
                    
                    {/* Operation Type Indicator Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPendingEntry && (
                          <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                            Validación de Ingreso (Entrada)
                          </span>
                        )}
                        {isInsideStay && (
                          <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-sky-500/30 text-sky-300 border border-sky-500/40 flex items-center gap-1.5 shadow-sm">
                            <ArrowUpRight className="w-4 h-4 text-sky-400" />
                            Validación de Egreso (Salida)
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-500/30 text-slate-300 border border-slate-500/40 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Estadía Ya Finalizada
                          </span>
                        )}

                        <span className="font-mono text-amber-300 font-extrabold text-base">
                          #{verifiedReservation.booking_code}
                        </span>

                        <Badge variant={verifiedReservation.status as any}>
                          {verifiedReservation.status_display}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300">
                          {verifiedReservation.parking_name}
                        </span>
                      </div>
                    </div>

                    {/* Driver & Vehicle Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Vehicle Column */}
                      <div className="p-3.5 bg-black/20 rounded-2xl border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Vehículo & Patente
                        </span>
                        <div className="flex items-center gap-2.5">
                          <span className="inline-block px-3 py-1 rounded-lg border-2 border-slate-400 bg-slate-950 font-mono font-black text-lg text-white tracking-wider shadow-inner">
                            {verifiedReservation.vehicle_plate}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 pt-1">
                          {verifiedReservation.vehicle_model || 'Vehículo Particular'}
                        </p>
                      </div>

                      {/* Driver & Space Column */}
                      <div className="p-3.5 bg-black/20 rounded-2xl border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Conductor & Ubicación
                        </span>
                        <p className="text-sm font-bold text-white">
                          {verifiedReservation.user_name}
                        </p>
                        <p className="text-xs text-teal-300 font-semibold flex items-center gap-1">
                          <span>Plaza asignada:</span>
                          <strong className="px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30 text-teal-200">
                            {verifiedReservation.space_code} ({verifiedReservation.space_floor})
                          </strong>
                        </p>
                      </div>

                      {/* Schedule & Stay Time Column */}
                      <div className="p-3.5 bg-black/20 rounded-2xl border border-white/10 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {isInsideStay ? 'Tiempo de Estadía en Vivo' : 'Horario Reservado'}
                        </span>
                        {isInsideStay ? (
                          <>
                            <div className="text-sm font-black text-amber-300 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>{elapsedStay || 'Recién ingresó'}</span>
                              <span className="text-[11px] font-normal text-slate-300">(adentro)</span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              Entrada: {new Date(verifiedReservation.check_in_time!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold text-white">
                              {verifiedReservation.start_time.slice(0, 5)} - {verifiedReservation.end_time.slice(0, 5)} hs
                            </div>
                            <p className="text-[11px] text-slate-300">
                              Total reservado: {verifiedReservation.total_hours} Horas
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* DEDICATED PAYMENT INFO SECTION (Muestra método de pago utilizado en Ingreso y Egreso) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/80 to-navy-950/90 border border-teal-500/30 shadow-inner">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Payment Method Badge & Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
                            {paymentInfo.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 block">
                              Método de Pago Utilizado
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-base font-black text-white">
                                {paymentInfo.name}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${paymentInfo.badgeClass}`}>
                                {verifiedReservation.payment_method || 'Mercado Pago'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount and Payment Status */}
                        <div className="flex items-center gap-3 sm:text-right">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Monto Total
                            </span>
                            <span className="text-xl font-black text-emerald-400 block">
                              ${Number(verifiedReservation.total_price).toLocaleString('es-AR')}
                            </span>
                          </div>

                          {isPaid ? (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Pagado Online</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                              <Clock className="w-4 h-4 text-amber-400" />
                              <span>Pendiente Cobro</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contextual Guidance for Operator */}
                      <div className="mt-3 pt-2.5 border-t border-white/10 text-xs flex items-center justify-between">
                        {isPendingEntry ? (
                          <div className="flex items-center gap-2 text-emerald-200">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>
                              {isPaid
                                ? `Pago 100% verificado vía ${paymentInfo.name}. Listo para autorizar ingreso y abrir barrera.`
                                : `Cobro en garita pendiente de liquidar al ingresar (${paymentInfo.name}).`}
                            </span>
                          </div>
                        ) : isInsideStay ? (
                          <div className="flex items-center gap-2 text-sky-200">
                            <Check className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>
                              {isPaid
                                ? `Pago completado previamente vía ${paymentInfo.name}. Salida libre sin cobro adicional requerido.`
                                : `Cobro pendiente de liquidar en garita antes de liberar la salida (${paymentInfo.name}).`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Estadía y cobro completados con éxito vía {paymentInfo.name}.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Operational Action Buttons (Instant 1-Click validation in same module) */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                      {isPendingEntry && (
                        <Button
                          variant="emerald"
                          size="md"
                          isLoading={actionLoading}
                          onClick={() => handleCheckIn(verifiedReservation)}
                          leftIcon={<ArrowDownRight className="w-4 h-4" />}
                          className="px-6 py-3 font-bold shadow-lg shadow-emerald-500/30"
                        >
                          Validar Ingreso (Abrir Barrera)
                        </Button>
                      )}

                      {isInsideStay && (
                        <Button
                          variant="primary"
                          size="md"
                          isLoading={actionLoading}
                          onClick={() => handleDirectCheckOut(verifiedReservation)}
                          leftIcon={<ArrowUpRight className="w-4 h-4" />}
                          className="px-6 py-3 font-bold bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 text-white"
                        >
                          Validar Egreso & Salida (Liberar Plaza)
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => {
                          setVerifiedReservation(null);
                          setQrCodeInput('');
                        }}
                        className="text-white border-white/20 hover:bg-white/10"
                      >
                        Cerrar Pase
                      </Button>
                    </div>

                  </div>
                );
              })()}
            </div>

            {/* Active Stays & Movements Table */}
            <div className="bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark shadow-sm overflow-hidden transition-colors">
              <div className="p-6 border-b border-slate-100 dark:border-parkia-line-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-navy-900 dark:text-white text-lg">
                    Registro en Vivo de Movimientos & Cobros
                  </h3>
                  <p className="text-slate-400 dark:text-slate-400 text-xs">
                    Listado en tiempo real de vehículos ingresados, egresos, medios de pago y caja diaria.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-parkia-navy/60 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-parkia-line-dark">
                  {filteredReservations.length} movimientos registrados
                </span>
              </div>

              {/* Tablet Portrait & Mobile Cards List (<lg) - Full visibility of actions and status */}
              <div className="lg:hidden divide-y divide-slate-100 dark:divide-parkia-line-dark">
                {filteredReservations.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-sm">
                    No hay registros de movimientos para este estacionamiento.
                  </div>
                ) : (
                  filteredReservations
                    .slice((gatePage - 1) * gatePageSize, gatePage * gatePageSize)
                    .map((res) => {
                    const isInside = res.check_in_time && !res.check_out_time;
                    return (
                      <div key={res.id} className="p-4 sm:p-5 space-y-3 bg-white dark:bg-parkia-card-dark hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-navy-900 dark:text-white text-base sm:text-lg tracking-wide">
                                {res.vehicle_plate}
                              </span>
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold">
                                {res.booking_code}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{res.user_name}</p>
                            <span className="text-xs text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/60 px-2.5 py-0.5 rounded-lg inline-block">
                              {res.parking_name} • Plaza {res.space_code}
                            </span>
                          </div>
                          <Badge variant={res.status as any}>
                            {res.status_display}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-parkia-page-dark p-3 rounded-2xl text-xs border border-slate-100 dark:border-parkia-line-dark">
                          <div>
                            <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Entrada</span>
                            {res.check_in_time ? (
                              <span className="font-bold text-teal-700 dark:text-teal-400 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                                {new Date(res.check_in_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs
                              </span>
                            ) : (
                              <span className="text-slate-400 italic mt-0.5 block whitespace-nowrap">Pendiente ({res.start_time.slice(0, 5)}hs)</span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Salida</span>
                            {res.check_out_time ? (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                {new Date(res.check_out_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs
                              </span>
                            ) : isInside ? (
                              <span className="inline-flex items-center gap-1.5 mt-0.5 font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                Adentro ahora
                              </span>
                            ) : (
                              <span className="text-slate-400 mt-0.5 block">-</span>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-400 dark:text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Cobro & Pago</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-sm font-black text-navy-900 dark:text-white">
                                ${Number(res.total_price).toLocaleString('es-AR')}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {res.payment_method === 'Mercado Pago' ? <CreditCard className="w-3 h-3 text-sky-500 shrink-0" /> : <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                {res.payment_method || 'Efectivo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
                          {!res.check_in_time && res.status === 'confirmed' && (
                            <button
                              onClick={() => handleCheckIn(res)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ArrowDownRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span>Registrar Entrada</span>
                            </button>
                          )}

                          {isInside && (
                            <button
                              onClick={() => setCheckoutTarget(res)}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <ArrowUpRight className="w-4 h-4 text-emerald-100" />
                              <span>Salida & Cobro Final</span>
                            </button>
                          )}

                          {res.status === 'completed' && (
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Movimiento Finalizado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Wide Table (>=lg) */}
              <div className="hidden lg:block overflow-x-auto w-full">
                <table className="w-full min-w-[960px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-parkia-navy/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-parkia-line-dark whitespace-nowrap">
                      <th className="py-3 px-4">Código / Patente</th>
                      <th className="py-3 px-4">Conductor</th>
                      <th className="py-3 px-4">Estacionamiento & Plaza</th>
                      <th className="py-3 px-4">Ingreso (Entrada)</th>
                      <th className="py-3 px-4">Egreso (Salida)</th>
                      <th className="py-3 px-4">Monto & Medio de Pago</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acción Operativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-parkia-line-dark font-medium text-slate-700 dark:text-slate-300">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No hay registros de movimientos para este estacionamiento.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations
                        .slice((gatePage - 1) * gatePageSize, gatePage * gatePageSize)
                        .map((res) => {
                        const isInside = res.check_in_time && !res.check_out_time;
                        return (
                          <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-navy-900 dark:text-white block text-sm">
                                {res.vehicle_plate}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {res.booking_code}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-bold text-slate-900 dark:text-white block">{res.user_name}</span>
                              <span className="text-[11px] text-slate-400">{res.user_email}</span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="font-semibold text-slate-900 dark:text-slate-200 block">{res.parking_name}</span>
                              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                                Plaza {res.space_code}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {res.check_in_time ? (
                                <div className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-bold whitespace-nowrap">
                                  <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                                  {new Date(res.check_in_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs
                                </div>
                              ) : (
                                <span className="text-slate-400 italic whitespace-nowrap">Pendiente (Reserva {res.start_time.slice(0, 5)}hs)</span>
                              )}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              {res.check_out_time ? (
                                <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold whitespace-nowrap">
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                  {new Date(res.check_out_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} hs
                                </div>
                              ) : isInside ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                  Adentro ahora
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="text-sm font-black text-navy-900 dark:text-white block">
                                ${Number(res.total_price).toLocaleString('es-AR')}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {res.payment_method === 'Mercado Pago' ? <CreditCard className="w-3 h-3 text-sky-500 shrink-0" /> : <Banknote className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                                {res.payment_method || 'Efectivo'}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 items-start">
                                <Badge variant={res.status as any}>
                                  {res.status_display}
                                </Badge>
                                {res.payment_status === 'refunded' && (
                                  <span className="text-[10px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-300 dark:border-purple-800 whitespace-nowrap">
                                    ↩ Reembolsado
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {!res.check_in_time && res.status === 'confirmed' && (
                                <button
                                  onClick={() => handleCheckIn(res)}
                                  className="px-3 py-1.5 rounded-xl font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer"
                                >
                                  Entrada
                                </button>
                              )}

                              {isInside && (
                                <button
                                  onClick={() => setCheckoutTarget(res)}
                                  className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                                >
                                  Salida & Cobro
                                </button>
                              )}

                              {res.status === 'completed' && (
                                <span className="text-[11px] font-bold text-slate-400">
                                  Finalizado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Controles de paginación (5, 10, 15) */}
              <div className="p-4 sm:p-6 pt-0">
                <Pagination
                  currentPage={gatePage}
                  totalItems={filteredReservations.length}
                  pageSize={gatePageSize}
                  onPageChange={setGatePage}
                  onPageSizeChange={setGatePageSize}
                  pageSizeOptions={[5, 10, 15]}
                  itemLabel="movimientos"
                />
              </div>
            </div>

          </div>
        </div>

      {/* Modal: Fullscreen Camera QR Scanner */}
      {isCameraScannerOpen && (
        <Modal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          title="Escáner QR con Cámara (Tablet o Teléfono)"
          maxWidth="md"
        >
          <div className="p-4 sm:p-6 space-y-4">
            <CameraQrScanner
              onScanSuccess={handleCameraScanSuccess}
              onClose={() => setIsCameraScannerOpen(false)}
              autoCloseOnSuccess={true}
            />
          </div>
        </Modal>
      )}

      {/* Modal: Salida y Cobro (Check-Out) */}
      {checkoutTarget && (
        <Modal
          isOpen={!!checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
          title={`Registrar Egreso y Cobro • ${checkoutTarget.vehicle_plate}`}
          maxWidth="md"
        >
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 dark:bg-parkia-page-dark rounded-2xl border border-slate-200/80 dark:border-parkia-line-dark space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Conductor:</span>
                <strong className="text-slate-900 dark:text-white">{checkoutTarget.user_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estacionamiento:</span>
                <strong className="text-slate-900 dark:text-white">{checkoutTarget.parking_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plaza:</span>
                <strong className="text-teal-700 dark:text-teal-400 font-bold">{checkoutTarget.space_code}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Duración Estancia:</span>
                <strong className="text-slate-900 dark:text-white">{checkoutTarget.total_hours} Horas</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-parkia-line-dark text-sm">
                <span className="font-bold text-slate-900 dark:text-white">Total a Cobrar:</span>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                  ${Number(checkoutTarget.total_price).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Método de Cobro en Garita:
              </label>
              <select
                value={checkoutMethod}
                onChange={(e) => setCheckoutMethod(e.target.value)}
                className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Mercado Pago">Mercado Pago (QR Garita)</option>
                <option value="Tarjeta Débito">Tarjeta de Débito</option>
                <option value="Tarjeta Crédito">Tarjeta de Crédito</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Notas del Operador (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: Cobrado ticket sin incidencias..."
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-parkia-line-dark">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCheckoutTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="emerald"
                size="md"
                isLoading={processingCheckout}
                onClick={handleConfirmCheckOut}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirmar Salida y Cobro
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Ingreso Directo en Ventanilla (Walk-in) */}
      {isWalkInOpen && (
        <Modal
          isOpen={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          title="Registrar Ingreso Directo (Sin Reserva Previa)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateWalkIn} className="space-y-4">
            <div>
              <label htmlFor="walkin-garage-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Estacionamiento Destino:
              </label>
              {isOwner && parkings.length <= 1 ? (
                <div className="w-full text-xs font-bold bg-slate-50 dark:bg-parkia-page-dark border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-slate-200 flex items-center justify-between min-h-[44px]">
                  <span>{parkings[0]?.name || 'Tu Estacionamiento'}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
                    ${Number(parkings[0]?.price_per_hour || 0).toLocaleString('es-AR')}/h
                  </span>
                </div>
              ) : (
                <select
                  id="walkin-garage-select"
                  value={walkInParkingId}
                  onChange={(e) => setWalkInParkingId(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                >
                  {parkings.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.price_per_hour).toLocaleString('es-AR')}/h)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="walkin-plate" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patente / Matrícula: *
                </label>
                <input
                  id="walkin-plate"
                  type="text"
                  required
                  placeholder="Ej: AB123CD"
                  value={walkInPlate}
                  onChange={(e) => setWalkInPlate(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold uppercase bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="walkin-model" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Modelo / Marca:
                </label>
                <input
                  id="walkin-model"
                  type="text"
                  placeholder="Ej: Toyota Corolla"
                  value={walkInModel}
                  onChange={(e) => setWalkInModel(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="walkin-hours" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Horas Estimadas:
                </label>
                <input
                  id="walkin-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={walkInHours}
                  onChange={(e) => setWalkInHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="walkin-method" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Medio de Pago:
                </label>
                <select
                  id="walkin-method"
                  value={walkInMethod}
                  onChange={(e) => setWalkInMethod(e.target.value)}
                  className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2.5 text-navy-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Mercado Pago">Mercado Pago (QR)</option>
                  <option value="Tarjeta Débito">Débito</option>
                  <option value="Tarjeta Crédito">Crédito</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="walkin-notes" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Observaciones:
              </label>
              <input
                id="walkin-notes"
                type="text"
                placeholder="Ej: Ingreso por barrera norte..."
                value={walkInNotes}
                onChange={(e) => setWalkInNotes(e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-parkia-line-dark rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-parkia-line-dark">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setIsWalkInOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="md"
                isLoading={submittingWalkIn}
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Registrar Entrada
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
