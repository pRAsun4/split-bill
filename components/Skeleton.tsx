/**
 * Skeleton.tsx
 * ────────────
 * USE FOR ALL DATA-FETCHING STATES — everywhere except auth.
 *
 * How it works:
 *   A single shared shimmer Animated.Value (0 → 1) is created once per
 *   <SkeletonGroup> and flows down via context, so all skeleton children
 *   animate in perfect sync — one wave sweeping across the whole screen.
 *
 * Exports (primitives):
 *   <SkeletonGroup>             — wrap a screen's skeleton in this
 *   <SkeletonBox>               — rectangle / card placeholder
 *   <SkeletonLine>              — text line placeholder
 *   <SkeletonCircle>            — avatar placeholder
 *
 * Exports (pre-built rows):
 *   <SkeletonGroupRow>          — group card row
 *   <SkeletonExpenseRow>        — expense row
 *   <SkeletonFriendRow>         — friend row
 *   <SkeletonTransactionRow>    — transaction row
 *   <SkeletonMessageBubble>     — chat bubble
 *   <SkeletonDebtCard>          — settle-up debt card
 *   <SkeletonMenuRow>           — settings menu row
 *
 * Exports (full-screen):
 *   <HomeScreenSkeleton>
 *   <GroupsScreenSkeleton>
 *   <GroupDetailSkeleton>
 *   <TransactionsSkeleton>
 *   <FriendProfileSkeleton>
 *   <GroupChatSkeleton>
 *   <SettleUpSkeleton>
 *   <ProfileScreenSkeleton>
 *   <ProfileSubScreenSkeleton>  — edit/notifications/theme/language/currency
 */

import { LinearGradient } from "expo-linear-gradient";
import React, { createContext, useContext, useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Platform,
    StatusBar,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { COLORS, RADIUS, SHADOW, SPACE } from "../constants/theme";

const { width } = Dimensions.get("window");

// ─── Shimmer Context ──────────────────────────────────────────────────────────
// All skeleton pieces share one Animated.Value so the shimmer wave is in sync.

const ShimmerCtx = createContext<Animated.Value | null>(null);

// ─── SkeletonGroup ────────────────────────────────────────────────────────────

export function SkeletonGroup({ children }: { children: React.ReactNode }) {
    const shimmer = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.timing(shimmer, {
                toValue: 1,
                duration: 1200,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
            })
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <ShimmerCtx.Provider value={shimmer}>
            {children}
        </ShimmerCtx.Provider>
    );
}

// ─── Shimmer overlay ──────────────────────────────────────────────────────────

