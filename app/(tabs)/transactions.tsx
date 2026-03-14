import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { useAppStore } from "../../store/useAppStore";

type Filter = "all" | "paid" | "owe";

function getMonthKey(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpRow({
  expense,
  groupName,
  groupEmoji,
  myRole,
  myAmount,
  delay,
  onPress,
}: {
  expense: any;
  groupName: string;
  groupEmoji: string;
  myRole: "paid" | "owe" | "none";
  myAmount: number;
  delay: number;
  onPress: () => void;
}) {
  const color = myRole === "paid" ? COLORS.success : myRole === "owe" ? COLORS.danger : COLORS.textMuted;
  const sign = myRole === "paid" ? "+" : myRole === "owe" ? "-" : "";
  const label = myRole === "paid" ? "You paid" : myRole === "owe" ? "You owe" : "Not involved";

  return (
    <FadeCard delay={delay}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.expRow}>
          <View style={styles.expEmojiBox}>
            <Text style={{ fontSize: 20 }}>{expense.emoji}</Text>
          </View>
          <View style={styles.expCenter}>
            <Text style={styles.expTitle}>{expense.title}</Text>
            <View style={styles.expMeta}>
              <Text style={styles.expGroup}>{groupEmoji} {groupName}</Text>
              <Text style={styles.expDot}>·</Text>
              <Text style={styles.expDate}>
                {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          </View>
          <View style={styles.expRight}>
            {myRole !== "none" && (
              <Text style={[styles.expAmt, { color }]}>
                {sign}${myAmount.toFixed(2)}
              </Text>
            )}
            <Text style={[styles.expLabel, { color }]}>{label}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const router = useRouter();
  const { getAllExpenses, currentUserId, groups } = useAppStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const allExps = useMemo(() => {
    return getAllExpenses().map((e) => {
      const iPaid = e.paidById === currentUserId;
      const mySplit = e.splits.find((s) => s.memberId === currentUserId);
      const myRole: "paid" | "owe" | "none" = iPaid ? "paid" : mySplit ? "owe" : "none";
      const myAmount = iPaid
        ? e.splits.filter((s) => s.memberId !== currentUserId && !s.settled).reduce((sum, s) => sum + s.amount, 0)
        : (mySplit?.amount ?? 0);
      return { ...e, myRole, myAmount };
    });
  }, [getAllExpenses, currentUserId]);

  const filtered = useMemo(() => {
    return allExps
      .filter((e) => {
        if (filter === "paid" && e.myRole !== "paid") return false;
        if (filter === "owe" && e.myRole !== "owe") return false;
        if (search) {
          const q = search.toLowerCase();
          if (!e.title.toLowerCase().includes(q) && !e.groupName.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allExps, filter, search]);

  const sections = useMemo(() => {
    const byMonth: Record<string, typeof filtered> = {};
    for (const e of filtered) {
      const k = getMonthKey(e.date);
      if (!byMonth[k]) byMonth[k] = [];
      byMonth[k].push(e);
    }
    return Object.entries(byMonth).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const totalPaid = allExps.filter((e) => e.myRole === "paid").reduce((s, e) => s + e.amount, 0);
  const totalOwes = allExps.filter((e) => e.myRole === "owe").reduce((s, e) => s + e.myAmount, 0);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "You Paid" },
    { key: "owe", label: "You Owe" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Activity</Text>
              <Text style={styles.headerSub}>{allExps.length} total expenses</Text>
            </View>
          </View>

          {/* Summary pills */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.success} />
              <View>
                <Text style={styles.summaryLbl}>Paid out</Text>
                <Text style={[styles.summaryAmt, { color: COLORS.success }]}>
                  ${allExps.filter((e) => e.myRole === "paid").reduce((s, e) => s + e.amount, 0).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryPill}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.danger} />
              <View>
                <Text style={styles.summaryLbl}>You owe</Text>
                <Text style={[styles.summaryAmt, { color: COLORS.danger }]}>
                  ${allExps.filter((e) => e.myRole === "owe").reduce((s, e) => s + e.myAmount, 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.body}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipOn]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextOn]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderSectionHeader={({ section }) => (
            <View style={styles.monthHeader}>
              <Text style={styles.monthTitle}>{section.title}</Text>
              <Text style={styles.monthCount}>{section.data.length} expenses</Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <ExpRow
              expense={item}
              groupName={item.groupName}
              groupEmoji={item.groupEmoji}
              myRole={item.myRole}
              myAmount={item.myAmount}
              delay={index * 40}
              onPress={() => router.push(`/groups/${item.groupId}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 44 }}>🔍</Text>
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { paddingBottom: SPACE.xl + 8, paddingHorizontal: SPACE.xl },
  headerRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", paddingTop: SPACE.xs, marginBottom: SPACE.lg,
  },
  headerTitle: { fontSize: FONT.display, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
  headerSub: { fontSize: FONT.sm, color: "rgba(255,255,255,0.7)", marginTop: 3 },
  summaryRow: { flexDirection: "row", gap: SPACE.md },
  summaryPill: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
  },
  summaryLbl: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
  summaryAmt: { fontSize: FONT.lg, fontWeight: FONT.black, letterSpacing: -0.3 },
  body: {
    flex: 1, backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl + 4,
    borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -RADIUS.xxl,
    paddingTop: SPACE.lg,
    paddingHorizontal: SPACE.xl,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
    gap: SPACE.sm, marginBottom: SPACE.md, ...SHADOW.sm,
  },
  searchInput: { flex: 1, fontSize: FONT.base, color: COLORS.textPrimary },
  filterRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.lg },
  filterChip: {
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm - 2,
    borderRadius: RADIUS.pill, backgroundColor: "#EDE8E3",
  },
  filterChipOn: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  filterChipTextOn: { color: "#fff" },
  monthHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: SPACE.sm, marginTop: SPACE.xs,
  },
  monthTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  monthCount: { fontSize: FONT.xs, color: COLORS.textMuted },
  expRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    padding: SPACE.md, marginBottom: SPACE.sm,
    gap: SPACE.md, ...SHADOW.sm,
  },
  expEmojiBox: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center",
  },
  expCenter: { flex: 1, gap: 3 },
  expTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.textPrimary },
  expMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  expGroup: { fontSize: FONT.xs, color: COLORS.textSecondary },
  expDot: { fontSize: FONT.xs, color: COLORS.textMuted },
  expDate: { fontSize: FONT.xs, color: COLORS.textMuted },
  expRight: { alignItems: "flex-end", gap: 2 },
  expAmt: { fontSize: FONT.md, fontWeight: FONT.black, letterSpacing: -0.3 },
  expLabel: { fontSize: FONT.xs, fontWeight: FONT.semibold },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
  emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold, color: COLORS.textMuted },
});



// import React from 'react';
// import { Text, View } from 'react-native';

// export default function TransactionsScreen() {
//   return (
//     <View className="flex-1 bg-transparent items-center justify-center">
//       <Text className="text-white text-xl">Transactions Feed</Text>
//     </View>
//   );
// }


