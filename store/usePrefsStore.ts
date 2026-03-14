import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark";
export type Language = "English" | "Hindi" | "Spanish" | "French" | "German" | "Japanese";
export type Currency = "USD" | "INR" | "EUR" | "GBP" | "JPY";

export type NotificationSettings = {
    pushEnabled: boolean;
    expenseAdded: boolean;
    settlementReminder: boolean;
    groupActivity: boolean;
    weeklyDigest: boolean;
};

export type UserProfile = {
    name: string;
    username: string;
    email: string;
    phone: string;
    bio: string;
    initials: string;
    avatarColor: string;
};

type PrefsState = {
    profile: UserProfile;
    theme: ThemeMode;
    language: Language;
    currency: Currency;
    notifications: NotificationSettings;

    // Actions
    updateProfile: (updates: Partial<UserProfile>) => void;
    setTheme: (mode: ThemeMode) => void;
    setLanguage: (lang: Language) => void;
    setCurrency: (currency: Currency) => void;
    updateNotification: (key: keyof NotificationSettings, value: boolean) => void;
};

export const usePrefsStore = create<PrefsState>((set) => ({
    profile: {
        name: "Alex Johnson",
        username: "@alexj",
        email: "alex@example.com",
        phone: "+1 (555) 000-0000",
        bio: "Split bills, not friendships 💸",
        initials: "AJ",
        avatarColor: "#FF6B35",
    },

    theme: "light",
    language: "English",
    currency: "USD",

    notifications: {
        pushEnabled: true,
        expenseAdded: true,
        settlementReminder: true,
        groupActivity: false,
        weeklyDigest: true,
    },

    updateProfile: (updates) =>
        set((s) => {
            const merged = { ...s.profile, ...updates };
            // Auto-compute initials from name
            if (updates.name) {
                const parts = updates.name.trim().split(" ");
                merged.initials = parts.length >= 2
                    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                    : parts[0].slice(0, 2).toUpperCase();
            }
            return { profile: merged };
        }),

    setTheme: (mode) => set({ theme: mode }),
    setLanguage: (lang) => set({ language: lang }),
    setCurrency: (currency) => set({ currency }),
    updateNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),
}));

// ─── Theme palette factory ────────────────────────────────────────────────────

export type ThemeColors = {
    bg: string;
    card: string;
    cardAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    inputBg: string;
    sectionBg: string;
};

export const LIGHT_THEME: ThemeColors = {
    bg: "#FFF8F0",
    card: "#FFFFFF",
    cardAlt: "#FFF3E0",
    border: "#F0EBE5",
    textPrimary: "#1A1A1A",
    textSecondary: "#666666",
    textMuted: "#AAAAAA",
    inputBg: "#F8F4F0",
    sectionBg: "#F5F0EA",
};

export const DARK_THEME: ThemeColors = {
    bg: "#121212",
    card: "#1E1E1E",
    cardAlt: "#2A1F1A",
    border: "#2E2E2E",
    textPrimary: "#F5F5F5",
    textSecondary: "#AAAAAA",
    textMuted: "#666666",
    inputBg: "#2A2A2A",
    sectionBg: "#1A1A1A",
};

export function useThemeColors(): ThemeColors {
    const theme = usePrefsStore((s) => s.theme);
    return theme === "dark" ? DARK_THEME : LIGHT_THEME;
}