function ShimmerOverlay({ shimmer }: { shimmer: Animated.Value }) {
    const translateX = shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-width * 1.2, width * 1.2],
    });

    return (
        <Animated.View
            style={[
                StyleSheet.absoluteFillObject,
                { transform: [{ translateX }], overflow: "hidden" },
            ]}
        >
            <LinearGradient
                colors={[
                    "rgba(255,255,255,0)",
                    "rgba(255,255,255,0.55)",
                    "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
            />
        </Animated.View>
    );
}

// ─── Base Skeleton Piece ──────────────────────────────────────────────────────

function SkeletonPiece({
    style,
}: {
    style: StyleProp<ViewStyle>;
}) {
    const shimmer = useContext(ShimmerCtx);
    // StyleSheet.flatten resolves arrays/nested styles into a plain ViewStyle
    const flat = StyleSheet.flatten(style) ?? {};

    return (
        <View style={[styles.piece, flat]}>
            {shimmer && <ShimmerOverlay shimmer={shimmer} />}
        </View>
    );
}

// ─── Primitive Building Blocks ────────────────────────────────────────────────

export function SkeletonBox({
    width: w,
    height: h,
    borderRadius = RADIUS.md,
    style,
}: {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <SkeletonPiece
            style={[
                { width: w as any, height: h ?? 16, borderRadius },
                style,
            ]}
        />
    );
}

export function SkeletonLine({
    width: w = "100%",
    height: h = 13,
    style,
}: {
    width?: number | string;
    height?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <SkeletonPiece
            style={[
                { width: w as any, height: h, borderRadius: RADIUS.pill },
                style,
            ]}
        />
    );
}

export function SkeletonCircle({
    size = 40,
    style,
}: {
    size?: number;
    style?: StyleProp<ViewStyle>;
}) {
    return (
        <SkeletonPiece
            style={[
                { width: size, height: size, borderRadius: size / 2 },
                style,
            ]}
        />
    );
}

// ─── Pre-built Row Skeletons ──────────────────────────────────────────────────

export function SkeletonGroupRow() {
    return (
        <View style={styles.groupCard}>
            <SkeletonBox width={52} height={52} borderRadius={RADIUS.md} />
            <View style={styles.groupCardCenter}>
                <SkeletonLine width="55%" height={14} />
                <SkeletonLine width="35%" height={11} style={{ marginTop: 6 }} />
                <View style={{ flexDirection: "row", gap: -6, marginTop: 8 }}>
                    {[0, 1, 2].map((i) => (
                        <SkeletonCircle key={i} size={22} style={{ marginLeft: i > 0 ? -6 : 0 }} />
                    ))}
                </View>
            </View>
            <View style={styles.groupCardRight}>
                <SkeletonLine width={70} height={16} />
                <SkeletonBox width={100} height={28} borderRadius={RADIUS.pill} style={{ marginTop: 6 }} />
            </View>
        </View>
    );
}

export function SkeletonExpenseRow() {
    return (
        <View style={styles.expRow}>
            <SkeletonBox width={44} height={44} borderRadius={RADIUS.md} />
            <View style={styles.expCenter}>
                <SkeletonLine width="50%" height={13} />
                <SkeletonLine width="30%" height={10} style={{ marginTop: 5 }} />
            </View>
            <View style={{ alignItems: "flex-end", gap: 5 }}>
                <SkeletonLine width={55} height={11} />
                <SkeletonLine width={70} height={15} />
            </View>
        </View>
    );
}

export function SkeletonFriendRow() {
    return (
        <View style={styles.friendRow}>
            <SkeletonCircle size={44} />
            <View style={{ flex: 1, gap: 6 }}>
                <SkeletonLine width="40%" height={13} />
                <SkeletonLine width="55%" height={11} />
            </View>
        </View>
    );
}

export function SkeletonTransactionRow() {
    return (
        <View style={styles.txRow}>
            <SkeletonBox width={44} height={44} borderRadius={RADIUS.md} />
            <View style={styles.txCenter}>
                <SkeletonLine width="50%" height={13} />
                <View style={{ flexDirection: "row", gap: 6, marginTop: 5 }}>
                    <SkeletonLine width={60} height={10} />
                    <SkeletonLine width={40} height={10} />
                </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 5 }}>
                <SkeletonLine width={65} height={15} />
                <SkeletonLine width={45} height={10} />
            </View>
        </View>
    );
}

// ─── Full-Screen Skeletons ────────────────────────────────────────────────────

// ── Home Screen ──

