import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthLoader } from "../../components/Loader";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, getTotalsFromBalances, useGroupStore } from "../../store/useGroupStore";
import { usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

// ─── Profile Avatar ───────────────────────────────────────────────────────────

function ProfileAvatar({ initials, color, size = 72 }: { initials: string; color: string; size?: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1800, useNativeDriver: true }),
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

function MenuRow({
  icon, label, sublabel, value, valueColor, iconBg, iconColor,
  isDanger, isLast, onPress, themeColors,
}: {
  icon: string; label: string; sublabel?: string;
  value?: string; valueColor?: string; iconBg?: string; iconColor?: string;
  isDanger?: boolean; isLast?: boolean; onPress: () => void;
  themeColors: ReturnType<typeof useThemeColors>;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }).start();

  const resolvedIconColor = iconColor ?? (isDanger ? COLORS.danger : COLORS.primary);
  const resolvedIconBg    = iconBg    ?? (isDanger ? `${COLORS.danger}18` : "#FFF3E0");

  return (
    <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
      <Animated.View style={[
        styles.menuRow,
        { borderBottomColor: themeColors.border, transform: [{ scale: scaleAnim }] },
        isLast && { borderBottomWidth: 0 },
      ]}>
        <View style={[styles.menuIconBox, { backgroundColor: resolvedIconBg }]}>
          <Ionicons name={icon as any} size={20} color={resolvedIconColor} />
        </View>
        <View style={styles.menuCenter}>
          <Text style={[styles.menuLabel, { color: isDanger ? COLORS.danger : themeColors.textPrimary }]}>{label}</Text>
          {sublabel ? <Text style={[styles.menuSublabel, { color: themeColors.textMuted }]}>{sublabel}</Text> : null}
        </View>
        {value ? <Text style={[styles.menuValue, { color: valueColor ?? themeColors.textMuted }]}>{value}</Text> : null}
        {!isDanger && <Ionicons name="chevron-forward" size={15} color={themeColors.textMuted} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Section Block ────────────────────────────────────────────────────────────

function Section({ title, children, delay, themeColors }: {
  title: string; children: React.ReactNode; delay: number;
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
  const { user, logout, loading: loggingOut } = useAuthStore();
  const { theme, language, currency } = usePrefsStore();
  const { tc, fmt, t } = useAppContext();
  const themeColors = useThemeColors();

  const { groups, balances, fetchGroups, fetchBalances } = useGroupStore();

  useEffect(() => {
    if (groups.length === 0) fetchGroups();
  }, []);

  useEffect(() => {
    for (const g of groups) {
      if (!balances[g.id]) fetchBalances(g.id);
    }
  }, [groups]);

  const onRefresh = useCallback(async () => {
    await fetchGroups();
    for (const g of groups) fetchBalances(g.id);
  }, [groups]);

  const { totalOwed, totalOwes } = getTotalsFromBalances(balances);

  // Count all expenses across groups
  const totalExpenses = Object.values(useGroupStore.getState().expenses)
    .reduce((s, arr) => s + arr.length, 0);

  const myUserId   = user?.id ?? "";
  const myName     = user?.name ?? "You";
  const myInitials = getInitials(myName);
  const myColor    = getAvatarColor(myUserId);
  const myBio      = user?.profile?.bio ?? "";
  const myEmail    = user?.email ?? "";

  const handleSignOut = () => {
    Alert.alert(t.profile.signOutConfirm, t.profile.signOutMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.profile.signOut,
        style: "destructive",
        onPress: async () => { await logout(); },
      },
    ]);
  };

  // Map language code to display name
  const langDisplay: Record<string, string> = { en: "English", hi: "हिन्दी", fr: "Français", es: "Español" };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
      <AuthLoader visible={loggingOut} message="Signing out..." />

      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          {/* Avatar + name */}
          <FadeCard delay={0} style={styles.hero}>
            <ProfileAvatar initials={myInitials} color={myColor} size={72} />
            <Text style={styles.heroName}>{myName}</Text>
            <Text style={styles.heroUsername}>{myEmail}</Text>
            {myBio ? <Text style={styles.heroBio}>{myBio}</Text> : null}
          </FadeCard>

          {/* Stats strip */}
          <FadeCard delay={120}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>{groups.length}</Text>
                <Text style={styles.statLbl}>{t.common.groups}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>{totalExpenses}</Text>
                <Text style={styles.statLbl}>{t.common.expenses}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statAmt}>{fmt(totalOwed)}</Text>
                <Text style={styles.statLbl}>{t.profile.owedToYou}</Text>
              </View>
            </View>
          </FadeCard>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scroll, { backgroundColor: themeColors.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {/* Balance card */}
        <FadeCard delay={80}>
          <View style={[styles.balanceCard, { backgroundColor: themeColors.card }]}>
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIconBox, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="arrow-down-circle" size={18} color={COLORS.success} />
              </View>
              <View>
                <Text style={[styles.balanceLbl, { color: themeColors.textMuted }]}>{t.profile.owedToYou}</Text>
                <Text style={[styles.balanceAmt, { color: COLORS.success }]}>{fmt(totalOwed)}</Text>
              </View>
            </View>
            <View style={[styles.balanceDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.balanceItem}>
              <View style={[styles.balanceIconBox, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="arrow-up-circle" size={18} color={COLORS.danger} />
              </View>
              <View>
                <Text style={[styles.balanceLbl, { color: themeColors.textMuted }]}>{t.profile.youOwe}</Text>
                <Text style={[styles.balanceAmt, { color: COLORS.danger }]}>{fmt(totalOwes)}</Text>
              </View>
            </View>
          </View>
        </FadeCard>

        {/* Account */}
        <Section title={t.profile.account.toUpperCase()} delay={140} themeColors={themeColors}>
          <MenuRow
            icon="person-circle-outline"
            label={t.profile.editProfile}
            sublabel={t.profile.editSub}
            onPress={() => router.push("/profile/edit")}
            themeColors={themeColors}
          />
          <MenuRow
            icon="notifications-outline"
            label={t.profile.notifications}
            sublabel={t.profile.notifSub}
            onPress={() => router.push("/profile/notifications")}
            themeColors={themeColors}
            isLast
          />
        </Section>

        {/* Preferences */}
        <Section title={t.profile.preferences.toUpperCase()} delay={220} themeColors={themeColors}>
          <MenuRow
            icon="cash-outline"
            label={t.profile.currency}
            value={currency}
            iconBg="#E8F5E9"
            iconColor={COLORS.success}
            onPress={() => router.push("/profile/currency")}
            themeColors={themeColors}
          />
          <MenuRow
            icon={theme === "dark" ? "moon" : "sunny-outline"}
            label={t.profile.theme}
            value={theme === "dark" ? "Dark" : "Light"}
            iconBg={theme === "dark" ? "#1A1A2E" : "#FFF3E0"}
            iconColor={theme === "dark" ? "#818CF8" : "#FF9F43"}
            onPress={() => router.push("/profile/theme")}
            themeColors={themeColors}
          />
          <MenuRow
            icon="language-outline"
            label={t.profile.language}
            value={langDisplay[language] ?? language}
            iconBg="#E3F2FD"
            iconColor="#2196F3"
            onPress={() => router.push("/profile/language")}
            themeColors={themeColors}
            isLast
          />
        </Section>

        {/* More */}
        <Section title={t.profile.more.toUpperCase()} delay={300} themeColors={themeColors}>
          <MenuRow
            icon="shield-checkmark-outline"
            label={t.profile.privacyPolicy}
            iconBg="#F3E5F5" iconColor="#9C27B0"
            onPress={() => {}}
            themeColors={themeColors}
          />
          <MenuRow
            icon="help-circle-outline"
            label={t.profile.helpSupport}
            iconBg="#E0F7FA" iconColor="#00BCD4"
            onPress={() => {}}
            themeColors={themeColors}
          />
          <MenuRow
            icon="log-out-outline"
            label={t.profile.signOut}
            isDanger
            onPress={handleSignOut}
            themeColors={themeColors}
            isLast
          />
        </Section>

        <FadeCard delay={380}>
          <Text style={[styles.version, { color: themeColors.textMuted }]}>{t.profile.version}</Text>
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
    alignItems: "center", justifyContent: "center", marginBottom: SPACE.sm,
  },
  avatarInner: { alignItems: "center", justifyContent: "center" },
  heroName: { fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  heroUsername: { fontSize: FONT.sm, color: "rgba(255,255,255,0.65)" },
  heroBio: { fontSize: FONT.sm, color: "rgba(255,255,255,0.75)", fontStyle: "italic", marginTop: 4, textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: RADIUS.xl, padding: SPACE.md,
  },
  statItem: { flex: 1, alignItems: "center" },
  statAmt: { fontSize: FONT.xl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.3 },
  statLbl: { fontSize: FONT.xs, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.25)", marginVertical: SPACE.xs },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  balanceCard: { flexDirection: "row", borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.sm },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  balanceIconBox: { width: 36, height: 36, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  balanceDivider: { width: 1, marginVertical: SPACE.xs },
  balanceLbl: { fontSize: FONT.xs },
  balanceAmt: { fontSize: FONT.lg, fontWeight: FONT.black, letterSpacing: -0.3 },
  sectionWrap: { marginBottom: SPACE.lg },
  sectionTitle: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.sm },
  sectionCard: { borderRadius: RADIUS.xl, overflow: "hidden", borderWidth: 1, ...SHADOW.sm },
  menuRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.md + 2,
    gap: SPACE.md, borderBottomWidth: 1,
  },
  menuIconBox: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  menuCenter: { flex: 1 },
  menuLabel: { fontSize: FONT.base, fontWeight: FONT.semibold },
  menuSublabel: { fontSize: FONT.xs, marginTop: 2 },
  menuValue: { fontSize: FONT.sm, fontWeight: FONT.medium },
  version: { fontSize: FONT.xs, textAlign: "center", paddingVertical: SPACE.md },
});