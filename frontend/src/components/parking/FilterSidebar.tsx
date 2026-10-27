import React from 'react';
import { SlidersHorizontal, RotateCcw, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { SearchFilters } from '../../types';
import { Select } from '../common/Select';

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  className?: string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  className = '',
}) => {
  const handleToggle = (key: keyof SearchFilters) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange({
      ...filters,
      max_price: val > 0 ? val : undefined,
    });
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onChange({
      ...filters,
      max_distance: val > 0 ? val : undefined,
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...filters,
      sort_by: e.target.value as any,
    });
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-brand-600" aria-hidden="true" />
          <h3 className="font-extrabold text-navy-900 text-base">Filtros y Orden</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
          aria-label="Restablecer todos los filtros"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Limpiar
        </button>
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <Select
          label="Ordenar por"
          value={filters.sort_by || 'recommended'}
          onChange={handleSortChange}
          options={[
            { value: 'recommended', label: 'Recomendados' },
            { value: 'closest', label: 'Más cercano' },
            { value: 'price_asc', label: 'Menor precio' },
            { value: 'price_desc', label: 'Mayor precio' },
            { value: 'rating_desc', label: 'Mejor valoración' },
          ]}
        />

        {/* Max Price Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-brand-600" />
              Precio máx. por hora
            </label>
            <span className="text-sm font-black text-brand-600">
              {filters.max_price ? `$${filters.max_price}` : 'Cualquiera'}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="4000"
            step="100"
            value={filters.max_price || 4000}
            onChange={handlePriceChange}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
            <span>$1.000</span>
            <span>$2.500</span>
            <span>$4.000+</span>
          </div>
        </div>

        {/* Max Distance Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              Radio de distancia
            </label>
            <span className="text-sm font-black text-brand-600">
              {filters.max_distance ? `${filters.max_distance} km` : 'Sin límite'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={filters.max_distance || 20}
            onChange={handleDistanceChange}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
            <span>1 km</span>
            <span>10 km</span>
            <span>20 km</span>
          </div>
        </div>

        {/* Amenities Checkboxes */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Servicios e Instalaciones
          </label>
          <div className="space-y-2.5">
            {[
              { key: 'is_covered' as const, label: 'Techado / Cubierto' },
              { key: 'has_security' as const, label: 'Seguridad / CCTV 24hs' },
              { key: 'has_ev_charging' as const, label: 'Cargador de Autos Eléctricos' },
              { key: 'has_disabled_access' as const, label: 'Accesibilidad reducida' },
              { key: 'is_24_hours' as const, label: 'Abierto 24 Horas' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer select-none hover:text-slate-900 group"
              >
                <input
                  type="checkbox"
                  checked={!!filters[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 transition-all rounded-md"
                />
                <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
