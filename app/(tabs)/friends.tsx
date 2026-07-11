import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InviteSheet from "../../components/InviteSheet";
import { Avatar, FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { usersApi } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { useFriendStore } from "../../store/useFriendStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

type TabKey = "find" | "requests" | "friends";

// ─── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({
    label, active, onPress, badge,
}: {
    label: string; active: boolean; onPress: () => void; badge?: number;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.tabBtn, active && styles.tabBtnActive]}
            activeOpacity={0.8}
        >
            <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>{label}</Text>
            {badge && badge > 0 ? (
                <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{badge > 9 ? "9+" : badge}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

// ─── User Search Row ──────────────────────────────────────────────────────────

type SearchUser = { id: string; name: string; email: string; avatarUrl: string | null };

function SearchUserRow({
    user, status, onAdd, delay, tc,
}: {
    user: SearchUser;
    status: "none" | "pending" | "friends" | "received";
    onAdd: () => void;
    delay: number;
    tc: ReturnType<typeof useAppContext>["tc"];
}) {
    return (
        <FadeCard delay={delay}>
            <View style={[styles.userCard, { backgroundColor: tc.card }]}>
                <Avatar initials={getInitials(user.name)} color={getAvatarColor(user.id)} size={42} />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: tc.textPrimary }]}>{user.name}</Text>
                    <Text style={[styles.userSub, { color: tc.textMuted }]}>{user.email}</Text>
                </View>
                {status === "none" && (
                    <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
                        <Ionicons name="person-add-outline" size={14} color="#fff" />
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                )}
                {status === "pending" && (
                    <View style={[styles.statusPill, { backgroundColor: tc.sectionBg }]}>
                        <Text style={[styles.statusPillText, { color: tc.textMuted }]}>Pending</Text>
                    </View>
                )}
                {status === "received" && (
                    <View style={[styles.statusPill, { backgroundColor: "#E3F2FD" }]}>
                        <Text style={[styles.statusPillText, { color: "#2196F3" }]}>Accept?</Text>
                    </View>
                )}
                {status === "friends" && (
                    <View style={[styles.statusPill, { backgroundColor: "#E8F5E9" }]}>
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                        <Text style={[styles.statusPillText, { color: COLORS.success }]}>Friends</Text>
                    </View>
                )}
            </View>
        </FadeCard>
    );
}

// ─── Request Row ──────────────────────────────────────────────────────────────

