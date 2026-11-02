import { api } from './api';
import { AuthResponse, User, UserRole } from '../types';

export const authService = {
  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: UserRole;
    phone?: string;
  }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register/', data);
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login/', credentials);
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async demoLogin(role: UserRole = 'driver'): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/demo-login/', { role });
    localStorage.setItem('parkia_token', res.tokens.access);
    localStorage.setItem('parkia_refresh', res.tokens.refresh);
    localStorage.setItem('parkia_user', JSON.stringify(res.user));
    return res;
  },

  async getMe(): Promise<User> {
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

  logout(): void {
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
