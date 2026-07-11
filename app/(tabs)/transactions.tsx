// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   RefreshControl,
//   SectionList,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { TransactionsSkeleton } from "../../components/Skeleton";
// import { FadeCard } from "../../components/ui";
// import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
// import { ApiExpense } from "../../lib/api";
// import { useAppContext } from "../../lib/useAppContext";
// import { useAuthStore } from "../../store/useAuthStore";
// import { useGroupStore } from "../../store/useGroupStore";

// type Filter = "all" | "paid" | "owe";

// function getMonthKey(date: string) {
//   return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
// }

// // ─── Expense Row ──────────────────────────────────────────────────────────────

// function ExpRow({
//   expense, groupName, groupEmoji, myUserId, delay, onPress, tc, fmt, t,
// }: {
//   expense: ApiExpense; groupName: string; groupEmoji: string;
//   myUserId: string; delay: number; onPress: () => void;
//   tc: ReturnType<typeof useAppContext>["tc"];
//   fmt: (n: number) => string;
//   t: ReturnType<typeof useAppContext>["t"];
// }) {
//   const iPaid   = expense.payers.some((p) => p.userId === myUserId);
//   const mySplit = expense.splits.find((s) => s.debtorId === myUserId);

//   const myRole: "paid" | "owe" | "none" = iPaid ? "paid" : mySplit ? "owe" : "none";
//   const myAmount = iPaid
//     ? parseFloat(String(expense.totalAmount))
//     : mySplit ? parseFloat(String(mySplit.splitAmount)) : 0;

//   const color  = myRole === "paid" ? COLORS.success : myRole === "owe" ? COLORS.danger : tc.textMuted;
//   const sign   = myRole === "paid" ? "+" : myRole === "owe" ? "-" : "";
//   const label  = myRole === "paid" ? t.common.youPaid : myRole === "owe" ? t.common.youOwe : t.common.notInvolved;

//   // Derive emoji from status
//   const emoji = expense.status === "locked" ? "🔒" : expense.status === "settled" ? "✅" : "💰";

//   return (
//     <FadeCard delay={delay}>
//       <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
//         <View style={[styles.expRow, { backgroundColor: tc.card }]}>
//           <View style={[styles.expEmojiBox, { backgroundColor: tc.cardAlt }]}>
//             <Text style={{ fontSize: 20 }}>{emoji}</Text>
//           </View>
//           <View style={styles.expCenter}>
//             <Text style={[styles.expTitle, { color: tc.textPrimary }]}>{expense.title}</Text>
//             <View style={styles.expMeta}>
//               <Text style={[styles.expGroup, { color: tc.textSecondary }]}>{groupEmoji} {groupName}</Text>
//               <Text style={[styles.expDot, { color: tc.textMuted }]}>·</Text>
//               <Text style={[styles.expDate, { color: tc.textMuted }]}>
//                 {new Date(expense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
//               </Text>
//             </View>
//           </View>
//           <View style={styles.expRight}>
//             {myRole !== "none" && (
//               <Text style={[styles.expAmt, { color }]}>
//                 {sign}{fmt(myAmount)}
//               </Text>
//             )}
//             <Text style={[styles.expLabel, { color }]}>{label}</Text>
//           </View>
//         </View>
//       </TouchableOpacity>
//     </FadeCard>
//   );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// export default function TransactionsScreen() {
//   const router = useRouter();
//   const { user } = useAuthStore();
//   const { tc, fmt, t } = useAppContext();
//   const { groups, expenses, loadingGroups, fetchGroups, fetchExpenses } = useGroupStore();

//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState<Filter>("all");

//   const myUserId = user?.id ?? "";

//   useEffect(() => {
//     if (groups.length === 0) fetchGroups();
//   }, []);

//   useEffect(() => {
//     for (const g of groups) {
//       if (!expenses[g.id]) fetchExpenses(g.id);
//     }
//   }, [groups]);

//   const onRefresh = useCallback(async () => {
//     await fetchGroups();
//     for (const g of groups) fetchExpenses(g.id);
//   }, [groups]);

