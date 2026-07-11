import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, GradBtn } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { ApiUser, usersApi } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

const GROUP_EMOJIS = ["🎂", "🎉", "🛍️", "✈️", "🏠", "🍕", "🎮", "💼", "⚽", "🎵"];

type SearchUser = Pick<ApiUser, "id" | "name" | "email" | "avatarUrl">;

export default function CreateGroupScreen() {
    const router = useRouter();
    const { tc, t } = useAppContext();
    const { createGroup } = useGroupStore();

    const [name, setName] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState(GROUP_EMOJIS[0]);
    const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const shakeAnim = useRef(new Animated.Value(0)).current;

    const shake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const handleSearch = (q: string) => {
        setSearchQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (q.trim().length < 2) { setSearchResults([]); return; }

        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            const res = await usersApi.search(q.trim());
            setSearching(false);
            if (res.ok) {
                const selectedIds = new Set(selectedMembers.map((m) => m.id));
                setSearchResults(res.data.users.filter((u) => !selectedIds.has(u.id)));
            }
        }, 400);
    };

    const addMember = (user: SearchUser) => {
        setSelectedMembers((prev) => [...prev, user]);
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        setSearchQuery("");
    };

    const removeMember = (userId: string) => {
        setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
    };

    const handleCreate = async () => {
        if (!name.trim()) { shake(); return; }
        if (selectedMembers.length === 0) {
            Alert.alert(t.groups.addFriends, "Select at least one member for the group.");
            return;
        }
        setLoading(true);
        const group = await createGroup({
            name: name.trim(),
            iconEmoji: selectedEmoji,
            memberIds: selectedMembers.map((m) => m.id),
        });
        setLoading(false);
        if (group) {
            router.replace(`/groups/${group.id}`);
        } else {
            Alert.alert("Error", "Could not create group. Please try again.");
        }
    };

    return (
        <View style={[styles.root, { backgroundColor: tc.bg }]}>
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t.groups.newGroup}</Text>
                        <View style={{ width: 38 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={[styles.body, { backgroundColor: tc.bg }]}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Emoji Picker */}
                    <Text style={[styles.label, { color: tc.textMuted }]}>
                        {t.groups.groupIcon.toUpperCase()}
                    </Text>
                    <ScrollView
                        horizontal showsHorizontalScrollIndicator={false}
                        style={styles.emojiRow}
                        contentContainerStyle={{ gap: SPACE.sm, paddingHorizontal: 2 }}
                    >
                        {GROUP_EMOJIS.map((e) => (
                            <TouchableOpacity
                                key={e}
                                onPress={() => setSelectedEmoji(e)}
                                style={[
                                    styles.emojiBtn, { backgroundColor: tc.card },
                                    selectedEmoji === e && styles.emojiBtnOn,
                                ]}
                                activeOpacity={0.8}
                            >
                                <Text style={{ fontSize: 26 }}>{e}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Group Name */}
                    <Text style={[styles.label, { color: tc.textMuted, marginTop: SPACE.lg }]}>
                        {t.groups.groupName.toUpperCase()}
                    </Text>
                    <Animated.View
                        style={[styles.inputWrap, { backgroundColor: tc.card, transform: [{ translateX: shakeAnim }] }]}
                    >
                        <View style={[styles.emojiPreview, { backgroundColor: tc.cardAlt }]}>
                            <Text style={{ fontSize: 20 }}>{selectedEmoji}</Text>
                        </View>
                        <TextInput
                            style={[styles.nameInput, { color: tc.textPrimary }]}
                            placeholder="e.g. Weekend Trip, Birthday..."
                            placeholderTextColor={tc.textMuted}
                            value={name}
                            onChangeText={setName}
                            returnKeyType="done"
                            autoCorrect={false}
                        />
                    </Animated.View>

                    {/* Member Search */}
                    <Text style={[styles.label, { color: tc.textMuted, marginTop: SPACE.xl }]}>
                        {t.groups.addFriends.toUpperCase()}
                    </Text>
                    <View style={[styles.searchBar, { backgroundColor: tc.card }]}>
                        <Ionicons name="search" size={16} color={tc.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: tc.textPrimary }]}
                            placeholder="Search by name or email..."
                            placeholderTextColor={tc.textMuted}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
                    </View>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <View style={[styles.searchResults, { backgroundColor: tc.card, borderColor: tc.border }]}>
                            {searchResults.map((user: SearchUser) => (
                                <TouchableOpacity
                                    key={user.id}
                                    style={[styles.searchResultRow, { borderBottomColor: tc.border }]}
                                    onPress={() => addMember(user)}
                                    activeOpacity={0.8}
                                >
                                    <Avatar initials={getInitials(user.name)} color={getAvatarColor(user.id)} size={36} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.resultName, { color: tc.textPrimary }]}>{user.name}</Text>
                                        <Text style={[styles.resultEmail, { color: tc.textMuted }]}>{user.email}</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Selected Members */}
                    {selectedMembers.length > 0 && (
                        <>
                            <Text style={[styles.selectedLabel, { color: tc.textMuted }]}>SELECTED MEMBERS</Text>
                            <View style={styles.selectedList}>
                                {selectedMembers.map((m) => (
                                    <View
                                        key={m.id}
                                        style={[styles.selectedChip, { backgroundColor: tc.cardAlt, borderColor: COLORS.primary }]}
                                    >
                                        <Avatar initials={getInitials(m.name)} color={getAvatarColor(m.id)} size={28} />
                                        <Text style={[styles.chipName, { color: tc.textPrimary }]}>
                                            {m.name.split(" ")[0]}
                                        </Text>
                                        <TouchableOpacity onPress={() => removeMember(m.id)}>
                                            <Ionicons name="close-circle" size={18} color={tc.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.selectedSummary}>
                                <Ionicons name="people" size={16} color={COLORS.primary} />
                                <Text style={styles.selectedSummaryText}>
                                    You + {selectedMembers.length} {t.groups.membersIn}
                                </Text>
                            </View>
                        </>
                    )}

                    <View style={{ height: SPACE.xxxl }} />
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: tc.bg, borderTopColor: tc.border }]}>
                    <GradBtn
                        label={loading ? t.common.loading : t.groups.createGroup}
                        onPress={handleCreate}
                        icon="arrow-forward"
                        disabled={loading || !name.trim() || selectedMembers.length === 0}
                        style={{ borderRadius: RADIUS.xl }}
                    />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
    headerRow: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: SPACE.xs,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
    body: {
        flex: 1, borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4,
        marginTop: -RADIUS.xxl, overflow: "hidden",
    },
    scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
    label: { fontSize: FONT.xs, fontWeight: FONT.black, letterSpacing: 1.2, marginBottom: SPACE.sm },
    emojiRow: { marginBottom: SPACE.sm },
    emojiBtn: {
        width: 54, height: 54, borderRadius: RADIUS.lg,
        alignItems: "center", justifyContent: "center",
        borderWidth: 2, borderColor: "transparent", ...SHADOW.sm,
    },
    emojiBtnOn: { borderColor: COLORS.primary },
    inputWrap: {
        flexDirection: "row", alignItems: "center",
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
        gap: SPACE.sm, ...SHADOW.sm,
    },
    emojiPreview: { width: 40, height: 40, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
    nameInput: { flex: 1, fontSize: FONT.lg, fontWeight: FONT.medium },
    searchBar: {
        flexDirection: "row", alignItems: "center",
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
        gap: SPACE.sm, marginBottom: SPACE.sm, ...SHADOW.sm,
    },
    searchInput: { flex: 1, fontSize: FONT.base },
    searchResults: {
        borderRadius: RADIUS.xl, borderWidth: 1,
        marginBottom: SPACE.md, overflow: "hidden", ...SHADOW.sm,
    },
    searchResultRow: {
        flexDirection: "row", alignItems: "center", gap: SPACE.md,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
        borderBottomWidth: 1,
    },
    resultName: { fontSize: FONT.base, fontWeight: FONT.semibold },
    resultEmail: { fontSize: FONT.xs, marginTop: 2 },
    selectedLabel: {
        fontSize: FONT.xs, fontWeight: FONT.black,
        letterSpacing: 1.2, marginBottom: SPACE.sm, marginTop: SPACE.md,
    },
    selectedList: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.md },
    selectedChip: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
        borderWidth: 1.5,
    },
    chipName: { fontSize: FONT.sm, fontWeight: FONT.semibold },
    selectedSummary: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        backgroundColor: "#FFF3E0", borderRadius: RADIUS.xl,
        padding: SPACE.md, borderWidth: 1, borderColor: "#FFD166",
    },
    selectedSummaryText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primary },
    footer: {
        paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl,
        paddingTop: SPACE.md, borderTopWidth: 1,
    },
});