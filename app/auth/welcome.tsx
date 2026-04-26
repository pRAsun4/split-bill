import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, GRAD, RADIUS, SPACE } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

// ─── Floating Coin ────────────────────────────────────────────────────────────

function FloatingCoin({
    emoji,
    x,
    y,
    size,
    delay,
    duration,
}: {
    emoji: string;
    x: number;
    y: number;
    size: number;
    delay: number;
    duration: number;
}) {
    const floatY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(opacity, { toValue: 0.85, duration: 600, delay, useNativeDriver: true }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(floatY, { toValue: -14, duration, delay, useNativeDriver: true }),
                Animated.timing(floatY, { toValue: 0, duration, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(rotate, { toValue: 1, duration: duration * 1.5, delay, useNativeDriver: true }),
                Animated.timing(rotate, { toValue: -1, duration: duration * 1.5, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const rot = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-8deg", "8deg"] });

    return (
        <Animated.View
            style={[
                styles.floatCoin,
                {
                    left: x,
                    top: y,
                    width: size,
                    height: size,
                    opacity,
                    transform: [{ translateY: floatY }, { rotate: rot }],
                },
            ]}
        >
            <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Entrance animations
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(30)).current;
    const taglineOp = useRef(new Animated.Value(0)).current;
    const btnsY = useRef(new Animated.Value(40)).current;
    const btnsOp = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance sequence
        Animated.sequence([
            // 1. Ring expands behind logo
            Animated.parallel([
                Animated.spring(ringScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
                Animated.timing(ringOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            // 2. Logo pops in
            Animated.parallel([
                Animated.spring(logoScale, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
                Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]),
            // 3. Tagline slides up
            Animated.parallel([
                Animated.spring(taglineY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
                Animated.timing(taglineOp, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            // 4. Buttons slide up
            Animated.parallel([
                Animated.spring(btnsY, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
                Animated.timing(btnsOp, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const coins = [
        { emoji: "💸", x: width * 0.06, y: height * 0.12, size: 44, delay: 800, duration: 2200 },
        { emoji: "🧾", x: width * 0.76, y: height * 0.08, size: 38, delay: 1000, duration: 1900 },
        { emoji: "💳", x: width * 0.82, y: height * 0.28, size: 36, delay: 600, duration: 2400 },
        { emoji: "✈️", x: width * 0.04, y: height * 0.32, size: 34, delay: 900, duration: 2000 },
        { emoji: "🍕", x: width * 0.70, y: height * 0.55, size: 32, delay: 1100, duration: 2100 },
        { emoji: "🎉", x: width * 0.08, y: height * 0.58, size: 30, delay: 700, duration: 2300 },
    ];

    return (
        <LinearGradient colors={GRAD} style={styles.root}>
            {/* Floating background elements */}
            {coins.map((c, i) => <FloatingCoin key={i} {...c} />)}

            {/* Decorative rings */}
            <Animated.View
                style={[
                    styles.bgRing,
                    styles.bgRing1,
                    { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
            />
            <Animated.View
                style={[
                    styles.bgRing,
                    styles.bgRing2,
                    { transform: [{ scale: ringScale }], opacity: ringOpacity },
                ]}
            />

            {/* Center content */}
            <View style={styles.center}>
                {/* Logo */}
                <Animated.View
                    style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}
                >
                    <View style={styles.logoBox}>
                        <Ionicons name="flash" size={36} color="#fff" />
                    </View>
                    <Text style={styles.logoText}>Splitty</Text>
                </Animated.View>

                {/* Tagline */}
                <Animated.View
                    style={{ transform: [{ translateY: taglineY }], opacity: taglineOp, alignItems: "center" }}
                >
                    <Text style={styles.tagline}>Split bills,</Text>
                    <Text style={styles.taglineAccent}>not friendships.</Text>
                    <Text style={styles.taglineSub}>
                        Track shared expenses with your{"\n"}friends, instantly.
                    </Text>
                </Animated.View>
            </View>

            {/* Bottom CTAs */}
            <Animated.View
                style={[
                    styles.btns,
                    { paddingBottom: insets.bottom + SPACE.xl },
                    { transform: [{ translateY: btnsY }], opacity: btnsOp },
                ]}
            >
                {/* Sign In */}
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => router.push("/auth/login")}
                    activeOpacity={0.88}
                >
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                </TouchableOpacity>

                {/* Register */}
                <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => router.push("/auth/register")}
                    activeOpacity={0.88}
                >
                    <Text style={styles.secondaryBtnText}>Create Account</Text>
                </TouchableOpacity>

                <Text style={styles.bottomNote}>
                    By continuing you agree to our{" "}
                    <Text style={styles.bottomNoteLink}>Terms</Text>
                    {" & "}
                    <Text style={styles.bottomNoteLink}>Privacy Policy</Text>
                </Text>
            </Animated.View>
        </LinearGradient>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },

    floatCoin: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.15)",
    },

    bgRing: {
        position: "absolute",
        borderRadius: 999,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.18)",
    },
    bgRing1: {
        width: width * 0.85,
        height: width * 0.85,
        top: height * 0.12,
        left: -(width * 0.18),
    },
    bgRing2: {
        width: width * 0.6,
        height: width * 0.6,
        bottom: height * 0.22,
        right: -(width * 0.15),
    },

    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.xl,
        paddingHorizontal: SPACE.xl,
    },

    logoWrap: {
        alignItems: "center",
        gap: SPACE.md,
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 28,
        backgroundColor: "rgba(255,255,255,0.22)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.4)",
    },
    logoText: {
        fontSize: 42,
        fontWeight: "900",
        color: "#fff",
        letterSpacing: -1.5,
    },

    tagline: {
        fontSize: 36,
        fontWeight: "800",
        color: "#fff",
        letterSpacing: -0.8,
        textAlign: "center",
    },
    taglineAccent: {
        fontSize: 36,
        fontWeight: "800",
        color: "rgba(255,255,255,0.75)",
        letterSpacing: -0.8,
        textAlign: "center",
        marginTop: -4,
    },
    taglineSub: {
        fontSize: 15,
        color: "rgba(255,255,255,0.65)",
        textAlign: "center",
        marginTop: SPACE.md,
        lineHeight: 22,
    },

    btns: {
        paddingHorizontal: SPACE.xl,
        gap: SPACE.md,
    },
    primaryBtn: {
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        paddingVertical: 16,
        alignItems: "center",
    },
    primaryBtnText: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.primary,
        letterSpacing: 0.2,
    },
    secondaryBtn: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: RADIUS.xl,
        paddingVertical: 16,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.45)",
    },
    secondaryBtnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.2,
    },
    bottomNote: {
        fontSize: 12,
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
        marginTop: SPACE.xs,
    },
    bottomNoteLink: {
        color: "rgba(255,255,255,0.75)",
        fontWeight: "600",
        textDecorationLine: "underline",
    },
});