export function HomeScreenSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Header gradient area */}
                <View style={skStyles.homeHeader}>
                    {/* Top bar */}
                    <View style={skStyles.topBar}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <SkeletonBox width={30} height={30} borderRadius={10} />
                            <SkeletonLine width={70} height={18} />
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <SkeletonCircle size={36} />
                            <SkeletonCircle size={36} />
                        </View>
                    </View>
                    {/* Balance cards */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                        {[0, 1].map((i) => (
                            <View key={i} style={[skStyles.balanceCard, { flex: 1 }]}>
                                <SkeletonLine width={18} height={18} style={{ marginBottom: 6 }} />
                                <SkeletonLine width="75%" height={22} />
                                <SkeletonLine width="50%" height={11} style={{ marginTop: 6 }} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* White body */}
                <View style={skStyles.body}>
                    {/* Section header */}
                    <View style={styles.sectionHeader}>
                        <SkeletonLine width={110} height={14} />
                        <SkeletonLine width={55} height={12} />
                    </View>
                    {/* Group rows */}
                    {[0, 1, 2].map((i) => <SkeletonGroupRow key={i} />)}

                    {/* Friends section */}
                    <View style={[styles.sectionHeader, { marginTop: SPACE.xl }]}>
                        <SkeletonLine width={70} height={14} />
                    </View>
                    {[0, 1, 2].map((i) => <SkeletonFriendRow key={i} />)}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ── Groups Tab ──

export function GroupsScreenSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                <View style={skStyles.simpleHeader}>
                    <SkeletonLine width={120} height={28} />
                    <SkeletonLine width={160} height={12} style={{ marginTop: 6 }} />
                </View>
                <View style={skStyles.body}>
                    {[0, 1, 2].map((i) => (
                        <View key={i} style={skStyles.groupDetailCard}>
                            {/* Card header */}
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                                <SkeletonBox width={52} height={52} borderRadius={RADIUS.md} />
                                <View style={{ flex: 1 }}>
                                    <SkeletonLine width="55%" height={15} />
                                    <SkeletonLine width="35%" height={11} style={{ marginTop: 6 }} />
                                </View>
                                <SkeletonLine width={70} height={20} />
                            </View>
                            {/* Member dots */}
                            <View style={{ flexDirection: "row", gap: -6, marginBottom: 12 }}>
                                {[0, 1, 2].map((j) => (
                                    <SkeletonCircle key={j} size={28} style={{ marginLeft: j > 0 ? -8 : 0 }} />
                                ))}
                            </View>
                            {/* Balance badge */}
                            <SkeletonBox width="100%" height={42} borderRadius={RADIUS.md} />
                        </View>
                    ))}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ── Group Detail ──

export function GroupDetailSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Header */}
                <View style={skStyles.groupDetailHeader}>
                    <View style={styles.headerRow}>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                        <View style={{ alignItems: "center", gap: 6 }}>
                            <SkeletonCircle size={32} />
                            <SkeletonLine width={120} height={14} />
                        </View>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                    </View>
                    {/* Balance summary */}
                    <SkeletonBox width="100%" height={56} borderRadius={RADIUS.xl} style={{ marginBottom: 12 }} />
                    {/* Member pills */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        {[0, 1, 2].map((i) => (
                            <SkeletonBox key={i} width={72} height={32} borderRadius={RADIUS.pill} />
                        ))}
                    </View>
                </View>

                {/* Expense list */}
                <View style={skStyles.body}>
                    <SkeletonLine width={90} height={13} style={{ marginBottom: 12 }} />
                    {[0, 1, 2, 3, 4].map((i) => <SkeletonExpenseRow key={i} />)}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ── Transactions Tab ──

export function TransactionsSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                <View style={skStyles.simpleHeader}>
                    <SkeletonLine width={100} height={28} />
                    <SkeletonLine width={150} height={12} style={{ marginTop: 6 }} />
                    {/* Summary pills */}
                    <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                        {[0, 1].map((i) => (
                            <SkeletonBox key={i} height={50} borderRadius={RADIUS.xl} style={{ flex: 1 }} />
                        ))}
                    </View>
                </View>

                <View style={skStyles.body}>
                    {/* Search bar */}
                    <SkeletonBox width="100%" height={46} borderRadius={RADIUS.xl} style={{ marginBottom: 12 }} />
                    {/* Filter chips */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                        {[0, 1, 2].map((i) => (
                            <SkeletonBox key={i} width={75} height={32} borderRadius={RADIUS.pill} />
                        ))}
                    </View>
                    {/* Month label */}
                    <SkeletonLine width={100} height={11} style={{ marginBottom: 10 }} />
                    {/* Rows */}
                    {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonTransactionRow key={i} />)}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ── Friend Profile ──

export function FriendProfileSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Header */}
                <View style={skStyles.profileHeader}>
                    <View style={styles.headerRow}>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                        <SkeletonLine width={120} height={15} />
                        <View style={{ width: 38 }} />
                    </View>
                    {/* Avatar hero */}
                    <View style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
                        <SkeletonCircle size={72} />
                        <SkeletonLine width={130} height={20} />
                        <SkeletonBox width={160} height={36} borderRadius={RADIUS.pill} />
                    </View>
                </View>

                {/* Group cards */}
                <View style={skStyles.body}>
                    <SkeletonLine width={110} height={11} style={{ marginBottom: 12 }} />
                    {[0, 1].map((i) => (
                        <View key={i} style={skStyles.friendGroupCard}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 }}>
                                <SkeletonBox width={40} height={40} borderRadius={RADIUS.md} />
                                <View style={{ flex: 1 }}>
                                    <SkeletonLine width="50%" height={14} />
                                    <SkeletonLine width="35%" height={11} style={{ marginTop: 5 }} />
                                </View>
                                <SkeletonBox width={60} height={26} borderRadius={RADIUS.sm} />
                            </View>
                            {[0, 1].map((j) => (
                                <View key={j} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F0EBE5" }}>
                                    <SkeletonBox width={24} height={24} borderRadius={6} />
                                    <View style={{ flex: 1, gap: 4 }}>
                                        <SkeletonLine width="45%" height={12} />
                                        <SkeletonLine width="25%" height={10} />
                                    </View>
                                    <SkeletonLine width={50} height={13} />
                                </View>
                            ))}
                        </View>
                    ))}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BASE_COLOR = "#EDE8E3";

