import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'VICTIM' | 'BUYER' | 'OFFICER' | 'ADMIN';
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  savePushToken: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },
  register: async (userData) => {
    const { data } = await client.post('/auth/register', userData);
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
  },
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null });
  },
  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  savePushToken: async (pushToken) => {
    await client.post('/auth/push-token', { expoPushToken: pushToken });
  },
}));
