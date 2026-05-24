import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GroupDetailSkeleton } from "../../components/Skeleton";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { ApiExpense, expensesApi } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpenseRow({
    expense, myUserId, delay, onPress, onLock, tc, fmt,
}: {
    expense: ApiExpense; myUserId: string; delay: number;
    onPress: () => void; onLock: () => void;
    tc: ReturnType<typeof useAppContext>["tc"];
    fmt: (n: number) => string;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
    const onOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

    const iPaid = expense.payers.some((p) => p.userId === myUserId);
    const mySplit = expense.splits.find((s) => s.debtorId === myUserId);

    let statusLabel = "Not Involved";
    let statusColor = tc.textMuted;
    let amountDisplay = "";

    if (iPaid) {
        const othersOwe = expense.splits
            .filter((s) => s.creditorId === myUserId && !s.isSettled)
            .reduce((sum, s) => sum + parseFloat(String(s.splitAmount)), 0);
        statusLabel = "Owes you";
        statusColor = COLORS.success;
        amountDisplay = othersOwe > 0 ? fmt(othersOwe) : "";
    } else if (mySplit) {
        if (mySplit.isSettled) {
            statusLabel = "Settled";
            statusColor = tc.textMuted;
        } else {
            statusLabel = "You Owe";
            statusColor = COLORS.danger;
            amountDisplay = fmt(parseFloat(String(mySplit.splitAmount)));
        }
    }

    const isCreator = expense.createdById === myUserId;
    const isPending = expense.status === "pending";
    const isLocked = expense.status === "locked";
    const isSettled = expense.status === "settled";

    const statusEmoji = isLocked ? "🔒" : isSettled ? "✅" : "💰";

    const bgColor =
        statusLabel === "Owes you" ? (tc.bg === "#121212" ? "#0D2610" : "#F0FBF1") :
            statusLabel === "You Owe" ? (tc.bg === "#121212" ? "#2A0D0D" : "#FFF5F5") :
                tc.sectionBg;

    return (
        <FadeCard delay={delay}>
            <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
                <Animated.View style={[styles.expRow, { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] }]}>
                    <View style={[styles.expEmoji, { backgroundColor: tc.cardAlt }]}>
                        <Text style={{ fontSize: 22 }}>{statusEmoji}</Text>
                    </View>
                    <View style={styles.expCenter}>
                        <Text style={[styles.expTitle, { color: tc.textPrimary }]}>{expense.title}</Text>
                        <Text style={[styles.expDate, { color: tc.textMuted }]}>
                            {new Date(expense.createdAt).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                            })}
                        </Text>
                        {/* Participant count */}
                        {expense.participants.length > 0 && (
                            <Text style={[styles.expParticipants, { color: tc.textMuted }]}>
                                {expense.participants.filter((p) => p.participationStatus === "yes").length}/
                                {expense.participants.length} confirmed
                            </Text>
                        )}
                    </View>
                    <View style={styles.expRight}>
                        <Text style={[styles.expStatus, { color: statusColor }]}>{statusLabel}</Text>
                        {amountDisplay ? <Text style={[styles.expAmount, { color: statusColor }]}>{amountDisplay}</Text> : null}
                        {/* Lock button for creator on pending expenses */}
                        {isCreator && isPending && (
                            <TouchableOpacity style={styles.lockBtn} onPress={onLock}>
                                <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} />
                                <Text style={styles.lockBtnText}>Lock</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </FadeCard>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuthStore();
    const { tc, fmt, t } = useAppContext();
    const { groups, expenses, balances, fetchExpenses, fetchBalances, fetchSummary, summaries } = useGroupStore();

    const myUserId = user?.id ?? "";
    const group = groups.find((g) => g.id === id);

    useEffect(() => {
        if (!id) return;
        fetchExpenses(id);
        fetchBalances(id);
        fetchSummary(id);
    }, [id]);

    const onRefresh = useCallback(async () => {
        if (!id) return;
        await fetchExpenses(id);
        await fetchBalances(id);
        await fetchSummary(id);
    }, [id]);

    const groupExpenses = expenses[id!] ?? [];
    const groupBalances = balances[id!] ?? [];
    const settlements = summaries[id!] ?? [];

    const totalOwed = groupBalances.reduce((s, b) => s + b.owesYou, 0);
    const totalOwes = groupBalances.reduce((s, b) => s + b.youOwe, 0);
    const net = totalOwed - totalOwes;

    const isLoading = !expenses[id!] && groups.length > 0;
    if (isLoading) return <GroupDetailSkeleton />;
    if (!group) return null;

    // Group expenses by month
    const monthMap: Record<string, ApiExpense[]> = {};
    const sorted = [...groupExpenses].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    for (const exp of sorted) {
        const key = new Date(exp.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        if (!monthMap[key]) monthMap[key] = [];
        monthMap[key].push(exp);
    }
    const sections = Object.entries(monthMap).map(([title, data]) => ({ title, data }));

    const handleLock = (expense: ApiExpense) => {
        Alert.alert(
            "Lock & Split",
            "This will calculate splits for all confirmed participants. Continue?",
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: "Lock",
                    onPress: async () => {
                        const res = await expensesApi.lock(expense.id);
                        if (res.ok) {
                            useGroupStore.getState().updateExpenseInCache(id!, res.data.expense);
                            fetchBalances(id!);
                        } else {
                            Alert.alert("Error", res.error);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: tc.bg }]}>
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={{ fontSize: 28 }}>{group.iconEmoji ?? "👥"}</Text>
                            <Text style={styles.headerTitle}>{group.name}</Text>
                        </View>
                        <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.push(`/groups/settle?id=${id}`)}>
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Balance summary */}
                    <View style={styles.balanceSummary}>
                        {totalOwed > 0 || totalOwes > 0 ? (
                            <>
                                <Text style={styles.balanceSummaryLabel}>
                                    {net > 0 ? t.common.youAreOwed : t.common.youOwe}
                                </Text>
                                <Text style={styles.balanceSummaryAmount}>{fmt(Math.abs(net))}</Text>
                            </>
                        ) : (
                            <Text style={styles.balanceSummaryLabel}>All settled up ✓</Text>
                        )}
                        <TouchableOpacity style={styles.settleBtn} onPress={() => router.push(`/groups/settle?id=${id}`)}>
                            <Text style={styles.settleBtnText}>{t.groupDetail.settleUp}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Member pills */}
                    <View style={styles.memberPills}>
                        {group.members.map((m) => (
                            <TouchableOpacity
                                key={m.userId}
                                style={styles.memberPill}
                                onPress={() => m.userId !== myUserId && router.push(`/friend/${m.userId}`)}
                            >
                                <Avatar
                                    initials={getInitials(m.user.name)}
                                    color={getAvatarColor(m.userId)}
                                    size={28}
                                />
                                <Text style={styles.memberPillName}>
                                    {m.userId === myUserId ? "You" : m.user.name.split(" ")[0]}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <SectionList
                style={[styles.list, { backgroundColor: tc.bg }]}
                contentContainerStyle={styles.listContent}
                sections={sections}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
                renderSectionHeader={({ section }) => (
                    <View style={styles.monthHeader}>
                        <Text style={[styles.monthTitle, { color: tc.textPrimary }]}>{section.title}</Text>
                        <Ionicons name="calendar-outline" size={16} color={tc.textMuted} />
                    </View>
                )}
                renderItem={({ item, index }) => (
                    <ExpenseRow
                        expense={item}
                        myUserId={myUserId}
                        delay={index * 50}
                        onPress={() => { }}
                        onLock={() => handleLock(item)}
                        tc={tc}
                        fmt={fmt}
                    />
                )}
                ListFooterComponent={
                    settlements.length > 0 ? (
                        <FadeCard delay={200}>
                            <View style={[styles.settleSection, { backgroundColor: tc.card }]}>
                                <Text style={[styles.settleSectionTitle, { color: tc.textMuted }]}>
                                    {t.groupDetail.whoOwesWhom}
                                </Text>
                                {settlements.map((s, i) => (
                                    <View key={i} style={[styles.settleRow, { borderBottomColor: tc.border }]}>
                                        <Text style={[styles.settleText, { color: tc.textSecondary }]}>
                                            <Text style={{ fontWeight: FONT.bold, color: tc.textPrimary }}>
                                                {s.from.id === myUserId ? "You" : s.from.name}
                                            </Text>
                                            <Text> owes </Text>
                                            <Text style={{ fontWeight: FONT.bold, color: tc.textPrimary }}>
                                                {s.to.id === myUserId ? "You" : s.to.name}
                                            </Text>
                                        </Text>
                                        <Text style={[styles.settleAmount, { color: tc.textPrimary }]}>{fmt(s.amount)}</Text>
                                    </View>
                                ))}
                            </View>
                        </FadeCard>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={{ fontSize: 42 }}>🧾</Text>
                        <Text style={[styles.emptyText, { color: tc.textMuted }]}>{t.groupDetail.noExpenses}</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => router.push(`/groups/${id}`)} activeOpacity={0.85}>
                <LinearGradient colors={[COLORS.gradStart, COLORS.gradMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
                    <Ionicons name="add" size={26} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
    headerRow: { flexDirection: "row", alignItems: "center", paddingTop: SPACE.sm, marginBottom: SPACE.lg },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.sm },
    headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
    headerIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
    },
    balanceSummary: {
        backgroundColor: "rgba(255,255,255,0.92)", borderRadius: RADIUS.xl,
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, marginBottom: SPACE.md, gap: SPACE.sm,
    },
    balanceSummaryLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: FONT.medium, flex: 1 },
    balanceSummaryAmount: { fontSize: FONT.xl, fontWeight: FONT.black, color: COLORS.success, letterSpacing: -0.5 },
    settleBtn: { backgroundColor: COLORS.textPrimary, paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm, borderRadius: RADIUS.pill },
    settleBtnText: { color: "#fff", fontSize: FONT.sm, fontWeight: FONT.bold },
    memberPills: { flexDirection: "row", gap: SPACE.sm, flexWrap: "wrap" },
    memberPill: {
        flexDirection: "row", alignItems: "center", gap: SPACE.xs,
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs, borderRadius: RADIUS.pill,
    },
    memberPillName: { fontSize: FONT.sm, color: "#fff", fontWeight: FONT.medium },
    list: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
    listContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl, paddingBottom: 120 },
    monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACE.md, marginTop: SPACE.sm },
    monthTitle: { fontSize: FONT.md, fontWeight: FONT.bold },
    expRow: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.xl, padding: SPACE.md, marginBottom: SPACE.sm, gap: SPACE.md },
    expEmoji: { width: 44, height: 44, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
    expCenter: { flex: 1, gap: 3 },
    expTitle: { fontSize: FONT.base, fontWeight: FONT.bold },
    expDate: { fontSize: FONT.xs },
    expParticipants: { fontSize: FONT.xs, marginTop: 1 },
    expRight: { alignItems: "flex-end", gap: 3 },
    expStatus: { fontSize: FONT.xs, fontWeight: FONT.semibold },
    expAmount: { fontSize: FONT.md, fontWeight: FONT.black, letterSpacing: -0.3 },
    lockBtn: {
        flexDirection: "row", alignItems: "center", gap: 3,
        backgroundColor: "#FFF3E0", paddingHorizontal: SPACE.sm,
        paddingVertical: 3, borderRadius: RADIUS.pill, marginTop: 2,
    },
    lockBtnText: { fontSize: 11, color: COLORS.primary, fontWeight: FONT.bold },
    settleSection: { borderRadius: RADIUS.xl, padding: SPACE.lg, marginTop: SPACE.md, ...SHADOW.sm },
    settleSectionTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: SPACE.md },
    settleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: SPACE.sm, borderBottomWidth: 1 },
    settleText: { fontSize: FONT.base, flex: 1 },
    settleAmount: { fontSize: FONT.md, fontWeight: FONT.black },
    emptyBox: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
    emptyText: { fontSize: FONT.lg, fontWeight: FONT.semibold },
    fab: { position: "absolute", bottom: 100, right: SPACE.xl, borderRadius: 28, overflow: "hidden", ...SHADOW.lg },
    fabGrad: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
});