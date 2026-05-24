import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { SettleUpSkeleton } from "../../components/Skeleton";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { ApiSettlementTx, settlementsApi } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

// ─── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({
    entry, isInvolved, delay, onSettle, tc, fmt, t,
}: {
    entry: ApiSettlementTx; isInvolved: boolean; delay: number; onSettle: () => void;
    tc: ReturnType<typeof useAppContext>["tc"];
    fmt: (n: number) => string;
    t: ReturnType<typeof useAppContext>["t"];
}) {
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    useEffect(() => {
        Animated.spring(scaleAnim, { toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 9 }).start();
    }, []);

    return (
        <Animated.View style={[styles.debtCard, { backgroundColor: tc.card, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.debtCardFlow}>
                <View style={styles.debtPerson}>
                    <Avatar
                        initials={getInitials(entry.from.name)}
                        size={48}
                        color={getAvatarColor(entry.from.id)}
                    />
                    <Text style={[styles.debtPersonName, { color: tc.textPrimary }]} numberOfLines={1}>
                        {entry.from.name}
                    </Text>
                </View>

                <View style={styles.debtArrow}>
                    <Text style={styles.debtAmount}>{fmt(entry.amount)}</Text>
                    <View style={styles.arrowLine}>
                        <View style={styles.arrowLineInner} />
                        <Ionicons name="caret-forward" size={14} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.debtOwesLabel, { color: tc.textMuted }]}>{t.settle.owes}</Text>
                </View>

                <View style={styles.debtPerson}>
                    <Avatar
                        initials={getInitials(entry.to.name)}
                        size={48}
                        color={getAvatarColor(entry.to.id)}
                    />
                    <Text style={[styles.debtPersonName, { color: tc.textPrimary }]} numberOfLines={1}>
                        {entry.to.name}
                    </Text>
                </View>
            </View>

            {isInvolved && (
                <TouchableOpacity style={styles.settleBtn} onPress={onSettle} activeOpacity={0.85}>
                    <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.settleBtnGrad}>
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.settleBtnText}>{t.settle.confirmPayment}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettleUpScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuthStore();
    const { tc, fmt, t } = useAppContext();

    const { groups, balances, summaries, settledFlags, fetchBalances, fetchSummary } = useGroupStore();

    const myUserId = user?.id ?? "";
    const group = groups.find((g) => g.id === id);

    useEffect(() => {
        if (!id) return;
        fetchBalances(id);
        fetchSummary(id);
    }, [id]);

    const onRefresh = useCallback(async () => {
        if (!id) return;
        await fetchBalances(id);
        await fetchSummary(id);
    }, [id]);

    const groupBalances = balances[id!] ?? [];
    const settlements = summaries[id!] ?? [];
    const isSettled = settledFlags[id!] ?? (settlements.length === 0 && groupBalances.length > 0);

    const totalOwed = groupBalances.reduce((s, b) => s + b.owesYou, 0);
    const totalOwes = groupBalances.reduce((s, b) => s + b.youOwe, 0);

    const myDebts = settlements.filter((s) => s.from.id === myUserId);
    const myCredits = settlements.filter((s) => s.to.id === myUserId);
    const others = settlements.filter((s) => s.from.id !== myUserId && s.to.id !== myUserId);

    const isLoading = !summaries[id!] && groups.length > 0;
    if (isLoading) return <SettleUpSkeleton />;
    if (!group) return null;

    const handleSettle = (entry: ApiSettlementTx) => {
        Alert.alert(
            "Confirm Settlement",
            t.settle.confirmSettle(entry.from.name, entry.to.name, fmt(entry.amount)),
            [
                { text: t.common.cancel, style: "cancel" },
                {
                    text: t.common.confirm,
                    onPress: async () => {
                        // Current user is paying → payeeId is the "to" person
                        const payeeId = entry.to.id;
                        const res = await settlementsApi.create(id!, {
                            payeeId,
                            amount: entry.amount,
                            currency: entry.currency,
                        });
                        if (res.ok) {
                            Alert.alert("✅ " + t.settle.settled, t.settle.settledMsg);
                            fetchBalances(id!);
                            fetchSummary(id!);
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
                            <Text style={{ fontSize: 26 }}>{group.iconEmoji ?? "👥"}</Text>
                            <View>
                                <Text style={styles.headerTitle}>{t.settle.title}</Text>
                                <Text style={styles.headerSub}>{group.name}</Text>
                            </View>
                        </View>
                        <View style={{ width: 38 }} />
                    </View>

                    {/* My balance */}
                    <View style={styles.myBalance}>
                        <View style={styles.myBalanceItem}>
                            <Text style={styles.myBalanceLbl}>{t.common.youAreOwed}</Text>
                            <Text style={[styles.myBalanceAmt, { color: COLORS.success }]}>{fmt(totalOwed)}</Text>
                        </View>
                        <View style={[styles.myBalanceDivider, { backgroundColor: COLORS.border }]} />
                        <View style={styles.myBalanceItem}>
                            <Text style={styles.myBalanceLbl}>{t.common.youOwe}</Text>
                            <Text style={[styles.myBalanceAmt, { color: COLORS.danger }]}>{fmt(totalOwes)}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={[styles.scroll, { backgroundColor: tc.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
            >
                {settlements.length === 0 ? (
                    <FadeCard delay={0}>
                        <View style={styles.allSettled}>
                            <Text style={{ fontSize: 64 }}>🎉</Text>
                            <Text style={[styles.allSettledTitle, { color: tc.textPrimary }]}>{t.settle.allSettled}</Text>
                            <Text style={[styles.allSettledSub, { color: tc.textMuted }]}>{t.settle.allSettledSub}</Text>
                        </View>
                    </FadeCard>
                ) : (
                    <>
                        {myDebts.length > 0 && (
                            <>
                                <Text style={[styles.sectionLbl, { color: tc.textMuted }]}>{t.settle.youNeedToPay}</Text>
                                {myDebts.map((d, i) => (
                                    <DebtCard key={i} entry={d} isInvolved delay={i * 80}
                                        onSettle={() => handleSettle(d)} tc={tc} fmt={fmt} t={t} />
                                ))}
                            </>
                        )}
                        {myCredits.length > 0 && (
                            <>
                                <Text style={[styles.sectionLbl, { color: tc.textMuted, marginTop: SPACE.xl }]}>{t.settle.youWillReceive}</Text>
                                {myCredits.map((c, i) => (
                                    <DebtCard key={i} entry={c} isInvolved delay={i * 80}
                                        onSettle={() => handleSettle(c)} tc={tc} fmt={fmt} t={t} />
                                ))}
                            </>
                        )}
                        {others.length > 0 && (
                            <>
                                <Text style={[styles.sectionLbl, { color: tc.textMuted, marginTop: SPACE.xl }]}>{t.settle.betweenOthers}</Text>
                                {others.map((o, i) => (
                                    <DebtCard key={i} entry={o} isInvolved={false} delay={i * 80}
                                        onSettle={() => { }} tc={tc} fmt={fmt} t={t} />
                                ))}
                            </>
                        )}
                    </>
                )}
                <View style={{ height: 80 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
    headerRow: { flexDirection: "row", alignItems: "center", paddingTop: SPACE.xs, marginBottom: SPACE.lg },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
    },
    headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: SPACE.sm },
    headerTitle: { fontSize: FONT.lg, fontWeight: FONT.black, color: "#fff" },
    headerSub: { fontSize: FONT.xs, color: "rgba(255,255,255,0.7)" },
    myBalance: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.92)", borderRadius: RADIUS.xl, overflow: "hidden" },
    myBalanceItem: { flex: 1, alignItems: "center", paddingVertical: SPACE.md },
    myBalanceDivider: { width: 1, marginVertical: SPACE.sm },
    myBalanceLbl: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium, marginBottom: 4 },
    myBalanceAmt: { fontSize: FONT.xxl, fontWeight: FONT.black, letterSpacing: -0.6 },
    scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
    scrollContent: { padding: SPACE.xl },
    sectionLbl: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md },
    debtCard: { borderRadius: RADIUS.xl, padding: SPACE.lg, marginBottom: SPACE.md, ...SHADOW.md },
    debtCardFlow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    debtPerson: { alignItems: "center", gap: SPACE.sm, width: 72 },
    debtPersonName: { fontSize: FONT.sm, fontWeight: FONT.semibold, textAlign: "center" },
    debtArrow: { flex: 1, alignItems: "center", gap: 2 },
    debtAmount: { fontSize: FONT.lg, fontWeight: FONT.black, color: COLORS.primary, letterSpacing: -0.3 },
    arrowLine: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center" },
    arrowLineInner: { flex: 1, height: 2, backgroundColor: "#FFD166", maxWidth: 40 },
    debtOwesLabel: { fontSize: FONT.xs },
    settleBtn: { marginTop: SPACE.md, borderRadius: RADIUS.lg, overflow: "hidden" },
    settleBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: SPACE.md, gap: SPACE.sm },
    settleBtnText: { color: "#fff", fontSize: FONT.base, fontWeight: FONT.bold },
    allSettled: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
    allSettledTitle: { fontSize: FONT.xxl, fontWeight: FONT.black },
    allSettledSub: { fontSize: FONT.base, textAlign: "center" },
});