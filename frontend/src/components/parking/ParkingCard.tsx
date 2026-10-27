import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Heart, 
  ArrowRight, 
  Car, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Parking } from '../../types';
import { useFavorites } from '../../context/FavoritesContext';
import { RatingStars } from './RatingStars';
import { AmenityBadge } from './AmenityBadge';
import { Button } from '../common/Button';

interface ParkingCardProps {
  parking: Parking;
  isSelected?: boolean;
  onHover?: (parkingId: number | null) => void;
  onQuickBook?: (parking: Parking) => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  parking,
  isSelected = false,
  onHover,
  onQuickBook,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(parking.id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isHighOccupancy = parking.available_spaces <= 3 && parking.available_spaces > 0;
  const isFull = parking.available_spaces === 0;

  return (
    <div
      onMouseEnter={() => onHover && onHover(parking.id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`group relative bg-white rounded-3xl border transition-all duration-300 p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-xl ${
        isSelected
          ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-brand-500/10'
          : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      {/* Image & Badges */}
      <div className="relative w-full sm:w-44 md:w-48 lg:w-44 xl:w-48 2xl:w-52 h-44 sm:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-100">
        <img
          src={parking.image_url || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=500'}
          alt={parking.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(parking.id);
          }}
          className="absolute top-3 right-3 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md text-slate-700 hover:text-rose-500 shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          aria-label={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
          title={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
        >
          <Heart
            className={`w-4.5 h-4.5 transition-colors ${
              favorited ? 'fill-rose-500 text-rose-500' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* 24 Hours / Hours Badge */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-navy-950/85 backdrop-blur-md text-white border border-white/20">
            <Clock className="w-3.5 h-3.5 text-brand-300" aria-hidden="true" />
            {parking.is_24_hours
              ? 'Abierto 24hs'
              : `${parking.opening_time ? parking.opening_time.slice(0, 5) : '08:00'} - ${parking.closing_time ? parking.closing_time.slice(0, 5) : '22:00'}`}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Top meta: Location & Distance */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{parking.city}</span>
            </div>
            {parking.distance_km !== undefined && (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                a {parking.distance_km} km
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/parking/${parking.id}`} className="block">
            <h3 className="text-lg font-extrabold text-navy-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1">
              {parking.name}
            </h3>
          </Link>

          <p className="text-xs text-slate-600 line-clamp-1 mb-3 font-medium">{parking.address}</p>

          {/* Rating */}
          <div className="mb-3">
            <RatingStars rating={parking.rating} reviewsCount={parking.reviews_count} size="sm" />
          </div>

          {/* Amenities tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {parking.is_covered && <AmenityBadge type="covered" />}
            {parking.has_security && <AmenityBadge type="security" />}
            {parking.has_ev_charging && <AmenityBadge type="ev" />}
            {parking.has_disabled_access && <AmenityBadge type="disabled" />}
            {parking.has_car_wash && <AmenityBadge type="wash" />}
          </div>
        </div>

        {/* Bottom bar: Pricing, Availability and CTA */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tarifa por hora</span>
              <span
                className={`text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap ${
                  isFull
                    ? 'text-rose-600'
                    : isHighOccupancy
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {isFull ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Completo
                  </>
                ) : isHighOccupancy ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> ¡Últimos {parking.available_spaces}!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {parking.available_spaces} libres
                  </>
                )}
              </span>
            </div>
            <span className="text-xl font-black text-navy-900 block leading-tight">
              {formatCurrency(parking.price_per_hour)}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to={`/parking/${parking.id}`} className="shrink-0">
              <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs whitespace-nowrap">
                Ver detalle
              </Button>
            </Link>
            {onQuickBook && !isFull && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onQuickBook(parking)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="px-3.5 py-1.5 text-xs shrink-0 whitespace-nowrap"
              >
                Reservar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
