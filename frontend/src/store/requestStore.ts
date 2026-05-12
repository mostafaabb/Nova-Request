import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HttpMethod,
  KeyValuePair,
  BodyType,
  ApiResponse,
  AuthConfig,
  RequestTest,
} from '@/types';
import { proxyApi } from '@/lib/api';
import { useEnvironmentStore } from './environmentStore';
import { defaultAuthConfig, mergeAuthIntoRequest } from '@/lib/buildAuth';
import toast from 'react-hot-toast';

export interface Tab {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  formFields: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  auth: AuthConfig;
  preRequestScript: string;
  postRequestScript: string;
  tests: RequestTest[];
  response: ApiResponse | null;
  isLoading: boolean;
  isDirty?: boolean;
}

interface RequestState {
  tabs: Tab[];
  activeTabId: string | null;

  addTab: (endpoint?: any) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (updates: Partial<Tab>) => void;

  sendRequest: (endpointId?: string) => Promise<void>;

  getActiveTab: () => Tab | null;
}

const DEFAULT_TAB: Omit<Tab, 'id'> = {
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  queryParams: [{ key: '', value: '', enabled: true }],
  formFields: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'json',
  auth: defaultAuthConfig(),
  preRequestScript: '',
  postRequestScript: '',
  tests: [],
  response: null,
  isLoading: false,
};

function ensureKeyValueList(val: unknown): KeyValuePair[] {
  if (Array.isArray(val) && val.length > 0) {
    return val as KeyValuePair[];
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as KeyValuePair[];
      }
    } catch {
      /* ignore */
    }
  }
  return [{ key: '', value: '', enabled: true }];
}

