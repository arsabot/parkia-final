import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  MapPin, 
  Clock, 
  DollarSign, 
  Layers, 
  AlertTriangle,
  Search,
  Mail,
  UserCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';
import { parkingService } from '../../services/parkingService';
import { Parking } from '../../types';

export const AdminParkingsPage: React.FC = () => {
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParking, setEditingParking] = useState<Parking | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Parking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Buenos Aires',
    latitude: -34.6037,
    longitude: -58.3816,
    description: '',
    phone: '',
    owner_email: '',
    price_per_hour: 2000,
    price_per_day: 15000,
    opening_time: '07:00:00',
    closing_time: '23:00:00',
    is_24_hours: false,
    capacity: 25,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: false,
    has_disabled_access: true,
    has_car_wash: false,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
  });

  const fetchParkings = async () => {
    try {
      setLoading(true);
      const data = await parkingService.getParkings();
      setParkings(data);
    } catch (err) {
      console.error('Error fetching parkings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkings();
  }, []);

  const handleOpenCreate = () => {
    setEditingParking(null);
    setFormData({
      name: '',
      address: '',
      city: 'Buenos Aires',
      latitude: -34.6037,
      longitude: -58.3816,
      description: '',
      phone: '',
      owner_email: '',
      price_per_hour: 2000,
      price_per_day: 15000,
      opening_time: '07:00:00',
      closing_time: '23:00:00',
      is_24_hours: false,
      capacity: 25,
      is_active: true,
      is_covered: true,
      has_security: true,
      has_ev_charging: false,
      has_disabled_access: true,
      has_car_wash: false,
      has_valet: false,
      image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Parking) => {
    setEditingParking(p);
    setFormData({
      name: p.name,
      address: p.address,
      city: p.city,
      latitude: p.latitude,
      longitude: p.longitude,
      description: p.description,
      phone: p.phone,
      owner_email: p.owner_email || '',
      price_per_hour: Number(p.price_per_hour),
      price_per_day: Number(p.price_per_day || 15000),
      opening_time: p.opening_time,
      closing_time: p.closing_time,
      is_24_hours: p.is_24_hours,
      capacity: p.capacity,
      is_active: p.is_active,
      is_covered: p.is_covered,
      has_security: p.has_security,
      has_ev_charging: p.has_ev_charging,
      has_disabled_access: p.has_disabled_access,
      has_car_wash: p.has_car_wash,
      has_valet: p.has_valet,
      image_url: p.image_url,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (p: Parking) => {
    try {
      const updated = await parkingService.updateParking(p.id, { is_active: !p.is_active });
      setParkings((prev) => prev.map((item) => (item.id === p.id ? { ...item, is_active: updated.is_active } : item)));
      success(`Estacionamiento ${updated.is_active ? 'activado' : 'desactivado'} correctamente.`);
    } catch (err: any) {
      error(err.message || 'Error al actualizar estado');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (editingParking) {
        const updated = await parkingService.updateParking(editingParking.id, formData);
        setParkings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        success('Estacionamiento actualizado correctamente.');
      } else {
        const created = await parkingService.createParking(formData);
        setParkings((prev) => [created, ...prev]);
        success('Nuevo estacionamiento creado exitosamente.');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      error(err.message || 'Error al guardar el estacionamiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await parkingService.deleteParking(deleteCandidate.id);
      setParkings((prev) => prev.filter((item) => item.id !== deleteCandidate.id));
      success('Estacionamiento eliminado.');
      setDeleteCandidate(null);
    } catch (err: any) {
      error(err.message || 'Error al eliminar');
    }
  };

  const filteredParkings = parkings.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                👑 Super Admin • Ariel
              </span>
              <span className="text-xs font-bold text-slate-400">
                Gestión Central de la Plataforma
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Alta y Baja de Estacionamientos
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Habilita o da de baja estacionamientos en la red, aprueba nuevos garajes, ajusta tarifas y administra la flota completa.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-lg shadow-brand-500/25 font-bold"
          >
            Dar de Alta Nuevo Garaje
          </Button>
        </div>

        <div className="space-y-6">
            
            {/* Search Input */}
            <Input
              type="text"
              placeholder="Filtrar estacionamientos por nombre o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            {/* Tablet Portrait & Mobile Cards List (<lg) */}
            <div className="lg:hidden divide-y divide-slate-100 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {filteredParkings.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=100'}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-sm"
                      />
                      <div>
                        <strong className="text-slate-900 block font-bold text-sm sm:text-base">{p.name}</strong>
                        <span className="text-xs text-slate-400 block">{p.address}</span>
                        {p.owner_email ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md mt-1">
                            <UserCheck className="w-3 h-3 text-teal-600" />
                            <span>Dueño: {p.owner_email}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1">
                            <span>⚠️ Sin dueño asignado</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        p.is_active
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.is_active ? '✓ Activo' : '✕ Inactivo'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-xs border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Tarifa/h</span>
                      <span className="font-bold text-slate-900 sm:text-sm">${Number(p.price_per_hour).toLocaleString('es-AR')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Capacidad</span>
                      <span className="font-bold text-slate-900 sm:text-sm">{p.capacity} plazas</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Horario</span>
                      <span className="font-bold text-slate-900 sm:text-sm">{p.is_24_hours ? '24hs' : `${p.opening_time?.slice(0, 5) || '08:00'}`}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar Garaje</span>
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(p)}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>=lg) */}
            <div className="hidden lg:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[920px] text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                    <tr>
                      <th className="py-4 px-4">Estacionamiento</th>
                      <th className="py-4 px-3">Dueño Asignado</th>
                      <th className="py-4 px-3">Tarifa/h</th>
                      <th className="py-4 px-3">Horario</th>
                      <th className="py-4 px-3">Capacidad</th>
                      <th className="py-4 px-3">Estado</th>
                      <th className="py-4 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredParkings.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=100'}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <strong className="text-slate-900 block font-bold text-sm">{p.name}</strong>
                              <span className="text-[11px] text-slate-400">{p.address}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {p.owner_email ? (
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">{p.owner_email}</span>
                              <span className="text-[10px] text-teal-600 font-semibold">{p.owner_name || 'Operador'}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Sin asignar
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                          ${Number(p.price_per_hour).toLocaleString('es-AR')}
                        </td>

                        <td className="py-3 px-3">
                          {p.is_24_hours ? (
                            <span className="font-bold text-indigo-600">24 Horas</span>
                          ) : (
                            `${p.opening_time ? p.opening_time.slice(0, 5) : '08:00'} - ${p.closing_time ? p.closing_time.slice(0, 5) : '22:00'}`
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900">{p.capacity}</span> plazas
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                              p.is_active
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {p.is_active ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                                <span>Activo</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                                <span>Inactivo</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteCandidate(p)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      {/* Modal: Create & Edit Parking */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingParking ? `Editar ${editingParking.name}` : 'Nuevo Estacionamiento'}
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: General Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
              <Car className="w-4 h-4" aria-hidden="true" />
              <span>Información General del Garaje</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Nombre del Estacionamiento"
                required
                containerClassName="sm:col-span-2"
                placeholder="Ej: Parkia Centro Premium"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="Dirección"
                required
                placeholder="Av. Corrientes 1000"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />

              <Input
                label="Ciudad"
                required
                placeholder="Buenos Aires"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />

              <Input
                label="Teléfono de Contacto"
                placeholder="+54 11 4321-8899"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <Input
                label="URL de Foto del Garaje"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />

              <Input
                label="Correo del Dueño / Operador (Asignación)"
                type="email"
                containerClassName="sm:col-span-2"
                placeholder="ej: dueno@parkia.com o nuevo@garaje.com"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                leftIcon={<Mail className="w-4 h-4 text-teal-600" />}
                hint="Al guardar, este garaje se asignará a la cuenta de este dueño para su gestión en tablets o móviles."
              />
            </div>
          </div>

          {/* Section 2: Pricing & Capacity */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
              <span>Tarifas y Capacidad</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <Input
                label="Precio / Hora ($)"
                type="number"
                required
                min="0"
                value={formData.price_per_hour}
                onChange={(e) => setFormData({ ...formData, price_per_hour: Number(e.target.value) })}
              />

              <Input
                label="Precio / Estadía Día ($)"
                type="number"
                min="0"
                value={formData.price_per_day}
                onChange={(e) => setFormData({ ...formData, price_per_day: Number(e.target.value) })}
              />

              <Input
                label="Capacidad de Plazas"
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Section 3: Coordinates & Schedule */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>Coordenadas GPS y Horarios</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <Input
                label="Latitud GPS"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
              />

              <Input
                label="Longitud GPS"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
              />

              <Input
                label="Hora Apertura"
                type="time"
                disabled={formData.is_24_hours}
                value={formData.opening_time}
                onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
              />

              <Input
                label="Hora Cierre"
                type="time"
                disabled={formData.is_24_hours}
                value={formData.closing_time}
                onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
              />
            </div>
          </div>

          {/* Section 4: Amenities toggles */}
          <div className="pt-4 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Comodidades, Servicios y Estado
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { key: 'is_24_hours', label: 'Abierto 24 Horas' },
                { key: 'is_covered', label: 'Techo Cubierto' },
                { key: 'has_security', label: 'Seguridad CCTV 24hs' },
                { key: 'has_ev_charging', label: 'Carga Autos Eléctricos' },
                { key: 'has_disabled_access', label: 'Acceso Discapacitados' },
                { key: 'is_active', label: 'Garaje Activo en Red' },
              ].map((item) => (
                <label 
                  key={item.key} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    (formData as any)[item.key]
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!(formData as any)[item.key]}
                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Description */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción Adicional
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Indicaciones para llegar, altura máxima de vehículos, etc."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex-1 font-bold">
              {editingParking ? 'Guardar Cambios' : 'Crear Estacionamiento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <Modal
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          title="Confirmar eliminación"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar <strong>{deleteCandidate.name}</strong>? Se borrarán todos sus espacios asociados y reservas históricas.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteCandidate(null)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1 font-bold">
                Eliminar Definitivamente
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
