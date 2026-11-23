import { api } from './api';
import { GreenPointsSummary, CausesSummary } from '../types';

export const greenPointsService = {
  /**
   * Obtiene el resumen de Green Points del usuario autenticado:
   * saldo, progreso al 10% de descuento, CO2 y km ahorrados, historial y causas.
   */
  async getGreenPointsSummary(): Promise<GreenPointsSummary> {
    return api.get<GreenPointsSummary>('/green-points/');
  },

  /**
   * Obtiene los totales acumulados destinados por Parkia a las dos causas:
   * Ambiente (árboles nativos) e Inclusión (accesibilidad universal).
   */
  async getCausesSummary(): Promise<CausesSummary> {
    return api.get<CausesSummary>('/green-points/causes/');
  },
};
