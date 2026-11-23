import { Parking } from '../types';
import { parkingService } from './parkingService';

export interface DriverProfile {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  hasDisabledPermit?: boolean;
  cudNumber?: string;
  favorites?: number[];
  recentBookings?: Array<{ parkingId?: number; parkingName?: string }>;
}

export interface PageContext {
  pathname: string;
  searchQuery?: string;
  currentParkingId?: number;
  currentParkingName?: string;
  lat?: number;
  lng?: number;
}

export type RecommendationPriority =
  | 'smart'
  | 'cheapest'
  | 'security'
  | 'ev'
  | 'accessible'
  | 'top_rated'
  | 'nearest';

export interface ScoredParking {
  parking: Parking;
  score: number;
  matchPercentage: number;
  badge: string;
  reasons: string[];
  highlights: string[];
  isCurrentPage?: boolean;
}

export interface AiRecommendationResult {
  headline: string;
  contextNote: string;
  primary: ScoredParking;
  alternative?: ScoredParking;
  aiExplanation: string;
  suggestedChips: string[];
}

// Catálogo de respaldo con metadata completa en caso de que el backend esté desconectado
const FALLBACK_PARKINGS: Parking[] = [
  {
    id: 1,
    name: 'Parkia Obelisco & Corrientes',
    address: 'Av. Corrientes 1045, San Nicolás',
    city: 'Buenos Aires',
    latitude: -34.6037,
    longitude: -58.3816,
    description: 'Estacionamiento premium subterráneo ubicado a 50m del Obelisco y teatros de calle Corrientes. Vigilancia 24hs.',
    phone: '+54 11 4322-9090',
    price_per_hour: 2400,
    price_per_day: 18000,
    opening_time: '00:00:00',
    closing_time: '23:59:59',
    is_24_hours: true,
    capacity: 35,
    rating: 4.9,
    reviews_count: 128,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: true,
    has_disabled_access: true,
    has_car_wash: true,
    has_valet: true,
    image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    available_spaces: 14,
    total_spaces: 35,
    occupancy_rate: 60,
    is_favorite: false,
  },
  {
    id: 2,
    name: 'Estacionamiento Palermo Soho Hub',
    address: 'Honduras 4820, Palermo',
    city: 'Buenos Aires',
    latitude: -34.5885,
    longitude: -58.4283,
    description: 'Cochera moderna en el corazón gastronómico y de diseño de Palermo Soho. Fácil acceso y plazas amplias.',
    phone: '+54 11 4833-1122',
    price_per_hour: 2200,
    price_per_day: 16500,
    opening_time: '07:00:00',
    closing_time: '01:00:00',
    is_24_hours: false,
    capacity: 25,
    rating: 4.7,
    reviews_count: 94,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: false,
    has_disabled_access: true,
    has_car_wash: false,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
    available_spaces: 8,
    total_spaces: 25,
    occupancy_rate: 68,
    is_favorite: false,
  },
  {
    id: 3,
    name: 'Plaza Las Heras Parking',
    address: 'Av. Las Heras 3150, Recoleta',
    city: 'Buenos Aires',
    latitude: -34.5841,
    longitude: -58.4042,
    description: 'Frente al Parque Las Heras, ideal para residentes, médicos y paseos por Recoleta y Palermo.',
    phone: '+54 11 4801-7788',
    price_per_hour: 1900,
    price_per_day: 14000,
    opening_time: '00:00:00',
    closing_time: '23:59:59',
    is_24_hours: true,
    capacity: 40,
    rating: 4.6,
    reviews_count: 82,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: true,
    has_disabled_access: true,
    has_car_wash: true,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1617886322207-6f504e7470c8?w=800&auto=format&fit=crop&q=80',
    available_spaces: 21,
    total_spaces: 40,
    occupancy_rate: 47,
    is_favorite: false,
  },
  {
    id: 4,
    name: 'Puerto Madero Dique 4 Central',
    address: 'Pierina Dealessi 550, Puerto Madero',
    city: 'Buenos Aires',
    latitude: -34.6019,
    longitude: -58.3653,
    description: 'Seguridad de primer nivel en Dique 4 de Puerto Madero. Espacios para camionetas y autos eléctricos.',
    phone: '+54 11 4314-5500',
    price_per_hour: 2800,
    price_per_day: 22000,
    opening_time: '00:00:00',
    closing_time: '23:59:59',
    is_24_hours: true,
    capacity: 50,
    rating: 4.9,
    reviews_count: 145,
    is_active: true,
    is_covered: true,
    has_security: true,
    has_ev_charging: true,
    has_disabled_access: true,
    has_car_wash: true,
    has_valet: true,
    image_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    available_spaces: 29,
    total_spaces: 50,
    occupancy_rate: 42,
    is_favorite: false,
  },
  {
    id: 5,
    name: 'Belgrano Cabildo Express',
    address: 'Av. Cabildo 2230, Belgrano',
    city: 'Buenos Aires',
    latitude: -34.5615,
    longitude: -58.4566,
    description: 'Cochera a metros del subte D y zona comercial Cabildo y Juramento. Tarifa más baja de la zona.',
    phone: '+54 11 4788-3300',
    price_per_hour: 1700,
    price_per_day: 12500,
    opening_time: '06:00:00',
    closing_time: '00:00:00',
    is_24_hours: false,
    capacity: 30,
    rating: 4.5,
    reviews_count: 67,
    is_active: true,
    is_covered: false,
    has_security: true,
    has_ev_charging: false,
    has_disabled_access: true,
    has_car_wash: false,
    has_valet: false,
    image_url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80',
    available_spaces: 12,
    total_spaces: 30,
    occupancy_rate: 60,
    is_favorite: false,
  },
];

