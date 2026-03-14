import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppStore } from "../../store/useAppStore";
import { usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

// ─── Avatar with initials ─────────────────────────────────────────────────────

function ProfileAvatar({ initials, color, size = 72 }: { initials: string; color: string; size?: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <View style={[styles.avatarOuter, { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2 }]}>
        <View style={[styles.avatarInner, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
          <Text style={{ color: "#fff", fontSize: size * 0.34, fontWeight: "800" }}>{initials}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────

type MenuRowProps = {
  icon: string;
  label: string;
  sublabel?: string;
  value?: string;
  valueColor?: string;
  iconBg?: string;
  iconColor?: string;
  isDanger?: boolean;
  isLast?: boolean;
  onPress: () => void;
  themeColors: ReturnType<typeof useThemeColors>;
};

function MenuRow({
  icon, label, sublabel, value, valueColor, iconBg, iconColor,
  isDanger, isLast, onPress, themeColors,
}: MenuRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

  const resolvedIconColor = iconColor ?? (isDanger ? COLORS.danger : COLORS.primary);
  const resolvedIconBg = iconBg ?? (isDanger ? `${COLORS.danger}18` : "#FFF3E0");

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View
        style={[
          styles.menuRow,
          { borderBottomColor: themeColors.border, transform: [{ scale: scaleAnim }] },
          isLast && { borderBottomWidth: 0 },
        ]}
      >
        <View style={[styles.menuIconBox, { backgroundColor: resolvedIconBg }]}>
          <Ionicons name={icon as any} size={20} color={resolvedIconColor} />
        </View>
        <View style={styles.menuCenter}>
          <Text style={[styles.menuLabel, { color: isDanger ? COLORS.danger : themeColors.textPrimary }]}>
            {label}
          </Text>
          {sublabel ? (
            <Text style={[styles.menuSublabel, { color: themeColors.textMuted }]}>{sublabel}</Text>
          ) : null}
        </View>
        {value ? (
          <Text style={[styles.menuValue, { color: valueColor ?? themeColors.textMuted }]}>{value}</Text>
        ) : null}
        {!isDanger && (
          <Ionicons name="chevron-forward" size={15} color={themeColors.textMuted} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────

function Section({
  title, children, delay, themeColors,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
  themeColors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <FadeCard delay={delay} style={styles.sectionWrap}>
      <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        {children}
      </View>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { getMyNetBalance, getAllExpenses, groups } = useAppStore();
  const { profile, theme, language, currency } = usePrefsStore();
  const themeColors = useThemeColors();

  const { totalOwed, totalOwes } = getMyNetBalance();
  const allExp = getAllExpenses();
  const totalSpent = allExp.filter((e) => e.paidById === "me").reduce((s, e) => s + e.amount, 0);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
      {/* ── Gradient Header ── */}
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          {/* Avatar + name */}
          <FadeCard delay={0} style={styles.hero}>
            <ProfileAvatar initials={profile.initials} color={profile.avatarColor} size={72} />
            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroUsername}>{profile.username}</Text>
            {profile.bio ? <Text style={styles.heroBio}>{profile.bio}</Text> : null}
          </FadeCard>

          {/* Stats strip */}
          <FadeCard delay={120}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>{groups.length}</Text>
                <Text style={styles.statLbl}>Groups</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>{allExp.length}</Text>
                <Text style={styles.statLbl}>Expenses</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>${totalSpent.toFixed(0)}</Text>
                <Text style={styles.statLbl}>Paid out</Text>
              </View>
            </View>
          </FadeCard>
        </SafeAreaView>
      </LinearGradient>

      {/* ── White Body ── */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: themeColors.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance card */}
        <FadeCard delay={80}>
          <View style={[styles.balanceCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIconBox, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="arrow-down-circle" size={18} color={COLORS.success} />
              </View>
              <View>
                <Text style={[styles.balanceLbl, { color: themeColors.textMuted }]}>Owed to you</Text>
                <Text style={[styles.balanceAmt, { color: COLORS.success }]}>${totalOwed.toFixed(2)}</Text>
              </View>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIconBox, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="arrow-up-circle" size={18} color={COLORS.danger} />
              </View>
              <View>
                <Text style={[styles.balanceLbl, { color: themeColors.textMuted }]}>You owe</Text>
                <Text style={[styles.balanceAmt, { color: COLORS.danger }]}>${totalOwes.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </FadeCard>

        {/* Account */}
        <Section title="ACCOUNT" delay={140} themeColors={themeColors}>
          <MenuRow
            icon="person-circle-outline"
            label="Edit Profile"
            sublabel="Name, username, bio"
            onPress={() => router.push("/profile/edit")}
            themeColors={themeColors}
          />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            sublabel="Push alerts & reminders"
            onPress={() => router.push("/profile/notifications")}
            themeColors={themeColors}
            isLast
          />
        </Section>

        {/* Preferences */}
        <Section title="PREFERENCES" delay={220} themeColors={themeColors}>
          <MenuRow
            icon="cash-outline"
            label="Currency"
            value={currency}
            iconBg="#E8F5E9"
            iconColor={COLORS.success}
            onPress={() => router.push("/profile/currency")}
            themeColors={themeColors}
          />
          <MenuRow
            icon={theme === "dark" ? "moon" : "sunny-outline"}
            label="Theme"
            value={theme === "dark" ? "Dark" : "Light"}
            iconBg={theme === "dark" ? "#1A1A2E" : "#FFF3E0"}
            iconColor={theme === "dark" ? "#818CF8" : "#FF9F43"}
            onPress={() => router.push("/profile/theme")}
            themeColors={themeColors}
          />
          <MenuRow
            icon="language-outline"
            label="Language"
            value={language}
            iconBg="#E3F2FD"
            iconColor="#2196F3"
            onPress={() => router.push("/profile/language")}
            themeColors={themeColors}
            isLast
          />
        </Section>

        {/* More */}
        <Section title="MORE" delay={300} themeColors={themeColors}>
          <MenuRow
            icon="shield-checkmark-outline"
            label="Privacy Policy"
            iconBg="#F3E5F5"
            iconColor="#9C27B0"
            onPress={() => { }}
            themeColors={themeColors}
          />
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            iconBg="#E0F7FA"
            iconColor="#00BCD4"
            onPress={() => { }}
            themeColors={themeColors}
          />
          <MenuRow
            icon="log-out-outline"
            label="Sign Out"
            isDanger
            onPress={() => { }}
            themeColors={themeColors}
            isLast
          />
        </Section>

        {/* Version */}
        <FadeCard delay={380}>
          <Text style={[styles.version, { color: themeColors.textMuted }]}>Splitty v1.0.0</Text>
        </FadeCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  hero: { alignItems: "center", paddingTop: SPACE.md, paddingBottom: SPACE.lg, gap: 4 },
  avatarOuter: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACE.sm,
  },
  avatarInner: { alignItems: "center", justifyContent: "center" },
  heroName: { fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  heroUsername: { fontSize: FONT.sm, color: "rgba(255,255,255,0.65)" },
  heroBio: {
    fontSize: FONT.sm, color: "rgba(255,255,255,0.75)",
    fontStyle: "italic", marginTop: 4, textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.xl,
    padding: SPACE.md,
  },
  statItem: { flex: 1, alignItems: "center" },
  statAmt: { fontSize: FONT.xl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.3 },
  statLbl: { fontSize: FONT.xs, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: SPACE.xs },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  balanceCard: {
    flexDirection: "row", borderRadius: RADIUS.xl,
    padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.sm,
  },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  balanceIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  balanceDivider: { width: 1, marginVertical: SPACE.xs },
  balanceLbl: { fontSize: FONT.xs },
  balanceAmt: { fontSize: FONT.lg, fontWeight: FONT.black, letterSpacing: -0.3 },
  sectionWrap: { marginBottom: SPACE.lg },
  sectionTitle: {
    fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2,
    textTransform: "uppercase", marginBottom: SPACE.sm,
  },
  sectionCard: {
    borderRadius: RADIUS.xl, overflow: "hidden",
    borderWidth: 1, ...SHADOW.sm,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.md + 2,
    gap: SPACE.md, borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 38, height: 38, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
  },
  menuCenter: { flex: 1 },
  menuLabel: { fontSize: FONT.base, fontWeight: FONT.semibold },
  menuSublabel: { fontSize: FONT.xs, marginTop: 2 },
  menuValue: { fontSize: FONT.sm, fontWeight: FONT.medium },
  version: { fontSize: FONT.xs, textAlign: "center", paddingVertical: SPACE.md },
});