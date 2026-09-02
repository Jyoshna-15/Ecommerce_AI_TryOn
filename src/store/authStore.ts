import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuthFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({ user: null, token: null });
  },

  loadAuthFromStorage: async () => {
    const token = await AsyncStorage.getItem("token");
    const userJson = await AsyncStorage.getItem("user");
    if (token && userJson) {
      set({ token, user: JSON.parse(userJson), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
}));