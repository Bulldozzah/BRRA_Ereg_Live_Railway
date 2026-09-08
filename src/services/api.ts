import type { ApiResponse, PaginatedResponse } from '@/types/database';

const DEV_API_BASE_URL = 'http://localhost:3001/api';
const PROD_API_BASE_URL = 'https://cooperative-respect-production-3d40.up.railway.app/api';

// Fall back per-environment so a dev build never silently talks to production
// when VITE_API_BASE_URL is missing. Set VITE_API_BASE_URL to override either.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEV_API_BASE_URL : PROD_API_BASE_URL);

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers as HeadersInit | undefined);
    if (
      options.body != null &&
      typeof options.body === 'string' &&
      !headers.has('Content-Type')
    ) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    const fullEndpoint = query ? `${endpoint}?${query}` : endpoint;
    return this.request<T>(fullEndpoint);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    return response.json();
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async putFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API error: ${response.status}`);
    }
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