//   // Flatten all expenses across all groups
//   const allExps = useMemo(() => {
//     return groups.flatMap((g) =>
//       (expenses[g.id] ?? []).map((e) => ({
//         ...e,
//         groupName:  g.name,
//         groupEmoji: g.iconEmoji ?? "👥",
//         groupId:    g.id,
//       }))
//     ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//   }, [groups, expenses]);

//   const filtered = useMemo(() => {
//     return allExps.filter((e) => {
//       const iPaid   = e.payers.some((p) => p.userId === myUserId);
//       const mySplit = e.splits.find((s) => s.debtorId === myUserId);
//       if (filter === "paid" && !iPaid) return false;
//       if (filter === "owe"  && !mySplit) return false;
//       if (search) {
//         const q = search.toLowerCase();
//         if (!e.title.toLowerCase().includes(q) && !e.groupName.toLowerCase().includes(q)) return false;
//       }
//       return true;
//     });
//   }, [allExps, filter, search, myUserId]);

//   const sections = useMemo(() => {
//     const byMonth: Record<string, typeof filtered> = {};
//     for (const e of filtered) {
//       const k = getMonthKey(e.createdAt);
//       if (!byMonth[k]) byMonth[k] = [];
//       byMonth[k].push(e);
//     }
//     return Object.entries(byMonth).map(([title, data]) => ({ title, data }));
//   }, [filtered]);

//   const totalPaid = allExps
//     .filter((e) => e.payers.some((p) => p.userId === myUserId))
//     .reduce((s, e) => s + parseFloat(String(e.totalAmount)), 0);

//   const totalOwes = allExps
//     .flatMap((e) => e.splits.filter((s) => s.debtorId === myUserId && !s.isSettled))
//     .reduce((s, sp) => s + parseFloat(String(sp.splitAmount)), 0);

//   const isLoading = loadingGroups && groups.length === 0;
//   if (isLoading) return <TransactionsSkeleton />;

//   const FILTERS: { key: Filter; label: string }[] = [
//     { key: "all",  label: t.transactions.all },
//     { key: "paid", label: t.transactions.youPaid },
//     { key: "owe",  label: t.transactions.youOweTab },
//   ];

//   return (
//     <View style={[styles.root, { backgroundColor: tc.bg }]}>
//       <LinearGradient colors={GRAD} style={styles.header}>
//         <SafeAreaView edges={["top"]}>
//           <View style={styles.headerRow}>
//             <View>
//               <Text style={styles.headerTitle}>{t.transactions.title}</Text>
//               <Text style={styles.headerSub}>{t.transactions.subtitle(allExps.length)}</Text>
//             </View>
//           </View>

//           <View style={styles.summaryRow}>
//             <View style={styles.summaryPill}>
//               <Ionicons name="arrow-up-circle" size={18} color={COLORS.success} />
//               <View>
//                 <Text style={styles.summaryLbl}>{t.transactions.paidOut}</Text>
//                 <Text style={[styles.summaryAmt, { color: COLORS.success }]}>{fmt(totalPaid)}</Text>
//               </View>
//             </View>
//             <View style={styles.summaryPill}>
//               <Ionicons name="arrow-down-circle" size={18} color={COLORS.danger} />
//               <View>
//                 <Text style={styles.summaryLbl}>{t.transactions.youOwe}</Text>
//                 <Text style={[styles.summaryAmt, { color: COLORS.danger }]}>{fmt(totalOwes)}</Text>
//               </View>
//             </View>
//           </View>
//         </SafeAreaView>
//       </LinearGradient>

//       <View style={[styles.body, { backgroundColor: tc.bg }]}>
//         {/* Search */}
//         <View style={[styles.searchBar, { backgroundColor: tc.card }]}>
//           <Ionicons name="search" size={16} color={tc.textMuted} />
//           <TextInput
//             style={[styles.searchInput, { color: tc.textPrimary }]}
//             placeholder={t.transactions.search}
//             placeholderTextColor={tc.textMuted}
//             value={search}
//             onChangeText={setSearch}
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={() => setSearch("")}>
//               <Ionicons name="close-circle" size={16} color={tc.textMuted} />
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Filters */}
//         <View style={styles.filterRow}>
//           {FILTERS.map((f) => (
//             <TouchableOpacity
//               key={f.key}
//               style={[styles.filterChip, { backgroundColor: filter === f.key ? COLORS.primary : tc.sectionBg }]}
//               onPress={() => setFilter(f.key)}
//               activeOpacity={0.8}
//             >
//               <Text style={[styles.filterChipText, { color: filter === f.key ? "#fff" : tc.textSecondary }]}>
//                 {f.label}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </View>

