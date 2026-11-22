import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronDown,
  DollarSign,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { SearchFilters } from '../../types';

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
  className?: string;
}

type SortValue = NonNullable<SearchFilters['sort_by']>;

const SORT_OPTIONS: {
  value: SortValue;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { value: 'recommended', label: 'Recomendados', description: 'Mejores opciones para vos', icon: BadgeCheck },
  { value: 'closest', label: 'Más cercano', description: 'Primero los que están cerca', icon: MapPin },
  { value: 'price_asc', label: 'Menor precio', description: 'De menor a mayor por hora', icon: ArrowDown },
  { value: 'price_desc', label: 'Mayor precio', description: 'De mayor a menor por hora', icon: ArrowUp },
  { value: 'rating_desc', label: 'Mejor valoración', description: 'Los mejor calificados primero', icon: Star },
];

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onChange,
  onReset,
  className = '',
}) => {
  const [sortOpen, setSortOpen] = useState(false);
  const [activeSortIndex, setActiveSortIndex] = useState(0);
  const sortMenuId = useId();
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const sortOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedSortValue = filters.sort_by || 'recommended';
  const selectedSortIndex = Math.max(
    0,
    SORT_OPTIONS.findIndex((option) => option.value === selectedSortValue)
  );
  const selectedSort = SORT_OPTIONS[selectedSortIndex];

  useEffect(() => {
    if (sortOpen) {
      sortOptionRefs.current[activeSortIndex]?.focus();
    }
  }, [sortOpen, activeSortIndex]);

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

  const handleSortChange = (sortBy: SortValue) => {
    onChange({
      ...filters,
      sort_by: sortBy,
    });
    setSortOpen(false);
    sortTriggerRef.current?.focus();
  };

  const handleSortTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSortIndex(selectedSortIndex);
      setSortOpen(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveSortIndex(selectedSortIndex);
      setSortOpen((open) => !open);
    } else if (event.key === 'Escape' && sortOpen) {
      event.preventDefault();
      setSortOpen(false);
    }
  };

  const handleSortOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowDown') {
      nextIndex = (index + 1) % SORT_OPTIONS.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (index - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SORT_OPTIONS.length - 1;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setSortOpen(false);
      sortTriggerRef.current?.focus();
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      setActiveSortIndex(nextIndex);
      sortOptionRefs.current[nextIndex]?.focus();
    }
  };

  const handleSortBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setSortOpen(false);
    }
  };

  const priceSliderValue = filters.max_price || 4000;
  const distanceSliderValue = filters.max_distance || 20;
  const getSliderProgress = (value: number, min: number, max: number) =>
    `${((value - min) / (max - min)) * 100}%`;

  return (
    <div className={`bg-white dark:bg-parkia-card-dark rounded-3xl border border-slate-100 dark:border-parkia-line-dark p-6 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-parkia-line-dark mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="pk-search-filter-icon w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <h3 className="font-extrabold text-navy-900 dark:text-white text-base">Filtros y Orden</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
          aria-label="Restablecer todos los filtros"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Limpiar
        </button>
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <div className="pk-search-sort" onBlur={handleSortBlur}>
          <label
            id={`${sortMenuId}-label`}
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide mb-1.5"
          >
            Ordenar por
          </label>
          <div className="relative">
            <button
              ref={sortTriggerRef}
              type="button"
              className="pk-search-sort-trigger"
              aria-labelledby={`${sortMenuId}-label`}
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              aria-controls={sortMenuId}
              onClick={() => {
                setActiveSortIndex(selectedSortIndex);
                setSortOpen((open) => !open);
              }}
              onKeyDown={handleSortTriggerKeyDown}
            >
              <span className="pk-search-sort-current">
                <selectedSort.icon className="pk-search-sort-option-icon" aria-hidden="true" />
                <span>{selectedSort.label}</span>
              </span>
              <ChevronDown
                className={`pk-search-sort-chevron ${sortOpen ? 'is-open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {sortOpen && (
              <div
                id={sortMenuId}
                className="pk-search-sort-menu"
                role="listbox"
                aria-labelledby={`${sortMenuId}-label`}
              >
                {SORT_OPTIONS.map((option, index) => {
                  const OptionIcon = option.icon;
                  const isSelected = option.value === selectedSortValue;

                  return (
                    <button
                      key={option.value}
                      ref={(element) => {
                        sortOptionRefs.current[index] = element;
                      }}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className="pk-search-sort-option"
                      onClick={() => handleSortChange(option.value)}
                      onKeyDown={(event) => handleSortOptionKeyDown(event, index)}
                    >
                      <span className="pk-search-sort-option-icon-wrap">
                        <OptionIcon className="pk-search-sort-option-icon" aria-hidden="true" />
                      </span>
                      <span className="pk-search-sort-option-copy">
                        <span className="pk-search-sort-option-label">{option.label}</span>
                        <span className="pk-search-sort-option-description">{option.description}</span>
                      </span>
                      {isSelected && <Check className="pk-search-sort-option-check" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Max Price Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="pk-search-filter-icon w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Precio máx. por hora
            </label>
            <span className="pk-search-filter-value text-sm font-black text-brand-600 dark:text-brand-400">
              {filters.max_price ? `$${filters.max_price}` : 'Cualquiera'}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="4000"
            step="100"
            value={priceSliderValue}
            onChange={handlePriceChange}
            style={{ '--range-progress': getSliderProgress(priceSliderValue, 1000, 4000) } as React.CSSProperties}
            className="pk-search-filter-range w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="pk-search-filter-icon w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Radio de distancia
            </label>
            <span className="pk-search-filter-value text-sm font-black text-brand-600 dark:text-brand-400">
              {filters.max_distance ? `${filters.max_distance} km` : 'Sin límite'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={distanceSliderValue}
            onChange={handleDistanceChange}
            style={{ '--range-progress': getSliderProgress(distanceSliderValue, 1, 20) } as React.CSSProperties}
            className="pk-search-filter-range w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
            <span>1 km</span>
            <span>10 km</span>
            <span>20 km</span>
          </div>
        </div>

        {/* Amenities Checkboxes */}
        <div className="pk-search-filter-section pt-2 border-t border-slate-100 dark:border-parkia-line-dark">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
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
                className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white group"
              >
                <input
                  type="checkbox"
                  checked={!!filters[item.key]}
                  onChange={() => handleToggle(item.key)}
                  className="pk-search-filter-checkbox w-4 h-4 rounded text-brand-600 border-slate-300 dark:border-slate-600 focus:ring-brand-500 transition-all rounded-md"
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
