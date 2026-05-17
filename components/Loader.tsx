/**
 * Loader.tsx
 * ──────────
 * USE ONLY FOR AUTHENTICATION:  login, register, logout, forgot password.
 * For all other data-fetching states, use <Skeleton> from Skeleton.tsx.
 *
 * Exports:
 *   <Loader />           — inline loader (inside buttons)
 *   <AuthLoader />       — full-screen branded overlay for auth flows
 */

import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { COLORS, FONT } from "../constants/theme";

const { width, height } = Dimensions.get("window");

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_MAP = {
    sm: { dot: 7, ring: 22, stroke: 2.5, gap: 6 },
    md: { dot: 10, ring: 34, stroke: 3, gap: 8 },
    lg: { dot: 14, ring: 50, stroke: 4, gap: 10 },
};

type SizeKey = "sm" | "md" | "lg";

// ─── 1. Dots Loader ───────────────────────────────────────────────────────────
// Three dots that bounce up one by one in sequence.

export function DotsLoader({
    size = "md",
    color = COLORS.primary,
}: {
    size?: SizeKey;
    color?: string;
}) {
    const s = SIZE_MAP[size];
    const anims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const make = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: -(s.dot * 1.4),
                        duration: 280,
                        easing: Easing.out(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 280,
                        easing: Easing.in(Easing.quad),
                        useNativeDriver: true,
                    }),
                    Animated.delay(360),
                ])
            );

        const a0 = make(anims[0], 0);
        const a1 = make(anims[1], 140);
        const a2 = make(anims[2], 280);
        a0.start(); a1.start(); a2.start();
        return () => { a0.stop(); a1.stop(); a2.stop(); };
    }, []);

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: s.gap }}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: s.dot,
                        height: s.dot,
                        borderRadius: s.dot / 2,
                        backgroundColor: color,
                        transform: [{ translateY: anim }],
                    }}
                />
            ))}
        </View>
    );
}

// ─── 2. Ring Loader ───────────────────────────────────────────────────────────
// Smooth spinning arc using proper Easing.linear — no stutter on Android.

export function RingLoader({
    size = "md",
    color = COLORS.primary,
}: {
    size?: SizeKey;
    color?: string;
}) {
    const s = SIZE_MAP[size];
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 750,
                easing: Easing.linear,   // ← critical: linear = smooth on Android
                useNativeDriver: true,
            })
        );
        anim.start();
        return () => anim.stop();
    }, []);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View
            style={{
                width: s.ring,
                height: s.ring,
                borderRadius: s.ring / 2,
                borderWidth: s.stroke,
                borderColor: `${color}30`,      // faint full ring
                borderTopColor: color,           // bright arc
                transform: [{ rotate }],
            }}
        />
    );
}

// ─── 3. Brand Spinner ─────────────────────────────────────────────────────────
// Larger ring with the Splitty gradient tint — used inside AuthLoader.

function BrandSpinner() {
    const spin = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        const spinAnim = Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 900,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        const pulseAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 0.92,
                    duration: 600,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        );
        spinAnim.start();
        pulseAnim.start();
        return () => { spinAnim.stop(); pulseAnim.stop(); };
    }, []);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            {/* Outer glow ring */}
            <Animated.View
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 4,
                    borderColor: `${COLORS.primary}20`,
                    borderTopColor: COLORS.primary,
                    borderRightColor: COLORS.primaryLight,
                    transform: [{ rotate }],
                    position: "absolute",
                }}
            />
            {/* Logo mark center */}
            <View
                style={{
                    width: 64,
                    height: 64,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: "#FFF3E0",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text style={{ fontSize: 18 }}>⚡</Text>
                </View>
            </View>
        </Animated.View>
    );
}

// ─── 4. AuthLoader ────────────────────────────────────────────────────────────
// Full-screen overlay. ONLY use for: login, register, logout, forgot password.
// Fades in/out smoothly. Shows branded spinner + contextual message.

export function AuthLoader({
    visible,
    message = "Please wait...",
}: {
    visible: boolean;
    message?: string;
}) {
    const opacity = useRef(new Animated.Value(0)).current;
    const cardScale = useRef(new Animated.Value(0.92)).current;
    const dotAnims = [
        useRef(new Animated.Value(0.4)).current,
        useRef(new Animated.Value(0.4)).current,
        useRef(new Animated.Value(0.4)).current,
    ];

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(cardScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
            ]).start();

            // Dot pulse animation for the message text
            const makeText = (anim: Animated.Value, delay: number) =>
                Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
                        Animated.delay(600),
                    ])
                );
            dotAnims.forEach((a, i) => makeText(a, i * 180).start());
        } else {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(cardScale, { toValue: 0.92, duration: 180, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.overlay, { opacity }]}>
            {/* Blurred backdrop */}
            <View style={styles.backdrop} />

            <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
                {/* Brand spinner */}
                <BrandSpinner />

                {/* Message */}
                <Text style={styles.message}>{message}</Text>

                {/* Animated dots suffix */}
                <View style={styles.dotsRow}>
                    {dotAnims.map((anim, i) => (
                        <Animated.View
                            key={i}
                            style={[styles.textDot, { opacity: anim }]}
                        />
                    ))}
                </View>
            </Animated.View>
        </Animated.View>
    );
}

// ─── 5. Inline Loader ─────────────────────────────────────────────────────────
// Tiny inline use — ONLY inside auth submit buttons.

export function Loader({
    variant = "dots",
    size = "md",
    color = COLORS.primary,
}: {
    variant?: "dots" | "ring";
    size?: SizeKey;
    color?: string;
}) {
    if (variant === "ring") return <RingLoader size={size} color={color} />;
    return <DotsLoader size={size} color={color} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 248, 240, 0.92)",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 28,
        paddingVertical: 36,
        paddingHorizontal: 48,
        alignItems: "center",
        gap: 16,
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 32,
        elevation: 16,
        borderWidth: 1,
        borderColor: "#FFF0E6",
    },
    message: {
        fontSize: FONT.base,
        fontWeight: FONT.semibold,
        color: COLORS.textSecondary,
        letterSpacing: 0.2,
        marginTop: 4,
    },
    dotsRow: {
        flexDirection: "row",
        gap: 5,
        marginTop: -8,
    },
    textDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: COLORS.primary,
    },
});