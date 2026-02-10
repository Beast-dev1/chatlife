import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setAccessToken, clearAccessToken, setOnRefreshFailed } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProfileUpdateData = {
  avatarUrl?: string | null;
  status?: string | null;
  bio?: string | null;
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  init: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isInitialized: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            user: User;
            accessToken: string;
            refreshToken: string;
          }>("/api/auth/login", { email, password });
          setAccessToken(data.accessToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          set({ user: data.user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      register: async (email, username, password) => {
        set({ isLoading: true });
        try {
          const data = await api.post<{
            user: User;
            accessToken: string;
            refreshToken: string;
          }>("/api/auth/register", { email, username, password });
          setAccessToken(data.accessToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          set({ user: data.user, isLoading: false });
        } catch (e) {
          set({ isLoading: false });
          throw e;
        }
      },

      logout: async () => {
        try {
          await api.post("/api/auth/logout", undefined, getRefreshToken());
        } catch {
          // Ignore logout API errors
        }
        clearAccessToken();
        if (typeof window !== "undefined") {
          localStorage.removeItem("refreshToken");
        }
        set({ user: null });
      },

      refresh: async () => {
        const rt = getRefreshToken();
        if (!rt) {
          set({ user: null, isInitialized: true });
          return;
        }
        try {
          const data = await api.post<{
            accessToken: string;
            refreshToken: string;
            user?: User;
          }>("/api/auth/refresh", { refreshToken: rt });
          setAccessToken(data.accessToken);
          if (data.refreshToken && typeof window !== "undefined") {
            localStorage.setItem("refreshToken", data.refreshToken);
          }
          const userData = await api.get<User>("/api/auth/me", rt);
          set({ user: userData, isInitialized: true });
        } catch {
          clearAccessToken();
          if (typeof window !== "undefined") {
            localStorage.removeItem("refreshToken");
          }
          set({ user: null, isInitialized: true });
        }
      },

      init: async () => {
        if (get().isInitialized) return;
        setOnRefreshFailed(() => {
          get().logout();
        });
        await get().refresh();
      },

      updateProfile: async (data) => {
        const updated = await api.put<User>("/api/auth/profile", data);
        set({ user: updated });
      },
    }),
    {
      name: "auth-storage",
      partialize: (s) => ({ user: s.user }),
    }
  )
);

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}
