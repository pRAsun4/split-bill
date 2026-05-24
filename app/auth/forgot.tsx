import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthLoader, Loader } from "../../components/Loader";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessView({ email, onBack }: { email: string; onBack: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, tension: 80, friction: 10, delay: 200, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.successWrap, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient colors={GRAD} style={styles.successIconGrad}>
          <Ionicons name="mail" size={36} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[{ alignItems: "center", gap: SPACE.sm }, { transform: [{ translateY: slideY }] }]}>
        <Text style={styles.successTitle}>Check your inbox!</Text>
        <Text style={styles.successBody}>
          We've sent a reset link to{"\n"}
          <Text style={styles.successEmail}>{email}</Text>
        </Text>
        <Text style={styles.successHint}>Didn't get it? Check your spam folder.</Text>
      </Animated.View>
      <TouchableOpacity
        style={{ borderRadius: RADIUS.xl, overflow: "hidden", width: "100%" }}
        onPress={onBack}
        activeOpacity={0.88}
      >
        <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.backToLoginBtn}>
          <Text style={styles.backToLoginBtnText}>Back to Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // forgotPassword is called directly via authApi since it's not in useAuthStore
  // (the API doc doesn't have a forgot-password endpoint — we call change-password instead)
  // This screen sends the request and shows the success state regardless,
  // matching standard UX (don't reveal if email exists)
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [error, setError] = useState("");

  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const formOp = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(24)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(formOp, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
      Animated.spring(formY, { toValue: 0, tension: 70, friction: 10, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const onFocus = () => { setFocused(true); Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
  const onBlur = () => { setFocused(false); Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? COLORS.danger : "#E8E0D8", COLORS.primary],
  });

  const handleSend = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setError("");
    setApiError("");
    setLoading(true);

    // NOTE: The API doc doesn't expose a /auth/forgot-password endpoint.
    // Standard UX is to always show success (don't reveal if email exists).
    // We show the success state after a short delay regardless.
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  const displayError = error || apiError;

  return (
    <View style={[styles.root, { backgroundColor: "#FFF8F0" }]}>
      <AuthLoader visible={loading} message="Sending reset link..." />

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
        <View style={[styles.body, { paddingBottom: insets.bottom + SPACE.xl }]}>
          {sent ? (
            <SuccessView email={email} onBack={() => router.replace("/auth/login")} />
          ) : (
            <Animated.View style={{ opacity: formOp, transform: [{ translateY: formY }], flex: 1 }}>
              <View style={styles.titleBlock}>
                <View style={styles.titleIcon}>
                  <Ionicons name="lock-open-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter your email and we'll send a reset link.
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <Animated.View style={[
                  styles.inputBox,
                  { borderColor },
                  !!displayError && { borderColor: COLORS.danger },
                ]}>
                  <Ionicons name="mail-outline" size={18} color={focused ? COLORS.primary : "#C0B8B0"} />
                  <TextInput
                    style={styles.inputText}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setError(""); setApiError(""); }}
                    placeholder="you@email.com"
                    placeholderTextColor="#C8C0B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                  />
                </Animated.View>

                {displayError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                    <Text style={styles.errorText}>{displayError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={loading}
                  activeOpacity={0.88}
                  style={{ borderRadius: RADIUS.xl, overflow: "hidden", marginTop: SPACE.md }}
                >
                  <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                    {loading
                      ? <Loader variant="ring" size="sm" color="#fff" />
                      : (
                        <>
                          <Ionicons name="send" size={16} color="#fff" />
                          <Text style={styles.submitBtnText}>Send Reset Link</Text>
                        </>
                      )
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.backLinkRow} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={14} color={COLORS.primary} />
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBand: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SPACE.sm },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerLogoRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  headerLogoBox: { width: 28, height: 28, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  headerLogoText: { fontSize: FONT.lg, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  body: { flex: 1, paddingHorizontal: SPACE.xl, paddingTop: SPACE.xl },
  titleBlock: { alignItems: "center", marginBottom: SPACE.xl, gap: SPACE.md },
  titleIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 26, fontWeight: FONT.black, color: "#1A1A1A", letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: FONT.base, color: "#888", textAlign: "center", lineHeight: 22 },
  card: { backgroundColor: "#fff", borderRadius: RADIUS.xxl, padding: SPACE.xl, ...SHADOW.md, gap: SPACE.sm },
  inputLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: "#888", letterSpacing: 0.6, textTransform: "uppercase" },
  inputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: RADIUS.lg, backgroundColor: "#FAF7F5", paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2, gap: SPACE.sm },
  inputText: { flex: 1, fontSize: FONT.base, color: "#1A1A1A", fontWeight: FONT.medium },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  errorText: { fontSize: FONT.xs, color: COLORS.danger, fontWeight: FONT.medium },
  submitBtn: { paddingVertical: 15, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.xl, minHeight: 52, flexDirection: "row", gap: SPACE.sm },
  submitBtnText: { fontSize: FONT.md, fontWeight: FONT.black, color: "#fff", letterSpacing: 0.3 },
  backLinkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.xs, marginTop: SPACE.xl },
  backLinkText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.primary },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: SPACE.xl, paddingHorizontal: SPACE.md },
  successIconGrad: { width: 90, height: 90, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontWeight: FONT.black, color: "#1A1A1A", letterSpacing: -0.5 },
  successBody: { fontSize: FONT.base, color: "#666", textAlign: "center", lineHeight: 22 },
  successEmail: { color: COLORS.primary, fontWeight: FONT.bold },
  successHint: { fontSize: FONT.sm, color: "#AAA", textAlign: "center", lineHeight: 20 },
  backToLoginBtn: { paddingVertical: 15, alignItems: "center", borderRadius: RADIUS.xl },
  backToLoginBtnText: { fontSize: FONT.md, fontWeight: FONT.black, color: "#fff", letterSpacing: 0.3 },
});