import { create } from 'zustand';
import { Collection, Endpoint } from '@/types';
import { collectionApi, endpointApi } from '@/lib/api';

interface CollectionState {
  collections: Collection[];
  currentCollection: Collection | null;
  currentEndpoint: Endpoint | null;
  isLoading: boolean;
  
  // Actions
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  createCollection: (name: string, description?: string) => Promise<Collection>;
  updateCollection: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  
  // Endpoints
  selectEndpoint: (endpoint: Endpoint | null) => void;
  createEndpoint: (collectionId: string, data: Partial<Endpoint>) => Promise<Endpoint>;
  updateEndpoint: (id: string, data: Partial<Endpoint>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  duplicateEndpoint: (id: string) => Promise<Endpoint>;
  
  // Sharing
  generateShareLink: (id: string) => Promise<string>;
  removeShareLink: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  currentCollection: null,
  currentEndpoint: null,
  isLoading: false,

  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const response = await collectionApi.getAll();
      set({ collections: response.data.collections, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchCollection: async (id) => {
    set({ isLoading: true });
    try {
      const response = await collectionApi.getOne(id);
      set({ currentCollection: response.data.collection, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCollection: async (name, description) => {
    const response = await collectionApi.create({ name, description });
    const newCollection = response.data.collection;
    set((state) => ({
      collections: [newCollection, ...state.collections],
      currentCollection: newCollection,
    }));
    return newCollection;
  },

  updateCollection: async (id, data) => {
    await collectionApi.update(id, data);
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, ...data }
          : state.currentCollection,
    }));
  },

  deleteCollection: async (id) => {
    await collectionApi.delete(id);
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
      currentCollection:
        state.currentCollection?.id === id ? null : state.currentCollection,
    }));
  },

  selectEndpoint: (endpoint) => set({ currentEndpoint: endpoint }),

  createEndpoint: async (collectionId, data) => {
    const response = await endpointApi.create(collectionId, data);
    const newEndpoint = response.data.endpoint;
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: [...(state.currentCollection.endpoints || []), newEndpoint],
          }
        : null,
    }));
    
    return newEndpoint;
  },

  updateEndpoint: async (id, data) => {
    await endpointApi.update(id, data);
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: state.currentCollection.endpoints?.map((e) =>
              e.id === id ? { ...e, ...data } : e
            ),
          }
        : null,
      currentEndpoint:
        state.currentEndpoint?.id === id
          ? { ...state.currentEndpoint, ...data }
          : state.currentEndpoint,
    }));
  },

  deleteEndpoint: async (id) => {
    await endpointApi.delete(id);
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: state.currentCollection.endpoints?.filter((e) => e.id !== id),
          }
        : null,
      currentEndpoint:
        state.currentEndpoint?.id === id ? null : state.currentEndpoint,
    }));
  },

  duplicateEndpoint: async (id) => {
    const response = await endpointApi.duplicate(id);
    const duplicate = response.data.endpoint;
    
    set((state) => ({
      currentCollection: state.currentCollection
        ? {
            ...state.currentCollection,
            endpoints: [...(state.currentCollection.endpoints || []), duplicate],
          }
        : null,
    }));
    
    return duplicate;
  },

  generateShareLink: async (id) => {
    const response = await collectionApi.generateShareLink(id);
    const { shareId, shareUrl } = response.data;
    
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, shareId, isPublic: true } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, shareId, isPublic: true }
          : state.currentCollection,
    }));
    
    return shareUrl;
  },

  removeShareLink: async (id) => {
    await collectionApi.removeShareLink(id);
    
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, shareId: undefined, isPublic: false } : c
      ),
      currentCollection:
        state.currentCollection?.id === id
          ? { ...state.currentCollection, shareId: undefined, isPublic: false }
          : state.currentCollection,
    }));
  },
}));