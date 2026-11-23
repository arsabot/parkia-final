import { api } from './api';
import { Reservation, ReservationStatus, LockAcquireResult, GreenPointsAvailabilityInfo } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { supabaseReservations } from './supabaseService';

export const reservationService = {
  async getReservations(params?: { status?: string; parking_id?: number; search?: string }): Promise<Reservation[]> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.getReservations(params);
    }
    return api.get<Reservation[]>('/reservations/', params);
  },

  async getReservationById(id: number | string): Promise<Reservation> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.getReservationById(id);
    }
    return api.get<Reservation>(`/reservations/${id}/`);
  },

  async createReservation(data: {
    parking: number;
    space?: number;
    vehicle_plate: string;
    vehicle_model?: string;
    date: string;
    start_time: string;
    end_time: string;
    payment_method?: string;
    payment_status?: 'pending' | 'paid' | 'refunded';
    status?: ReservationStatus;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.createReservation(data);
    }
    return api.post<{ message: string; reservation: Reservation }>('/reservations/', data);
  },

  async cancelReservation(id: number, reason?: string): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.cancelReservation(id, reason);
    }
    return api.patch<{ message: string; reservation: Reservation }>(`/reservations/${id}/cancel/`, { reason });
  },

  async updatePayment(id: number | string, payment_method: string, payment_status: 'paid' | 'pending' = 'paid'): Promise<Reservation> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.updatePayment(id, payment_method, payment_status);
    }
    const res = await api.patch<{ message: string; reservation: Reservation }>(`/reservations/${id}/`, {
      payment_method,
      payment_status,
      status: 'confirmed',
    });
    return res.reservation;
  },

  async changeStatus(id: number, status: ReservationStatus): Promise<{ message: string; reservation: Reservation }> {
    return api.patch<{ message: string; reservation: Reservation }>(`/reservations/${id}/change_status/`, { status });
  },

  async checkAvailability(params: {
    parking_id: number;
    date: string;
    start_time: string;
    end_time: string;
    session_id?: string;
    user_id?: number;
  }): Promise<{
    parking_id: number;
    total_spaces: number;
    available_spaces_count: number;
    has_availability: boolean;
    duration_hours: number;
    estimated_price: number;
    green_points?: GreenPointsAvailabilityInfo;
    spaces: Array<{
      id: number;
      code: string;
      floor: string;
      space_type: string;
      is_available: boolean;
      status: string;
      is_locked_by_me?: boolean;
      is_locked_by_other?: boolean;
      lock_info?: {
        lock_id: number;
        is_mine: boolean;
        expires_at: string;
        seconds_remaining: number;
      } | null;
    }>;
  }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.checkAvailability(params);
    }
    return api.get('/reservations/check_availability/', params);
  },

  async acquireSpaceLock(params: {
    space_id: number;
    parking_id: number;
    user_id?: number;
    session_id: string;
    date: string;
    start_time: string;
    end_time: string;
  }): Promise<LockAcquireResult> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.acquireSpaceLock(params);
    }
    return api.post<LockAcquireResult>('/reservations/lock_space/', params);
  },

  async releaseSpaceLock(params: {
    lock_id: number;
    session_id: string;
    user_id?: number;
  }): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.releaseSpaceLock(params);
    }
    return api.post<{ success: boolean; message: string }>('/reservations/release_lock/', params);
  },

  async confirmReservationWithLock(data: {
    lock_id: number;
    session_id: string;
    parking: number;
    space?: number;
    vehicle_plate: string;
    vehicle_model?: string;
    date: string;
    start_time: string;
    end_time: string;
    payment_method?: string;
    payment_status?: 'pending' | 'paid' | 'refunded';
    status?: ReservationStatus;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.confirmReservationWithLock(data);
    }
    return api.post<{ message: string; reservation: Reservation }>('/reservations/', {
      ...data,
      lock_id: data.lock_id,
      session_id: data.session_id,
    });
  },

  async verifyQr(code: string): Promise<{ valid: boolean; message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.verifyQr(code);
    }
    return api.post<{ valid: boolean; message: string; reservation: Reservation }>('/reservations/verify_qr/', { code });
  },

  async checkIn(id: number, data?: { notes?: string; payment_method?: string }): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.checkIn(id, data);
    }
    return api.post<{ message: string; reservation: Reservation }>(`/reservations/${id}/check_in/`, data || {});
  },

  async checkOut(id: number, data?: { notes?: string; payment_method?: string }): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.checkOut(id, data);
    }
    return api.post<{ message: string; reservation: Reservation }>(`/reservations/${id}/check_out/`, data || {});
  },

  async registerWalkIn(data: {
    parking_id: number;
    vehicle_plate: string;
    vehicle_model?: string;
    hours: number;
    payment_method: string;
    notes?: string;
  }): Promise<{ message: string; reservation: Reservation }> {
    if (isSupabaseConfigured()) {
      return supabaseReservations.registerWalkIn(data);
    }
    return api.post<{ message: string; reservation: Reservation }>('/reservations/register_walk_in/', data);
  },
};
