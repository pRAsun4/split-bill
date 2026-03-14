import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef } from "react";
import {
    Animated,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { computeSettlements, getNetBalance, useAppStore } from "../../store/useAppStore";

// ─── Expense Row ──────────────────────────────────────────────────────────────

function ExpenseRow({
    expense,
    currentUserId,
    delay,
    onPress,
}: {
    expense: ReturnType<typeof useAppStore.getState>["groups"][0]["expenses"][0];
    currentUserId: string;
    delay: number;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const onIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
    const onOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();

    const mySplit = expense.splits.find((s) => s.memberId === currentUserId);
    const iPaid = expense.paidById === currentUserId;
    const notInvolved = !mySplit && !iPaid;

    let statusLabel = "Not Involved";
    let statusColor = COLORS.textMuted;
    let amountDisplay = "";

    if (notInvolved) {
        statusLabel = "Not Involved";
    } else if (iPaid) {
        const othersOwe = expense.splits.filter((s) => s.memberId !== currentUserId && !s.settled).reduce((sum, s) => sum + s.amount, 0);
        statusLabel = "Owes you";
        statusColor = COLORS.success;
        amountDisplay = `$${othersOwe.toFixed(2)}`;
    } else if (mySplit) {
        if (mySplit.settled) {
            statusLabel = "Settled";
            statusColor = COLORS.textMuted;
        } else {
            statusLabel = "You Owe";
            statusColor = COLORS.danger;
            amountDisplay = `$${mySplit.amount.toFixed(2)}`;
        }
    }

    const bgColor =
        statusLabel === "Owes you" ? "#F0FBF1" :
            statusLabel === "You Owe" ? "#FFF5F5" :
                "#F8F8F8";

    return (
        <FadeCard delay={delay}>
            <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
                <Animated.View style={[styles.expRow, { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.expEmoji}>
                        <Text style={{ fontSize: 22 }}>{expense.emoji}</Text>
                    </View>
                    <View style={styles.expCenter}>
                        <Text style={styles.expTitle}>{expense.title}</Text>
                        <Text style={styles.expDate}>
                            {new Date(expense.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </Text>
                    </View>
                    <View style={styles.expRight}>
                        <Text style={[styles.expStatus, { color: statusColor }]}>{statusLabel}</Text>
                        {amountDisplay ? (
                            <Text style={[styles.expAmount, { color: statusColor }]}>{amountDisplay}</Text>
                        ) : null}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </FadeCard>
    );
}

// ─── Settle Row ───────────────────────────────────────────────────────────────

function SettleRow({ fromName, toName, amount }: { fromName: string; toName: string; amount: number }) {
    return (
        <View style={styles.settleRow}>
            <Text style={styles.settleText}>
                <Text style={{ fontWeight: FONT.bold, color: COLORS.textPrimary }}>{fromName}</Text>
                <Text style={{ color: COLORS.textSecondary }}> owes </Text>
                <Text style={{ fontWeight: FONT.bold, color: COLORS.textPrimary }}>{toName}</Text>
            </Text>
            <Text style={styles.settleAmount}>${amount.toFixed(2)}</Text>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GroupDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { getGroup, currentUserId } = useAppStore();
    const group = getGroup(id!);

    if (!group) return null;

    const bal = getNetBalance(currentUserId, group.expenses);
    const settlements = computeSettlements(group.members, group.expenses);
    const totalOwed = bal.owed;

    // Group expenses by month
    type ExpSectionItem = typeof group.expenses[0];
    const monthMap: Record<string, ExpSectionItem[]> = {};
    const sorted = [...group.expenses].sort((a, b) => b.date.localeCompare(a.date));
    for (const exp of sorted) {
        const key = new Date(exp.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        if (!monthMap[key]) monthMap[key] = [];
        monthMap[key].push(exp);
    }
    const sections = Object.entries(monthMap).map(([title, data]) => ({ title, data }));

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            {/* Gradient Header */}
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={{ fontSize: 28 }}>{group.emoji}</Text>
                            <Text style={styles.headerTitle}>{group.name}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.headerIconBtn}
                            onPress={() => router.push(`/groups/settle?id=${id}`)}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Balance summary */}
                    <View style={styles.balanceSummary}>
                        {bal.owed > 0 || bal.owes > 0 ? (
                            <>
                                <Text style={styles.balanceSummaryLabel}>
                                    {bal.owed > bal.owes ? "You are owed" : "You owe"}
                                </Text>
                                <Text style={styles.balanceSummaryAmount}>
                                    ${Math.abs(bal.owed - bal.owes).toFixed(2)}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.balanceSummaryLabel}>All settled up ✓</Text>
                        )}
                        <TouchableOpacity
                            style={styles.settleBtn}
                            onPress={() => router.push(`/groups/settle?id=${id}`)}
                        >
                            <Text style={styles.settleBtnText}>Settle</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Member pills */}
                    <View style={styles.memberPills}>
                        {group.members.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.memberPill}
                                onPress={() => m.id !== "me" && router.push(`/friend/${m.id}`)}
                            >
                                <Avatar initials={m.initials} color={m.avatarColor} size={28} />
                                <Text style={styles.memberPillName}>{m.id === "me" ? "You" : m.name.split(" ")[0]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Expense List */}
            <SectionList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                sections={sections}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section }) => (
                    <View style={styles.monthHeader}>
                        <Text style={styles.monthTitle}>{section.title}</Text>
                        <TouchableOpacity style={styles.calIcon}>
                            <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>
                )}
                renderItem={({ item, index }) => (
                    <ExpenseRow
                        expense={item}
                        currentUserId={currentUserId}
                        delay={index * 50}
                        onPress={() => { }}
                    />
                )}
                ListFooterComponent={
                    settlements.length > 0 ? (
                        <FadeCard delay={200}>
                            <View style={styles.settleSection}>
                                <Text style={styles.settleSectionTitle}>Who owes whom?</Text>
                                {settlements.map((s) => (
                                    <SettleRow
                                        key={`${s.fromId}-${s.toId}`}
                                        fromName={s.fromId === "me" ? "You" : s.fromName}
                                        toName={s.toId === "me" ? "You" : s.toName}
                                        amount={s.amount}
                                    />
                                ))}
                            </View>
                        </FadeCard>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Text style={{ fontSize: 42 }}>🧾</Text>
                        <Text style={styles.emptyText}>No expenses yet</Text>
                    </View>
                }
            />

            {/* FAB - Add Expense */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push(`/groups/${id}`)}
                activeOpacity={0.85}
            >
                <LinearGradient colors={[COLORS.gradStart, COLORS.gradMid]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
                    <Ionicons name="add" size={26} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 80 }} />
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        paddingBottom: SPACE.xl,
        paddingHorizontal: SPACE.xl,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: SPACE.sm,
        marginBottom: SPACE.lg,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerCenter: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.sm,
    },
    headerTitle: {
        fontSize: FONT.lg,
        fontWeight: FONT.bold,
        color: "#fff",
    },
    headerIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    balanceSummary: {
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: RADIUS.xl,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SPACE.lg,
        paddingVertical: SPACE.md,
        marginBottom: SPACE.md,
        gap: SPACE.sm,
    },
    balanceSummaryLabel: {
        fontSize: FONT.sm,
        color: COLORS.textSecondary,
        fontWeight: FONT.medium,
        flex: 1,
    },
    balanceSummaryAmount: {
        fontSize: FONT.xl,
        fontWeight: FONT.black,
        color: COLORS.success,
        letterSpacing: -0.5,
    },
    settleBtn: {
        backgroundColor: COLORS.textPrimary,
        paddingHorizontal: SPACE.lg,
        paddingVertical: SPACE.sm,
        borderRadius: RADIUS.pill,
    },
    settleBtnText: {
        color: "#fff",
        fontSize: FONT.sm,
        fontWeight: FONT.bold,
    },
    memberPills: {
        flexDirection: "row",
        gap: SPACE.sm,
        flexWrap: "wrap",
    },
    memberPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE.xs,
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: SPACE.sm,
        paddingVertical: SPACE.xs,
        borderRadius: RADIUS.pill,
    },
    memberPillName: {
        fontSize: FONT.sm,
        color: "#fff",
        fontWeight: FONT.medium,
    },
    list: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4,
        marginTop: -RADIUS.xxl,
    },
    listContent: {
        paddingTop: SPACE.xl,
        paddingHorizontal: SPACE.xl,
        paddingBottom: 120,
    },
    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACE.md,
        marginTop: SPACE.sm,
    },
    monthTitle: {
        fontSize: FONT.md,
        fontWeight: FONT.bold,
        color: COLORS.textPrimary,
    },
    calIcon: {},
    expRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: RADIUS.xl,
        padding: SPACE.md,
        marginBottom: SPACE.sm,
        gap: SPACE.md,
    },
    expEmoji: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.md,
        backgroundColor: "rgba(255,255,255,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    expCenter: { flex: 1, gap: 3 },
    expTitle: {
        fontSize: FONT.base,
        fontWeight: FONT.bold,
        color: COLORS.textPrimary,
    },
    expDate: {
        fontSize: FONT.xs,
        color: COLORS.textMuted,
    },
    expRight: { alignItems: "flex-end", gap: 2 },
    expStatus: {
        fontSize: FONT.xs,
        fontWeight: FONT.semibold,
    },
    expAmount: {
        fontSize: FONT.md,
        fontWeight: FONT.black,
        letterSpacing: -0.3,
    },
    settleSection: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginTop: SPACE.md,
        ...SHADOW.sm,
    },
    settleSectionTitle: {
        fontSize: FONT.sm,
        fontWeight: FONT.bold,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: SPACE.md,
    },
    settleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: SPACE.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settleText: {
        fontSize: FONT.base,
        flex: 1,
    },
    settleAmount: {
        fontSize: FONT.md,
        fontWeight: FONT.black,
        color: COLORS.textPrimary,
    },
    emptyBox: {
        alignItems: "center",
        paddingVertical: 60,
        gap: SPACE.md,
    },
    emptyText: {
        fontSize: FONT.lg,
        fontWeight: FONT.semibold,
        color: COLORS.textMuted,
    },
    fab: {
        position: "absolute",
        bottom: 100,
        right: SPACE.xl,
        borderRadius: 28,
        overflow: "hidden",
        ...SHADOW.lg,
    },
    fabGrad: {
        width: 56,
        height: 56,
        alignItems: "center",
        justifyContent: "center",
    },
});


