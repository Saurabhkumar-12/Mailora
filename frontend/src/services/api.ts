import type {
  AuthMeResponse,
  ApiResponse,
  PaginatedListResponse,
  EmailRecord,
  SlackStatus,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

/**
 * Generic HTTP Request Helper configured with credentials for HttpOnly session cookies.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Crucial for sending signed HttpOnly session cookie
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected network error occurred. Please check your connection.');
  }
}

/**
 * Mailora Backend API Service Layer
 */
export const api = {
  // Authentication & Session API
  auth: {
    getGoogleAuthUrl: async (): Promise<string> => {
      const res = await fetchApi<{ success: boolean; url: string }>('/api/auth/google?json=true');
      return res.url;
    },
    getCurrentUser: async (): Promise<AuthMeResponse> => {
      return fetchApi<AuthMeResponse>('/api/auth/me');
    },
    logout: async (): Promise<ApiResponse<void>> => {
      return fetchApi<ApiResponse<void>>('/api/auth/logout', { method: 'POST' });
    },
  },

  // Email API
  emails: {
    getScheduled: async (page = 1, limit = 20): Promise<PaginatedListResponse<EmailRecord>> => {
      return fetchApi<PaginatedListResponse<EmailRecord>>(`/api/emails/scheduled?page=${page}&limit=${limit}`);
    },
    getSent: async (page = 1, limit = 20): Promise<PaginatedListResponse<EmailRecord>> => {
      return fetchApi<PaginatedListResponse<EmailRecord>>(`/api/emails/sent?page=${page}&limit=${limit}`);
    },
    getById: async (id: string): Promise<ApiResponse<EmailRecord>> => {
      return fetchApi<ApiResponse<EmailRecord>>(`/api/emails/${id}`);
    },
    cancel: async (id: string): Promise<ApiResponse<EmailRecord>> => {
      return fetchApi<ApiResponse<EmailRecord>>(`/api/emails/${id}/cancel`, { method: 'POST' });
    },
    search: async (query: string): Promise<ApiResponse<EmailRecord[]>> => {
      return fetchApi<ApiResponse<EmailRecord[]>>(`/api/emails/search?q=${encodeURIComponent(query)}`);
    },
  },

  // Slack Integration API
  slack: {
    getStatus: async (): Promise<ApiResponse<SlackStatus>> => {
      return fetchApi<ApiResponse<SlackStatus>>('/api/slack/status');
    },
    disconnect: async (): Promise<ApiResponse<void>> => {
      return fetchApi<ApiResponse<void>>('/api/slack/disconnect', { method: 'POST' });
    },
  },
};
