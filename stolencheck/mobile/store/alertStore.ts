import { create } from 'zustand';
import client from '../api/client';

interface AlertItem {
  id: string;
  type: string;
  status: string;
  confidence: number;
  lat?: number;
  lng?: number;
  createdAt: string;
  item?: {
    id: string;
    scid: string;
    title: string;
    category: string;
  };
  notes?: string;
}

interface AlertStats {
  total: number;
  pending: number;
  investigating: number;
  resolved: number;
}

interface AlertState {
  alerts: AlertItem[];
  stats: AlertStats | null;
  isLoading: boolean;
  fetchAlerts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  updateAlert: (id: string, status: string, notes?: string) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  stats: null,
  isLoading: false,
  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await client.get('/alerts/');
      set({ alerts: data.alerts || data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  fetchStats: async () => {
    try {
      const { data } = await client.get('/alerts/stats');
      set({ stats: data });
    } catch {
      // silently handle
    }
  },
  updateAlert: async (id, status, notes) => {
    await client.patch(`/alerts/${id}`, { status, notes });
    get().fetchAlerts();
    get().fetchStats();
  },
}));