// import { useRouter } from 'expo-router';
// import { ArrowLeft, Filter } from 'lucide-react-native';
// import React from 'react';
// import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function GroupDetailsListScreen() {
//     const router = useRouter();

//     return (
//         <SafeAreaView className="flex-1 bg-transparent">
//             {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
//             <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
//                 <TouchableOpacity onPress={() => router.back()}>
//                     <ArrowLeft color="white" size={24} />
//                 </TouchableOpacity>
//                 <Text className="text-white text-xl font-bold">Group Expenses</Text>
//                 <TouchableOpacity>
//                     <Filter color="white" size={20} />
//                 </TouchableOpacity>
//             </View>

//             <ScrollView className="flex-1 bg-transparent px-6 pt-6">
//                 <Text className="text-white/70 font-bold uppercase text-[10px] mb-4 tracking-widest">Active Calculations</Text>

//                 {/* 2. Expense Row (The Petrol Example) - Hardcoded: bg-white */}
//                 <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm flex-row justify-between items-center">
//                     <View className="flex-row items-center">
//                         <View className="bg-orange-100 p-3 rounded-2xl">
//                             <Text className="text-lg">⛽</Text>
//                         </View>
//                         <View className="ml-4">
//                             <Text className="text-gray-900 font-bold text-lg">Petrol</Text>
//                             <Text className="text-gray-400 text-xs">Paid by A • Split with B</Text>
//                         </View>
//                     </View>
//                     <View className="items-end">
//                         <Text className="text-gray-900 font-black text-xl">$20.00</Text>
//                         <Text className="text-green-500 font-bold text-[10px]">SUCCESS</Text>
//                     </View>
//                 </View>

//                 {/* 3. Another Expense Row - Hardcoded: bg-white */}
//                 <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm flex-row justify-between items-center">
//                     <View className="flex-row items-center">
//                         <View className="bg-blue-100 p-3 rounded-2xl">
//                             <Text className="text-lg">🍱</Text>
//                         </View>
//                         <View className="ml-4">
//                             <Text className="text-gray-900 font-bold text-lg">Dinner</Text>
//                             <Text className="text-gray-400 text-xs">Paid by C • Split with A, B</Text>
//                         </View>
//                     </View>
//                     <View className="items-end">
//                         <Text className="text-gray-900 font-black text-xl">$60.00</Text>
//                         <Text className="text-green-500 font-bold text-[10px]">SUCCESS</Text>
//                     </View>
//                 </View>
//             </ScrollView>
//         </SafeAreaView>
//     );
// }