//         <SectionList
//           sections={sections}
//           keyExtractor={(item) => item.id}
//           showsVerticalScrollIndicator={false}
//           stickySectionHeadersEnabled={false}
//           contentContainerStyle={{ paddingBottom: 100 }}
//           refreshControl={<RefreshControl refreshing={loadingGroups} onRefresh={onRefresh} />}
//           renderSectionHeader={({ section }) => (
//             <View style={styles.monthHeader}>
//               <Text style={[styles.monthTitle, { color: tc.textSecondary }]}>{section.title}</Text>
//               <Text style={[styles.monthCount, { color: tc.textMuted }]}>
//                 {section.data.length} {t.common.expenses}
//               </Text>
//             </View>
//           )}
//           renderItem={({ item, index }) => (
//             <ExpRow
//               expense={item}
//               groupName={item.groupName}
//               groupEmoji={item.groupEmoji}
//               myUserId={myUserId}
//               delay={index * 40}
//               onPress={() => router.push(`/groups/${item.groupId}`)}
//               tc={tc} fmt={fmt} t={t}
//             />
//           )}
//           ListEmptyComponent={
//             <View style={styles.emptyBox}>
//               <Text style={{ fontSize: 44 }}>🔍</Text>
//               <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t.transactions.noTransactions}</Text>
//             </View>
//           }
//         />
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   header: { paddingBottom: SPACE.xl + 8, paddingHorizontal: SPACE.xl },
//   headerRow: {
//     flexDirection: "row", justifyContent: "space-between",
//     alignItems: "flex-start", paddingTop: SPACE.xs, marginBottom: SPACE.lg,
//   },
//   headerTitle: { fontSize: FONT.display, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
//   headerSub: { fontSize: FONT.sm, color: "rgba(255,255,255,0.7)", marginTop: 3 },
//   summaryRow: { flexDirection: "row", gap: SPACE.md },
//   summaryPill: {
//     flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
//   },
//   summaryLbl: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium },
//   summaryAmt: { fontSize: FONT.lg, fontWeight: FONT.black, letterSpacing: -0.3 },
//   body: {
//     flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4,
//     marginTop: -RADIUS.xxl, paddingTop: SPACE.lg, paddingHorizontal: SPACE.xl,
//   },
//   searchBar: {
//     flexDirection: "row", alignItems: "center",
//     borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
//     gap: SPACE.sm, marginBottom: SPACE.md, ...SHADOW.sm,
//   },
//   searchInput: { flex: 1, fontSize: FONT.base },
//   filterRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.lg },
//   filterChip: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm - 2, borderRadius: RADIUS.pill },
//   filterChipText: { fontSize: FONT.sm, fontWeight: FONT.semibold },
//   monthHeader: {
//     flexDirection: "row", alignItems: "center", justifyContent: "space-between",
//     marginBottom: SPACE.sm, marginTop: SPACE.xs,
//   },
//   monthTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, textTransform: "uppercase", letterSpacing: 0.5 },
//   monthCount: { fontSize: FONT.xs },
//   expRow: {
//     flexDirection: "row", alignItems: "center",
//     borderRadius: RADIUS.xl, padding: SPACE.md,
//     marginBottom: SPACE.sm, gap: SPACE.md, ...SHADOW.sm,
//   },
//   expEmojiBox: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
//   expCenter: { flex: 1, gap: 3 },
//   expTitle: { fontSize: FONT.base, fontWeight: FONT.bold },
//   expMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
//   expGroup: { fontSize: FONT.xs },
//   expDot: { fontSize: FONT.xs },
//   expDate: { fontSize: FONT.xs },
//   expRight: { alignItems: "flex-end", gap: 2 },
//   expAmt: { fontSize: FONT.md, fontWeight: FONT.black, letterSpacing: -0.3 },
//   expLabel: { fontSize: FONT.xs, fontWeight: FONT.semibold },
//   emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
//   emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold },
// });



