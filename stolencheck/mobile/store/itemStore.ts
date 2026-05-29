import { create } from 'zustand';
import client from '../api/client';

interface StolenItem {
  id: string;
  scid: string;
  title: string;
  category: string;
  description: string;
  brand?: string;
  model?: string;
  color?: string;
  estimatedValue?: number;
  stolenAt: string;
  stolenLocation: string;
  firNumber?: string;
  status: string;
  images: { id: string; url: string; isPrimary: boolean }[];
  identifiers: { id: string; type: string; value: string }[];
}

interface ItemState {
  items: StolenItem[];
  isLoading: boolean;
  fetchMyItems: () => Promise<void>;
  getItem: (id: string) => Promise<StolenItem>;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  isLoading: false,
  fetchMyItems: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/items/mine');
      set({ items: data.items, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  getItem: async (id) => {
    const { data } = await client.get(`/items/${id}`);
    return data;
  },
}));