// Cálculo de distancia euclidiana aproximada / Haversine en km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Extrae términos de zona comunes en Buenos Aires
function extractZoneQuery(text: string): string | null {
  const lower = text.toLowerCase();
  const zones = [
    'palermo',
    'obelisco',
    'corrientes',
    'recoleta',
    'puerto madero',
    'belgrano',
    'cabildo',
    'san nicolas',
    'microcentro',
    'caballito',
    'almagro',
    'centro',
  ];
  for (const z of zones) {
    if (lower.includes(z)) return z;
  }
  return null;
}

export const aiRecommendationService = {
  /**
   * Obtiene la lista activa de estacionamientos (API o fallback)
   */
  async getAvailableParkings(): Promise<Parking[]> {
    try {
      const data = await parkingService.getParkings();
      const list = Array.isArray(data) ? data : (data as any)?.results ?? [];
      const active = list.filter((p: Parking) => p.is_active);
      if (active.length > 0) return active;
      return FALLBACK_PARKINGS;
    } catch {
      return FALLBACK_PARKINGS;
    }
  },

  /**
   * Genera una recomendación inteligente con IA basada en:
   * 1. Perfil del conductor (nombre, CUD, favoritos, historial)
   * 2. Contexto de la página (/search, /parking/:id, ubicación, etc.)
   * 3. Prioridad del conductor (económico, seguro, EV, CUD, etc.)
   */
  async getRecommendation(params: {
    driver: DriverProfile;
    pageContext: PageContext;
    priority?: RecommendationPriority;
    userQuery?: string;
  }): Promise<AiRecommendationResult> {
    const { driver, pageContext, priority = 'smart', userQuery = '' } = params;
    const parkings = await this.getAvailableParkings();

    // Detectar si la consulta del usuario indica alguna prioridad específica
    const effectivePriority = this.inferPriority(userQuery, priority, driver);

    // Calcular el precio promedio del catálogo
    const avgPrice =
      parkings.reduce((acc, p) => acc + Number(p.price_per_hour || 2000), 0) /
      (parkings.length || 1);

    // Contexto de ubicación o búsqueda detectada
    const detectedZone =
      extractZoneQuery(userQuery) ||
      (pageContext.searchQuery ? extractZoneQuery(pageContext.searchQuery) : null) ||
      (pageContext.searchQuery?.trim() ? pageContext.searchQuery.trim().toLowerCase() : null);

    // Puntuar cada estacionamiento con el algoritmo multi-criterio de IA
    const scoredList: ScoredParking[] = parkings.map((p) => {
      let score = 50; // Base inicial
      const reasons: string[] = [];
      const highlights: string[] = [];

      // 1. DISPONIBILIDAD Y RIESGO DE OCUPACIÓN
      const avail = p.available_spaces ?? 5;
      const total = p.total_spaces || p.capacity || 20;
      const availPct = total > 0 ? (avail / total) * 100 : 50;

      if (avail === 0) {
        score = 0;
        reasons.push('⚠️ Sin lugares disponibles en este momento.');
      } else if (availPct >= 40) {
        score += 15;
        highlights.push(`${avail} lugares libres`);
        reasons.push(`🚗 <b>Alta disponibilidad</b>: cuenta con <b>${avail} lugares libres</b> (${Math.round(availPct)}% libre), garantizando tu plaza sin demoras.`);
      } else {
        score += 5;
        highlights.push(`${avail} lugares`);
        reasons.push(`⏰ <b>Disponibilidad moderada</b>: quedan ${avail} cocheras.`);
      }

      // 2. PRECIO Y RELACIÓN COSTO-BENEFICIO
      const price = Number(p.price_per_hour || 2000);
      const priceDiff = avgPrice - price;

      if (effectivePriority === 'cheapest') {
        if (price < avgPrice) {
          score += 35;
          const savings = Math.round(((avgPrice - price) / avgPrice) * 100);
          highlights.push(`Ahorro ${savings}%`);
          reasons.push(`💰 <b>Tarifa más accesible</b>: $${price.toLocaleString('es-AR')}/h (un <b>${savings}% más bajo</b> que el promedio de la zona).`);
        } else {
          score -= 10;
        }
      } else {
        if (price <= avgPrice) {
          score += 10;
          highlights.push(`$${price}/h`);
          reasons.push(`💵 <b>Excelente precio</b>: $${price.toLocaleString('es-AR')}/h por hora.`);
        } else {
          highlights.push(`$${price}/h`);
        }
      }

      // 3. CALIFICACIÓN Y OPINIONES
      const rating = Number(p.rating || 4.5);
      score += (rating - 4.0) * 15;
      if (rating >= 4.7) {
        highlights.push(`${rating}★`);
        reasons.push(`⭐ <b>Altamente valorado</b> por la comunidad (${rating}★ con ${p.reviews_count || 10}+ opiniones verificadas).`);
      }
      if (effectivePriority === 'top_rated' && rating >= 4.8) {
        score += 25;
      }

      // 4. TECHADO Y SEGURIDAD
      if (p.is_covered) {
        score += 8;
        highlights.push('Techado');
      }
      if (p.has_security) {
        score += 8;
        highlights.push('Seguridad 24h');
      }
      if (effectivePriority === 'security') {
        if (p.is_covered && p.has_security) {
          score += 30;
          reasons.push('🛡️ <b>Máxima protección</b>: cochera cubierta con circuito cerrado y vigilancia permanente.');
        } else {
          score -= 15;
        }
      } else if (p.is_covered && p.has_security) {
        reasons.push('🛡️ Cochera techada y vigilada 24hs para total tranquilidad.');
      }

      // 5. CARGA ELÉCTRICA (EV)
      if (p.has_ev_charging) {
        score += 6;
        highlights.push('Carga EV ⚡');
        if (effectivePriority === 'ev') {
          score += 40;
          reasons.push('⚡ <b>Cargador eléctrico activo</b>: terminales disponibles para vehículos híbridos y eléctricos.');
        }
      } else if (effectivePriority === 'ev') {
        score -= 40;
      }

      // 6. PERSONALIZACIÓN CONDUCTOR: ACCESIBILIDAD (CUD)
      if (driver.hasDisabledPermit || effectivePriority === 'accessible') {
        if (p.has_disabled_access) {
          score += 35;
          highlights.push('Accesible CUD ♿');
          reasons.push('♿ <b>Acceso adaptado y plazas CUD</b>: cuenta con rampas y cocheras reservadas prioritarias.');
        } else {
          score -= 45;
        }
      } else if (p.has_disabled_access) {
        highlights.push('Acceso CUD');
      }

      // 7. PERSONALIZACIÓN CONDUCTOR: FAVORITOS E HISTORIAL
      if (driver.favorites?.includes(p.id) || p.is_favorite) {
        score += 20;
        highlights.push('En tus favoritos ❤️');
        reasons.push('❤️ <b>Garage en tus Favoritos</b>: ya guardado previamente en tu lista personal.');
      }
      if (driver.recentBookings?.some((b) => b.parkingId === p.id)) {
        score += 15;
        reasons.push('🔄 Ya reservaste aquí con éxito anteriormente.');
      }

      // 8. CONTEXTO DE PÁGINA: BÚSQUEDA O COORDENADAS
      if (detectedZone) {
        const matchZone =
          p.name.toLowerCase().includes(detectedZone) ||
          p.address.toLowerCase().includes(detectedZone) ||
          p.city.toLowerCase().includes(detectedZone) ||
          p.description.toLowerCase().includes(detectedZone);
        if (matchZone) {
          score += 35;
          reasons.unshift(`📍 <b>Ubicación ideal</b>: ubicado directamente en la zona de <b>${detectedZone.toUpperCase()}</b>.`);
        } else {
          score -= 10;
        }
      }

      // Distancia si hay lat/lng
      if (pageContext.lat && pageContext.lng && p.latitude && p.longitude) {
        const dist = calculateDistance(pageContext.lat, pageContext.lng, p.latitude, p.longitude);
        p.distance_km = dist;
        if (dist <= 1.5) {
          score += 30;
          reasons.unshift(`📍 A solo <b>${dist} km</b> de tu posición actual.`);
          highlights.push(`${dist} km`);
        } else if (dist <= 3.5) {
          score += 15;
          highlights.push(`${dist} km`);
        }
      }

      // 9. CONTEXTO DE PÁGINA: ¿ESTÁ VIENDO ESTE ESTACIONAMIENTO AHORA MISMO?
      const isCurrent = pageContext.currentParkingId === p.id;
      if (isCurrent) {
        score += 10; // ligero bono para evaluar el actual
      }

      // Calcular match % normalizado entre 78% y 99%
      const boundedScore = Math.max(10, Math.min(100, score));
      const matchPercentage = Math.round(75 + (boundedScore / 100) * 24);

      // Badge según mérito principal
      let badge = `${matchPercentage}% Match · Recomendado`;
      if (effectivePriority === 'cheapest' && price < avgPrice) {
        badge = `💰 Mejor Precio · ${matchPercentage}% Match`;
      } else if (effectivePriority === 'security') {
        badge = `🛡️ Máxima Seguridad · ${matchPercentage}% Match`;
      } else if (effectivePriority === 'ev') {
        badge = `⚡ Especial EV · ${matchPercentage}% Match`;
      } else if (effectivePriority === 'accessible' || driver.hasDisabledPermit) {
        badge = `♿ Adaptado CUD · ${matchPercentage}% Match`;
      } else if (rating >= 4.8) {
        badge = `⭐ Top Calidad · ${matchPercentage}% Match`;
      }

      return {
        parking: p,
        score: boundedScore,
        matchPercentage,
        badge,
        reasons: reasons.slice(0, 3), // Top 3 razones más relevantes
        highlights: Array.from(new Set(highlights)).slice(0, 4),
        isCurrentPage: isCurrent,
      };
    });

    // Ordenar de mayor a menor puntuación
    scoredList.sort((a, b) => b.score - a.score);

    const primary = scoredList[0] || scoredList.find((s) => s.parking.is_active);
    const alternative = scoredList.find((s) => s.parking.id !== primary?.parking.id);

    // Síntesis de contexto y saludo personalizado
    const driverName = driver.name ? driver.name.split(' ')[0] : 'Conductor';
    const contextNote = this.buildContextNote(pageContext, driver, detectedZone);

    // Intentar consulta con Gemini si hay API key configurada, o usar el generador inteligente local
    const aiExplanation = await this.generateAiExplanation({
      driver,
      pageContext,
      primary,
      detectedZone,
      userQuery,
    });

    const headline = `🎯 Recomendación personalizada para ${driverName}`;

    return {
      headline,
      contextNote,
      primary,
      alternative,
      aiExplanation,
      suggestedChips: [
        'Reservar recomendado',
        '💰 Más económico',
        '🛡️ Techado y seguro',
        '⚡ Con carga EV',
        '♿ Accesible CUD',
        'Menú',
      ],
    };
  },

  /**
   * Deduce la prioridad según la consulta del usuario o contexto
   */
  inferPriority(query: string, explicit: RecommendationPriority, driver: DriverProfile): RecommendationPriority {
    if (explicit !== 'smart') return explicit;
    const q = query.toLowerCase();
    if (/(barat|econom|preci|cuant|menos plata|ahorr)/.test(q)) return 'cheapest';
    if (/(techad|segur|cuid|camioneta|cubiert|camara)/.test(q)) return 'security';
    if (/(electric|cargador|ev|hibrid)/.test(q)) return 'ev';
    if (/(discapac|cud|accesib|rampa|silla)/.test(q) || driver.hasDisabledPermit) return 'accessible';
    if (/(mejor|calific|puntaj|estrell|opin)/.test(q)) return 'top_rated';
    if (/(cerc|cerca|ubicacion|mapa)/.test(q)) return 'nearest';
    return 'smart';
  },

  /**
   * Construye una nota contextual visible sobre la página y el conductor
   */
  buildContextNote(pageContext: PageContext, driver: DriverProfile, detectedZone: string | null): string {
    const parts: string[] = [];

    if (pageContext.pathname.startsWith('/parking/') && pageContext.currentParkingName) {
      parts.push(`Estás viendo <b>${pageContext.currentParkingName}</b>`);
    } else if (detectedZone) {
      parts.push(`Zona detectada: <b>${detectedZone.toUpperCase()}</b>`);
    } else if (pageContext.pathname === '/search') {
      parts.push(`Explorando resultados de búsqueda`);
    } else if (pageContext.pathname === '/favorites') {
      parts.push(`Consultando tus estacionamientos favoritos`);
    }

    if (driver.hasDisabledPermit) {
      parts.push(`Prioridad CUD activa ♿`);
    }

    return parts.length ? parts.join(' · ') : 'Contexto en tiempo real de PARKIA';
  },

  /**
   * Genera el razonamiento conversacional de IA.
   * Si VITE_GEMINI_API_KEY está configurada, utiliza la API de Google Gemini.
   * De lo contrario, utiliza el motor de síntesis local contextual de ParkIA.
   */
  async generateAiExplanation(params: {
    driver: DriverProfile;
    pageContext: PageContext;
    primary?: ScoredParking;
    detectedZone: string | null;
    userQuery: string;
  }): Promise<string> {
    const { driver, pageContext, primary, detectedZone, userQuery } = params;
    if (!primary) {
      return 'No encontramos un estacionamiento que coincida con esos criterios en este momento.';
    }

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (geminiKey && userQuery.trim().length > 3) {
      try {
        const prompt = `Actúa como ParkIA, el asistente de inteligencia artificial del conductor en PARKIA (Argentina).
El usuario pregunta: "${userQuery}".
Contexto del conductor: Nombre: ${driver.name || 'Conductor'}, CUD: ${driver.hasDisabledPermit ? 'Sí' : 'No'}.
Página actual: ${pageContext.pathname}.
Estacionamiento recomendado por el algoritmo:
- Nombre: ${primary.parking.name}
- Dirección: ${primary.parking.address}
- Precio: $${primary.parking.price_per_hour}/h
- Lugares libres: ${primary.parking.available_spaces} de ${primary.parking.total_spaces}
- Techado: ${primary.parking.is_covered ? 'Sí' : 'No'}
- Carga EV: ${primary.parking.has_ev_charging ? 'Sí' : 'No'}
- Accesible CUD: ${primary.parking.has_disabled_access ? 'Sí' : 'No'}
- Calificación: ${primary.parking.rating} estrellas

Escribe un mensaje conciso (máximo 3 párrafos cortos, tono rioplatense cálido y profesional) explicándole al conductor por qué este garage es su mejor opción hoy teniendo en cuenta su contexto.`;

        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 250, temperature: 0.4 },
            }),
          }
        );

        if (resp.ok) {
          const data = await resp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text.replace(/\n\n/g, '<br><br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
          }
        }
      } catch (err) {
        console.warn('Gemini API fallback to local reasoning engine:', err);
      }
    }

    // Motor de síntesis determinístico local de ParkIA
    const p = primary.parking;
    const name = driver.name ? driver.name.split(' ')[0] : 'Conductor';
    const zoneText = detectedZone ? ` en <b>${detectedZone}</b>` : '';
    const isViewingThis = pageContext.currentParkingId === p.id;

    if (isViewingThis) {
      return `¡Hola <b>${name}</b>! Analicé el garage que estás mirando en pantalla: <b>${p.name}</b> es una excelente alternativa para tu estadía. Tiene <b>${p.available_spaces} plazas libres</b> en este instante y una tarifa de <b>$${Number(p.price_per_hour).toLocaleString('es-AR')}/h</b>.`;
    }

    return `¡Hola <b>${name}</b>! Evalué en tiempo real la disponibilidad, tarifas y seguridad${zoneText}. La opción óptima para tu perfil es <b>${p.name}</b>: cuenta con <b>${primary.matchPercentage}% de compatibilidad</b> y tiene <b>${p.available_spaces} cocheras disponibles</b> ahora mismo.`;
  },
};
