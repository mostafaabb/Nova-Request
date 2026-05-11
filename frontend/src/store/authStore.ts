import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/lib/api';
import { useWorkspaceStore } from './workspaceStore';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await authApi.login({ email, password });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        await useWorkspaceStore.getState().fetchWorkspaces(user?.defaultWorkspaceId);
      },

      register: async (email: string, password: string, name: string) => {
        const response = await authApi.register({ email, password, name });
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
        await useWorkspaceStore.getState().fetchWorkspaces(user?.defaultWorkspaceId);
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('nova-active-workspace');
        useWorkspaceStore.getState().setActiveWorkspace(null);
        set({ user: null, token: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }

          const response = await authApi.me();
          const user = response.data.user;
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
          await useWorkspaceStore.getState().fetchWorkspaces(user?.defaultWorkspaceId);
        } catch {
          localStorage.removeItem('token');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
