import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FriendProfileSkeleton } from "../../components/Skeleton";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

export default function FriendProfileScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { tc, fmt, t } = useAppContext();
  const { groups, expenses, balances, fetchGroups, fetchExpenses, fetchBalances } = useGroupStore();

  const myUserId = user?.id ?? "";

  const [isLoading, setIsLoading] = useState(groups.length === 0);

  useEffect(() => {
    const init = async () => {
      if (groups.length === 0) await fetchGroups();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    // Fetch expenses and balances for shared groups
    for (const g of groups) {
      const isMember = g.members.some((m) => m.userId === myUserId);
      const isFriendIn = g.members.some((m) => m.userId === friendId);
      if (isMember && isFriendIn) {
        if (!expenses[g.id]) fetchExpenses(g.id);
        if (!balances[g.id]) fetchBalances(g.id);
      }
    }
  }, [groups]);

  const onRefresh = useCallback(async () => {
    await fetchGroups();
  }, []);

  if (isLoading) return <FriendProfileSkeleton />;

  // Find friend info from any shared group member list
  const friendInfo = useMemo(() => {
    for (const g of groups) {
      const m = g.members.find((m) => m.userId === friendId);
      if (m) return m;
    }
    return null;
  }, [groups, friendId]);

  // Build shared group data
  const sharedData = useMemo(() => {
    return groups
      .filter((g) =>
        g.members.some((m) => m.userId === friendId) &&
        g.members.some((m) => m.userId === myUserId)
      )
      .map((g) => {
        // Net from balances cache
        const groupBals = balances[g.id] ?? [];
        const friendBal = groupBals.find((b) => b.otherUser.id === friendId);
        const net = friendBal ? friendBal.owesYou - friendBal.youOwe : 0;

        // Recent shared expenses
        const groupExps = expenses[g.id] ?? [];
        const sharedExp = groupExps.filter((e) =>
          e.participants.some((p) => p.userId === friendId) &&
          e.participants.some((p) => p.userId === myUserId)
        );

        return { group: g, net: parseFloat(net.toFixed(2)), sharedExp };
      });
  }, [groups, balances, expenses, friendId, myUserId]);

  const totalNet = sharedData.reduce((s, d) => s + d.net, 0);

  if (!friendInfo) {
    return (
      <View style={[styles.root, { backgroundColor: tc.bg, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: tc.textMuted }}>Friend not found</Text>
      </View>
    );
  }

  const isOwed = totalNet > 0;
  const isSettled = Math.abs(totalNet) < 0.01;

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Friend Profile</Text>
            <View style={{ width: 38 }} />
          </View>

          <View style={styles.hero}>
            <Avatar
              initials={getInitials(friendInfo.user.name)}
              color={getAvatarColor(friendInfo.userId)}
              size={70}
              style={{ borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" }}
            />
            <Text style={styles.heroName}>{friendInfo.user.name}</Text>

            <View style={[styles.netBadge, {
              backgroundColor: isSettled ? "rgba(255,255,255,0.2)" : isOwed ? "rgba(76,175,80,0.25)" : "rgba(255,68,68,0.25)",
            }]}>
              {isSettled ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.netBadgeText}>{t.common.settledUp}</Text>
                </>
              ) : isOwed ? (
                <>
                  <Ionicons name="arrow-down-circle" size={16} color="#A5D6A7" />
                  <Text style={styles.netBadgeText}>
                    {t.home.owesYou} <Text style={{ fontWeight: FONT.black }}>{fmt(totalNet)}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={16} color="#EF9A9A" />
                  <Text style={styles.netBadgeText}>
                    {t.common.youOwe} <Text style={{ fontWeight: FONT.black }}>{fmt(-totalNet)}</Text>
                  </Text>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={[styles.scroll, { backgroundColor: tc.bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        <Text style={[styles.sectionLbl, { color: tc.textMuted }]}>SHARED GROUPS</Text>

        {sharedData.map(({ group, net, sharedExp }, gi) => (
          <FadeCard key={group.id} delay={gi * 80}>
            <TouchableOpacity
              style={[styles.groupCard, { backgroundColor: tc.card }]}
              onPress={() => router.push(`/groups/${group.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.groupCardHeader}>
                <Text style={{ fontSize: 26 }}>{group.iconEmoji ?? "👥"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupCardName, { color: tc.textPrimary }]}>{group.name}</Text>
                  <Text style={[styles.groupCardExpCount, { color: tc.textMuted }]}>
                    {sharedExp.length} shared expenses
                  </Text>
                </View>
                <View style={[styles.groupNetTag, {
                  backgroundColor: Math.abs(net) < 0.01 ? tc.sectionBg : net > 0 ? "#E8F5E9" : "#FFEBEE",
                }]}>
                  <Text style={[styles.groupNetAmt, {
                    color: Math.abs(net) < 0.01 ? tc.textMuted : net > 0 ? COLORS.success : COLORS.danger,
                  }]}>
                    {Math.abs(net) < 0.01 ? t.common.settledUp : net > 0 ? `+${fmt(net)}` : `-${fmt(-net)}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={tc.textMuted} />
              </View>

              {sharedExp.slice(0, 3).map((exp) => {
                const iPaid = exp.payers.some((p) => p.userId === myUserId);
                const mySplit = exp.splits.find((s) => s.debtorId === myUserId);
                const fSplit = exp.splits.find((s) => s.debtorId === friendId);
                const amt = iPaid
                  ? fSplit ? parseFloat(String(fSplit.splitAmount)) : undefined
                  : mySplit ? parseFloat(String(mySplit.splitAmount)) : undefined;
                const color = iPaid ? COLORS.success : COLORS.danger;

                return (
                  <View key={exp.id} style={[styles.expPreviewRow, { borderTopColor: tc.border }]}>
                    <Text style={{ fontSize: 16, width: 26, textAlign: "center" }}>💰</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.expPreviewTitle, { color: tc.textPrimary }]}>{exp.title}</Text>
                      <Text style={[styles.expPreviewDate, { color: tc.textMuted }]}>
                        {new Date(exp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Text>
                    </View>
                    {amt !== undefined && (
                      <Text style={[styles.expPreviewAmt, { color }]}>
                        {iPaid ? "+" : "-"}{fmt(amt)}
                      </Text>
                    )}
                  </View>
                );
              })}

              {sharedExp.length > 3 && (
                <Text style={styles.viewMore}>+{sharedExp.length - 3} more expenses</Text>
              )}
            </TouchableOpacity>
          </FadeCard>
        ))}

        {sharedData.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44 }}>🤝</Text>
            <Text style={[styles.emptyText, { color: tc.textMuted }]}>No shared groups yet</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: SPACE.xs, marginBottom: SPACE.lg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
  hero: { alignItems: "center", gap: SPACE.md, paddingBottom: SPACE.sm },
  heroName: { fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5 },
  netBadge: {
    flexDirection: "row", alignItems: "center", gap: SPACE.xs,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, borderRadius: RADIUS.pill,
  },
  netBadgeText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: "#fff" },
  scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  sectionLbl: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md },
  groupCard: { borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.sm },
  groupCardHeader: { flexDirection: "row", alignItems: "center", gap: SPACE.md, marginBottom: SPACE.sm },
  groupCardName: { fontSize: FONT.md, fontWeight: FONT.bold },
  groupCardExpCount: { fontSize: FONT.xs, marginTop: 2 },
  groupNetTag: { paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
  groupNetAmt: { fontSize: FONT.sm, fontWeight: FONT.black },
  expPreviewRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACE.sm, borderTopWidth: 1, gap: SPACE.sm },
  expPreviewTitle: { fontSize: FONT.sm, fontWeight: FONT.semibold },
  expPreviewDate: { fontSize: FONT.xs },
  expPreviewAmt: { fontSize: FONT.sm, fontWeight: FONT.black },
  viewMore: { fontSize: FONT.sm, color: COLORS.primary, fontWeight: FONT.semibold, paddingTop: SPACE.sm, paddingLeft: 38 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
  emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold },
});