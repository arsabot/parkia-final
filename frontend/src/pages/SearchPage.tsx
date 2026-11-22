import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  SlidersHorizontal, 
  Map as MapIcon, 
  List, 
  Frown 
} from 'lucide-react';
import { Parking, SearchFilters } from '../types';
import { parkingService } from '../services/parkingService';
import { LeafletMap } from '../components/map/LeafletMap';
import { ParkingCard } from '../components/parking/ParkingCard';
import { FilterSidebar } from '../components/parking/FilterSidebar';
import { ParkingCardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { BookingModal } from '../components/reservations/BookingModal';
import { Pagination } from '../components/common/Pagination';
import { useTheme } from '../context/ThemeContext';
import '../styles/search-page.css';

const SEARCH_TYPEWRITER_PHRASES = [
  '¿A dónde vas?',
  'Av. Corrientes 1200',
  'Obelisco',
  'Palermo Soho',
  'Estadio Monumental',
  'Aeroparque',
];
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark } = useTheme();

  // URL state
  const initialSearch = searchParams.get('q') || '';
  const initialLat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined;
  const initialLng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined;

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [animatedSearch, setAnimatedSearch] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION_QUERY).matches
      ? SEARCH_TYPEWRITER_PHRASES[0]
      : ''
  );
  const typingPaused = useRef(Boolean(initialSearch));
  const [selectedParkingId, setSelectedParkingId] = useState<number | null>(null);
  const [activeBookingParking, setActiveBookingParking] = useState<Parking | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Pagination state (5, 10 o 15 para evitar scroll infinito)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // View mode for mobile (list or map)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    search: initialSearch,
    lat: initialLat,
    lng: initialLng,
    sort_by: 'recommended',
    max_price: undefined,
    max_distance: undefined,
    is_covered: undefined,
    has_security: undefined,
    has_ev_charging: undefined,
    has_disabled_access: undefined,
    is_24_hours: undefined,
  });

  const loadParkings = async () => {
    try {
      setLoading(true);
      const data = await parkingService.getParkings(filters);
      setParkings(data);
    } catch (err) {
      console.error('Error al cargar estacionamientos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParkings();
    setCurrentPage(1);
  }, [filters]);

  const paginatedParkings = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return parkings.slice(startIndex, startIndex + pageSize);
  }, [parkings, currentPage, pageSize]);

  const handleSelectParking = (p: Parking) => {
    setSelectedParkingId(p.id);
    const index = parkings.findIndex((item) => item.id === p.id);
    if (index !== -1) {
      const targetPage = Math.floor(index / pageSize) + 1;
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);
      }
    }
  };

  useEffect(() => {
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timer = 0;

    const typeNextCharacter = () => {
      if (typingPaused.current) {
        timer = window.setTimeout(typeNextCharacter, 100);
        return;
      }

      const phrase = SEARCH_TYPEWRITER_PHRASES[phraseIndex];
      let delay = deleting ? 35 : 75;

      if (!deleting) {
        characterIndex += 1;
        if (characterIndex >= phrase.length) {
          characterIndex = phrase.length;
          deleting = true;
          delay = 1500;
        }
      } else {
        characterIndex -= 1;
        if (characterIndex <= 0) {
          characterIndex = 0;
          deleting = false;
          phraseIndex = (phraseIndex + 1) % SEARCH_TYPEWRITER_PHRASES.length;
          delay = 350;
        }
      }

      setAnimatedSearch(phrase.slice(0, characterIndex));
      timer = window.setTimeout(typeNextCharacter, delay);
    };

    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      return;
    }

    timer = window.setTimeout(typeNextCharacter, 900);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchTerm.trim() }));
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          setFilters((prev) => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            sort_by: 'closest',
          }));
        },
        () => {
          setIsLocating(false);
          // Fallback to Buenos Aires center
          setFilters((prev) => ({
            ...prev,
            lat: -34.6037,
            lng: -58.3816,
            sort_by: 'closest',
          }));
        }
      );
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    typingPaused.current = false;
    setFilters({
      search: '',
      sort_by: 'recommended',
    });
  };

  const userCoords = useMemo(() => {
    if (filters.lat && filters.lng) {
      return { lat: filters.lat, lng: filters.lng };
    }
    return null;
  }, [filters.lat, filters.lng]);
  return (
    <div className="pk-search-page min-h-[calc(100vh-5rem)] flex flex-col transition-colors">
      <div className="pk-search-page__stars" aria-hidden="true" />
      
      {/* Top Search Bar & Controls */}
      <div className="pk-search-toolbar bg-white dark:bg-parkia-navy sticky top-16 sm:top-20 z-30 py-3.5">
        <div className="max-w-7xl xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="pk-search-hero-form">
            <label className="pk-search-hero-label" htmlFor="parking-destination">
              <MapPin className="pk-search-hero-pin" aria-hidden="true" />
              <span className="pk-search-hero-input-wrap">
                <input
                  id="parking-destination"
                  type="text"
                  value={searchTerm}
                  autoComplete="off"
                  aria-label="¿A dónde vas?"
                  onFocus={() => {
                    typingPaused.current = true;
                    setAnimatedSearch('');
                  }}
                  onBlur={() => {
                    typingPaused.current = searchTerm.length > 0;
                  }}
                  onChange={(event) => {
                    typingPaused.current = true;
                    setAnimatedSearch('');
                    setSearchTerm(event.target.value);
                  }}
                  className="pk-search-hero-input"
                />
                {!searchTerm && (
                  <span className="pk-search-hero-typing" aria-hidden="true">
                    {animatedSearch}
                    <span className="pk-search-hero-caret" />
                  </span>
                )}
              </span>
              <button
                type="button"
                className="pk-search-hero-geo"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                title="Usar mi ubicación actual"
                aria-label="Usar mi ubicación actual"
              >
                <Navigation className={isLocating ? 'pk-search-hero-geo-spin' : ''} aria-hidden="true" />
                <span>Cerca de mí</span>
              </button>
            </label>
            <button type="submit" className="pk-search-hero-submit">
              Buscar estacionamiento
            </button>
          </form>

          {/* Controls: Filter modal toggle + Mobile view switch */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-parkia-line-dark bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-expanded={mobileFilterOpen}
              aria-label="Abrir filtros de búsqueda"
            >
              <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <span>Filtros</span>
            </button>

            {/* Mobile View Switcher (List vs Map) */}
            <div className="lg:hidden flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" role="group" aria-label="Vista de resultados">
              <button
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list' || viewMode === 'split'}
                className={`flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  viewMode === 'list' || viewMode === 'split' ? 'bg-white dark:bg-slate-700 text-navy-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Lista</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                aria-pressed={viewMode === 'map'}
                className={`flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  viewMode === 'map' ? 'bg-white dark:bg-slate-700 text-navy-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Mapa</span>
              </button>
            </div>

            <div className="hidden lg:block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Mostrando <strong className="pk-search-result-count text-navy-900 dark:text-white font-extrabold">{parkings.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, parkings.length)}</strong> de <strong className="pk-search-result-count text-navy-900 dark:text-white font-extrabold">{parkings.length}</strong> cocheras
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="pk-search-page__content max-w-7xl xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        
        {/* Mobile Filter Drawer */}
        {mobileFilterOpen && (
          <div className="lg:hidden mb-6 animate-fade-in">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              className="pk-search-filter"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Desktop Left Column: Filters Sidebar (3 cols) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-40 space-y-4">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={handleResetFilters}
                className="pk-search-filter"
              />
            </div>
          </div>

          {/* Center Column: Results List (6 cols on 2xl, 5 on xl, or 8 cols without map) */}
          <div
            className={`pk-search-results space-y-4 min-w-0 ${
              viewMode === 'map' ? 'hidden lg:block' : 'block'
            } lg:col-span-8 xl:col-span-5 2xl:col-span-5`}
          >
            {loading ? (
              <>
                <ParkingCardSkeleton />
                <ParkingCardSkeleton />
                <ParkingCardSkeleton />
              </>
            ) : parkings.length === 0 ? (
              <EmptyState
                icon={<Frown className="w-8 h-8" />}
                title="No encontramos estacionamientos"
                description="Intenta ajustar los filtros de precio o distancia, o busca por otra dirección."
                actionText="Restablecer filtros"
                onAction={handleResetFilters}
                className="pk-search-empty-state"
              />
            ) : (
              <>
                {paginatedParkings.map((p) => (
                  <ParkingCard
                    key={p.id}
                    parking={p}
                    isSelected={p.id === selectedParkingId}
                    onHover={(id) => setSelectedParkingId(id)}
                    onQuickBook={(parking) => setActiveBookingParking(parking)}
                  />
                ))}

                <div className="pt-2 pb-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={parkings.length}
                    pageSize={pageSize}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 80, behavior: 'smooth' });
                    }}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    pageSizeOptions={[5, 10, 15]}
                    itemLabel="cocheras"
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column: Sticky Interactive Leaflet Map (4 cols on xl) */}
          <div
            className={`pk-search-map h-[450px] lg:h-[calc(100vh-14rem)] sticky top-36 ${
              viewMode === 'list' ? 'hidden lg:block' : 'block'
            } lg:col-span-8 xl:col-span-4 2xl:col-span-4 lg:hidden xl:block`}
          >
            <LeafletMap
              parkings={parkings}
              selectedParkingId={selectedParkingId}
              onSelectParking={handleSelectParking}
              userCoords={userCoords}
              zoom={12}
              darkTiles={isDark}
            />
          </div>

        </div>
      </div>

      {/* Booking Modal Instance */}
      {activeBookingParking && (
        <BookingModal
          isOpen={!!activeBookingParking}
          onClose={() => setActiveBookingParking(null)}
          parking={activeBookingParking}
        />
      )}

    </div>
  );
};
