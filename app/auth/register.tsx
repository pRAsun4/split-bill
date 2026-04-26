import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Loader } from "../../components/Loader";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";

// ─── Password Strength Indicator ──────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
    const hasLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const score = [hasLen, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;

    if (!password) return null;

    const colors = ["#FF4444", "#FF9F43", "#FFD166", "#4CAF50"];
    const labels = ["Weak", "Fair", "Good", "Strong"];

    return (
        <View style={strengthStyles.wrap}>
            <View style={strengthStyles.bars}>
                {[0, 1, 2, 3].map((i) => (
                    <View
                        key={i}
                        style={[
                            strengthStyles.bar,
                            { backgroundColor: i < score ? colors[score - 1] : "#EEE8E0" },
                        ]}
                    />
                ))}
            </View>
            <Text style={[strengthStyles.label, { color: colors[score - 1] ?? "#C0B8B0" }]}>
                {password.length > 0 ? labels[score - 1] ?? "Weak" : ""}
            </Text>
        </View>
    );
}

const strengthStyles = StyleSheet.create({
    wrap: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, marginTop: 4 },
    bars: { flexDirection: "row", gap: 4, flex: 1 },
    bar: { flex: 1, height: 4, borderRadius: 2 },
    label: { fontSize: FONT.xs, fontWeight: FONT.bold, width: 46, textAlign: "right" },
});

// ─── Auth Input (same pattern as login) ───────────────────────────────────────

