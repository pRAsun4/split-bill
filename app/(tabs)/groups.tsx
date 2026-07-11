import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import {
  Animated,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GroupsScreenSkeleton } from "../../components/Skeleton";
import { Avatar, FadeCard, PressScale } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({
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
  const bals = groupBalances ?? [];
  const totalOwed = bals.reduce((s, b) => s + b.owesYou, 0);
  const totalOwes = bals.reduce((s, b) => s + b.youOwe, 0);
  const net = totalOwed - totalOwes;
  const isSettled = bals.length === 0 || Math.abs(net) < 0.01;
  const isOwed = net > 0;

  const others = group.members.filter((m) => m.userId !== myUserId);

  // Simplify debt lines from balances
  const credits = bals.filter((b) => b.owesYou > 0.01);
  const debts = bals.filter((b) => b.youOwe > 0.01);

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={[styles.card, { backgroundColor: tc.card }]}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.cardEmojiBox, { backgroundColor: tc.cardAlt }]}>
              <Text style={{ fontSize: 28 }}>{group.iconEmoji ?? "👥"}</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardName, { color: tc.textPrimary }]}>{group.name}</Text>
              <Text style={[styles.cardDate, { color: tc.textMuted }]}>
                {new Date(group.createdAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </Text>
            </View>
            <Text style={[styles.cardMemberCount, { color: tc.textMuted }]}>
              {group.members.length} {t.common.members}
            </Text>
          </View>

          {/* Member avatars */}
          <View style={styles.memberRow}>
            {others.slice(0, 4).map((m, i) => (
              <Avatar
                key={m.userId}
                initials={getInitials(m.user.name)}
                color={getAvatarColor(m.userId)}
                size={28}
                style={{ marginLeft: i > 0 ? -8 : 0, borderWidth: 2, borderColor: tc.card }}
              />
            ))}
            {others.length > 4 && (
              <View style={[styles.moreAvatar, { marginLeft: -8, backgroundColor: tc.border }]}>
                <Text style={[styles.moreAvatarText, { color: tc.textSecondary }]}>
                  +{others.length - 4}
                </Text>
              </View>
            )}
          </View>

          {/* Balance section */}
          {isSettled ? (
            <View style={styles.settledBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.settledText}>{t.common.settledUp}</Text>
            </View>
          ) : (
            <View style={styles.debtSection}>
              {credits.map((b) => (
                <Text key={b.id} style={[styles.creditLine, { color: tc.textSecondary }]}>
                  <Text style={{ fontWeight: FONT.bold }}>{b.otherUser.name}</Text>
                  {" "}{t.settle.owes} {t.common.youAreOwed.toLowerCase()}{" "}
                  <Text style={{ color: COLORS.success, fontWeight: FONT.bold }}>{fmt(b.owesYou)}</Text>
                </Text>
              ))}
              {debts.map((b) => (
                <Text key={b.id} style={[styles.debtLine, { color: tc.textSecondary }]}>
                  {t.common.youOwe}{" "}
                  <Text style={{ fontWeight: FONT.bold }}>{b.otherUser.name}</Text>{" "}
                  <Text style={{ color: COLORS.danger, fontWeight: FONT.bold }}>{fmt(b.youOwe)}</Text>
                </Text>
              ))}
              <View style={[styles.netBadge, { backgroundColor: isOwed ? "#E8F5E9" : "#FFEBEE" }]}>
                <Text style={[styles.netBadgeLabel, { color: tc.textSecondary }]}>
                  {isOwed ? t.common.youAreOwed : t.common.youOwe}
                </Text>
                <Text style={[styles.netBadgeAmt, { color: isOwed ? COLORS.success : COLORS.danger }]}>
                  {fmt(Math.abs(net))}
                </Text>
              </View>
            </View>
          )}
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const router = useRouter();
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

  if (loadingGroups && groups.length === 0) return <GroupsScreenSkeleton />;

  const myUserId = user?.id ?? "";
  const sorted = [...groups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{t.groups.title}</Text>
              <Text style={styles.headerSub}>{t.groups.subtitle(groups.length)}</Text>
            </View>
            {/* + button → create new group */}
            <TouchableOpacity
              style={styles.addGroupBtn}
              onPress={() => router.push("/groups/create")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.scroll, { backgroundColor: tc.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loadingGroups} onRefresh={onRefresh} />}
      >
        {sorted.length === 0 && (
          <FadeCard delay={0}>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t.groups.noGroups}</Text>
          </FadeCard>
        )}

        {sorted.map((g, i) => (
          <GroupCard
            key={g.id} group={g} myUserId={myUserId}
            groupBalances={balances[g.id] ?? []}
            delay={i * 70}
            onPress={() => router.push(`/groups/${g.id}`)}
            tc={tc} fmt={fmt} t={t}
          />
        ))}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  headerRow: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingTop: SPACE.sm,
  },
  headerTitle: { fontSize: FONT.display, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
  headerSub: { fontSize: FONT.sm, color: "rgba(255,255,255,0.7)", marginTop: 3, fontWeight: FONT.medium },
  addGroupBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
    marginTop: SPACE.xs,
  },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  card: { borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.sm },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.md },
  cardEmojiBox: { width: 52, height: 52, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  cardHeaderText: { flex: 1 },
  cardName: { fontSize: FONT.lg, fontWeight: FONT.bold },
  cardDate: { fontSize: FONT.xs, marginTop: 2 },
  cardMemberCount: { fontSize: FONT.xs, fontWeight: FONT.medium },
  memberRow: { flexDirection: "row", alignItems: "center", marginBottom: SPACE.md },
  moreAvatar: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  moreAvatarText: { fontSize: FONT.xs, fontWeight: FONT.bold },
  settledBadge: {
    flexDirection: "row", alignItems: "center", gap: SPACE.xs,
    backgroundColor: "#E8F5E9", alignSelf: "flex-start",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs, borderRadius: RADIUS.pill,
  },
  settledText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.success },
  debtSection: { gap: SPACE.xs },
  creditLine: { fontSize: FONT.sm },
  debtLine: { fontSize: FONT.sm },
  netBadge: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md, marginTop: SPACE.xs,
  },
  netBadgeLabel: { fontSize: FONT.sm, fontWeight: FONT.medium },
  netBadgeAmt: { fontSize: FONT.md, fontWeight: FONT.black, letterSpacing: -0.3 },
  emptyText: { fontSize: FONT.base, textAlign: "center", paddingVertical: SPACE.xl },
});