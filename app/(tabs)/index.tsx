import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeScreenSkeleton } from "../../components/Skeleton";
import { Avatar, BalancePill, FadeCard, PressScale, SectionHeader } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppContext } from "../../lib/useAppContext";
import { computeFriendBalances, getNetBalance, useAppStore } from "../../store/useAppStore";

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({
  label,
  amount,
  icon,
  delay,
  fmt,
}: {
  label: string;
  amount: number;
  icon: string;
  delay: number;
  fmt: (n: number) => string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, delay, useNativeDriver: true, tension: 80, friction: 10 }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, flex: 1, transform: [{ translateY: slideY }] }}>
      <View style={styles.balanceCard}>
        <Ionicons name={icon as any} size={18} color="rgba(255,255,255,0.65)" style={{ marginBottom: 6 }} />
        <Text style={styles.balanceAmount}>{fmt(amount)}</Text>
        <Text style={styles.balanceLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Group Row ────────────────────────────────────────────────────────────────

function GroupRow({
  group,
  balance,
  delay,
  onPress,
  tc,
  fmt,
  t,
}: {
  group: ReturnType<typeof useAppStore.getState>["groups"][0];
  balance: { owes: number; owed: number };
  delay: number;
  onPress: () => void;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
  t: ReturnType<typeof useAppContext>["t"];
}) {
  const isOwed = balance.owed > balance.owes;
  const net = Math.abs(balance.owed - balance.owes);
  const type = balance.owed === 0 && balance.owes === 0 ? "settled" : isOwed ? "owed" : "owes";
  const label =
    type === "settled"
      ? t.common.settledUp
      : isOwed
        ? t.home.owesYou
        : t.common.youOwe;
  const shownMembers = group.members.filter((m) => m.id !== "me").slice(0, 3);

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={[styles.groupRow, { backgroundColor: tc.card }]}>
          <View style={[styles.groupRowEmoji, { backgroundColor: tc.cardAlt }]}>
            <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
          </View>
          <View style={styles.groupRowCenter}>
            <Text style={[styles.groupRowName, { color: tc.textPrimary }]}>{group.name}</Text>
            <Text style={[styles.groupRowDate, { color: tc.textMuted }]}>
              {new Date(group.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </Text>
            <View style={styles.groupRowAvatars}>
              {shownMembers.map((m, i) => (
                <Avatar
                  key={m.id}
                  initials={m.initials}
                  color={m.avatarColor}
                  size={22}
                  style={{ marginLeft: i > 0 ? -6 : 0, borderWidth: 1.5, borderColor: tc.card }}
                />
              ))}
            </View>
          </View>
          <View style={styles.groupRowRight}>
            <Text style={[styles.groupRowTotal, { color: tc.textPrimary }]}>
              {fmt(group.expenses.reduce((s, e) => s + e.amount, 0))}
            </Text>
            <BalancePill label={label} amount={net} type={type} />
          </View>
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({
  name, initials, avatarColor, net, delay, onPress, tc, fmt, t,
}: {
  name: string; initials: string; avatarColor: string;
  net: number; delay: number; onPress: () => void;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
  t: ReturnType<typeof useAppContext>["t"];
}) {
  const isOwed = net > 0;
  const isSettled = Math.abs(net) < 0.01;

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={[styles.friendRow, { backgroundColor: tc.card }]}>
          <Avatar initials={initials} color={avatarColor} size={44} />
          <View style={styles.friendRowCenter}>
            <Text style={[styles.friendRowName, { color: tc.textPrimary }]}>{name}</Text>
            <Text style={[
              styles.friendRowStatus,
              { color: isSettled ? tc.textMuted : isOwed ? COLORS.success : COLORS.danger },
            ]}>
              {isSettled
                ? t.common.settledUp
                : isOwed
                  ? `${t.home.owesYou} ${fmt(net)}`
                  : `${t.common.youOwe} ${fmt(-net)}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={tc.textMuted} />
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groups, currentUserId, getMyNetBalance } = useAppStore();
  const { totalOwed, totalOwes } = getMyNetBalance();
  const { tc, fmt, t } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  const friendBalances = React.useMemo(
    () => computeFriendBalances(currentUserId, groups),
    [groups, currentUserId]
  );

  const sortedGroups = [...groups].sort((a, b) => {
    const aLast = a.expenses[a.expenses.length - 1]?.date ?? a.createdAt;
    const bLast = b.expenses[b.expenses.length - 1]?.date ?? b.createdAt;
    return bLast.localeCompare(aLast);
  });

  if (isLoading) return <HomeScreenSkeleton />;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={GRAD}
        style={[styles.header, { paddingTop: insets.top + SPACE.sm }]}
      >
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="flash" size={14} color="#fff" />
            </View>
            <Text style={styles.logoText}>{t.home.title}</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/profile/notifications")}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Avatar initials="ME" color="rgba(255,255,255,0.3)" size={36} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <BalanceCard label={t.home.youOweLabel} amount={totalOwes} icon="arrow-up-circle" delay={100} fmt={fmt} />
          <View style={{ width: SPACE.md }} />
          <BalanceCard label={t.home.owesYou} amount={totalOwed} icon="arrow-down-circle" delay={220} fmt={fmt} />
        </View>
      </LinearGradient>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: tc.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeCard delay={80}>
          <SectionHeader
            title={t.home.pendingBills}
            action={t.common.viewAll}
            onAction={() => router.push("/(tabs)/groups")}
          />
        </FadeCard>

        {sortedGroups.map((g, i) => {
          const bal = getNetBalance(currentUserId, g.expenses);
          return (
            <GroupRow
              key={g.id}
              group={g}
              balance={bal}
              delay={120 + i * 60}
              onPress={() => router.push(`/groups/${g.id}`)}
              tc={tc}
              fmt={fmt}
              t={t}
            />
          );
        })}

        <FadeCard delay={300}>
          <SectionHeader title={t.common.friends} style={{ marginTop: SPACE.xl }} />
        </FadeCard>

        {friendBalances.length === 0 && (
          <FadeCard delay={350}>
            <Text style={[styles.emptyFriends, { color: tc.textMuted }]}>
              {t.common.noData}
            </Text>
          </FadeCard>
        )}

        {friendBalances.map((f, i) => (
          <FriendRow
            key={f.memberId}
            name={f.name}
            initials={f.initials}
            avatarColor={f.avatarColor}
            net={f.net}
            delay={340 + i * 55}
            onPress={() => router.push(`/friend/${f.memberId}`)}
            tc={tc}
            fmt={fmt}
            t={t}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: SPACE.xl,
    paddingBottom: SPACE.xl + 4,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACE.md,
  },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  logoMark: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: FONT.xl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: SPACE.md },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  balanceRow: { flexDirection: "row" },
  balanceCard: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
  },
  balanceAmount: { fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
  balanceLabel: { fontSize: FONT.sm, color: "rgba(255,255,255,0.75)", fontWeight: FONT.medium, marginTop: 2 },
  scroll: {
    flex: 1,
    borderTopLeftRadius: RADIUS.xxl + 4,
    borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -(RADIUS.xxl + 4),
  },
  scrollContent: { paddingTop: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  groupRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, padding: SPACE.lg,
    marginBottom: SPACE.md, gap: SPACE.md, ...SHADOW.sm,
  },
  groupRowEmoji: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
  },
  groupRowCenter: { flex: 1, gap: 3 },
  groupRowName: { fontSize: FONT.md, fontWeight: FONT.bold },
  groupRowDate: { fontSize: FONT.xs, marginTop: 1 },
  groupRowAvatars: { flexDirection: "row", marginTop: 5 },
  groupRowRight: { alignItems: "flex-end", gap: SPACE.xs },
  groupRowTotal: { fontSize: FONT.lg, fontWeight: FONT.black, letterSpacing: -0.3 },
  friendRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, padding: SPACE.lg,
    marginBottom: SPACE.md, gap: SPACE.md, ...SHADOW.sm,
  },
  friendRowCenter: { flex: 1, gap: 3 },
  friendRowName: { fontSize: FONT.md, fontWeight: FONT.bold },
  friendRowStatus: { fontSize: FONT.sm, fontWeight: FONT.semibold },
  emptyFriends: { fontSize: FONT.base, textAlign: "center", paddingVertical: SPACE.xl },
});