const styles = StyleSheet.create({
    piece: {
        backgroundColor: BASE_COLOR,
        overflow: "hidden",
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACE.md,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: SPACE.lg,
    },
    groupCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        gap: SPACE.md,
        ...SHADOW.sm,
    },
    groupCardCenter: { flex: 1 },
    groupCardRight: { alignItems: "flex-end" },
    expRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: RADIUS.xl,
        padding: SPACE.md,
        marginBottom: SPACE.sm,
        gap: SPACE.md,
        backgroundColor: "#F8F8F8",
    },
    expCenter: { flex: 1, gap: 4 },
    friendRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        gap: SPACE.md,
        ...SHADOW.sm,
    },
    txRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.md,
        marginBottom: SPACE.sm,
        gap: SPACE.md,
        ...SHADOW.sm,
    },
    txCenter: { flex: 1 },

    // Chat
    bubbleRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: SPACE.sm,
        marginBottom: SPACE.md,
    },
    bubbleBody: { flex: 1 },
    inputBarSkeleton: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.sm,
        paddingBottom: SPACE.lg,
        borderTopWidth: 1,
        borderTopColor: "#F0EBE5",
        gap: SPACE.sm,
    },
    stepDotsRow: { flexDirection: "row", gap: SPACE.xs },
    inputRowSkeleton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8F4F0",
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        gap: SPACE.sm,
    },

    // Settle
    debtCard: {
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        ...SHADOW.md,
    },
    debtCardRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    balancePillRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.92)",
        borderRadius: RADIUS.xl,
        overflow: "hidden",
    },
    balancePillCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: SPACE.md,
    },

    // Profile
    profileHero: {
        alignItems: "center",
        paddingBottom: SPACE.lg,
    },
    statsStrip: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: RADIUS.xl,
        padding: SPACE.md,
    },
    statsDivider: {
        width: 1,
        backgroundColor: "rgba(255,255,255,0.25)",
        marginVertical: SPACE.xs,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    menuCard: {
        backgroundColor: "#fff",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#F0EBE5",
        ...SHADOW.sm,
    },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.md,
        gap: SPACE.md,
        borderBottomColor: "#F0EBE5",
    },
});

// Screen-level layout styles
// STATUS_H: safe top padding that works on both iOS and Android
const STATUS_H = (Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44) + SPACE.sm;

const skStyles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.bg },
    homeHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.xl,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl + 4,
        gap: SPACE.md,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACE.sm,
    },
    balanceCard: {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
    },
    body: {
        flex: 1,
        backgroundColor: COLORS.bg,
        borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4,
        marginTop: -(RADIUS.xxl + 4),
        paddingTop: SPACE.xl + 4,
        paddingHorizontal: SPACE.xl,
    },
    simpleHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.xl,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl + 8,
    },
    groupDetailCard: {
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        ...SHADOW.sm,
    },
    groupDetailHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.xl,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl,
    },
    profileHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.xl,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl + 4,
    },
    friendGroupCard: {
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        padding: SPACE.lg,
        marginBottom: SPACE.md,
        ...SHADOW.sm,
    },
    chatHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.lg,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl,
    },
    subScreenHeader: {
        backgroundColor: "#FF8C42",
        paddingHorizontal: SPACE.xl,
        paddingTop: STATUS_H,
        paddingBottom: SPACE.xl,
    },
});

