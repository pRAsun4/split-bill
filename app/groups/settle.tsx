import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { computeSettlements, DebtEntry, getNetBalance, useAppStore } from "../../store/useAppStore";

// ─── Debt Card ────────────────────────────────────────────────────────────────

function DebtCard({
    entry,
    isInvolved,
    delay,
    onSettle,
}: {
    entry: DebtEntry;
    isInvolved: boolean;
    delay: number;
    onSettle: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: 1, delay, useNativeDriver: true, tension: 80, friction: 9,
        }).start();
    }, []);

    return (
        <Animated.View style={[styles.debtCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.debtCardFlow}>
                {/* From */}
                <View style={styles.debtPerson}>
                    <Avatar initials={entry.fromName.slice(0, 2).toUpperCase()} size={48} color={COLORS.danger} />
                    <Text style={styles.debtPersonName} numberOfLines={1}>
                        {entry.fromId === "me" ? "You" : entry.fromName}
                    </Text>
                </View>

                {/* Arrow + Amount */}
                <View style={styles.debtArrow}>
                    <Text style={styles.debtAmount}>${entry.amount.toFixed(2)}</Text>
                    <View style={styles.arrowLine}>
                        <View style={styles.arrowLineInner} />
                        <Ionicons name="caret-forward" size={14} color={COLORS.primary} />
                    </View>
                    <Text style={styles.debtOwesLabel}>owes</Text>
                </View>

                {/* To */}
                <View style={styles.debtPerson}>
                    <Avatar initials={entry.toName.slice(0, 2).toUpperCase()} size={48} color={COLORS.success} />
                    <Text style={styles.debtPersonName} numberOfLines={1}>
                        {entry.toId === "me" ? "You" : entry.toName}
                    </Text>
                </View>
            </View>

            {isInvolved && (
                <TouchableOpacity
                    style={styles.settleBtn}
                    onPress={onSettle}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={GRAD_SHORT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.settleBtnGrad}
                    >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.settleBtnText}>Confirm Payment</Text>
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
    const { getGroup, settleDebt, currentUserId } = useAppStore();

    const group = getGroup(id!);
    if (!group) return null;

    const bal = getNetBalance(currentUserId, group.expenses);
    const settlements = computeSettlements(group.members, group.expenses);

    const myDebts = settlements.filter((s) => s.fromId === currentUserId);
    const myCredits = settlements.filter((s) => s.toId === currentUserId);
    const others = settlements.filter((s) => s.fromId !== currentUserId && s.toId !== currentUserId);

    const handleSettle = (entry: DebtEntry) => {
        Alert.alert(
            "Confirm Settlement",
            `Record $${entry.amount.toFixed(2)} payment from ${entry.fromId === "me" ? "you" : entry.fromName} to ${entry.toId === "me" ? "you" : entry.toName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: () => {
                        settleDebt(id!, entry.fromId, entry.toId);
                        Alert.alert("✅ Done!", "Payment recorded.");
                    },
                },
            ]
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={{ fontSize: 26 }}>{group.emoji}</Text>
                            <View>
                                <Text style={styles.headerTitle}>Settle Up</Text>
                                <Text style={styles.headerSub}>{group.name}</Text>
                            </View>
                        </View>
                        <View style={{ width: 38 }} />
                    </View>

                    {/* My balance */}
                    <View style={styles.myBalance}>
                        <View style={styles.myBalanceItem}>
                            <Text style={styles.myBalanceLbl}>You are owed</Text>
                            <Text style={[styles.myBalanceAmt, { color: COLORS.success }]}>
                                ${bal.owed.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.myBalanceDivider} />
                        <View style={styles.myBalanceItem}>
                            <Text style={styles.myBalanceLbl}>You owe</Text>
                            <Text style={[styles.myBalanceAmt, { color: COLORS.danger }]}>
                                ${bal.owes.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {settlements.length === 0 ? (
                    <FadeCard delay={0}>
                        <View style={styles.allSettled}>
                            <Text style={{ fontSize: 64 }}>🎉</Text>
                            <Text style={styles.allSettledTitle}>All settled up!</Text>
                            <Text style={styles.allSettledSub}>No outstanding debts in this group.</Text>
                        </View>
                    </FadeCard>
                ) : (
                    <>
                        {myDebts.length > 0 && (
                            <>
                                <Text style={styles.sectionLbl}>YOU NEED TO PAY</Text>
                                {myDebts.map((d, i) => (
                                    <DebtCard key={`${d.fromId}-${d.toId}`} entry={d} isInvolved delay={i * 80} onSettle={() => handleSettle(d)} />
                                ))}
                            </>
                        )}

                        {myCredits.length > 0 && (
                            <>
                                <Text style={[styles.sectionLbl, { marginTop: SPACE.xl }]}>YOU WILL RECEIVE</Text>
                                {myCredits.map((c, i) => (
                                    <DebtCard key={`${c.fromId}-${c.toId}`} entry={c} isInvolved delay={i * 80} onSettle={() => handleSettle(c)} />
                                ))}
                            </>
                        )}

                        {others.length > 0 && (
                            <>
                                <Text style={[styles.sectionLbl, { marginTop: SPACE.xl }]}>BETWEEN OTHERS</Text>
                                {others.map((o, i) => (
                                    <DebtCard key={`${o.fromId}-${o.toId}`} entry={o} isInvolved={false} delay={i * 80} onSettle={() => { }} />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
    headerRow: {
        flexDirection: "row", alignItems: "center",
        paddingTop: SPACE.xs, marginBottom: SPACE.lg,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: {
        flex: 1, flexDirection: "row", alignItems: "center",
        justifyContent: "center", gap: SPACE.sm,
    },
    headerTitle: { fontSize: FONT.lg, fontWeight: FONT.black, color: "#fff" },
    headerSub: { fontSize: FONT.xs, color: "rgba(255,255,255,0.7)" },
    myBalance: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: RADIUS.xl,
        overflow: "hidden",
    },
    myBalanceItem: { flex: 1, alignItems: "center", paddingVertical: SPACE.md },
    myBalanceDivider: { width: 1, backgroundColor: COLORS.border, marginVertical: SPACE.sm },
    myBalanceLbl: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: FONT.medium, marginBottom: 4 },
    myBalanceAmt: { fontSize: FONT.xxl, fontWeight: FONT.black, letterSpacing: -0.6 },
    scroll: {
        flex: 1, backgroundColor: COLORS.bg,
        borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4,
        marginTop: -RADIUS.xxl,
    },
    scrollContent: { padding: SPACE.xl },
    sectionLbl: {
        fontSize: FONT.xs, fontWeight: FONT.black,
        color: COLORS.textMuted, letterSpacing: 1.2,
        textTransform: "uppercase", marginBottom: SPACE.md,
    },
    debtCard: {
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        ...SHADOW.md,
    },
    debtCardFlow: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    debtPerson: { alignItems: "center", gap: SPACE.sm, width: 72 },
    debtPersonName: {
        fontSize: FONT.sm, fontWeight: FONT.semibold,
        color: COLORS.textPrimary, textAlign: "center",
    },
    debtArrow: { flex: 1, alignItems: "center", gap: 2 },
    debtAmount: {
        fontSize: FONT.lg, fontWeight: FONT.black,
        color: COLORS.primary, letterSpacing: -0.3,
    },
    arrowLine: {
        flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center",
    },
    arrowLineInner: { flex: 1, height: 2, backgroundColor: "#FFD166", maxWidth: 40 },
    debtOwesLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
    settleBtn: { marginTop: SPACE.md, borderRadius: RADIUS.lg, overflow: "hidden" },
    settleBtnGrad: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: SPACE.md, gap: SPACE.sm,
    },
    settleBtnText: { color: "#fff", fontSize: FONT.base, fontWeight: FONT.bold },
    allSettled: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
    allSettledTitle: { fontSize: FONT.xxl, fontWeight: FONT.black, color: COLORS.textPrimary },
    allSettledSub: { fontSize: FONT.base, color: COLORS.textMuted, textAlign: "center" },
});