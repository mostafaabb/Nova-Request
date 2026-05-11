import axios, { AxiosError } from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : '');

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const workspaceId = localStorage.getItem('nova-active-workspace');
    if (workspaceId) {
      config.headers['X-Workspace-Id'] = workspaceId;
    }
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Collection APIs
export const collectionApi = {
  getAll: () => api.get('/collections'),
  getOne: (id: string) => api.get(`/collections/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/collections', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put(`/collections/${id}`, data),
  delete: (id: string) => api.delete(`/collections/${id}`),
  generateShareLink: (id: string) => api.post(`/collections/${id}/share`),
  removeShareLink: (id: string) => api.delete(`/collections/${id}/share`),
  export: (id: string) => api.get(`/collections/${id}/export`),
  import: (data: any) => api.post('/collections/import', data),
};

// Endpoint APIs
export const endpointApi = {
  getAll: (collectionId: string) =>
    api.get(`/endpoints/collection/${collectionId}`),
  getOne: (id: string) => api.get(`/endpoints/${id}`),
  create: (collectionId: string, data: any) =>
    api.post(`/endpoints/collection/${collectionId}`, data),
  update: (id: string, data: any) => api.put(`/endpoints/${id}`, data),
  delete: (id: string) => api.delete(`/endpoints/${id}`),
  duplicate: (id: string) => api.post(`/endpoints/${id}/duplicate`),
};

// Proxy API (for executing requests)
export const proxyApi = {
  execute: (data: {
    method: string;
    url: string;
    headers?: any[];
    body?: any;
    timeout?: number;
    endpointId?: string;
  }) => api.post('/proxy', data),
};

// History APIs
export const historyApi = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get('/history', { params }),
  getOne: (id: string) => api.get(`/history/${id}`),
  delete: (id: string) => api.delete(`/history/${id}`),
  clearAll: () => api.delete('/history'),
};

// Share API (public)
export const shareApi = {
  getCollection: (shareId: string) => api.get(`/share/${shareId}`),
};

// Workspace APIs
export const workspaceApi = {
  getAll: () => api.get('/workspaces'),
  create: (data: { name: string }) => api.post('/workspaces', data),
  getMembers: (workspaceId: string) => api.get(`/workspaces/${workspaceId}/members`),
  addMember: (workspaceId: string, data: { email: string; role?: string }) =>
    api.post(`/workspaces/${workspaceId}/members`, data),
  updateMemberRole: (workspaceId: string, memberId: string, data: { role: string }) =>
    api.patch(`/workspaces/${workspaceId}/members/${memberId}`, data),
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  getAuditLogs: (workspaceId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/workspaces/${workspaceId}/audit`, { params }),
};

// Environment APIs
export const environmentApi = {
  getAll: (workspaceId: string) =>
    api.get(`/workspaces/${workspaceId}/environments`),
  getOne: (workspaceId: string, envId: string) =>
    api.get(`/workspaces/${workspaceId}/environments/${envId}`),
  create: (workspaceId: string, data: { name: string; variables?: Record<string, string> }) =>
    api.post(`/workspaces/${workspaceId}/environments`, data),
  update: (workspaceId: string, envId: string, data: { name?: string; variables?: Record<string, string> }) =>
    api.put(`/workspaces/${workspaceId}/environments/${envId}`, data),
  delete: (workspaceId: string, envId: string) =>
    api.delete(`/workspaces/${workspaceId}/environments/${envId}`),
};
