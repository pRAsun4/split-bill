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
import { LANGUAGES } from "../../lib/i18n";
import { LanguageCode, usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

function LangRow({
  lang, isSelected, onSelect, isLast, themeColors, delay,
}: {
  lang: typeof LANGUAGES[0];
  isSelected: boolean; onSelect: () => void; isLast: boolean;
  themeColors: ReturnType<typeof useThemeColors>; delay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <FadeCard delay={delay}>
      <TouchableOpacity onPressIn={onIn} onPressOut={onOut} onPress={onSelect} activeOpacity={1}>
        <Animated.View style={[
          styles.langRow,
          { borderBottomColor: themeColors.border },
          isLast && { borderBottomWidth: 0 },
          isSelected && { backgroundColor: `${COLORS.primary}0C` },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Text style={styles.langFlag}>{lang.flag}</Text>
          <View style={styles.langCenter}>
            <Text style={[styles.langName, { color: themeColors.textPrimary }]}>{lang.nativeName}</Text>
            <Text style={[styles.langRegion, { color: themeColors.textMuted }]}>
              {lang.name} · {lang.region}
            </Text>
          </View>
          <View style={[styles.checkCircle, isSelected && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </FadeCard>
  );
}

export default function LanguageScreen() {
  const router = useRouter();
  const { language, setLanguage } = usePrefsStore();
  const themeColors = useThemeColors();

  const handleSelect = async (code: LanguageCode) => {
    setLanguage(code); // instant local update
    // Backend stores language as part of profile — map code to locale string
    // The API profile doesn't have a language field in the spec,
    // so we persist locally only (language is UI-only preference)
  };

  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Language</Text>
            <View style={{ width: 38 }} />
          </View>

          <FadeCard delay={0}>
            <View style={styles.currentBadge}>
              <Text style={styles.currentFlag}>{current?.flag ?? "🌐"}</Text>
              <Text style={styles.currentBadgeText}>{current?.name ?? language}</Text>
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
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>SELECT LANGUAGE</Text>
        </FadeCard>

        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {LANGUAGES.map((lang, i) => (
            <LangRow
              key={lang.code}
              lang={lang}
              isSelected={language === lang.code}
              onSelect={() => handleSelect(lang.code)}
              isLast={i === LANGUAGES.length - 1}
              themeColors={themeColors}
              delay={i * 50}
            />
          ))}
        </View>

        <FadeCard delay={280}>
          <View style={[styles.infoBanner, { backgroundColor: themeColors.cardAlt, borderColor: themeColors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              Language affects display text only. Dates and numbers follow your system locale.
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
  currentFlag: { fontSize: 20 },
  currentBadgeText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: "#fff" },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md },
  card: { borderRadius: RADIUS.xl, overflow: "hidden", borderWidth: 1, ...SHADOW.sm, marginBottom: SPACE.lg },
  langRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.md + 2,
    gap: SPACE.md, borderBottomWidth: 1,
  },
  langFlag: { fontSize: 28, width: 36, textAlign: "center" },
  langCenter: { flex: 1 },
  langName: { fontSize: FONT.md, fontWeight: FONT.bold },
  langRegion: { fontSize: FONT.xs, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm, borderRadius: RADIUS.lg, padding: SPACE.md, borderWidth: 1 },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 20 },
});