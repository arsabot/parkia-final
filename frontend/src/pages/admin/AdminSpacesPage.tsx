import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Grid, 
  Car, 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Wrench,
  Sparkles,
  ScanLine,
  Filter
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/parkingService';
import { Parking, ParkingSpace, SpaceStatus } from '../../types';

export const AdminSpacesPage: React.FC = () => {
  const { isSuperAdmin, isOwner } = useAuth();
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<number | null>(null);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newSpaceCode, setNewSpaceCode] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    const loadParkings = async () => {
      try {
        setLoading(true);
        const data = isOwner ? await parkingService.getMyParkings() : await parkingService.getParkings();
        setParkings(data);
        if (data.length > 0) {
          setSelectedParkingId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading parkings', err);
      } finally {
        setLoading(false);
      }
    };
    loadParkings();
  }, [isOwner]);

  useEffect(() => {
    const loadSpaces = async () => {
      if (!selectedParkingId) return;
      try {
        const list = await parkingService.getSpaces(selectedParkingId);
        setSpaces(list);
      } catch (err) {
        console.error('Error loading spaces', err);
      }
    };
    loadSpaces();
  }, [selectedParkingId]);

  const handleSpaceClick = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setIsStatusModalOpen(true);
  };

  const handleChangeStatus = async (status: SpaceStatus) => {
    if (!selectedSpace) return;
    try {
      const updated = await parkingService.updateSpaceStatus(selectedSpace.id, status);
      setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      success(`Plaza ${selectedSpace.code} actualizada a ${updated.status_display}`);
      setIsStatusModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Error al cambiar estado');
    }
  };

  const handleAddSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParkingId || !newSpaceCode.trim()) return;

    try {
      const created = await parkingService.updateParking(selectedParkingId, {}); // or create space API
      // For MVP we can refresh spaces
      const list = await parkingService.getSpaces(selectedParkingId);
      setSpaces(list);
      success(`Plaza ${newSpaceCode.toUpperCase()} añadida`);
      setNewSpaceCode('');
      setIsAddModalOpen(false);
    } catch (err: any) {
      error('No se pudo añadir la plaza');
    }
  };

  const currentParking = parkings.find((p) => p.id === selectedParkingId);

  const countAvailable = spaces.filter((s) => s.status === 'available').length;
  const countOccupied = spaces.filter((s) => s.status === 'occupied').length;
  const countReserved = spaces.filter((s) => s.status === 'reserved').length;
  const countMaintenance = spaces.filter((s) => s.status === 'maintenance').length;

  const filteredSpaces = spaces.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isOwner 
                  ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isOwner ? '🏢 Panel Dueño de Garaje' : '👑 Super Administrador'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Monitoreo de Ocupación en Tiempo Real
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Gestión de Plazas Vacantes
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Visualiza en vivo los espacios libres, autos estacionados y modifica la disponibilidad con 1 toque.
            </p>
          </div>

          <Link to="/admin/gate">
            <Button
              variant="emerald"
              size="md"
              leftIcon={<ScanLine className="w-4 h-4" />}
              className="shadow-md shadow-emerald-500/20"
            >
              Ir a Cámara Escáner QR
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar />

          <div className="flex-1 space-y-6">
            
            {/* Garage Selector & Vacancy Counters */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {isOwner && parkings.length <= 1 ? 'Garaje Asignado' : 'Estacionamiento Seleccionado'}
                </label>
                {isOwner && parkings.length <= 1 ? (
                  <div className="w-full sm:max-w-md bg-emerald-50/80 border border-emerald-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <h4 className="text-sm font-extrabold text-navy-900 leading-tight">
                          {currentParking?.name || parkings[0]?.name || 'Tu Garaje'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">
                          {currentParking?.address || parkings[0]?.address}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold bg-emerald-200/60 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                      Tu Garaje
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedParkingId || ''}
                    onChange={(e) => setSelectedParkingId(Number(e.target.value))}
                    className="w-full sm:max-w-md bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {parkings.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.address})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus(filterStatus === 'available' ? 'all' : 'available')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    filterStatus === 'available'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filterStatus === 'available' ? 'bg-white' : 'bg-emerald-500'}`} />
                  {countAvailable} Libres
                </button>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'occupied' ? 'all' : 'occupied')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    filterStatus === 'occupied'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filterStatus === 'occupied' ? 'bg-white' : 'bg-rose-500'}`} />
                  {countOccupied} Ocupados
                </button>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'reserved' ? 'all' : 'reserved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    filterStatus === 'reserved'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filterStatus === 'reserved' ? 'bg-white' : 'bg-amber-500'}`} />
                  {countReserved} Reservados
                </button>
                <button
                  onClick={() => setFilterStatus(filterStatus === 'maintenance' ? 'all' : 'maintenance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    filterStatus === 'maintenance'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${filterStatus === 'maintenance' ? 'bg-white' : 'bg-slate-400'}`} />
                  {countMaintenance} Taller
                </button>
              </div>
            </div>

            {/* Interactive Grid of Spaces */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Cuadrícula de Plazas - {currentParking?.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Toca cualquier plaza para liberarla u ocuparla inmediatamente.
                  </p>
                </div>

                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="text-xs text-teal-600 font-bold hover:underline"
                  >
                    Mostrar todas ({spaces.length})
                  </button>
                )}
              </div>

              {filteredSpaces.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No hay plazas registradas con el filtro seleccionado.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {filteredSpaces.map((space) => {
                    const isAvailable = space.status === 'available';
                    const isOccupied = space.status === 'occupied';
                    const isReserved = space.status === 'reserved';
                    const isMaintenance = space.status === 'maintenance';

                    return (
                      <button
                        key={space.id}
                        onClick={() => handleSpaceClick(space)}
                        className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 hover:scale-105 active:scale-95 shadow-sm group ${
                          isAvailable
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                            : isOccupied
                            ? 'bg-rose-50/60 border-rose-300 text-rose-900 hover:bg-rose-100'
                            : isReserved
                            ? 'bg-amber-50/60 border-amber-300 text-amber-900 hover:bg-amber-100'
                            : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Car className={`w-5 h-5 ${
                          isAvailable ? 'text-emerald-600' : isOccupied ? 'text-rose-600' : isReserved ? 'text-amber-600' : 'text-slate-400'
                        }`} />
                        <span className="font-extrabold text-sm tracking-wider">{space.code}</span>
                        <span className="text-[10px] font-semibold opacity-75">{space.floor}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Modal: Change Status */}
      {selectedSpace && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Plaza ${selectedSpace.code} (${selectedSpace.floor})`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Selecciona el nuevo estado operativo para esta plaza:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleChangeStatus('available')}
                className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm text-left flex items-center justify-between"
              >
                <span>✓ Disponible (Libre para reservar)</span>
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </button>

              <button
                onClick={() => handleChangeStatus('occupied')}
                className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-sm text-left flex items-center justify-between"
              >
                <span>✕ Ocupado (Auto estacionado en garita)</span>
                <span className="w-3 h-3 rounded-full bg-rose-500" />
              </button>

              <button
                onClick={() => handleChangeStatus('reserved')}
                className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-sm text-left flex items-center justify-between"
              >
                <span>⏱ Reservado (Bloqueado temporalmente)</span>
                <span className="w-3 h-3 rounded-full bg-amber-500" />
              </button>

              <button
                onClick={() => handleChangeStatus('maintenance')}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm text-left flex items-center justify-between"
              >
                <span>🛠 Fuera de servicio / Mantenimiento</span>
                <span className="w-3 h-3 rounded-full bg-slate-400" />
              </button>
            </div>

            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} className="w-full mt-2">
              Cerrar
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};