// ─── New Pre-built Row Skeletons ──────────────────────────────────────────────

export function SkeletonMessageBubble({ isRight = false }: { isRight?: boolean }) {
    return (
        <View style={[
            styles.bubbleRow,
            isRight && { flexDirection: "row-reverse" },
        ]}>
            {!isRight && <SkeletonCircle size={30} />}
            <View style={styles.bubbleBody}>
                <SkeletonBox
                    width={isRight ? 200 : 180}
                    height={72}
                    borderRadius={RADIUS.xl}
                />
            </View>
        </View>
    );
}

export function SkeletonDebtCard() {
    return (
        <View style={styles.debtCard}>
            <View style={styles.debtCardRow}>
                <View style={{ alignItems: "center", gap: 6, width: 72 }}>
                    <SkeletonCircle size={48} />
                    <SkeletonLine width={55} height={11} />
                </View>
                <View style={{ flex: 1, alignItems: "center", gap: 6 }}>
                    <SkeletonLine width={70} height={16} />
                    <SkeletonLine width={40} height={10} />
                </View>
                <View style={{ alignItems: "center", gap: 6, width: 72 }}>
                    <SkeletonCircle size={48} />
                    <SkeletonLine width={55} height={11} />
                </View>
            </View>
            <SkeletonBox width="100%" height={44} borderRadius={RADIUS.lg} style={{ marginTop: SPACE.md }} />
        </View>
    );
}

export function SkeletonMenuRow({ isLast = false }: { isLast?: boolean }) {
    return (
        <View style={[
            styles.menuRow,
            { borderBottomWidth: isLast ? 0 : 1 },
        ]}>
            <SkeletonBox width={38} height={38} borderRadius={RADIUS.md} />
            <View style={{ flex: 1, gap: 5 }}>
                <SkeletonLine width="50%" height={13} />
                <SkeletonLine width="65%" height={10} />
            </View>
            <SkeletonLine width={40} height={11} />
        </View>
    );
}

// ─── Group Chat Skeleton ──────────────────────────────────────────────────────

export function GroupChatSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Header */}
                <View style={skStyles.chatHeader}>
                    <View style={[styles.headerRow, { marginBottom: SPACE.sm }]}>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                        <View style={{ flex: 1, alignItems: "center", gap: 5 }}>
                            <SkeletonLine width={120} height={14} />
                            <SkeletonLine width={80} height={10} />
                        </View>
                        <SkeletonBox width={70} height={32} borderRadius={RADIUS.pill} />
                    </View>
                </View>

                {/* Chat body */}
                <View style={[skStyles.body, { paddingTop: SPACE.lg }]}>
                    {/* Alternating message bubbles */}
                    <SkeletonMessageBubble isRight={false} />
                    <SkeletonMessageBubble isRight={true} />
                    <SkeletonMessageBubble isRight={false} />
                    <SkeletonMessageBubble isRight={true} />
                    <SkeletonMessageBubble isRight={false} />

                    {/* Input bar placeholder at bottom */}
                    <View style={styles.inputBarSkeleton}>
                        <View style={styles.stepDotsRow}>
                            <SkeletonBox width={20} height={6} borderRadius={3} />
                            <SkeletonBox width={6} height={6} borderRadius={3} />
                        </View>
                        <View style={styles.inputRowSkeleton}>
                            <SkeletonBox width={28} height={28} borderRadius={RADIUS.md} />
                            <SkeletonLine width="75%" height={20} style={{ flex: 1 }} />
                            <SkeletonBox width={38} height={38} borderRadius={RADIUS.md} />
                        </View>
                    </View>
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ─── Settle Up Skeleton ───────────────────────────────────────────────────────

