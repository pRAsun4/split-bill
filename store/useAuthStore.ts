import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { authApi, AuthUser } from "../lib/api";

const TOKEN_KEY = process.env.EXPO_PUBLIC_TOKEN_KEY ?? "splitty_auth_token";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type AuthState = {
    status: AuthStatus;       // "unknown" while checking AsyncStorage on boot
    token: string | null;
    user: AuthUser | null;
    error: string | null;
    loading: boolean;

    // Actions
    bootstrap: () => Promise<void>;          // called once on app start
    login: (email: string, password: string) => Promise<boolean>;
    register: (name: string, email: string, password: string) => Promise<boolean>;
    forgotPassword: (email: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
    status: "unknown",
    token: null,
    user: null,
    error: null,
    loading: false,

    // ── bootstrap ──────────────────────────────────────────────────────────────
    // Called once from the root layout on mount.
    // Reads persisted token → verifies it → sets status.

    bootstrap: async () => {
        try {
            const stored = await AsyncStorage.getItem(TOKEN_KEY);
            if (!stored) {
                set({ status: "unauthenticated", token: null, user: null });
                return;
            }

            // Verify token is still valid by hitting /auth/me
            const res = await authApi.me(stored);
            if (res.ok) {
                set({ status: "authenticated", token: stored, user: res.data });
            } else {
                // Token expired / invalid — clear it
                await AsyncStorage.removeItem(TOKEN_KEY);
                set({ status: "unauthenticated", token: null, user: null });
            }
        } catch {
            set({ status: "unauthenticated", token: null, user: null });
        }
    },

    // ── login ──────────────────────────────────────────────────────────────────

    login: async (email, password) => {
        set({ loading: true, error: null });
        const res = await authApi.login({ email, password });

        if (res.ok) {
            await AsyncStorage.setItem(TOKEN_KEY, res.data.access_token);
            set({
                loading: false,
                status: "authenticated",
                token: res.data.access_token,
                user: res.data.user,
            });
            return true;
        } else {
            set({ loading: false, error: res.error });
            return false;
        }
    },

    // ── register ───────────────────────────────────────────────────────────────

    register: async (name, email, password) => {
        set({ loading: true, error: null });
        const res = await authApi.register({ name, email, password });

        if (res.ok) {
            await AsyncStorage.setItem(TOKEN_KEY, res.data.access_token);
            set({
                loading: false,
                status: "authenticated",
                token: res.data.access_token,
                user: res.data.user,
            });
            return true;
        } else {
            set({ loading: false, error: res.error });
            return false;
        }
    },

    // ── forgotPassword ─────────────────────────────────────────────────────────

    forgotPassword: async (email) => {
        set({ loading: true, error: null });
        const res = await authApi.forgotPassword({ email });

        if (res.ok) {
            set({ loading: false });
            return true;
        } else {
            set({ loading: false, error: res.error });
            return false;
        }
    },

    // ── logout ─────────────────────────────────────────────────────────────────

    logout: async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        set({ status: "unauthenticated", token: null, user: null, error: null });
    },

    clearError: () => set({ error: null }),
}));