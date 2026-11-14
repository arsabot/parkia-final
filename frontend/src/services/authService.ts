import { api } from './api';
import { AuthResponse, User, UserRole } from '../types';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { supabaseAuth } from './supabaseService';

export const authService = {
  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: UserRole;
    phone?: string;
    has_disability_permit?: boolean;
    cud_number?: string;
    cud_dni?: string;
    cud_expiration?: string;
  }): Promise<AuthResponse> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.register(data);
    }
    const res = await api.post<AuthResponse>('/auth/register/', data);
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async verifyCud(data: {
    cud_number: string;
    cud_dni?: string;
    cud_expiration?: string;
  }): Promise<{
    valid: boolean;
    message: string;
    cud_number: string;
    status: string;
    symbol: string;
    accessible_parking_access: boolean;
  }> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.verifyCud(data);
    }
    return api.post('/auth/verify-cud/', data);
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.login(credentials);
    }
    const res = await api.post<AuthResponse>('/auth/login/', credentials);
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async demoLogin(role: UserRole = 'driver'): Promise<AuthResponse> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.demoLogin(role);
    }
    const res = await api.post<AuthResponse>('/auth/demo-login/', { role });
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async getMe(): Promise<User> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.getMe();
    }
    const user = await api.get<User>('/auth/me/');
    localStorage.setItem('parkia_user', JSON.stringify(user));
    return user;
  },

  async requestPasswordReset(email: string): Promise<{ message: string; dev_reset_url?: string }> {
    return api.post<{ message: string; dev_reset_url?: string }>('/auth/password-reset/', { email });
  },

  async validateResetToken(uid: string, token: string): Promise<{ valid: boolean; email?: string; message?: string }> {
    return api.post<{ valid: boolean; email?: string; message?: string }>('/auth/password-reset/validate/', { uid, token });
  },

  async confirmPasswordReset(data: {
    uid: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/password-reset/confirm/', data);
  },

  async signInWithGoogle(role?: UserRole): Promise<void> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.signInWithGoogle(role);
    }
    throw new Error('Supabase no está configurado para inicio de sesión con Google.');
  },

  async handleOAuthCallback(): Promise<AuthResponse | null> {
    if (isSupabaseConfigured()) {
      return supabaseAuth.handleOAuthCallback();
    }
    return null;
  },

  logout(): void {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('parkia_token');
    localStorage.removeItem('parkia_refresh');
    localStorage.removeItem('parkia_user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('parkia_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('parkia_token');
  },
};
