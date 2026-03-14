import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from "react-native";
import { COLORS, FONT, GRAD_SHORT, RADIUS, SPACE } from "../constants/theme";

// ─── Avatar ───────────────────────────────────────────────────────────────────

type AvatarProps = {
    initials: string;
    color?: string;
    size?: number;
    style?: ViewStyle;
};

export function Avatar({ initials, color = COLORS.primary, size = 40, style }: AvatarProps) {
    return (
        <View
            style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                },
                style,
            ]}
        >
            <Text
                style={{
                    color: "#fff",
                    fontWeight: FONT.bold,
                    fontSize: size * 0.34,
                    letterSpacing: 0.5,
                }}
            >
                {initials}
            </Text>
        </View>
    );
}

// ─── Animated Fade-In Card ────────────────────────────────────────────────────

type FadeCardProps = {
    children: React.ReactNode;
    delay?: number;
    style?: ViewStyle;
};

export function FadeCard({ children, delay = 0, style }: FadeCardProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 380,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay,
                useNativeDriver: true,
                tension: 80,
                friction: 10,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
            {children}
        </Animated.View>
    );
}

// ─── Press Scale Wrapper ──────────────────────────────────────────────────────

type PressScaleProps = {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    scale?: number;
};

export function PressScale({ children, onPress, style, scale = 0.97 }: PressScaleProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: scale, useNativeDriver: true, tension: 200, friction: 10 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            style={style}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                {children}
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Balance Pill Badge ───────────────────────────────────────────────────────

type BalancePillProps = {
    label: string;
    amount: number;
    type: "owed" | "owes" | "settled";
};

export function BalancePill({ label, amount, type }: BalancePillProps) {
    const bg =
        type === "owed" ? "#E8F5E9" : type === "owes" ? "#FFEBEE" : "#F5F5F5";
    const color =
        type === "owed" ? COLORS.success : type === "owes" ? COLORS.danger : COLORS.textMuted;

    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillLabel, { color: COLORS.textSecondary }]}>{label}</Text>
            <Text style={[styles.pillAmount, { color }]}>
                {type === "settled" ? "Settled up" : `$${amount.toFixed(2)}`}
            </Text>
        </View>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({
    title,
    action,
    onAction,
    style,
}: {
    title: string;
    action?: string;
    onAction?: () => void;
    style?: ViewStyle;
}) {
    return (
        <View style={[styles.sectionHeader, style]}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {action && (
                <TouchableOpacity onPress={onAction}>
                    <Text style={styles.sectionAction}>{action}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Gradient Button ──────────────────────────────────────────────────────────

type GradBtnProps = {
    label: string;
    onPress: () => void;
    icon?: string;
    style?: ViewStyle;
    disabled?: boolean;
};

export function GradBtn({ label, onPress, icon, style, disabled }: GradBtnProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
    const onOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={onIn}
            onPressOut={onOut}
            activeOpacity={1}
            disabled={disabled}
            style={[style, { opacity: disabled ? 0.5 : 1 }]}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <LinearGradient
                    colors={GRAD_SHORT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradBtn}
                >
                    {icon && <Ionicons name={icon as any} size={18} color="#fff" />}
                    <Text style={styles.gradBtnText}>{label}</Text>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
    return (
        <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>{emoji}</Text>
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    pill: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SPACE.md,
        paddingVertical: 6,
        borderRadius: RADIUS.pill,
        gap: SPACE.xs,
    },
    pillLabel: {
        fontSize: FONT.sm,
        fontWeight: FONT.medium,
    },
    pillAmount: {
        fontSize: FONT.sm,
        fontWeight: FONT.black,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACE.md,
    },
    sectionTitle: {
        fontSize: FONT.md,
        fontWeight: FONT.bold,
        color: COLORS.textPrimary,
        letterSpacing: 0.2,
    },
    sectionAction: {
        fontSize: FONT.sm,
        fontWeight: FONT.semibold,
        color: COLORS.primary,
    },
    gradBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: SPACE.xl,
        borderRadius: RADIUS.lg,
        gap: SPACE.sm,
    },
    gradBtnText: {
        color: "#fff",
        fontSize: FONT.md,
        fontWeight: FONT.bold,
        letterSpacing: 0.3,
    },
    emptyBox: {
        alignItems: "center",
        paddingVertical: 60,
        gap: SPACE.md,
    },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: {
        fontSize: FONT.xl,
        fontWeight: FONT.bold,
        color: COLORS.textSecondary,
    },
    emptySub: {
        fontSize: FONT.base,
        color: COLORS.textMuted,
        textAlign: "center",
        paddingHorizontal: SPACE.xl,
    },
});