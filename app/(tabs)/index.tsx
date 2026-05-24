import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  RefreshControl,
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
import { useAuthStore } from "../../store/useAuthStore";
import {
  getAvatarColor,
  getInitials,
  getTotalsFromBalances,
  useGroupStore,
} from "../../store/useGroupStore";

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({
  label, amount, icon, delay, fmt,
}: {
  label: string; amount: number; icon: string; delay: number;
  fmt: (n: number) => string;
}) {
  const anim   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim,   { toValue: 1, duration: 500, delay, useNativeDriver: true }),
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
  group, myUserId, groupBalances, delay, onPress, tc, fmt, t,
}: {
  group: ReturnType<typeof useGroupStore.getState>["groups"][0];
  myUserId: string;
  groupBalances: ReturnType<typeof useGroupStore.getState>["balances"][string];
  delay: number; onPress: () => void;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
  t: ReturnType<typeof useAppContext>["t"];
}) {
  const bals    = groupBalances ?? [];
  const totalOwed = bals.reduce((s, b) => s + b.owesYou, 0);
  const totalOwes = bals.reduce((s, b) => s + b.youOwe,  0);
  const net     = totalOwed - totalOwes;
  const type    = Math.abs(net) < 0.01 ? "settled" : net > 0 ? "owed" : "owes";
  const label   = type === "settled" ? t.common.settledUp : type === "owed" ? t.home.owesYou : t.common.youOwe;

  const shownMembers = group.members.filter((m) => m.userId !== myUserId).slice(0, 3);

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={[styles.groupRow, { backgroundColor: tc.card }]}>
          <View style={[styles.groupRowEmoji, { backgroundColor: tc.cardAlt }]}>
            <Text style={{ fontSize: 24 }}>{group.iconEmoji ?? "👥"}</Text>
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
                  key={m.userId}
                  initials={getInitials(m.user.name)}
                  color={getAvatarColor(m.userId)}
                  size={22}
                  style={{ marginLeft: i > 0 ? -6 : 0, borderWidth: 1.5, borderColor: tc.card }}
                />
              ))}
            </View>
          </View>
          <View style={styles.groupRowRight}>
            <BalancePill label={label} amount={Math.abs(net)} type={type} />
          </View>
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({
  name, userId, net, delay, onPress, tc, fmt, t,
}: {
  name: string; userId: string; net: number; delay: number; onPress: () => void;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
  t: ReturnType<typeof useAppContext>["t"];
}) {
  const isOwed    = net > 0;
  const isSettled = Math.abs(net) < 0.01;

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={[styles.friendRow, { backgroundColor: tc.card }]}>
          <Avatar initials={getInitials(name)} color={getAvatarColor(userId)} size={44} />
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
  const { user } = useAuthStore();
  const { tc, fmt, t } = useAppContext();
  const { groups, balances, loadingGroups, fetchGroups, fetchBalances } = useGroupStore();

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    for (const g of groups) {
      if (!balances[g.id]) fetchBalances(g.id);
    }
  }, [groups]);

  const onRefresh = useCallback(async () => {
    await fetchGroups();
    for (const g of groups) fetchBalances(g.id);
  }, [groups]);

  const myUserId = user?.id ?? "";
  const { totalOwed, totalOwes } = getTotalsFromBalances(balances);

  // Aggregate per-friend net across all groups
  const friendNetMap: Record<string, { name: string; userId: string; net: number }> = {};
  for (const g of groups) {
    for (const b of (balances[g.id] ?? [])) {
      const uid = b.otherUser.id;
      if (!friendNetMap[uid]) friendNetMap[uid] = { name: b.otherUser.name, userId: uid, net: 0 };
      friendNetMap[uid].net += b.owesYou - b.youOwe;
    }
  }
  const friendBalances = Object.values(friendNetMap).map((f) => ({
    ...f, net: parseFloat(f.net.toFixed(2)),
  }));

  const sortedGroups = [...groups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loadingGroups && groups.length === 0) return <HomeScreenSkeleton />;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <LinearGradient colors={GRAD} style={[styles.header, { paddingTop: insets.top + SPACE.sm }]}>
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.logoMark}>
              <Ionicons name="flash" size={14} color="#fff" />
            </View>
            <Text style={styles.logoText}>{t.home.title}</Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/profile/notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Avatar initials={getInitials(user?.name ?? "You")} color={getAvatarColor(myUserId)} size={36} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <BalanceCard label={t.home.youOweLabel} amount={totalOwes} icon="arrow-up-circle"   delay={100} fmt={fmt} />
          <View style={{ width: SPACE.md }} />
          <BalanceCard label={t.home.owesYou}    amount={totalOwed} icon="arrow-down-circle" delay={220} fmt={fmt} />
        </View>
      </LinearGradient>

      <ScrollView
        style={[styles.scroll, { backgroundColor: tc.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loadingGroups} onRefresh={onRefresh} />}
      >
        <FadeCard delay={80}>
          <SectionHeader
            title={t.home.pendingBills}
            action={t.common.viewAll}
            onAction={() => router.push("/(tabs)/groups")}
          />
        </FadeCard>

        {sortedGroups.length === 0 && (
          <FadeCard delay={100}>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>No groups yet. Create one!</Text>
          </FadeCard>
        )}

        {sortedGroups.map((g, i) => (
          <GroupRow
            key={g.id} group={g} myUserId={myUserId}
            groupBalances={balances[g.id] ?? []}
            delay={120 + i * 60}
            onPress={() => router.push(`/groups/${g.id}`)}
            tc={tc} fmt={fmt} t={t}
          />
        ))}

        <FadeCard delay={300}>
          <SectionHeader title={t.common.friends} style={{ marginTop: SPACE.xl }} />
        </FadeCard>

        {friendBalances.length === 0 && (
          <FadeCard delay={350}>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t.common.noData}</Text>
          </FadeCard>
        )}

        {friendBalances.map((f, i) => (
          <FriendRow
            key={f.userId} name={f.name} userId={f.userId} net={f.net}
            delay={340 + i * 55}
            onPress={() => router.push(`/friend/${f.userId}`)}
            tc={tc} fmt={fmt} t={t}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl + 4 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.md },
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
  balanceCard: { backgroundColor: "rgba(0,0,0,0.18)", borderRadius: RADIUS.xl, padding: SPACE.lg },
  balanceAmount: { fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
  balanceLabel: { fontSize: FONT.sm, color: "rgba(255,255,255,0.75)", fontWeight: FONT.medium, marginTop: 2 },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -(RADIUS.xxl + 4) },
  scrollContent: { paddingTop: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  groupRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, padding: SPACE.lg,
    marginBottom: SPACE.md, gap: SPACE.md, ...SHADOW.sm,
  },
  groupRowEmoji: { width: 50, height: 50, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  groupRowCenter: { flex: 1, gap: 3 },
  groupRowName: { fontSize: FONT.md, fontWeight: FONT.bold },
  groupRowDate: { fontSize: FONT.xs, marginTop: 1 },
  groupRowAvatars: { flexDirection: "row", marginTop: 5 },
  groupRowRight: { alignItems: "flex-end", gap: SPACE.xs },
  friendRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, padding: SPACE.lg,
    marginBottom: SPACE.md, gap: SPACE.md, ...SHADOW.sm,
  },
  friendRowCenter: { flex: 1, gap: 3 },
  friendRowName: { fontSize: FONT.md, fontWeight: FONT.bold },
  friendRowStatus: { fontSize: FONT.sm, fontWeight: FONT.semibold },
  emptyText: { fontSize: FONT.base, textAlign: "center", paddingVertical: SPACE.xl },
});