import { useEffect, useState, useCallback } from 'react';
import { greenPointsService } from '../services/greenPointsService';
import { GreenPointsBalance, GreenPointsTransaction } from '../types';

export const useGreenPoints = () => {
  const [balance, setBalance] = useState<GreenPointsBalance | null>(null);
  const [transactions, setTransactions] = useState<GreenPointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await greenPointsService.getHistory();
      setBalance(data.balance);
      setTransactions(data.transactions);
    } catch (e: any) {
      console.error('Error al cargar Green Points:', e);
      setError('No se pudo cargar la información de Green Points.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cuántos puntos faltan para el próximo descuento (100 - puntos actuales)
  const pointsNeeded = balance
    ? Math.max(0, balance.nextDiscountThreshold - balance.points)
    : 0;

  // Si ya alcanzó o superó los 100 puntos para tener descuento
  const hasDiscount = balance
    ? balance.points >= balance.nextDiscountThreshold
    : false;

  return {
    balance,
    transactions,
    loading,
    error,
    pointsNeeded,
    hasDiscount,
    refetch: loadData,
  };
};
