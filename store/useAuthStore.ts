import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { ApiUser, authApi, setUnauthorizedHandler } from "../lib/api";
import { usePrefsStore } from "./usePrefsStore";

const TOKEN_KEY = process.env.EXPO_PUBLIC_TOKEN_KEY ?? "splitty_auth_token";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  token: string | null;
  user: ApiUser | null;
  error: string | null;
  loading: boolean;
  isLoggingOut: boolean;

  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: ApiUser) => void;
};

// ─── Sync profile prefs from API user ────────────────────────────────────────

function syncPrefsFromUser(user: ApiUser) {
  if (!user.profile) return;
  const { setTheme, setCurrency } = usePrefsStore.getState();
  const { theme, currency } = user.profile;

  // Map API theme to our ThemeMode (ignore "system" → keep current)
  if (theme === "light" || theme === "dark") setTheme(theme);

  // Map API currency code to CurrencyCode if it's one we support
  const supported = ["USD", "INR", "EUR", "CAD"] as const;
  if (supported.includes(currency as any)) {
    setCurrency(currency as typeof supported[number]);
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => {
  // Wire the unauthorized handler so api.ts can call logout without circular import
  setUnauthorizedHandler(() => get().logout());

  return {
    status: "unknown",
    token: null,
    user: null,
    error: null,
    loading: false,
    isLoggingOut: false,

    // ── bootstrap ─────────────────────────────────────────────────────────────

    bootstrap: async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) {
          set({ status: "unauthenticated", token: null, user: null });
          return;
        }

        // Validate token
        const res = await authApi.me(stored);
        if (res.ok) {
          syncPrefsFromUser(res.data.user);
          set({ status: "authenticated", token: stored, user: res.data.user });
          return;
        }

        // Token invalid — try refresh via httpOnly cookie
        const refreshRes = await authApi.refresh();
        if (refreshRes.ok) {
          const newToken = refreshRes.data.accessToken;
          await AsyncStorage.setItem(TOKEN_KEY, newToken);
          const meRes = await authApi.me(newToken);
          if (meRes.ok) {
            syncPrefsFromUser(meRes.data.user);
            set({ status: "authenticated", token: newToken, user: meRes.data.user });
            return;
          }
        }

        // Both failed — clear storage
        await AsyncStorage.removeItem(TOKEN_KEY);
        set({ status: "unauthenticated", token: null, user: null });
      } catch {
        set({ status: "unauthenticated", token: null, user: null });
      }
    },

    // ── login ─────────────────────────────────────────────────────────────────

    login: async (email, password) => {
      set({ loading: true, error: null });
      const res = await authApi.login({ email, password });

      if (res.ok) {
        // API returns { data: { user, accessToken } }
        const { user, accessToken } = res.data;
        await AsyncStorage.setItem(TOKEN_KEY, accessToken);
        syncPrefsFromUser(user);
        set({ loading: false, status: "authenticated", token: accessToken, user });
        return true;
      } else {
        set({ loading: false, error: res.error });
        return false;
      }
    },

    // ── register ──────────────────────────────────────────────────────────────

    register: async (name, email, password) => {
      set({ loading: true, error: null });
      const res = await authApi.register({ name, email, password });

      if (res.ok) {
        // Register doesn't return accessToken — login automatically
        const loginRes = await authApi.login({ email, password });
        if (loginRes.ok) {
          const { user, accessToken } = loginRes.data;
          await AsyncStorage.setItem(TOKEN_KEY, accessToken);
          syncPrefsFromUser(user);
          set({ loading: false, status: "authenticated", token: accessToken, user });
          return true;
        }
        // Fallback: registered but login failed — redirect to login
        set({ loading: false });
        return true;
      } else {
        set({ loading: false, error: res.error });
        return false;
      }
    },

    // ── logout ────────────────────────────────────────────────────────────────

    logout: async () => {
      const { token } = get();

      set({ isLoggingOut: true });

      // Set unauthenticated FIRST — AuthGate redirects immediately
      // Don't wait for API or AsyncStorage before redirecting
      set({
        status: "unauthenticated",
        token: null,
        user: null,
        error: null,
        loading: false,
        isLoggingOut: false,
      });

      // Clean up in background — non-blocking
      AsyncStorage.removeItem(TOKEN_KEY).catch(() => { });
      if (token) {
        authApi.logout(token).catch(() => { });
      }
    },

    clearError: () => set({ error: null }),

    updateUser: (user) => set({ user }),
  };
});
