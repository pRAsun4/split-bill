import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type LoaderVariant = "dots" | "ring" | "pulse" | "bar";

type LoaderProps = {
    variant?: LoaderVariant;
    size?: "sm" | "md" | "lg";
    color?: string;
    label?: string;
};

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_MAP = {
    sm: { dot: 7, ring: 24, bar: 3, gap: 6 },
    md: { dot: 10, ring: 36, bar: 4, gap: 8 },
    lg: { dot: 13, ring: 52, bar: 5, gap: 10 },
};

// ─── Dots Loader ──────────────────────────────────────────────────────────────

function DotsLoader({ size = "md", color = COLORS.primary }: { size?: "sm" | "md" | "lg"; color?: string }) {
    const s = SIZE_MAP[size];
    const anims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const makeAnim = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: -s.dot * 1.1, duration: 320, delay, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 320, useNativeDriver: true }),
                    Animated.delay(400),
                ])
            );

        const a0 = makeAnim(anims[0], 0);
        const a1 = makeAnim(anims[1], 160);
        const a2 = makeAnim(anims[2], 320);

        a0.start(); a1.start(); a2.start();
        return () => { a0.stop(); a1.stop(); a2.stop(); };
    }, []);

    return (
        <View style={[styles.dotsRow, { gap: s.gap }]}>
            {anims.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.dot,
                        {
                            width: s.dot,
                            height: s.dot,
                            borderRadius: s.dot / 2,
                            backgroundColor: color,
                            transform: [{ translateY: anim }],
                        },
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Ring Loader ──────────────────────────────────────────────────────────────

function RingLoader({ size = "md", color = COLORS.primary }: { size?: "sm" | "md" | "lg"; color?: string }) {
    const s = SIZE_MAP[size];
    const spin = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        const spinAnim = Animated.loop(
            Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true })
        );
        const pulseAnim = Animated.loop(
            Animated.sequence([
                Animated.timing(scale, { toValue: 1, duration: 450, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.85, duration: 450, useNativeDriver: true }),
            ])
        );
        spinAnim.start(); pulseAnim.start();
        return () => { spinAnim.stop(); pulseAnim.stop(); };
    }, []);

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

    return (
        <Animated.View
            style={[
                styles.ring,
                {
                    width: s.ring,
                    height: s.ring,
                    borderRadius: s.ring / 2,
                    borderColor: color,
                    borderTopColor: "transparent",
                    borderWidth: s.bar,
                    transform: [{ rotate }, { scale }],
                },
            ]}
        />
    );
}

// ─── Pulse Loader ─────────────────────────────────────────────────────────────

function PulseLoader({ size = "md", color = COLORS.primary }: { size?: "sm" | "md" | "lg"; color?: string }) {
    const s = SIZE_MAP[size];
    const scale1 = useRef(new Animated.Value(1)).current;
    const scale2 = useRef(new Animated.Value(1)).current;
    const opacity1 = useRef(new Animated.Value(0.7)).current;
    const opacity2 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const a1 = Animated.loop(
            Animated.parallel([
                Animated.timing(scale1, { toValue: 2.2, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity1, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        );
        const a2 = Animated.loop(
            Animated.sequence([
                Animated.delay(400),
                Animated.parallel([
                    Animated.timing(scale2, { toValue: 2.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(opacity2, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ]),
            ])
        );
        a1.start(); a2.start();
        return () => { a1.stop(); a2.stop(); };
    }, []);

    const base = s.ring * 0.6;

    return (
        <View style={{ width: s.ring, height: s.ring, alignItems: "center", justifyContent: "center" }}>
            <Animated.View style={[styles.pulseRing, {
                width: base, height: base, borderRadius: base / 2,
                backgroundColor: color, opacity: opacity1, transform: [{ scale: scale1 }],
                position: "absolute",
            }]} />
            <Animated.View style={[styles.pulseRing, {
                width: base, height: base, borderRadius: base / 2,
                backgroundColor: color, opacity: opacity2, transform: [{ scale: scale2 }],
                position: "absolute",
            }]} />
            <View style={[styles.pulseCore, {
                width: base, height: base, borderRadius: base / 2,
                backgroundColor: color,
            }]} />
        </View>
    );
}

// ─── Bar Loader ───────────────────────────────────────────────────────────────

function BarLoader({ size = "md", color = COLORS.primary }: { size?: "sm" | "md" | "lg"; color?: string }) {
    const s = SIZE_MAP[size];
    const bars = [
        useRef(new Animated.Value(0.3)).current,
        useRef(new Animated.Value(0.3)).current,
        useRef(new Animated.Value(0.3)).current,
        useRef(new Animated.Value(0.3)).current,
    ];
    const barHeight = s.ring * 0.7;

    useEffect(() => {
        const make = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                    Animated.delay(500),
                ])
            );

        const anims = bars.map((b, i) => make(b, i * 120));
        anims.forEach((a) => a.start());
        return () => anims.forEach((a) => a.stop());
    }, []);

    return (
        <View style={[styles.barsRow, { gap: s.gap * 0.6, height: barHeight }]}>
            {bars.map((anim, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: s.bar + 2,
                        height: barHeight,
                        borderRadius: s.bar,
                        backgroundColor: color,
                        opacity: anim,
                    }}
                />
            ))}
        </View>
    );
}

// ─── Full Screen Overlay Loader ───────────────────────────────────────────────

export function FullScreenLoader({
    visible,
    label = "Loading...",
    color = COLORS.primary,
}: {
    visible: boolean;
    label?: string;
    color?: string;
}) {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 220,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.fullScreen, { opacity }]}>
            <View style={styles.fullScreenCard}>
                <RingLoader size="lg" color={color} />
                {label ? <Text style={[styles.fullScreenLabel, { color }]}>{label}</Text> : null}
            </View>
        </Animated.View>
    );
}

// ─── Inline Loader ────────────────────────────────────────────────────────────
// Default export — use this inline anywhere

export function Loader({ variant = "dots", size = "md", color = COLORS.primary, label }: LoaderProps) {
    return (
        <View style={styles.inline}>
            {variant === "dots" && <DotsLoader size={size} color={color} />}
            {variant === "ring" && <RingLoader size={size} color={color} />}
            {variant === "pulse" && <PulseLoader size={size} color={color} />}
            {variant === "bar" && <BarLoader size={size} color={color} />}
            {label && <Text style={[styles.inlineLabel, { color }]}>{label}</Text>}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    dotsRow: { flexDirection: "row", alignItems: "center" },
    dot: {},
    ring: { borderStyle: "solid" },
    pulseRing: {},
    pulseCore: {},
    barsRow: { flexDirection: "row", alignItems: "flex-end" },
    inline: { alignItems: "center", gap: 10 },
    inlineLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.88)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
    },
    fullScreenCard: {
        backgroundColor: "#fff",
        borderRadius: 24,
        paddingHorizontal: 36,
        paddingVertical: 28,
        alignItems: "center",
        gap: 16,
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    fullScreenLabel: {
        fontSize: 14,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});