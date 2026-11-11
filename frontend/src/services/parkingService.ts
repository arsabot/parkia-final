import { api } from './api';
import { Parking, ParkingSpace, SearchFilters, SpaceStatus, SpaceType } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { supabaseParking } from './supabaseService';

export const parkingService = {
  async getParkings(filters?: SearchFilters): Promise<Parking[]> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getParkings(filters);
    }
    return api.get<Parking[]>('/parking/', filters);
  },

  async getMyParkings(): Promise<Parking[]> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getMyParkings();
    }
    return api.get<Parking[]>('/parking/my_parkings/');
  },

  async getParkingById(id: number | string): Promise<Parking> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getParkingById(id);
    }
    return api.get<Parking>(`/parking/${id}/`);
  },

  async getSpaces(parkingId: number | string): Promise<ParkingSpace[]> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getSpaces(parkingId);
    }
    return api.get<ParkingSpace[]>(`/parking/${parkingId}/spaces/`);
  },

  async toggleFavorite(parkingId: number): Promise<{ is_favorite: boolean; message: string }> {
    if (isSupabaseConfigured()) {
      return supabaseParking.toggleFavorite(parkingId);
    }
    return api.post<{ is_favorite: boolean; message: string }>(`/parking/${parkingId}/toggle_favorite/`);
  },

  async getFavorites(): Promise<Array<{ id: number; parking: Parking; created_at: string }>> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getFavorites();
    }
    return api.get<Array<{ id: number; parking: Parking; created_at: string }>>('/parking/favorites/');
  },

  // Admin Actions
  async createParking(data: Partial<Parking>): Promise<Parking> {
    if (isSupabaseConfigured()) {
      return supabaseParking.createParking(data);
    }
    return api.post<Parking>('/parking/', data);
  },

  async updateParking(id: number, data: Partial<Parking>): Promise<Parking> {
    if (isSupabaseConfigured()) {
      return supabaseParking.updateParking(id, data);
    }
    return api.patch<Parking>(`/parking/${id}/`, data);
  },

  async deleteParking(id: number): Promise<void> {
    if (isSupabaseConfigured()) {
      return supabaseParking.deleteParking(id);
    }
    return api.delete(`/parking/${id}/`);
  },

  async getAllSpaces(parkingId?: number): Promise<ParkingSpace[]> {
    if (isSupabaseConfigured()) {
      return supabaseParking.getAllSpaces(parkingId);
    }
    return api.get<ParkingSpace[]>('/parking/spaces/', { parking_id: parkingId });
  },

  async updateSpaceStatus(spaceId: number, status: SpaceStatus): Promise<ParkingSpace> {
    if (isSupabaseConfigured()) {
      return supabaseParking.updateSpaceStatus(spaceId, status);
    }
    return api.patch<ParkingSpace>(`/parking/spaces/${spaceId}/set_status/`, { status });
  },

  // Marca una plaza como común ('standard') o accesible ('disabled')
  async updateSpaceType(spaceId: number, spaceType: SpaceType): Promise<ParkingSpace> {
    if (isSupabaseConfigured()) {
      return supabaseParking.updateSpaceType(spaceId, spaceType);
    }
    return api.patch<ParkingSpace>(`/parking/spaces/${spaceId}/set_type/`, { space_type: spaceType });
  },
};
