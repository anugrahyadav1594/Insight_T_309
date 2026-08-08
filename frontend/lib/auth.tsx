/**
 * Zustand-based authentication store.
 *
 * Manages JWT tokens, user profile, and auth actions (login, register,
 * logout, refresh, fetchMe). Tokens are persisted in localStorage and
 * hydrated on mount via the `hydrate()` action.
 *
 * Usage in components:
 *   const { user, isAuthenticated, login, logout } = useAuthStore();
 *
 * Usage outside React:
 *   useAuthStore.getState().accessToken
 */

"use client";

import { create } from "zustand";
import { apiClient, ApiError, TOKEN_KEY, REFRESH_KEY } from "./api";
import type { TokenPair, TokenRefreshResponse, MeResponse } from "./types";

// ─── Store shape ─────────────────────────────────────────────────────────────

interface AuthState {
  /* state */
  accessToken: string | null;
  refreshToken: string | null;
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /* actions */
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
  clearAuth: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function persistTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  /**
   * Call once on app mount to rehydrate tokens from localStorage.
   * Does NOT hit the network — pair with `fetchMe()` if you need the profile.
   */
  hydrate: () => {
    if (typeof window === "undefined") return;
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (accessToken) {
      set({ accessToken, refreshToken, isAuthenticated: true });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await apiClient.post<TokenPair>(
        "/auth/login",
        { email, password },
        { skipAuth: true },
      );
      persistTokens(data.access_token, data.refresh_token);
      set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Register ─────────────────────────────────────────────────────────────

  register: async (email, password, fullName) => {
    set({ isLoading: true });
    try {
      const data = await apiClient.post<TokenPair>(
        "/auth/register",
        { email, password, full_name: fullName },
        { skipAuth: true },
      );
      persistTokens(data.access_token, data.refresh_token);
      set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        user: data.user ?? null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────

  logout: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await apiClient.post("/auth/logout", {
          refresh_token: refreshToken,
        });
      }
    } catch {
      // Swallow — server-side invalidation is best-effort
    }
    get().clearAuth();
  },

  // ── Refresh ──────────────────────────────────────────────────────────────

  refresh: async () => {
    const { refreshToken } = get();
    if (!refreshToken) return false;
    try {
      const data = await apiClient.post<TokenRefreshResponse>(
        "/auth/refresh",
        { refresh_token: refreshToken },
        { skipAuth: true },
      );
      persistTokens(data.access_token, data.refresh_token);
      set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
      });
      return true;
    } catch {
      get().clearAuth();
      return false;
    }
  },

  // ── Fetch current user profile ───────────────────────────────────────────

  fetchMe: async () => {
    try {
      const user = await apiClient.get<MeResponse>("/auth/me");
      set({ user });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token is invalid — attempt a silent refresh
        const refreshed = await get().refresh();
        if (refreshed) {
          try {
            const user = await apiClient.get<MeResponse>("/auth/me");
            set({ user });
            return;
          } catch {
            // Still failing — clear
          }
        }
        get().clearAuth();
      }
      throw err;
    }
  },

  // ── Clear everything ─────────────────────────────────────────────────────

  clearAuth: () => {
    if (typeof window !== "undefined") {
      clearTokens();
    }
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
