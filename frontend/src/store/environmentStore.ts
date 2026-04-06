import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Environment {
  id: string;
  name: string;
  variables: { key: string; value: string; enabled: boolean }[];
}

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  
  // Actions
  addEnvironment: (name: string) => void;
  deleteEnvironment: (id: string) => void;
  setActiveEnvironment: (id: string | null) => void;
  updateVariable: (envId: string, index: number, variable: { key: string; value: string; enabled: boolean }) => void;
  addVariable: (envId: string) => void;
  removeVariable: (envId: string, index: number) => void;
  
  // Helper to get active variables
  getVariables: () => Record<string, string>;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set, get) => ({
      environments: [
        {
          id: 'globals',
          name: 'Globals',
          variables: [],
        }
      ],
      activeEnvironmentId: null,

      addEnvironment: (name) => {
        const newEnv: Environment = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          variables: [],
        };
        set((state) => ({ environments: [...state.environments, newEnv] }));
      },

      deleteEnvironment: (id) => {
        if (id === 'globals') return;
        set((state) => ({
          environments: state.environments.filter((e) => e.id !== id),
          activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
        }));
      },

      setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

      updateVariable: (envId, index, variable) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? {
                  ...e,
                  variables: e.variables.map((v, i) => (i === index ? variable : v)),
                }
              : e
          ),
        }));
      },

      addVariable: (envId) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? {
                  ...e,
                  variables: [...e.variables, { key: '', value: '', enabled: true }],
                }
              : e
          ),
        }));
      },

      removeVariable: (envId, index) => {
        set((state) => ({
          environments: state.environments.map((e) =>
            e.id === envId
              ? {
                  ...e,
                  variables: e.variables.filter((_, i) => i !== index),
                }
              : e
          ),
        }));
      },

      getVariables: () => {
        const { environments, activeEnvironmentId } = get();
        const vars: Record<string, string> = {};
        
        // Load Globals
        const globals = environments.find(e => e.id === 'globals');
        globals?.variables.forEach(v => {
          if (v.enabled && v.key) vars[v.key] = v.value;
        });

        // Load Active Environment (overrides globals)
        if (activeEnvironmentId) {
          const active = environments.find(e => e.id === activeEnvironmentId);
          active?.variables.forEach(v => {
            if (v.enabled && v.key) vars[v.key] = v.value;
          });
        }

        return vars;
      },
    }),
    {
      name: 'nova-environments',
    }
  )
);