function AuthInput({
    label, icon, value, onChangeText, placeholder,
    secureTextEntry, keyboardType, autoCapitalize, error, delay,
}: {
    label: string; icon: string; value: string;
    onChangeText: (v: string) => void; placeholder?: string;
    secureTextEntry?: boolean; keyboardType?: any;
    autoCapitalize?: any; error?: string; delay: number;
}) {
    const [focused, setFocused] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    const onFocus = () => { setFocused(true); Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
    const onBlur = () => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? COLORS.danger : "#E8E0D8", COLORS.primary],
    });

    return (
        <Animated.View style={[styles.inputWrap, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
            <Text style={styles.inputLabel}>{label}</Text>
            <Animated.View style={[styles.inputBox, { borderColor }, error && { borderColor: COLORS.danger }]}>
                <Ionicons name={icon as any} size={18} color={focused ? COLORS.primary : "#C0B8B0"} />
                <TextInput
                    style={styles.inputText}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#C8C0B8"
                    secureTextEntry={secureTextEntry && !showPw}
                    keyboardType={keyboardType ?? "default"}
                    autoCapitalize={autoCapitalize ?? "none"}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    autoCorrect={false}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setShowPw((p) => !p)}>
                        <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color="#C0B8B0" />
                    </TouchableOpacity>
                )}
            </Animated.View>
            {error && (
                <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RegisterScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const headerY = useRef(new Animated.Value(-30)).current;
    const headerOp = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
            Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = "Full name is required";
        if (!email.trim()) e.email = "Email is required";
        else if (!email.includes("@")) e.email = "Enter a valid email";
        if (!password) e.password = "Password is required";
        else if (password.length < 6) e.password = "At least 6 characters";
        if (!confirm) e.confirm = "Please confirm your password";
        else if (confirm !== password) e.confirm = "Passwords don't match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleRegister = () => {
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.replace("/(tabs)");
        }, 2000);
    };

    const handleGoogle = () => {
        router.replace("/(tabs)");
    };

    const clearError = (key: string) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

    return (
        <View style={[styles.root, { backgroundColor: "#FFF8F0" }]}>
            <LinearGradient colors={GRAD} style={[styles.topBand, { paddingTop: insets.top }]}>
                <Animated.View style={[styles.headerRow, { transform: [{ translateY: headerY }], opacity: headerOp }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerLogoRow}>
                        <View style={styles.headerLogoBox}>
                            <Ionicons name="flash" size={16} color="#fff" />
                        </View>
                        <Text style={styles.headerLogoText}>Splitty</Text>
                    </View>
                    <View style={{ width: 38 }} />
                </Animated.View>
            </LinearGradient>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACE.xl }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Title */}
                    <Animated.View style={[styles.titleBlock, { transform: [{ translateY: headerY }], opacity: headerOp }]}>
                        <Text style={styles.title}>Create account ✨</Text>
                        <Text style={styles.subtitle}>Start splitting expenses in seconds</Text>
                    </Animated.View>

                    {/* Form */}
                    <View style={styles.card}>
                        <AuthInput
                            label="Full Name"
                            icon="person-outline"
                            value={name}
                            onChangeText={(v) => { setName(v); clearError("name"); }}
                            placeholder="Alex Johnson"
                            autoCapitalize="words"
                            error={errors.name}
                            delay={60}
                        />
                        <AuthInput
                            label="Email address"
                            icon="mail-outline"
                            value={email}
                            onChangeText={(v) => { setEmail(v); clearError("email"); }}
                            placeholder="you@email.com"
                            keyboardType="email-address"
                            error={errors.email}
                            delay={120}
                        />

                        {/* Password with strength */}
                        <Animated.View style={styles.inputWrap}>
                            <AuthInput
                                label="Password"
                                icon="lock-closed-outline"
                                value={password}
                                onChangeText={(v) => { setPassword(v); clearError("password"); }}
                                placeholder="Min. 6 characters"
                                secureTextEntry
                                error={errors.password}
                                delay={180}
                            />
                            <PasswordStrength password={password} />
                        </Animated.View>

                        <AuthInput
                            label="Confirm Password"
                            icon="shield-checkmark-outline"
                            value={confirm}
                            onChangeText={(v) => { setConfirm(v); clearError("confirm"); }}
                            placeholder="Repeat password"
                            secureTextEntry
                            error={errors.confirm}
                            delay={240}
                        />

                        {/* Register button */}
                        <Animated.View style={{ marginTop: SPACE.sm }}>
                            <TouchableOpacity
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={0.88}
                                style={{ borderRadius: RADIUS.xl, overflow: "hidden" }}
                            >
                                <LinearGradient
                                    colors={GRAD_SHORT}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitBtn}
                                >
                                    {loading ? (
                                        <Loader variant="dots" size="sm" color="#fff" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Create Account</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google */}
                        <TouchableOpacity onPress={handleGoogle} style={styles.googleBtn} activeOpacity={0.85}>
                            <View style={styles.googleIconWrap}>
                                <Text style={styles.googleG}>G</Text>
                            </View>
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Login link */}
                    <View style={styles.switchRow}>
                        <Text style={styles.switchText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace("/auth/login")}>
                            <Text style={styles.switchLink}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    topBand: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },
    headerRow: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: SPACE.sm,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    headerLogoRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
    headerLogoBox: {
        width: 28, height: 28, borderRadius: 9,
        backgroundColor: "rgba(255,255,255,0.22)",
        alignItems: "center", justifyContent: "center",
    },
    headerLogoText: { fontSize: FONT.lg, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
    scrollContent: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl },
    titleBlock: { marginBottom: SPACE.xl },
    title: { fontSize: 28, fontWeight: FONT.black, color: "#1A1A1A", letterSpacing: -0.6 },
    subtitle: { fontSize: FONT.base, color: "#888", marginTop: 4 },
    card: {
        backgroundColor: "#fff", borderRadius: RADIUS.xxl,
        padding: SPACE.xl, ...SHADOW.md, gap: SPACE.sm,
    },
    inputWrap: { gap: 2 },
    inputLabel: {
        fontSize: FONT.xs, fontWeight: FONT.bold,
        color: "#888", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4,
    },
    inputBox: {
        flexDirection: "row", alignItems: "center",
        borderWidth: 1.5, borderRadius: RADIUS.lg,
        backgroundColor: "#FAF7F5",
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2, gap: SPACE.sm,
    },
    inputText: { flex: 1, fontSize: FONT.base, color: "#1A1A1A", fontWeight: FONT.medium },
    errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
    errorText: { fontSize: FONT.xs, color: COLORS.danger, fontWeight: FONT.medium },
    submitBtn: {
        paddingVertical: 15, alignItems: "center",
        justifyContent: "center", borderRadius: RADIUS.xl, minHeight: 52,
    },
    submitBtnText: { fontSize: FONT.md, fontWeight: FONT.black, color: "#fff", letterSpacing: 0.3 },
    divider: {
        flexDirection: "row", alignItems: "center",
        gap: SPACE.md, marginVertical: SPACE.xs,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: "#EEE8E0" },
    dividerText: { fontSize: FONT.sm, color: "#C0B8B0", fontWeight: FONT.medium },
    googleBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: SPACE.md, borderWidth: 1.5, borderColor: "#E8E0D8",
        borderRadius: RADIUS.xl, paddingVertical: 13, backgroundColor: "#fff",
    },
    googleIconWrap: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: "#4285F4", alignItems: "center", justifyContent: "center",
    },
    googleG: { color: "#fff", fontSize: 13, fontWeight: "900" },
    googleBtnText: { fontSize: FONT.base, fontWeight: FONT.semibold, color: "#333" },
    switchRow: {
        flexDirection: "row", justifyContent: "center",
        alignItems: "center", marginTop: SPACE.xl,
    },
    switchText: { fontSize: FONT.base, color: "#888" },
    switchLink: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.primary },
});