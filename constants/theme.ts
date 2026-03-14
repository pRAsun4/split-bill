// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
    // Gradient
    gradStart: "#FF6B35",
    gradMid: "#FFA833",
    gradEnd: "#FFD166",

    // Semantic
    primary: "#FF6B35",
    primaryLight: "#FF8C42",
    success: "#4CAF50",
    danger: "#FF4444",
    dangerLight: "#FF6B6B",

    // Neutrals
    white: "#FFFFFF",
    bg: "#FFF8F0",       // warm off-white body
    card: "#FFFFFF",
    border: "#F0EBE5",
    textPrimary: "#1A1A1A",
    textSecondary: "#666666",
    textMuted: "#AAAAAA",
    textOnGradient: "#FFFFFF",

    // Overlay
    overlayLight: "rgba(255,255,255,0.2)",
    overlayMid: "rgba(255,255,255,0.85)",
    overlayStrong: "rgba(255,255,255,0.95)",
};

export const GRAD: [string, string, string] = [
    COLORS.gradStart,
    COLORS.gradMid,
    COLORS.gradEnd,
];

export const GRAD_SHORT: [string, string] = [COLORS.gradStart, COLORS.primaryLight];

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT = {
    // weights
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    black: "800" as const,

    // sizes
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const SPACE = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// ─── Radii ────────────────────────────────────────────────────────────────────
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 100,
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const SHADOW = {
    sm: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    md: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    lg: {
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
        elevation: 8,
    },
};

// ─── Emoji map for categories ─────────────────────────────────────────────────
export const CATEGORY_EMOJI: Record<string, string> = {
    Food: "🍽️",
    Transport: "✈️",
    Shopping: "🛍️",
    Gift: "🎁",
    Accommodation: "🏠",
    Entertainment: "🎉",
    Utilities: "⚡",
    Other: "💰",
};