import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransactionsSkeleton } from "../../components/Skeleton";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { ApiExpense } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { useGroupStore } from "../../store/useGroupStore";

type Filter = "all" | "paid" | "owe";

function getMonthKey(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpRow({
  expense, groupName, groupEmoji, myUserId, delay, onPress, tc, fmt, t,
}: {
  expense: ApiExpense; groupName: string; groupEmoji: string;
  myUserId: string; delay: number; onPress: () => void;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
  t: ReturnType<typeof useAppContext>["t"];
}) {
  const iPaid = (expense.payers ?? []).some((p) => p.userId === myUserId);
  const mySplit = (expense.splits ?? []).find((s) => s.debtorId === myUserId);

  const myRole: "paid" | "owe" | "none" = iPaid ? "paid" : mySplit ? "owe" : "none";
  const myAmount = iPaid
    ? parseFloat(String(expense.totalAmount))
    : mySplit ? parseFloat(String(mySplit.splitAmount)) : 0;

  const color = myRole === "paid" ? COLORS.success : myRole === "owe" ? COLORS.danger : tc.textMuted;
  const sign = myRole === "paid" ? "+" : myRole === "owe" ? "-" : "";
  const label = myRole === "paid" ? t.common.youPaid : myRole === "owe" ? t.common.youOwe : t.common.notInvolved;

  // Derive emoji from status
  const emoji = expense.status === "locked" ? "🔒" : expense.status === "settled" ? "✅" : "💰";

  return (
    <FadeCard delay={delay}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={[styles.expRow, { backgroundColor: tc.card }]}>
          <View style={[styles.expEmojiBox, { backgroundColor: tc.cardAlt }]}>
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </View>
          <View style={styles.expCenter}>
            <Text style={[styles.expTitle, { color: tc.textPrimary }]}>{expense.title}</Text>
            <View style={styles.expMeta}>
              <Text style={[styles.expGroup, { color: tc.textSecondary }]}>{groupEmoji} {groupName}</Text>
              <Text style={[styles.expDot, { color: tc.textMuted }]}>·</Text>
              <Text style={[styles.expDate, { color: tc.textMuted }]}>
                {new Date(expense.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
            </View>
          </View>
          <View style={styles.expRight}>
            {myRole !== "none" && (
              <Text style={[styles.expAmt, { color }]}>
                {sign}{fmt(myAmount)}
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
  const { user } = useAuthStore();
  const { tc, fmt, t } = useAppContext();
  const { groups, expenses, loadingGroups, fetchGroups, fetchExpenses } = useGroupStore();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const myUserId = user?.id ?? "";

  useEffect(() => {
    if (groups.length === 0) fetchGroups();
  }, []);

  useEffect(() => {
    for (const g of groups) {
      if (!expenses[g.id]) fetchExpenses(g.id);
    }
  }, [groups]);

  const onRefresh = useCallback(async () => {
    await fetchGroups();
    for (const g of groups) fetchExpenses(g.id);
  }, [groups]);

  // Flatten all expenses across all groups
  const allExps = useMemo(() => {
    return groups.flatMap((g) =>
      (expenses[g.id] ?? []).map((e) => ({
        ...e,
        // Safe fallbacks in case API returns undefined arrays
        payers: e.payers ?? [],
        splits: e.splits ?? [],
        participants: e.participants ?? [],
        groupName: g.name,
        groupEmoji: g.iconEmoji ?? "👥",
        groupId: g.id,
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [groups, expenses]);

  const filtered = useMemo(() => {
    return allExps.filter((e) => {
      const iPaid = (e.payers ?? []).some((p) => p.userId === myUserId);
      const mySplit = (e.splits ?? []).find((s) => s.debtorId === myUserId);
      if (filter === "paid" && !iPaid) return false;
      if (filter === "owe" && !mySplit) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.groupName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allExps, filter, search, myUserId]);

  const sections = useMemo(() => {
    const byMonth: Record<string, typeof filtered> = {};
    for (const e of filtered) {
      const k = getMonthKey(e.createdAt);
      if (!byMonth[k]) byMonth[k] = [];
      byMonth[k].push(e);
    }
    return Object.entries(byMonth).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const totalPaid = allExps
    .filter((e) => (e.payers ?? []).some((p) => p.userId === myUserId))
    .reduce((s, e) => s + parseFloat(String(e.totalAmount)), 0);

  const totalOwes = allExps
    .flatMap((e) => (e.splits ?? []).filter((s) => s.debtorId === myUserId && !s.isSettled))
    .reduce((s, sp) => s + parseFloat(String(sp.splitAmount)), 0);

  const isLoading = loadingGroups && groups.length === 0;
  if (isLoading) return <TransactionsSkeleton />;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.transactions.all },
    { key: "paid", label: t.transactions.youPaid },
    { key: "owe", label: t.transactions.youOweTab },
  ];

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>{t.transactions.title}</Text>
              <Text style={styles.headerSub}>{t.transactions.subtitle(allExps.length)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryPill}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.success} />
              <View>
                <Text style={styles.summaryLbl}>{t.transactions.paidOut}</Text>
                <Text style={[styles.summaryAmt, { color: COLORS.success }]}>{fmt(totalPaid)}</Text>
              </View>
            </View>
            <View style={styles.summaryPill}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.danger} />
              <View>
                <Text style={styles.summaryLbl}>{t.transactions.youOwe}</Text>
                <Text style={[styles.summaryAmt, { color: COLORS.danger }]}>{fmt(totalOwes)}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={[styles.body, { backgroundColor: tc.bg }]}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: tc.card }]}>
          <Ionicons name="search" size={16} color={tc.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            placeholder={t.transactions.search}
            placeholderTextColor={tc.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={tc.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, { backgroundColor: filter === f.key ? COLORS.primary : tc.sectionBg }]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, { color: filter === f.key ? "#fff" : tc.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={loadingGroups} onRefresh={onRefresh} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.monthHeader}>
              <Text style={[styles.monthTitle, { color: tc.textSecondary }]}>{section.title}</Text>
              <Text style={[styles.monthCount, { color: tc.textMuted }]}>
                {section.data.length} {t.common.expenses}
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <ExpRow
              expense={item}
              groupName={item.groupName}
              groupEmoji={item.groupEmoji}
              myUserId={myUserId}
              delay={index * 40}
              onPress={() => router.push(`/groups/${item.groupId}`)}
              tc={tc} fmt={fmt} t={t}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 44 }}>🔍</Text>
              <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t.transactions.noTransactions}</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -RADIUS.xxl, paddingTop: SPACE.lg, paddingHorizontal: SPACE.xl,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
    gap: SPACE.sm, marginBottom: SPACE.md, ...SHADOW.sm,
  },
  searchInput: { flex: 1, fontSize: FONT.base },
  filterRow: { flexDirection: "row", gap: SPACE.sm, marginBottom: SPACE.lg },
  filterChip: { paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm - 2, borderRadius: RADIUS.pill },
  filterChipText: { fontSize: FONT.sm, fontWeight: FONT.semibold },
  monthHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: SPACE.sm, marginTop: SPACE.xs,
  },
  monthTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, textTransform: "uppercase", letterSpacing: 0.5 },
  monthCount: { fontSize: FONT.xs },
  expRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: RADIUS.xl, padding: SPACE.md,
    marginBottom: SPACE.sm, gap: SPACE.md, ...SHADOW.sm,
  },
  expEmojiBox: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
  expCenter: { flex: 1, gap: 3 },
  expTitle: { fontSize: FONT.base, fontWeight: FONT.bold },
  expMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  expGroup: { fontSize: FONT.xs },
  expDot: { fontSize: FONT.xs },
  expDate: { fontSize: FONT.xs },
  expRight: { alignItems: "flex-end", gap: 2 },
  expAmt: { fontSize: FONT.md, fontWeight: FONT.black, letterSpacing: -0.3 },
  expLabel: { fontSize: FONT.xs, fontWeight: FONT.semibold },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
  emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold },
});