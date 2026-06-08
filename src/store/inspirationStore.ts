import { create } from 'zustand';
import { Inspiration } from '../types';
import * as db from '../services/database';

interface InspirationStore {
  inspirations: Inspiration[];
  isLoading: boolean;
  error: string | null;

  loadInspirations: () => Promise<void>;
  addInspiration: (data: Partial<Inspiration>) => Promise<string>;
  updateInspiration: (id: string, data: Partial<Inspiration>) => Promise<void>;
  deleteInspiration: (id: string) => Promise<void>;
  getInspiration: (id: string) => Inspiration | undefined;
  clearError: () => void;
}

export const useInspirationStore = create<InspirationStore>((set, get) => ({
  inspirations: [],
  isLoading: false,
  error: null,

  loadInspirations: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await db.getAllInspirations();
      set({ inspirations: data, isLoading: false });
    } catch (err) {
      set({ error: '加载灵感失败', isLoading: false });
    }
  },

  addInspiration: async (data) => {
    set({ error: null });
    try {
      const id = await db.createInspiration(data);
      await get().loadInspirations();
      return id;
    } catch (err) {
      set({ error: '创建灵感失败' });
      throw err;
    }
  },

  updateInspiration: async (id, data) => {
    set({ error: null });
    try {
      await db.updateInspiration(id, data);
      await get().loadInspirations();
    } catch (err) {
      set({ error: '更新灵感失败' });
    }
  },

  deleteInspiration: async (id) => {
    set({ error: null });
    try {
      await db.deleteInspiration(id);
      await get().loadInspirations();
    } catch (err) {
      set({ error: '删除灵感失败' });
    }
  },

  getInspiration: (id) => {
    return get().inspirations.find(inf => inf.id === id);
  },

  clearError: () => {
    set({ error: null });
  },
}));