export function SettleUpSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Header */}
                <View style={skStyles.groupDetailHeader}>
                    <View style={[styles.headerRow, { marginBottom: SPACE.lg }]}>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                        <View style={{ flex: 1, alignItems: "center", gap: 6 }}>
                            <SkeletonLine width={90} height={16} />
                            <SkeletonLine width={120} height={11} />
                        </View>
                        <View style={{ width: 38 }} />
                    </View>
                    {/* Balance row */}
                    <View style={styles.balancePillRow}>
                        {[0, 1].map((i) => (
                            <View key={i} style={styles.balancePillCard}>
                                <SkeletonLine width={70} height={11} />
                                <SkeletonLine width={90} height={22} style={{ marginTop: 4 }} />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Debt cards */}
                <View style={skStyles.body}>
                    <SkeletonLine width={130} height={11} style={{ marginBottom: SPACE.md }} />
                    <SkeletonDebtCard />
                    <SkeletonLine width={110} height={11} style={{ marginTop: SPACE.xl, marginBottom: SPACE.md }} />
                    <SkeletonDebtCard />
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ─── Profile Tab Skeleton ─────────────────────────────────────────────────────

export function ProfileScreenSkeleton() {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Gradient header */}
                <View style={skStyles.profileHeader}>
                    {/* Avatar hero */}
                    <View style={styles.profileHero}>
                        <SkeletonCircle size={82} />
                        <SkeletonLine width={140} height={20} style={{ marginTop: 8 }} />
                        <SkeletonLine width={90} height={12} style={{ marginTop: 4 }} />
                        <SkeletonLine width={160} height={12} style={{ marginTop: 4 }} />
                    </View>
                    {/* Stats strip */}
                    <View style={styles.statsStrip}>
                        {[0, 1, 2].map((i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <View style={styles.statsDivider} />}
                                <View style={styles.statItem}>
                                    <SkeletonLine width={40} height={20} />
                                    <SkeletonLine width={55} height={11} style={{ marginTop: 4 }} />
                                </View>
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                {/* Scrollable body */}
                <View style={skStyles.body}>
                    {/* Balance card */}
                    <SkeletonBox width="100%" height={70} borderRadius={RADIUS.xl} style={{ marginBottom: SPACE.lg }} />

                    {/* Menu sections */}
                    {[
                        { label: 80, rows: 2 },
                        { label: 110, rows: 3 },
                        { label: 60, rows: 3 },
                    ].map((section, si) => (
                        <View key={si} style={{ marginBottom: SPACE.lg }}>
                            <SkeletonLine width={section.label} height={11} style={{ marginBottom: SPACE.sm }} />
                            <View style={[styles.menuCard, { borderRadius: RADIUS.xl }]}>
                                {Array.from({ length: section.rows }).map((_, ri) => (
                                    <SkeletonMenuRow key={ri} isLast={ri === section.rows - 1} />
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        </SkeletonGroup>
    );
}

// ─── Profile Sub-screen Skeleton ──────────────────────────────────────────────
// Generic skeleton for edit, notifications, theme, language, currency screens

export function ProfileSubScreenSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <SkeletonGroup>
            <View style={skStyles.root}>
                {/* Thin gradient header */}
                <View style={skStyles.subScreenHeader}>
                    <View style={styles.headerRow}>
                        <SkeletonBox width={38} height={38} borderRadius={19} />
                        <SkeletonLine width={120} height={15} />
                        <SkeletonBox width={55} height={32} borderRadius={RADIUS.pill} />
                    </View>
                    {/* Status badge */}
                    <SkeletonBox width={180} height={36} borderRadius={RADIUS.xl} />
                </View>

                {/* Content area */}
                <View style={skStyles.body}>
                    {/* Section label */}
                    <SkeletonLine width={100} height={11} style={{ marginBottom: SPACE.md }} />

                    {/* Main card with rows */}
                    <View style={[styles.menuCard, { borderRadius: RADIUS.xl, marginBottom: SPACE.lg }]}>
                        {Array.from({ length: rows }).map((_, i) => (
                            <SkeletonMenuRow key={i} isLast={i === rows - 1} />
                        ))}
                    </View>

                    {/* Info banner */}
                    <SkeletonBox width="100%" height={52} borderRadius={RADIUS.lg} />
                </View>
            </View>
        </SkeletonGroup>
    );
}