function normalizeTests(raw: unknown): RequestTest[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RequestTest[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RequestTest[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeAuth(raw: unknown): AuthConfig {
  if (raw && typeof raw === 'object') {
    return { ...defaultAuthConfig(), ...(raw as AuthConfig) };
  }
  return defaultAuthConfig();
}

const validateTab = (tab: any): Tab => ({
  id: tab.id || Math.random().toString(36).substr(2, 9),
  name: tab.name || 'New Request',
  method: (tab.method as HttpMethod) || 'GET',
  url: tab.url || '',
  headers: ensureKeyValueList(tab.headers),
  queryParams: ensureKeyValueList(tab.queryParams),
  formFields: ensureKeyValueList(tab.formFields),
  body: tab.body || '',
  bodyType: (tab.bodyType as BodyType) || 'json',
  auth: normalizeAuth(tab.auth),
  preRequestScript: tab.preRequestScript || '',
  postRequestScript: tab.postRequestScript || '',
  tests: normalizeTests(tab.tests),
  response: tab.response ?? null,
  isLoading: tab.isLoading ?? false,
  isDirty: tab.isDirty || false,
});

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        const tab = tabs.find((t) => t.id === activeTabId);
        return tab ? validateTab(tab) : null;
      },

      addTab: (endpoint) => {
        set((state) => {
          const id = Math.random().toString(36).substr(2, 9);
          const newTab = endpoint
            ? validateTab({
                ...endpoint,
                id,
                auth: normalizeAuth(endpoint.auth),
                formFields: ensureKeyValueList(endpoint.formFields),
                tests: normalizeTests(endpoint.tests),
                response: null,
                isLoading: false,
              })
            : validateTab({ ...DEFAULT_TAB, id });

          return {
            tabs: [...state.tabs, newTab],
            activeTabId: id,
          };
        });
      },

      removeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== id);
          let newActiveTabId = state.activeTabId;

          if (state.activeTabId === id) {
            newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          };
        });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateActiveTab: (updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === state.activeTabId ? validateTab({ ...t, ...updates, isDirty: true }) : t
          ),
        }));
      },

      sendRequest: async (endpointId) => {
        const activeTab = get().getActiveTab();
        const targetTabId = get().activeTabId;

        if (!activeTab || !targetTabId) return;

        if (!activeTab.url || activeTab.url.trim() === '') {
          toast.error('Please enter a URL');
          return;
        }

        const variables = useEnvironmentStore.getState().getVariables();

        const replaceVariables = (str: string) => {
          if (!str) return '';
          return str.replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key.trim()] || `{{${key}}}`);
        };

        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === targetTabId ? { ...t, isLoading: true, response: null } : t
          ),
        }));

        try {
          const startTime = Date.now();

          let finalUrl = replaceVariables(activeTab.url);
          const enabledParams = (activeTab.queryParams || []).filter((p) => !!p.enabled && !!p.key);
          const { headers: authHeaderRows, queryPairs: authQueryPairs } = mergeAuthIntoRequest(
            activeTab.auth,
            replaceVariables
          );

          if (enabledParams.length > 0 || authQueryPairs.length > 0) {
            try {
              const searchParams = new URLSearchParams();
              enabledParams.forEach((p) =>
                searchParams.append(replaceVariables(p.key), replaceVariables(p.value))
              );
              authQueryPairs.forEach((p) =>
                searchParams.append(replaceVariables(p.key), replaceVariables(p.value))
              );
              const qs = searchParams.toString();
              if (qs) {
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + qs;
              }
            } catch (err) {
              console.error('URL SearchParams Error:', err);
            }
          }

          const userHeaderRows = (activeTab.headers || [])
            .filter((h) => !!h.enabled && !!h.key)
            .map((h) => ({
              key: replaceVariables(h.key),
              value: replaceVariables(h.value),
              enabled: true as const,
            }));

          const headerMap = new Map<string, KeyValuePair>();
          authHeaderRows.forEach((h) => headerMap.set(h.key.toLowerCase(), h));
          userHeaderRows.forEach((h) => headerMap.set(h.key.toLowerCase(), h));
          const enabledHeaders = Array.from(headerMap.values());

          const methodsNoBody: HttpMethod[] = ['GET', 'HEAD'];
          const sendsBody = !methodsNoBody.includes(activeTab.method);

          let bodyPayload: string | undefined;
          let formFieldsPayload: KeyValuePair[] | undefined;

          if (sendsBody) {
            if (
              activeTab.bodyType === 'form-data' ||
              activeTab.bodyType === 'x-www-form-urlencoded'
            ) {
              formFieldsPayload = (activeTab.formFields || [])
                .filter((p) => p.enabled && p.key)
                .map((p) => ({
                  key: p.key,
                  value: p.value,
                  enabled: true,
                }));
            } else if (activeTab.bodyType !== 'none') {
              bodyPayload = replaceVariables(activeTab.body);
            }
          }

          const response = await proxyApi.execute({
            method: activeTab.method,
            url: finalUrl,
            headers: enabledHeaders,
            body: bodyPayload,
            bodyType: activeTab.bodyType,
            formFields: formFieldsPayload,
            endpointId,
            environmentVariables: variables,
            preRequestScript: activeTab.preRequestScript || undefined,
            postRequestScript: activeTab.postRequestScript || undefined,
            tests: activeTab.tests?.length ? activeTab.tests : undefined,
          });

          const responseTime = Date.now() - startTime;

          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === targetTabId
                ? {
                    ...t,
                    isLoading: false,
                    response: { ...response.data, responseTime },
                  }
                : t
            ),
          }));
        } catch (error: any) {
          console.error('Nova Request Error:', error);
          set((state) => ({
            tabs: state.tabs.map((t) =>
              t.id === targetTabId
                ? {
                    ...t,
                    isLoading: false,
                    response: {
                      success: false,
                      error: {
                        message:
                          error.response?.data?.error || error.message || 'Connection failed',
                      },
                    },
                  }
                : t
            ),
          }));
          toast.error(error.message || 'Request failed');
        }
      },
    }),
    {
      name: 'nova-requests',
      partialize: (state) => ({
        tabs: state.tabs.map(({ response, isLoading, ...rest }) => rest),
        activeTabId: state.activeTabId,
      }),
    }
  )
);
