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
import { CURRENCIES } from "../../lib/currency";
import { CurrencyCode, usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

function CurrencyRow({
  item, isSelected, onSelect, isLast, themeColors, delay,
}: {
  item: { code: CurrencyCode; name: string; symbol: string; flag: string };
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
          styles.row,
          { borderBottomColor: themeColors.border },
          isLast && { borderBottomWidth: 0 },
          isSelected && { backgroundColor: `${COLORS.primary}0C` },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <Text style={styles.flag}>{item.flag}</Text>
          <View style={[styles.symbolBox, { backgroundColor: isSelected ? COLORS.primary : themeColors.sectionBg }]}>
            <Text style={[styles.symbol, { color: isSelected ? "#fff" : themeColors.textSecondary }]}>
              {item.symbol}
            </Text>
          </View>
          <View style={styles.rowCenter}>
            <Text style={[styles.rowCode, { color: themeColors.textPrimary }]}>{item.code}</Text>
            <Text style={[styles.rowName, { color: themeColors.textMuted }]}>{item.name}</Text>
          </View>
          <View style={[styles.checkCircle, isSelected && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </FadeCard>
  );
}

export default function CurrencyScreen() {
  const router = useRouter();
  const { currency, setCurrency } = usePrefsStore();
  const themeColors = useThemeColors();

  const handleSelect = async (code: CurrencyCode) => {
    setCurrency(code); // instant local update
    await usersApi.updateMyProfile({ currency: code });
  };

  const currencyList = Object.values(CURRENCIES);
  const selected = CURRENCIES[currency];

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Currency</Text>
            <View style={{ width: 38 }} />
          </View>

          <FadeCard delay={0}>
            <View style={styles.currentBadge}>
              <Text style={{ fontSize: 20 }}>{selected.flag}</Text>
              <Text style={styles.currentText}>
                {selected.symbol} · {selected.name}
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
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>SELECT CURRENCY</Text>
        </FadeCard>

        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {currencyList.map((c, i) => (
            <CurrencyRow
              key={c.code}
              item={c}
              isSelected={currency === c.code}
              onSelect={() => handleSelect(c.code)}
              isLast={i === currencyList.length - 1}
              themeColors={themeColors}
              delay={i * 50}
            />
          ))}
        </View>

        <FadeCard delay={240}>
          <View style={[styles.infoBanner, { backgroundColor: themeColors.cardAlt, borderColor: themeColors.border }]}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              All amounts are stored in USD and converted to your selected currency on display.
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
  currentText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: "#fff" },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md },
  card: { borderRadius: RADIUS.xl, overflow: "hidden", borderWidth: 1, ...SHADOW.sm, marginBottom: SPACE.lg },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.md,
    gap: SPACE.md, borderBottomWidth: 1,
  },
  flag: { fontSize: 26, width: 32, textAlign: "center" },
  symbolBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  symbol: { fontSize: FONT.lg, fontWeight: FONT.black },
  rowCenter: { flex: 1 },
  rowCode: { fontSize: FONT.md, fontWeight: FONT.bold },
  rowName: { fontSize: FONT.xs, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: "#ccc", alignItems: "center", justifyContent: "center" },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm, borderRadius: RADIUS.lg, padding: SPACE.md, borderWidth: 1 },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 20 },
});