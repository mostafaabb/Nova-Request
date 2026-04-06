import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { HttpMethod, KeyValuePair, BodyType, ApiResponse } from '@/types';
import { proxyApi } from '@/lib/api';
import { useEnvironmentStore } from './environmentStore';
import toast from 'react-hot-toast';

export interface Tab {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  queryParams: KeyValuePair[];
  body: string;
  bodyType: BodyType;
  response: ApiResponse | null;
  isLoading: boolean;
  isDirty?: boolean;
}

interface RequestState {
  tabs: Tab[];
  activeTabId: string | null;
  
  // Tab Management
  addTab: (endpoint?: any) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateActiveTab: (updates: Partial<Tab>) => void;
  
  // Core Actions
  sendRequest: (endpointId?: string) => Promise<void>;
  
  // Helpers
  getActiveTab: () => Tab | null;
}

const DEFAULT_TAB: Omit<Tab, 'id'> = {
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  queryParams: [{ key: '', value: '', enabled: true }],
  body: '',
  bodyType: 'json',
  response: null,
  isLoading: false,
};

const ensureArray = (val: any) => Array.isArray(val) ? val : [{ key: '', value: '', enabled: true }];

const validateTab = (tab: any): Tab => ({
  id: tab.id || Math.random().toString(36).substr(2, 9),
  name: tab.name || 'New Request',
  method: (tab.method as HttpMethod) || 'GET',
  url: tab.url || '',
  headers: ensureArray(tab.headers),
  queryParams: ensureArray(tab.queryParams),
  body: tab.body || '',
  bodyType: (tab.bodyType as BodyType) || 'json',
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
        const tab = tabs.find(t => t.id === activeTabId);
        return tab ? validateTab(tab) : null;
      },

      addTab: (endpoint) => {
        set((state) => {
          const id = Math.random().toString(36).substr(2, 9);
          const newTab = validateTab(endpoint ? { ...endpoint, id } : { ...DEFAULT_TAB, id });
          
          return {
            tabs: [...state.tabs, newTab],
            activeTabId: id,
          };
        });
      },

      removeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter(t => t.id !== id);
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
          tabs: state.tabs.map(t => 
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

        // Variable Replacement Helper
        const replaceVariables = (str: string) => {
          if (!str) return '';
          return str.replace(/\{\{(.*?)\}\}/g, (_, key) => variables[key.trim()] || `{{${key}}}`);
        };

        set((state) => ({
          tabs: state.tabs.map(t => 
            t.id === targetTabId ? { ...t, isLoading: true, response: null } : t
          ),
        }));

        try {
          const startTime = Date.now();
          
          // Build URL with query params & variables
          let finalUrl = replaceVariables(activeTab.url);
          const enabledParams = (activeTab.queryParams || []).filter(p => !!p.enabled && !!p.key);
          if (enabledParams.length > 0) {
            try {
              const searchParams = new URLSearchParams();
              enabledParams.forEach(p => searchParams.append(replaceVariables(p.key), replaceVariables(p.value)));
              finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
            } catch (err) {
              console.error('URL SearchParams Error:', err);
            }
          }

          // Filter enabled headers & replace variables
          const enabledHeaders = (activeTab.headers || [])
            .filter(h => !!h.enabled && !!h.key)
            .map(h => ({
              key: replaceVariables(h.key),
              value: replaceVariables(h.value),
              enabled: true
            }));

          const response = await proxyApi.execute({
            method: activeTab.method,
            url: finalUrl,
            headers: enabledHeaders,
            body: activeTab.method !== 'GET' ? replaceVariables(activeTab.body) : undefined,
            endpointId,
          });

          const responseTime = Date.now() - startTime;

          set((state) => ({
            tabs: state.tabs.map(t => 
              t.id === targetTabId ? { 
                ...t, 
                isLoading: false, 
                response: { ...response.data, responseTime } 
              } : t
            ),
          }));
        } catch (error: any) {
          console.error('Nova Request Error:', error);
          set((state) => ({
            tabs: state.tabs.map(t => 
              t.id === targetTabId ? { 
                ...t, 
                isLoading: false, 
                response: {
                  success: false,
                  error: { 
                    message: error.response?.data?.error || error.message || 'Connection failed' 
                  },
                }
              } : t
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