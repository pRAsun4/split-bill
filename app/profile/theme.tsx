import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
    Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { usersApi } from "../../lib/api";
import { useAuthStore } from "../../store/useAuthStore";
import { ThemeMode, usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

function ThemeCard({
  mode, label, description, isSelected, onSelect, delay,
}: {
  mode: ThemeMode; label: string; description: string;
  isSelected: boolean; onSelect: () => void; delay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }).start();

  const isDark       = mode === "dark";
  const previewBg    = isDark ? "#121212" : "#FFF8F0";
  const previewCard  = isDark ? "#1E1E1E" : "#FFFFFF";
  const previewText  = isDark ? "#F5F5F5" : "#1A1A1A";
  const previewMuted = isDark ? "#666"    : "#AAA";

  return (
    <FadeCard delay={delay}>
      <TouchableOpacity onPressIn={onIn} onPressOut={onOut} onPress={onSelect} activeOpacity={1}>
        <Animated.View style={[
          styles.themeCard,
          { backgroundColor: previewBg, borderColor: isSelected ? COLORS.primary : "transparent" },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <View style={[styles.previewHeader, { backgroundColor: isDark ? "#1A1A1A" : "#FF6B35" }]}>
            <View style={styles.previewHeaderDots}>
              <View style={[styles.dot, { backgroundColor: "rgba(255,255,255,0.5)" }]} />
              <View style={[styles.dot, { width: 40, backgroundColor: "rgba(255,255,255,0.5)" }]} />
            </View>
            <View style={styles.previewBalanceRow}>
              {[0, 1].map((i) => (
                <View key={i} style={[styles.previewBalanceCard, { backgroundColor: "rgba(0,0,0,0.18)" }]}>
                  <View style={[styles.previewLine, { width: 30, backgroundColor: "rgba(255,255,255,0.5)" }]} />
                  <View style={[styles.previewLine, { width: 50, backgroundColor: "rgba(255,255,255,0.8)", height: 8 }]} />
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.previewBody, { backgroundColor: previewBg }]}>
            {[1, 2].map((i) => (
              <View key={i} style={[styles.previewRow, { backgroundColor: previewCard }]}>
                <View style={[styles.previewRowIcon, { backgroundColor: isDark ? "#2A1F1A" : "#FFF3E0" }]} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={[styles.previewLine, { width: "60%", backgroundColor: previewText }]} />
                  <View style={[styles.previewLine, { width: "35%", backgroundColor: previewMuted }]} />
                </View>
              </View>
            ))}
          </View>

          <View style={styles.themeCardFooter}>
            <View style={styles.themeCardLabel}>
              <Ionicons name={isDark ? "moon" : "sunny"} size={20} color={isDark ? "#818CF8" : "#FF9F43"} />
              <View>
                <Text style={[styles.themeCardName, { color: previewText }]}>{label}</Text>
                <Text style={[styles.themeCardDesc, { color: previewMuted }]}>{description}</Text>
              </View>
            </View>
            <View style={[styles.checkCircle, isSelected && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
              {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </FadeCard>
  );
}

export default function ThemeScreen() {
  const router = useRouter();
  const { theme, setTheme } = usePrefsStore();
  const { updateUser } = useAuthStore();
  const themeColors = useThemeColors();

  const handleSelect = async (mode: ThemeMode) => {
    setTheme(mode); // instant local update
    const res = await usersApi.updateMyProfile({ theme: mode });
    if (res.ok && res.data.profile) {
      // Optionally sync — prefs already updated locally
    }
  };

  const options: { mode: ThemeMode; label: string; description: string }[] = [
    { mode: "light", label: "Light", description: "Clean & bright interface" },
    { mode: "dark",  label: "Dark",  description: "Easy on the eyes at night" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Appearance</Text>
            <View style={{ width: 38 }} />
          </View>

          <FadeCard delay={0}>
            <View style={styles.currentBadge}>
              <Ionicons name={theme === "dark" ? "moon" : "sunny-outline"} size={18} color="#fff" />
              <Text style={styles.currentBadgeText}>
                Currently using <Text style={{ fontWeight: FONT.black }}>{theme === "dark" ? "Dark" : "Light"}</Text> mode
              </Text>
            </View>
          </FadeCard>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scroll, { backgroundColor: themeColors.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeCard delay={0}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>CHOOSE THEME</Text>
        </FadeCard>

        {options.map((opt, i) => (
          <ThemeCard
            key={opt.mode}
            mode={opt.mode}
            label={opt.label}
            description={opt.description}
            isSelected={theme === opt.mode}
            onSelect={() => handleSelect(opt.mode)}
            delay={i * 80}
          />
        ))}

        <FadeCard delay={200}>
          <View style={[styles.infoBanner, { backgroundColor: themeColors.cardAlt, borderColor: themeColors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              Theme changes apply instantly across the entire app.
            </Text>
          </View>
        </FadeCard>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: SPACE.xs, marginBottom: SPACE.lg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
  currentBadge: {
    flexDirection: "row", alignItems: "center", gap: SPACE.sm,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    alignSelf: "flex-start",
  },
  currentBadgeText: { fontSize: FONT.sm, color: "#fff" },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md },
  themeCard: { borderRadius: RADIUS.xl, marginBottom: SPACE.md, borderWidth: 2, overflow: "hidden", ...SHADOW.md },
  previewHeader: { height: 90, padding: SPACE.md },
  previewHeaderDots: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
  previewBalanceRow: { flexDirection: "row", gap: SPACE.sm, marginTop: SPACE.xs },
  previewBalanceCard: { flex: 1, borderRadius: 8, padding: SPACE.sm, gap: 4 },
  previewBody: { padding: SPACE.sm, gap: SPACE.sm },
  previewRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, borderRadius: 10, padding: SPACE.sm },
  previewRowIcon: { width: 28, height: 28, borderRadius: 8 },
  previewLine: { height: 6, borderRadius: 3 },
  themeCardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md },
  themeCardLabel: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  themeCardName: { fontSize: FONT.md, fontWeight: FONT.bold },
  themeCardDesc: { fontSize: FONT.xs, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm, borderRadius: RADIUS.lg, padding: SPACE.md, borderWidth: 1 },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 20 },
});