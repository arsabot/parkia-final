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
  Smartphone
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { parkingService } from '../../services/parkingService';
import { Reservation, Parking } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
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

  // QR Scan / Code Search state
  const [qrCodeInput, setQrCodeInput] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState<boolean>(false);
  const [verifiedReservation, setVerifiedReservation] = useState<Reservation | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

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
      setVerifiedReservation(res.reservation);
      setQrCodeInput(code);
      success(`¡QR validado con éxito! Vehículo: ${res.reservation.vehicle_plate}`);
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
  const handleCheckIn = async (res: Reservation) => {
    try {
      const updated = await reservationService.checkIn(res.id);
      success(updated.message || 'Ingreso registrado correctamente.');
      setVerifiedReservation(null);
      setQrCodeInput('');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Error al registrar ingreso.');
    }
  };

  // Handle Check-Out (Egreso y Cobro)
  const handleConfirmCheckOut = async () => {
    if (!checkoutTarget) return;
    try {
      setProcessingCheckout(true);
      const updated = await reservationService.checkOut(checkoutTarget.id, {
        payment_method: checkoutMethod,
        notes: checkoutNotes
      });
      success(updated.message || 'Egreso y cobro registrado exitosamente.');
      setCheckoutTarget(null);
      setVerifiedReservation(null);
      setQrCodeInput('');
      await loadData();
    } catch (err: any) {
      error(err.message || 'Error al registrar egreso.');
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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Role-tailored Sidebar */}
          <AdminSidebar />

          {/* Main Operations Area */}
          <div className="flex-1 space-y-8 animate-fade-in">
            
            {/* Header and Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-widest">
                    Módulo de Operación y Garita
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {isSuperAdmin ? 'Super Admin' : 'Panel de Dueño'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  Control de Accesos, Cámara QR & Caja
                </h1>
                <p className="text-slate-500 text-sm">
                  Utiliza la cámara de tu tablet o teléfono para validar pases QR, registrar entradas/salidas y controlar la recaudación en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Parking selector filter */}
                {isOwner && parkings.length <= 1 ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Garaje: <strong>{parkings[0]?.name || 'Tu Garaje'}</strong></span>
                    <span className="text-[10px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                      Asignado
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedParkingId}
                    onChange={(e) => setSelectedParkingId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  >
                    {!isOwner && <option value="all">🏢 Todos los Estacionamientos</option>}
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
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Vehículos Adentro</span>
                  <span className="text-2xl font-black text-navy-900 mt-1 block">
                    {checkedInList.length}
                  </span>
                  <span className="text-[11px] font-bold text-teal-600 flex items-center gap-1 mt-0.5">
                    <ArrowDownRight className="w-3.5 h-3.5" /> En estadía activa
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Car className="w-6 h-6" />
                </div>
              </div>

              {/* Egresos completados */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Egresos Registrados</span>
                  <span className="text-2xl font-black text-navy-900 mt-1 block">
                    {checkedOutToday.length}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Salidas exitosas
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Recaudación Total en Caja */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Recaudación / Caja</span>
                  <span className="text-2xl font-black text-navy-900 mt-1 block">
                    ${totalMoneyCollected.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <DollarSign className="w-3.5 h-3.5" /> Ingresos de dinero
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              {/* Reservas Pendientes de Ingreso */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block">Por Ingresar (Hoy)</span>
                  <span className="text-2xl font-black text-navy-900 mt-1 block">
                    {filteredReservations.filter((r) => r.status === 'confirmed' && !r.check_in_time).length}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" /> Con reserva confirmada
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* QR Scanner & Code Validation Station */}
            <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-teal-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    <ScanLine className="w-5 h-5 animate-pulse" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Terminal de Escaneo de Códigos QR
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  Abre la cámara en tu teléfono o tablet para escanear en tiempo real el pase QR del conductor, o tipea manualmente el código (ej: <code>PK-892401</code>).
                </p>

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
                    o escribe el código:
                  </div>

                  <form onSubmit={handleVerifyQr} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ej: PK-892401..."
                        value={qrCodeInput}
                        onChange={(e) => setQrCodeInput(e.target.value.toUpperCase())}
                        className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl pl-10 pr-3 py-3 text-white placeholder-slate-400 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      isLoading={verifying}
                      className="px-4 text-xs font-bold text-white border-white/30 hover:bg-white/10"
                    >
                      Validar
                    </Button>
                  </form>
                </div>

                {/* Quick Demo Code helper buttons */}
                <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 flex-wrap">
                  <span>Probar rápido con reservas registradas:</span>
                  {filteredReservations.slice(0, 3).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => verifyCode(r.booking_code)}
                      className="font-mono bg-white/10 hover:bg-white/20 text-teal-300 px-2 py-0.5 rounded-lg border border-white/10 transition-colors"
                    >
                      {r.booking_code} ({r.vehicle_plate})
                    </button>
                  ))}
                </div>
              </div>

              {/* Verified QR Detail Box */}
              {verifiedReservation && (
                <div className="mt-6 pt-6 border-t border-white/15 bg-white/5 p-5 rounded-2xl border border-white/10 animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-xl text-amber-300">
                          #{verifiedReservation.booking_code}
                        </span>
                        <Badge variant={verifiedReservation.status as any}>
                          {verifiedReservation.status_display}
                        </Badge>
                        {verifiedReservation.check_in_time && !verifiedReservation.check_out_time && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            Adentro
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-base">
                        {verifiedReservation.user_name} • Vehículo: <span className="font-mono text-emerald-400">{verifiedReservation.vehicle_plate}</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Estacionamiento: <strong>{verifiedReservation.parking_name}</strong> | Plaza: <strong className="text-teal-300">{verifiedReservation.space_code}</strong> | Horario: {verifiedReservation.start_time.slice(0, 5)} - {verifiedReservation.end_time.slice(0, 5)} hs | Total: <strong>${Number(verifiedReservation.total_price).toLocaleString('es-AR')}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {!verifiedReservation.check_in_time && (
                        <Button
                          variant="emerald"
                          size="md"
                          onClick={() => handleCheckIn(verifiedReservation)}
                          leftIcon={<ArrowDownRight className="w-4 h-4" />}
                        >
                          Registrar Ingreso
                        </Button>
                      )}

                      {verifiedReservation.check_in_time && !verifiedReservation.check_out_time && (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setCheckoutTarget(verifiedReservation)}
                          leftIcon={<ArrowUpRight className="w-4 h-4" />}
                        >
                          Registrar Egreso & Cobro
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setVerifiedReservation(null)}
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Stays & Movements Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-navy-900 text-lg">
                    Registro en Vivo de Movimientos & Cobros
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Listado en tiempo real de vehículos ingresados, egresos, medios de pago y caja diaria.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                  {filteredReservations.length} movimientos registrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
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
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredReservations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          No hay registros de movimientos para este estacionamiento.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((res) => {
                        const isInside = res.check_in_time && !res.check_out_time;
                        return (
                          <tr key={res.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-navy-900 block text-sm">
                                {res.vehicle_plate}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                {res.booking_code}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">{res.user_name}</span>
                              <span className="text-[11px] text-slate-400">{res.user_email}</span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-900 block">{res.parking_name}</span>
                              <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                                Plaza {res.space_code}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              {res.check_in_time ? (
                                <div className="flex items-center gap-1.5 text-teal-700 font-bold">
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                  {new Date(res.check_in_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Pendiente (Reserva {res.start_time.slice(0, 5)}hs)</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {res.check_out_time ? (
                                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  {new Date(res.check_out_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                </div>
                              ) : isInside ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Adentro ahora
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className="text-sm font-black text-navy-900 block">
                                ${Number(res.total_price).toLocaleString('es-AR')}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                {res.payment_method === 'Mercado Pago' ? <CreditCard className="w-3 h-3 text-sky-500" /> : <Banknote className="w-3 h-3 text-emerald-600" />}
                                {res.payment_method || 'Efectivo'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <Badge variant={res.status as any}>
                                {res.status_display}
                              </Badge>
                            </td>

                            <td className="py-3 px-4 text-right">
                              {!res.check_in_time && res.status === 'confirmed' && (
                                <button
                                  onClick={() => handleCheckIn(res)}
                                  className="px-3 py-1.5 rounded-xl font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                                >
                                  Entrada
                                </button>
                              )}

                              {isInside && (
                                <button
                                  onClick={() => setCheckoutTarget(res)}
                                  className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors"
                                >
                                  Salida & Cobro
                                </button>
                              )}

                              {res.status === 'completed' && (
                                <span className="text-[11px] font-bold text-slate-400">
                                  ✓ Finalizado
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
          <div className="p-6 space-y-5">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Conductor:</span>
                <strong className="text-slate-900">{checkoutTarget.user_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estacionamiento:</span>
                <strong className="text-slate-900">{checkoutTarget.parking_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plaza:</span>
                <strong className="text-teal-700 font-bold">{checkoutTarget.space_code}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duración Estancia:</span>
                <strong className="text-slate-900">{checkoutTarget.total_hours} Horas</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Total a Cobrar:</span>
                <span className="font-black text-xl text-emerald-600">
                  ${Number(checkoutTarget.total_price).toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Método de Cobro en Garita:
              </label>
              <select
                value={checkoutMethod}
                onChange={(e) => setCheckoutMethod(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Mercado Pago">📱 Mercado Pago (QR Garita)</option>
                <option value="Tarjeta Débito">💳 Tarjeta de Débito</option>
                <option value="Tarjeta Crédito">💳 Tarjeta de Crédito</option>
                <option value="Transferencia">🏦 Transferencia Bancaria</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Notas del Operador (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: Cobrado ticket sin incidencias..."
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
          <form onSubmit={handleCreateWalkIn} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estacionamiento Destino:
              </label>
              {isOwner && parkings.length <= 1 ? (
                <div className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 flex items-center justify-between">
                  <span>🏢 {parkings[0]?.name || 'Tu Estacionamiento'}</span>
                  <span className="text-emerald-700 font-extrabold">
                    ${Number(parkings[0]?.price_per_hour || 0).toLocaleString('es-AR')}/h
                  </span>
                </div>
              ) : (
                <select
                  value={walkInParkingId}
                  onChange={(e) => setWalkInParkingId(Number(e.target.value))}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Patente / Matrícula: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AB123CD"
                  value={walkInPlate}
                  onChange={(e) => setWalkInPlate(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono font-bold uppercase bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Modelo / Marca:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Toyota Corolla"
                  value={walkInModel}
                  onChange={(e) => setWalkInModel(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Horas Estimadas:
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={walkInHours}
                  onChange={(e) => setWalkInHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Medio de Pago:
                </label>
                <select
                  value={walkInMethod}
                  onChange={(e) => setWalkInMethod(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Mercado Pago">📱 Mercado Pago (QR)</option>
                  <option value="Tarjeta Débito">💳 Débito</option>
                  <option value="Tarjeta Crédito">💳 Crédito</option>
                  <option value="Transferencia">🏦 Transferencia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observaciones:
              </label>
              <input
                type="text"
                placeholder="Ej: Ingreso por barrera norte..."
                value={walkInNotes}
                onChange={(e) => setWalkInNotes(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
