import { api } from './api';
import { AdminDashboardData } from '../types';
import { isSupabaseConfigured } from './supabaseClient';
import { supabaseAdmin } from './supabaseService';

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardData> {
    if (isSupabaseConfigured()) {
      return supabaseAdmin.getDashboardStats();
    }
    return api.get<AdminDashboardData>('/admin/dashboard/');
  },
};
