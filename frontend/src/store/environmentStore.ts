import { create } from 'zustand';
import { environmentApi } from '@/lib/api';

export type EnvVariable = { key: string; value: string; enabled: boolean };

interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
}

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  serverWorkspaceId: string | null;
  isLoading: boolean;

  fetchForWorkspace: (workspaceId: string) => Promise<void>;
  addEnvironment: (name: string) => Promise<void>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironment: (id: string | null) => void;
  updateVariable: (envId: string, index: number, variable: EnvVariable) => void;
  addVariable: (envId: string) => void;
  removeVariable: (envId: string, index: number) => void;
  getVariables: () => Record<string, string>;
}

const defaultGlobals = (): Environment => ({
  id: 'globals',
  name: 'Globals',
  variables: [],
});

function objectToVariables(obj: Record<string, unknown> | null | undefined): EnvVariable[] {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
    enabled: true,
  }));
}

function variablesToObject(vars: EnvVariable[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) {
    if (v.enabled && v.key.trim()) out[v.key.trim()] = v.value;
  }
  return out;
}

const persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function schedulePersist(
  get: () => EnvironmentState,
  workspaceId: string | null,
  envId: string
) {
  if (!workspaceId || envId === 'globals') return;
  const key = `${workspaceId}:${envId}`;
  if (persistTimers[key]) clearTimeout(persistTimers[key]);
  persistTimers[key] = setTimeout(async () => {
    delete persistTimers[key];
    const state = get();
    const env = state.environments.find((e) => e.id === envId);
    if (!env || env.id === 'globals' || state.serverWorkspaceId !== workspaceId) return;
    try {
      await environmentApi.update(workspaceId, envId, {
        name: env.name,
        variables: variablesToObject(env.variables),
      });
    } catch {
      /* surfaced elsewhere if needed */
    }
  }, 550);
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [defaultGlobals()],
  activeEnvironmentId: null,
  serverWorkspaceId: null,
  isLoading: false,

  fetchForWorkspace: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const prevGlobals =
        get().environments.find((e) => e.id === 'globals') ?? defaultGlobals();
      const res = await environmentApi.getAll(workspaceId);
      const serverEnvs = res.data.environments.map(
        (e: { id: string; name: string; variables: Record<string, unknown> }) => ({
          id: e.id,
          name: e.name,
          variables: objectToVariables(e.variables),
        })
      );
      set({
        environments: [prevGlobals, ...serverEnvs],
        serverWorkspaceId: workspaceId,
        activeEnvironmentId: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addEnvironment: async (name) => {
    const wsId = get().serverWorkspaceId;
    if (!wsId) throw new Error('No workspace context');
    const trimmed = name.trim();
    if (!trimmed) return;

    const res = await environmentApi.create(wsId, { name: trimmed, variables: {} });
    const e = res.data.environment as {
      id: string;
      name: string;
      variables: Record<string, unknown>;
    };

    set((state) => ({
      environments: [
        ...state.environments,
        {
          id: e.id,
          name: e.name,
          variables: objectToVariables(e.variables),
        },
      ],
    }));
  },

  deleteEnvironment: async (id) => {
    if (id === 'globals') return;
    const wsId = get().serverWorkspaceId;
    if (!wsId) return;

    await environmentApi.delete(wsId, id);
    set((state) => ({
      environments: state.environments.filter((e) => e.id !== id),
      activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
    }));
  },

  setActiveEnvironment: (id) => set({ activeEnvironmentId: id }),

  updateVariable: (envId, index, variable) => {
    const wsId = get().serverWorkspaceId;
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
    schedulePersist(get, wsId, envId);
  },

  addVariable: (envId) => {
    const wsId = get().serverWorkspaceId;
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
    schedulePersist(get, wsId, envId);
  },

  removeVariable: (envId, index) => {
    const wsId = get().serverWorkspaceId;
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
    schedulePersist(get, wsId, envId);
  },

  getVariables: () => {
    const { environments, activeEnvironmentId } = get();
    const vars: Record<string, string> = {};

    const globals = environments.find((e) => e.id === 'globals');
    globals?.variables.forEach((v) => {
      if (v.enabled && v.key) vars[v.key] = v.value;
    });

    if (activeEnvironmentId) {
      const active = environments.find((e) => e.id === activeEnvironmentId);
      active?.variables.forEach((v) => {
        if (v.enabled && v.key) vars[v.key] = v.value;
      });
    }

    return vars;
  },
}));
