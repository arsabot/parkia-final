const getApiBaseUrl = (): string => {
  // En desarrollo local (localhost / 127.0.0.1), usar el backend local si no se fuerza la API remota
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    !import.meta.env.VITE_FORCE_REMOTE_API
  ) {
    return 'http://127.0.0.1:8000/api';
  }
  return import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
};

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('parkia_token');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error(
          'No se pudo conectar con el servidor backend (Failed to fetch). Verifica que el servicio esté activo.'
        );
      }
      throw err;
    }

    // Handle 401 (Unauthorized)
    if (response.status === 401) {
      // Optional token refresh or auto logout
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        localStorage.removeItem('parkia_token');
        localStorage.removeItem('parkia_user');
      }
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || (data?.errors ? Object.values(data.errors).flat().join(', ') : 'Error en la petición');
      throw new Error(errorMsg);
    }

    return data as T;
  }

  get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
