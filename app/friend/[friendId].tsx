import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FriendProfileSkeleton } from "../../components/Skeleton";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppStore } from "../../store/useAppStore";

export default function FriendProfileScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const router = useRouter();
  const { groups, currentUserId } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1100);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <FriendProfileSkeleton />;

  const friendInfo = useMemo(() => {
    for (const g of groups) {
      const m = g.members.find((m) => m.id === friendId);
      if (m) return m;
    }
    return null;
  }, [groups, friendId]);

  const sharedData = useMemo(() => {
    return groups
      .filter((g) => g.members.some((m) => m.id === friendId) && g.members.some((m) => m.id === currentUserId))
      .map((g) => {
        let net = 0;
        for (const exp of g.expenses) {
          if (exp.paidById === currentUserId) {
            const s = exp.splits.find((s) => s.memberId === friendId && !s.settled);
            if (s) net += s.amount;
          } else if (exp.paidById === friendId) {
            const s = exp.splits.find((s) => s.memberId === currentUserId && !s.settled);
            if (s) net -= s.amount;
          }
        }
        const sharedExp = g.expenses.filter(
          (e) => e.splits.some((s) => s.memberId === friendId) && e.splits.some((s) => s.memberId === currentUserId)
        );
        return { group: g, net: parseFloat(net.toFixed(2)), sharedExp };
      });
  }, [groups, friendId, currentUserId]);

  const totalNet = sharedData.reduce((s, d) => s + d.net, 0);

  if (!friendInfo) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ color: COLORS.textMuted }}>Friend not found</Text>
      </View>
    );
  }

  const isOwed = totalNet > 0;
  const isSettled = Math.abs(totalNet) < 0.01;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Friend Profile</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Profile hero */}
          <View style={styles.hero}>
            <Avatar initials={friendInfo.initials} color={friendInfo.avatarColor} size={70}
              style={{ borderWidth: 3, borderColor: "rgba(255,255,255,0.5)" }} />
            <Text style={styles.heroName}>{friendInfo.name}</Text>

            {/* Net badge */}
            <View style={[styles.netBadge,
              { backgroundColor: isSettled ? "rgba(255,255,255,0.2)" : isOwed ? "rgba(76,175,80,0.25)" : "rgba(255,68,68,0.25)" }
            ]}>
              {isSettled ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.netBadgeText}>All settled up</Text>
                </>
              ) : isOwed ? (
                <>
                  <Ionicons name="arrow-down-circle" size={16} color="#A5D6A7" />
                  <Text style={styles.netBadgeText}>
                    Owes you <Text style={{ fontWeight: FONT.black }}>${totalNet.toFixed(2)}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-up-circle" size={16} color="#EF9A9A" />
                  <Text style={styles.netBadgeText}>
                    You owe <Text style={{ fontWeight: FONT.black }}>${(-totalNet).toFixed(2)}</Text>
                  </Text>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLbl}>SHARED GROUPS</Text>

        {sharedData.map(({ group, net, sharedExp }, gi) => (
          <FadeCard key={group.id} delay={gi * 80}>
            <TouchableOpacity
              style={styles.groupCard}
              onPress={() => router.push(`/groups/${group.id}`)}
              activeOpacity={0.8}
            >
              {/* Header */}
              <View style={styles.groupCardHeader}>
                <Text style={{ fontSize: 26 }}>{group.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupCardName}>{group.name}</Text>
                  <Text style={styles.groupCardExpCount}>{sharedExp.length} shared expenses</Text>
                </View>
                <View style={[styles.groupNetTag, {
                  backgroundColor: Math.abs(net) < 0.01 ? "#F0F0F0" : net > 0 ? "#E8F5E9" : "#FFEBEE",
                }]}>
                  <Text style={[styles.groupNetAmt, {
                    color: Math.abs(net) < 0.01 ? COLORS.textMuted : net > 0 ? COLORS.success : COLORS.danger,
                  }]}>
                    {Math.abs(net) < 0.01 ? "Settled" : net > 0 ? `+$${net.toFixed(2)}` : `-$${(-net).toFixed(2)}`}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
              </View>

              {/* Expense preview */}
              {sharedExp.slice(0, 3).map((exp) => {
                const friendSplit = exp.splits.find((s) => s.memberId === friendId);
                const mySplit = exp.splits.find((s) => s.memberId === currentUserId);
                const iPaid = exp.paidById === currentUserId;
                const friendPaid = exp.paidById === friendId;
                const amt = iPaid ? friendSplit?.amount : mySplit?.amount;
                const color = iPaid ? COLORS.success : COLORS.danger;

                return (
                  <View key={exp.id} style={styles.expPreviewRow}>
                    <Text style={{ fontSize: 16, width: 26, textAlign: "center" }}>{exp.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.expPreviewTitle}>{exp.title}</Text>
                      <Text style={styles.expPreviewDate}>{exp.date}</Text>
                    </View>
                    {amt !== undefined && (
                      <Text style={[styles.expPreviewAmt, { color }]}>
                        {iPaid ? "+" : "-"}${amt.toFixed(2)}
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
            <Text style={styles.emptyText}>No shared groups yet</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingBottom: SPACE.xl + 4, paddingHorizontal: SPACE.xl },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingTop: SPACE.xs,
    marginBottom: SPACE.lg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
  hero: { alignItems: "center", gap: SPACE.md, paddingBottom: SPACE.sm },
  heroName: {
    fontSize: FONT.xxl, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.5,
  },
  netBadge: {
    flexDirection: "row", alignItems: "center", gap: SPACE.xs,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    borderRadius: RADIUS.pill,
  },
  netBadgeText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: "#fff" },
  scroll: {
    flex: 1, backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl + 4,
    borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -RADIUS.xxl,
  },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  sectionLbl: {
    fontSize: FONT.xs, fontWeight: FONT.black, color: COLORS.textMuted,
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md,
  },
  groupCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.sm,
  },
  groupCardHeader: {
    flexDirection: "row", alignItems: "center",
    gap: SPACE.md, marginBottom: SPACE.sm,
  },
  groupCardName: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.textPrimary },
  groupCardExpCount: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  groupNetTag: {
    paddingHorizontal: SPACE.sm, paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  groupNetAmt: { fontSize: FONT.sm, fontWeight: FONT.black },
  expPreviewRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: SPACE.sm, borderTopWidth: 1,
    borderTopColor: COLORS.border, gap: SPACE.sm,
  },
  expPreviewTitle: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textPrimary },
  expPreviewDate: { fontSize: FONT.xs, color: COLORS.textMuted },
  expPreviewAmt: { fontSize: FONT.sm, fontWeight: FONT.black },
  viewMore: {
    fontSize: FONT.sm, color: COLORS.primary, fontWeight: FONT.semibold,
    paddingTop: SPACE.sm, paddingLeft: 38,
  },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
  emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold, color: COLORS.textMuted },
});