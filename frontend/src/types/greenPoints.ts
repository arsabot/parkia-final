/**
 * Tipos de TypeScript para el sistema Green Points (Park for Good).
 * 
 * Reglas de negocio:
 * - Cada reserva completada con check-in suma: 10 Green Points, 5 km y 1 kg de CO2.
 * - Al llegar a 100 puntos se obtiene un 10% de descuento en la próxima reserva.
 */

export interface GreenPointsBalance {
  /** Puntos acumulados del usuario */
  points: number;
  /** Kilómetros evitados de dar vueltas (5 km por reserva) */
  kmSaved: number;
  /** CO₂ evitado en kg (1 kg por reserva) */
  co2Saved: number;
  /** Puntos necesarios para el próximo descuento (100) */
  nextDiscountThreshold: number;
  /** Porcentaje de descuento al alcanzar la meta (10%) */
  discountPercentage: number;
}

export interface GreenPointsTransaction {
  /** Identificador de la transacción o reserva */
  id: string | number;
  /** Fecha de la transacción en formato ISO */
  date: string;
  /** Puntos obtenidos (10 en el MVP) */
  pointsEarned: number;
  /** Kilómetros ahorrados (5 km en el MVP) */
  kmEarned: number;
  /** CO₂ ahorrado en kg (1 kg en el MVP) */
  co2EarnedKg: number;
  /** Nombre del estacionamiento (opcional) */
  parkingName?: string;
  /** ID de la reserva asociada (opcional) */
  reservationId?: number;
}

export interface GreenPointsResponse {
  balance: GreenPointsBalance;
  transactions: GreenPointsTransaction[];
}
