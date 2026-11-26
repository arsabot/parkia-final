import { api } from './api';
import {
  GreenPointsBalance,
  GreenPointsResponse,
  GreenPointsTransaction,
} from '../types/greenPoints';

/**
 * Datos de prueba (Mock) basados en las reglas de negocio de Park for Good:
 * - 10 Green Points, 5 km y 1 kg de CO2 por reserva completada.
 * - Descuento del 10% al alcanzar los 100 puntos.
 *
 * En este mock, el usuario tiene 80 puntos acumulados (le faltan 20 para el descuento).
 */
const MOCK_TRANSACTIONS: GreenPointsTransaction[] = [
  {
    id: 1,
    reservationId: 101,
    parkingName: 'Estacionamiento Obelisco Central',
    date: '2026-11-20T10:30:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 2,
    reservationId: 98,
    parkingName: 'Parking Corrientes Plaza',
    date: '2026-11-18T14:15:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 3,
    reservationId: 92,
    parkingName: 'Garage Puerto Madero',
    date: '2026-11-15T09:00:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 4,
    reservationId: 85,
    parkingName: 'Estacionamiento Retiro Sur',
    date: '2026-11-12T16:45:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 5,
    reservationId: 78,
    parkingName: 'Estacionamiento Recoleta Mall',
    date: '2026-11-10T11:20:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 6,
    reservationId: 70,
    parkingName: 'Parking Belgrano R',
    date: '2026-11-06T18:00:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 7,
    reservationId: 64,
    parkingName: 'Estacionamiento Palermo Soho',
    date: '2026-11-02T13:10:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
  {
    id: 8,
    reservationId: 58,
    parkingName: 'Garage Tribunales Norte',
    date: '2026-10-28T08:30:00Z',
    pointsEarned: 10,
    kmEarned: 5,
    co2EarnedKg: 1,
  },
];

const MOCK_BALANCE: GreenPointsBalance = {
  points: 80, // 8 reservas x 10 puntos = 80 puntos
  kmSaved: 40, // 8 reservas x 5 km = 40 km
  co2Saved: 8, // 8 reservas x 1 kg = 8 kg CO2
  nextDiscountThreshold: 100, // Meta para el 10% de descuento
  discountPercentage: 10,
};

/**
 * Servicio para consultar el saldo y el historial de Green Points.
 * 
 * Si el backend real B2 está listo (VITE_GREEN_POINTS_BACKEND_READY='true'),
 * realiza las llamadas a los endpoints '/green-points/balance/' e '/green-points/history/'.
 * En caso contrario o si falla la conexión, usa los datos de prueba (mock).
 */
export const greenPointsService = {
  /**
   * Obtiene el saldo actual de Green Points y el impacto ambiental (CO2 y km).
   */
  async getBalance(): Promise<GreenPointsBalance> {
    const isBackendReady = import.meta.env.VITE_GREEN_POINTS_BACKEND_READY === 'true';

    if (isBackendReady) {
      try {
        return await api.get<GreenPointsBalance>('/green-points/balance/');
      } catch (err) {
        console.warn('Backend B2 no disponible aún, usando datos de prueba para saldo:', err);
        return MOCK_BALANCE;
      }
    }

    // Simula una breve latencia para pruebas de estado 'loading'
    await new Promise((resolve) => setTimeout(resolve, 250));
    return MOCK_BALANCE;
  },

  /**
   * Obtiene el balance y el historial de transacciones de Green Points.
   */
  async getHistory(): Promise<GreenPointsResponse> {
    const isBackendReady = import.meta.env.VITE_GREEN_POINTS_BACKEND_READY === 'true';

    if (isBackendReady) {
      try {
        return await api.get<GreenPointsResponse>('/green-points/history/');
      } catch (err) {
        console.warn('Backend B2 no disponible aún, usando datos de prueba para historial:', err);
        return {
          balance: MOCK_BALANCE,
          transactions: MOCK_TRANSACTIONS,
        };
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      balance: MOCK_BALANCE,
      transactions: MOCK_TRANSACTIONS,
    };
  },
};