function RequestRow({
    name, userId, friendshipId, type, onAccept, onDecline, delay, tc,
}: {
    name: string; userId: string; friendshipId: string;
    type: "received" | "sent";
    onAccept?: () => void; onDecline: () => void;
    delay: number;
    tc: ReturnType<typeof useAppContext>["tc"];
}) {
    return (
        <FadeCard delay={delay}>
            <View style={[styles.userCard, { backgroundColor: tc.card }]}>
                <Avatar initials={getInitials(name)} color={getAvatarColor(userId)} size={42} />
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: tc.textPrimary }]}>{name}</Text>
                    <Text style={[styles.userSub, { color: tc.textMuted }]}>
                        {type === "received" ? "Wants to connect" : "Request pending"}
                    </Text>
                </View>
                {type === "received" ? (
                    <View style={styles.actionBtns}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.8}>
                            <Text style={styles.acceptBtnText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.declineBtn, { borderColor: tc.border }]} onPress={onDecline} activeOpacity={0.8}>
                            <Ionicons name="close" size={14} color={tc.textMuted} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.declineBtn, { borderColor: tc.border }]}
                        onPress={onDecline}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.cancelText, { color: tc.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </FadeCard>
    );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({
    name, userId, friendshipId, net, onPress, onRemove, delay, tc, fmt,
}: {
    name: string; userId: string; friendshipId: string;
    net: number; onPress: () => void; onRemove: () => void;
    delay: number;
    tc: ReturnType<typeof useAppContext>["tc"];
    fmt: (n: number) => string;
}) {
    const isOwed = net > 0.01;
    const isOwing = net < -0.01;
    const isSettled = !isOwed && !isOwing;

    return (
        <FadeCard delay={delay}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
                <View style={[styles.userCard, { backgroundColor: tc.card }]}>
                    <Avatar initials={getInitials(name)} color={getAvatarColor(userId)} size={42} />
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: tc.textPrimary }]}>{name}</Text>
                        <Text style={[
                            styles.userSub,
                            { color: isSettled ? tc.textMuted : isOwed ? COLORS.success : COLORS.danger },
                        ]}>
                            {isSettled ? "Settled up" : isOwed ? `Owes you ${fmt(net)}` : `You owe ${fmt(-net)}`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); onRemove(); }}
                        style={styles.removeBtn}
                    >
                        <Ionicons name="person-remove-outline" size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </FadeCard>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FriendsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { tc, fmt, t } = useAppContext();
    const {
        friends, received, sent,
        fetchFriends, fetchRequests,
        sendRequest, acceptRequest, removeFriend,
        loading,
    } = useFriendStore();
    const { groups, balances } = useGroupStore();

    const [activeTab, setActiveTab] = useState<TabKey>("find");
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [invitePrefill, setInvitePrefill] = useState("");
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const myUserId = user?.id ?? "";

    useEffect(() => {
        fetchFriends();
        fetchRequests();
    }, []);

    const onRefresh = useCallback(async () => {
        await fetchFriends();
        await fetchRequests();
    }, []);

    // Auto-search as user types (after 2+ chars)
    const handleSearch = (q: string) => {
        setQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (q.trim().length < 2) { setSearchResults([]); return; }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            const res = await usersApi.search(q.trim());
            setSearching(false);
            if (res.ok) {
                // Exclude self
                setSearchResults(res.data.users.filter((u) => u.id !== myUserId));
            }
        }, 400);
    };

    // Determine relationship status for a search result
    const getStatus = (userId: string): "none" | "pending" | "friends" | "received" => {
        if (friends.some((f) => f.user.id === userId)) return "friends";
        if (sent.some((r) => r.user.id === userId)) return "pending";
        if (received.some((r) => r.user.id === userId)) return "received";
        return "none";
    };

    const handleAdd = async (userId: string) => {
        const ok = await sendRequest(userId);
        if (!ok) Alert.alert("Error", "Could not send friend request.");
    };

    const handleAccept = async (friendshipId: string) => {
        const ok = await acceptRequest(friendshipId);
        if (!ok) Alert.alert("Error", "Could not accept request.");
    };

    const handleRemove = (friendshipId: string, name: string) => {
        Alert.alert(
            "Remove Friend",
            `Remove ${name} from your friends?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const ok = await removeFriend(friendshipId);
                        if (!ok) Alert.alert("Error", "Could not remove friend.");
                    },
                },
            ]
        );
    };

    // Net balance per friend across all groups
    const getFriendNet = (friendUserId: string): number => {
        let net = 0;
        for (const g of groups) {
            const gBal = balances[g.id] ?? [];
            const b = gBal.find((b) => b.otherUser.id === friendUserId);
            if (b) net += b.owesYou - b.youOwe;
        }
        return parseFloat(net.toFixed(2));
    };

    return (
        <View style={[styles.root, { backgroundColor: tc.bg }]}>
            {/* Header */}
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.headerTitle}>Friends</Text>
                            <Text style={styles.headerSub}>
                                {friends.length} friends · {received.length} pending
                            </Text>
                        </View>
                    </View>

                    {/* Search bar — shown on Find tab */}
                    {activeTab === "find" && (
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or email..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                value={query}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searching && <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />}
                            {!searching && query.length > 0 && (
                                <TouchableOpacity onPress={() => { setQuery(""); setSearchResults([]); }}>
                                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Tabs */}
                    <View style={styles.tabRow}>
                        <TabBtn label="Find People" active={activeTab === "find"} onPress={() => setActiveTab("find")} />
                        <TabBtn label="Requests" active={activeTab === "requests"} onPress={() => setActiveTab("requests")} badge={received.length} />
                        <TabBtn label="My Friends" active={activeTab === "friends"} onPress={() => setActiveTab("friends")} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Body */}
            <ScrollView
                style={[styles.scroll, { backgroundColor: tc.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
                keyboardShouldPersistTaps="handled"
            >

                {/* ── FIND PEOPLE ── */}
                {activeTab === "find" && (
                    <>
                        {query.trim().length === 0 && (
                            <FadeCard delay={0}>
                                <View style={[styles.emptyHint, { backgroundColor: tc.card }]}>
                                    <Ionicons name="search" size={32} color={tc.textMuted} />
                                    <Text style={[styles.emptyHintTitle, { color: tc.textPrimary }]}>Find your friends</Text>
                                    <Text style={[styles.emptyHintSub, { color: tc.textMuted }]}>
                                        Search by name or email to send a friend request
                                    </Text>
                                </View>
                            </FadeCard>
                        )}

                        {query.trim().length >= 2 && !searching && searchResults.length === 0 && (
                            <FadeCard delay={0}>
                                <View style={[styles.emptyHint, { backgroundColor: tc.card }]}>
                                    <Ionicons name="person-outline" size={32} color={tc.textMuted} />
                                    <Text style={[styles.emptyHintTitle, { color: tc.textPrimary }]}>No users found</Text>
                                    <Text style={[styles.emptyHintSub, { color: tc.textMuted }]}>
                                        "{query}" is not on Splitty yet.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.inviteBtn}
                                        onPress={() => { setInvitePrefill(query); setShowInvite(true); }}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="send-outline" size={14} color="#fff" />
                                        <Text style={styles.inviteBtnText}>Invite them to Splitty</Text>
                                    </TouchableOpacity>
                                </View>
                            </FadeCard>
                        )}

                        {searchResults.map((u, i) => (
                            <SearchUserRow
                                key={u.id}
                                user={u}
                                status={getStatus(u.id)}
                                onAdd={() => handleAdd(u.id)}
                                delay={i * 50}
                                tc={tc}
                            />
                        ))}

                        {/* Invite option always visible at bottom when searching */}
                        {query.trim().length >= 2 && searchResults.length > 0 && (
                            <FadeCard delay={searchResults.length * 50 + 40}>
                                <TouchableOpacity
                                    style={[styles.inviteBanner, { backgroundColor: tc.cardAlt, borderColor: tc.border }]}
                                    onPress={() => { setInvitePrefill(query); setShowInvite(true); }}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.inviteBannerIcon}>
                                        <Ionicons name="send-outline" size={18} color={COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.inviteBannerTitle, { color: tc.textPrimary }]}>
                                            Not who you were looking for?
                                        </Text>
                                        <Text style={[styles.inviteBannerSub, { color: tc.textMuted }]}>
                                            Invite someone via email or phone
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color={tc.textMuted} />
                                </TouchableOpacity>
                            </FadeCard>
                        )}
                    </>
                )}

                {/* ── REQUESTS ── */}
                {activeTab === "requests" && (
                    <>
                        {received.length > 0 && (
                            <>
                                <Text style={[styles.sectionLabel, { color: tc.textMuted }]}>
                                    RECEIVED ({received.length})
                                </Text>
                                {received.map((r, i) => (
                                    <RequestRow
                                        key={r.friendshipId}
                                        name={r.user.name}
                                        userId={r.user.id}
                                        friendshipId={r.friendshipId}
                                        type="received"
                                        onAccept={() => handleAccept(r.friendshipId)}
                                        onDecline={() => removeFriend(r.friendshipId)}
                                        delay={i * 60}
                                        tc={tc}
                                    />
                                ))}
                            </>
                        )}

                        {sent.length > 0 && (
                            <>
                                <Text style={[styles.sectionLabel, { color: tc.textMuted, marginTop: SPACE.lg }]}>
                                    SENT ({sent.length})
                                </Text>
                                {sent.map((r, i) => (
                                    <RequestRow
                                        key={r.friendshipId}
                                        name={r.user.name}
                                        userId={r.user.id}
                                        friendshipId={r.friendshipId}
                                        type="sent"
                                        onDecline={() => removeFriend(r.friendshipId)}
                                        delay={i * 60}
                                        tc={tc}
                                    />
                                ))}
                            </>
                        )}

                        {received.length === 0 && sent.length === 0 && (
                            <FadeCard delay={0}>
                                <View style={[styles.emptyHint, { backgroundColor: tc.card }]}>
                                    <Ionicons name="mail-outline" size={32} color={tc.textMuted} />
                                    <Text style={[styles.emptyHintTitle, { color: tc.textPrimary }]}>No pending requests</Text>
                                    <Text style={[styles.emptyHintSub, { color: tc.textMuted }]}>
                                        Friend requests you send and receive will appear here
                                    </Text>
                                </View>
                            </FadeCard>
                        )}
                    </>
                )}

                {/* ── MY FRIENDS ── */}
                {activeTab === "friends" && (
                    <>
                        {friends.length === 0 ? (
                            <FadeCard delay={0}>
                                <View style={[styles.emptyHint, { backgroundColor: tc.card }]}>
                                    <Ionicons name="people-outline" size={32} color={tc.textMuted} />
                                    <Text style={[styles.emptyHintTitle, { color: tc.textPrimary }]}>No friends yet</Text>
                                    <Text style={[styles.emptyHintSub, { color: tc.textMuted }]}>
                                        Search for people and send them a friend request
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.inviteBtn}
                                        onPress={() => setActiveTab("find")}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="search" size={14} color="#fff" />
                                        <Text style={styles.inviteBtnText}>Find Friends</Text>
                                    </TouchableOpacity>
                                </View>
                            </FadeCard>
                        ) : (
                            <>
                                <Text style={[styles.sectionLabel, { color: tc.textMuted }]}>
                                    {friends.length} FRIEND{friends.length !== 1 ? "S" : ""}
                                </Text>
                                {friends.map((f, i) => (
                                    <FriendRow
                                        key={f.friendshipId}
                                        name={f.user.name}
                                        userId={f.user.id}
                                        friendshipId={f.friendshipId}
                                        net={getFriendNet(f.user.id)}
                                        onPress={() => router.push(`/friend/${f.user.id}`)}
                                        onRemove={() => handleRemove(f.friendshipId, f.user.name)}
                                        delay={i * 60}
                                        tc={tc}
                                        fmt={fmt}
                                    />
                                ))}
                            </>
                        )}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Invite Modal */}
            <Modal
                visible={showInvite}
                transparent
                animationType="slide"
                onRequestClose={() => setShowInvite(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <InviteSheet
                            prefill={invitePrefill}
                            onClose={() => setShowInvite(false)}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingBottom: SPACE.md, paddingHorizontal: SPACE.xl },
    headerTop: {
        flexDirection: "row", alignItems: "flex-start",
        justifyContent: "space-between", paddingTop: SPACE.sm, marginBottom: SPACE.md,
    },
    headerTitle: { fontSize: FONT.display, fontWeight: FONT.black, color: "#fff", letterSpacing: -0.8 },
    headerSub: { fontSize: FONT.sm, color: "rgba(255,255,255,0.7)", marginTop: 3 },
    searchBar: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
        marginBottom: SPACE.md,
    },
    searchInput: { flex: 1, fontSize: FONT.base, color: "#fff" },
    tabRow: {
        flexDirection: "row", gap: SPACE.xs,
        backgroundColor: "rgba(0,0,0,0.15)",
        borderRadius: RADIUS.xl, padding: 3,
        marginBottom: SPACE.sm,
    },
    tabBtn: {
        flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg,
        alignItems: "center", justifyContent: "center",
        flexDirection: "row", gap: 4, position: "relative",
    },
    tabBtnActive: { backgroundColor: "#fff" },
    tabBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: "rgba(255,255,255,0.65)" },
    tabBtnTextActive: { color: COLORS.primary },
    tabBadge: {
        backgroundColor: COLORS.danger, borderRadius: 8,
        paddingHorizontal: 4, paddingVertical: 1, minWidth: 16,
        alignItems: "center",
    },
    tabBadgeText: { fontSize: 9, fontWeight: FONT.black, color: "#fff" },
    scroll: {
        flex: 1, borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.md,
    },
    scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
    sectionLabel: {
        fontSize: FONT.xs, fontWeight: FONT.black,
        letterSpacing: 1.2, textTransform: "uppercase",
        marginBottom: SPACE.md,
    },
    userCard: {
        flexDirection: "row", alignItems: "center",
        borderRadius: RADIUS.xl, padding: SPACE.md,
        marginBottom: SPACE.sm, gap: SPACE.md, ...SHADOW.sm,
    },
    userInfo: { flex: 1 },
    userName: { fontSize: FONT.base, fontWeight: FONT.bold },
    userSub: { fontSize: FONT.xs, marginTop: 2 },
    addBtn: {
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs + 2,
    },
    addBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: "#fff" },
    statusPill: {
        flexDirection: "row", alignItems: "center", gap: 4,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs,
    },
    statusPillText: { fontSize: FONT.xs, fontWeight: FONT.semibold },
    actionBtns: { flexDirection: "row", gap: SPACE.xs },
    acceptBtn: {
        backgroundColor: COLORS.success, borderRadius: RADIUS.pill,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.xs + 2,
    },
    acceptBtnText: { fontSize: FONT.xs, fontWeight: FONT.bold, color: "#fff" },
    declineBtn: {
        borderRadius: RADIUS.pill, borderWidth: 1.5,
        paddingHorizontal: SPACE.sm, paddingVertical: SPACE.xs + 2,
        alignItems: "center", justifyContent: "center",
    },
    cancelText: { fontSize: FONT.xs, fontWeight: FONT.medium },
    removeBtn: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: "center", justifyContent: "center",
    },
    emptyHint: {
        borderRadius: RADIUS.xl, padding: SPACE.xl,
        alignItems: "center", gap: SPACE.sm, marginBottom: SPACE.md,
        ...SHADOW.sm,
    },
    emptyHintTitle: { fontSize: FONT.md, fontWeight: FONT.bold, marginTop: SPACE.xs },
    emptyHintSub: { fontSize: FONT.sm, textAlign: "center", lineHeight: 20 },
    inviteBtn: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
        paddingHorizontal: SPACE.lg, paddingVertical: SPACE.sm,
        marginTop: SPACE.sm,
    },
    inviteBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: "#fff" },
    inviteBanner: {
        flexDirection: "row", alignItems: "center", gap: SPACE.md,
        borderRadius: RADIUS.xl, borderWidth: 1,
        padding: SPACE.md, marginBottom: SPACE.md,
    },
    inviteBannerIcon: {
        width: 38, height: 38, borderRadius: RADIUS.md,
        backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center",
    },
    inviteBannerTitle: { fontSize: FONT.sm, fontWeight: FONT.bold },
    inviteBannerSub: { fontSize: FONT.xs, marginTop: 2 },
    modalOverlay: {
        flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        paddingHorizontal: SPACE.xl,
        paddingBottom: SPACE.xl + 20,
    },
});