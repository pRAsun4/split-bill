import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthLoader, Loader } from "../../components/Loader";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAuthStore } from "../../store/useAuthStore";

// ─── Animated Input ───────────────────────────────────────────────────────────

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
      <Animated.View style={[styles.inputBox, { borderColor }, !!error && { borderColor: COLORS.danger }]}>
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
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, loading, error: authError, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Local field errors (client-side) + merged with API field errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    return () => clearError();
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!email.includes("@")) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const ok = await login(email, password);
    // If the API returns field-level errors, surface them
    if (!ok) {
      const store = useAuthStore.getState();
      // authError is the general message — shown in the banner
      // fieldErrors are per-field — map them to local state
      // (login() stores them on the store if needed; we use authError banner for now)
    }
    // On success AuthGate in _layout.tsx auto-redirects to /(tabs)
  };

  return (
    <View style={styles.root}>
      <AuthLoader visible={loading} message="Signing you in..." />

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
          <Animated.View style={[styles.titleBlock, { transform: [{ translateY: headerY }], opacity: headerOp }]}>
            <Text style={styles.title}>Welcome back 👋</Text>
            <Text style={styles.subtitle}>Sign in to continue splitting</Text>
          </Animated.View>

          <View style={styles.card}>
            {/* API error banner */}
            {authError ? (
              <View style={styles.apiBanner}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.apiBannerText}>{authError}</Text>
              </View>
            ) : null}

            <AuthInput
              label="Email address" icon="mail-outline"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); clearError(); }}
              placeholder="you@email.com"
              keyboardType="email-address"
              error={errors.email}
              delay={80}
            />
            <AuthInput
              label="Password" icon="lock-closed-outline"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); clearError(); }}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password}
              delay={160}
            />

            <TouchableOpacity style={styles.forgotRow} onPress={() => router.push("/auth/forgot")}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              style={{ borderRadius: RADIUS.xl, overflow: "hidden", marginTop: SPACE.sm }}
            >
              <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                {loading
                  ? <Loader variant="dots" size="sm" color="#fff" />
                  : <Text style={styles.submitBtnText}>Sign In</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google — placeholder until OAuth is implemented */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85}>
              <View style={styles.googleIconWrap}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/auth/register")}>
              <Text style={styles.switchLink}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF8F0" },
  topBand: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SPACE.sm },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  headerLogoBox: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  headerLogoText: { fontSize: FONT.lg, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl },
  titleBlock: { marginBottom: SPACE.xl },
  title: { fontSize: 28, fontWeight: FONT.black, color: "#1A1A1A", letterSpacing: -0.6 },
  subtitle: { fontSize: FONT.base, color: "#888", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: RADIUS.xxl, padding: SPACE.xl, ...SHADOW.md, gap: SPACE.sm },
  apiBanner: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, backgroundColor: "#FFEBEE", borderRadius: RADIUS.lg, padding: SPACE.md, borderWidth: 1, borderColor: "#FFCDD2" },
  apiBannerText: { flex: 1, fontSize: FONT.sm, color: COLORS.danger, fontWeight: FONT.medium },
  inputWrap: { gap: SPACE.xs },
  inputLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: "#888", letterSpacing: 0.6, textTransform: "uppercase" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: RADIUS.lg, backgroundColor: "#FAF7F5", paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2, gap: SPACE.sm },
  inputText: { flex: 1, fontSize: FONT.base, color: "#1A1A1A", fontWeight: FONT.medium },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorText: { fontSize: FONT.xs, color: COLORS.danger, fontWeight: FONT.medium },
  forgotRow: { alignItems: "flex-end", marginTop: -SPACE.xs },
  forgotText: { fontSize: FONT.sm, color: COLORS.primary, fontWeight: FONT.semibold },
  submitBtn: { paddingVertical: 15, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.xl, minHeight: 52 },
  submitBtnText: { fontSize: FONT.md, fontWeight: FONT.black, color: "#fff", letterSpacing: 0.3 },
  divider: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginVertical: SPACE.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#EEE8E0" },
  dividerText: { fontSize: FONT.sm, color: "#C0B8B0", fontWeight: FONT.medium },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.md, borderWidth: 1.5, borderColor: "#E8E0D8", borderRadius: RADIUS.xl, paddingVertical: 13, backgroundColor: "#fff" },
  googleIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#4285F4", alignItems: "center", justifyContent: "center" },
  googleG: { color: "#fff", fontSize: 13, fontWeight: "900" },
  googleBtnText: { fontSize: FONT.base, fontWeight: FONT.semibold, color: "#333" },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: SPACE.xl },
  switchText: { fontSize: FONT.base, color: "#888" },
  switchLink: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.primary },
});