import { create } from 'zustand';
import { HttpMethod, KeyValuePair, BodyType, ApiResponse } from '@/types';
import { proxyApi } from '@/lib/api';

interface RequestState {
  // Current request
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  
  // Response
  response: ApiResponse | null;
  isLoading: boolean;
  
  // Actions
  setMethod: (method: HttpMethod) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: KeyValuePair[]) => void;
  setQueryParams: (params: KeyValuePair[]) => void;
  setBody: (body: string) => void;
  setBodyType: (type: BodyType) => void;
  addHeader: () => void;
  removeHeader: (index: number) => void;
  updateHeader: (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
  addQueryParam: () => void;
  removeQueryParam: (index: number) => void;
  updateQueryParam: (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
  sendRequest: (endpointId?: string) => Promise<void>;
  clearResponse: () => void;
  loadEndpoint: (endpoint: any) => void;
  reset: () => void;
}

const initialState = {
  method: 'GET' as HttpMethod,
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  queryParams: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'json' as BodyType,
  response: null,
  isLoading: false,
};

export const useRequestStore = create<RequestState>((set, get) => ({
  ...initialState,

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setHeaders: (headers) => set({ headers }),
  setQueryParams: (queryParams) => set({ queryParams }),
  setBody: (body) => set({ body }),
  setBodyType: (bodyType) => set({ bodyType }),

  addHeader: () => set((state) => ({
    headers: [...state.headers, { key: '', value: '', enabled: true }]
  })),

  removeHeader: (index) => set((state) => ({
    headers: state.headers.filter((_, i) => i !== index)
  })),

  updateHeader: (index, field, value) => set((state) => ({
    headers: state.headers.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    )
  })),

  addQueryParam: () => set((state) => ({
    queryParams: [...state.queryParams, { key: '', value: '', enabled: true }]
  })),

  removeQueryParam: (index) => set((state) => ({
    queryParams: state.queryParams.filter((_, i) => i !== index)
  })),

  updateQueryParam: (index, field, value) => set((state) => ({
    queryParams: state.queryParams.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    )
  })),

  sendRequest: async (endpointId) => {
    const state = get();
    set({ isLoading: true, response: null });

    try {
      // Build URL with query params
      let finalUrl = state.url;
      const enabledParams = state.queryParams.filter(p => p.enabled && p.key);
      if (enabledParams.length > 0) {
        const searchParams = new URLSearchParams();
        enabledParams.forEach(p => searchParams.append(p.key, p.value));
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
      }

      // Filter enabled headers
      const enabledHeaders = state.headers.filter(h => h.enabled && h.key);

      // Send via proxy
      const response = await proxyApi.execute({
        method: state.method,
        url: finalUrl,
        headers: enabledHeaders,
        body: state.method !== 'GET' ? state.body : undefined,
        endpointId,
      });

      set({ response: response.data, isLoading: false });
    } catch (error: any) {
      set({
        response: {
          success: false,
          error: {
            message: error.response?.data?.error || error.message || 'Request failed',
          },
        },
        isLoading: false,
      });
    }
  },

  clearResponse: () => set({ response: null }),

  loadEndpoint: (endpoint) => set({
    method: endpoint.method || 'GET',
    url: endpoint.url || '',
    headers: endpoint.headers?.length > 0 
      ? endpoint.headers 
      : [{ key: '', value: '', enabled: true }],
    queryParams: endpoint.queryParams?.length > 0 
      ? endpoint.queryParams 
      : [{ key: '', value: '', enabled: true }],
    body: endpoint.body || '',
    bodyType: endpoint.bodyType || 'json',
    response: null,
  }),

  reset: () => set(initialState),
}));