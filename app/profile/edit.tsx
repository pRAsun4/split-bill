import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { COLORS, FONT, GRAD, RADIUS, SPACE } from "../../constants/theme";
import { usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

// ─── Avatar color palette ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#FF6B35", "#FF6584", "#6C63FF", "#43BCCD",
    "#FF9F43", "#EE5A24", "#4CAF50", "#9C27B0",
    "#2196F3", "#FF5722", "#607D8B", "#E91E63",
];

// ─── Field Row ────────────────────────────────────────────────────────────────

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    multiline,
    keyboardType,
    maxLength,
    themeColors,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    multiline?: boolean;
    keyboardType?: "default" | "email-address" | "phone-pad";
    maxLength?: number;
    themeColors: ReturnType<typeof useThemeColors>;
}) {
    const [focused, setFocused] = useState(false);
    const borderAnim = useRef(new Animated.Value(0)).current;

    const onFocus = () => {
        setFocused(true);
        Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
    };
    const onBlur = () => {
        setFocused(false);
        Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    };

    const borderColor = borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [themeColors.border, COLORS.primary],
    });

    return (
        <View style={styles.fieldWrap}>
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>{label}</Text>
            <Animated.View
                style={[
                    styles.fieldBox,
                    { backgroundColor: themeColors.inputBg, borderColor },
                    multiline && { minHeight: 80 },
                ]}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    placeholderTextColor={themeColors.textMuted}
                    style={[
                        styles.fieldInput,
                        { color: themeColors.textPrimary },
                        multiline && { textAlignVertical: "top", paddingTop: SPACE.sm },
                    ]}
                    multiline={multiline}
                    keyboardType={keyboardType ?? "default"}
                    maxLength={maxLength}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {maxLength && (
                    <Text style={[styles.charCount, { color: themeColors.textMuted }]}>
                        {value.length}/{maxLength}
                    </Text>
                )}
            </Animated.View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile, updateProfile } = usePrefsStore();
    const themeColors = useThemeColors();

    const [name, setName] = useState(profile.name);
    const [username, setUsername] = useState(profile.username);
    const [email, setEmail] = useState(profile.email);
    const [phone, setPhone] = useState(profile.phone);
    const [bio, setBio] = useState(profile.bio);
    const [avatarColor, setAvatarColor] = useState(profile.avatarColor);

    const [saving, setSaving] = useState(false);
    const saveScale = useRef(new Animated.Value(1)).current;

    const hasChanges =
        name !== profile.name ||
        username !== profile.username ||
        email !== profile.email ||
        phone !== profile.phone ||
        bio !== profile.bio ||
        avatarColor !== profile.avatarColor;

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Name required", "Please enter your name.");
            return;
        }
        setSaving(true);
        Animated.sequence([
            Animated.spring(saveScale, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 8 }),
            Animated.spring(saveScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        ]).start(() => {
            updateProfile({ name, username, email, phone, bio, avatarColor });
            setSaving(false);
            router.back();
        });
    };

    // Derive preview initials
    const previewInitials = (() => {
        const parts = name.trim().split(" ");
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.trim().slice(0, 2).toUpperCase() || "ME";
    })();

    return (
        <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
            {/* Header */}
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <Animated.View style={{ transform: [{ scale: saveScale }] }}>
                            <TouchableOpacity
                                onPress={handleSave}
                                style={[styles.saveBtn, !hasChanges && { opacity: 0.45 }]}
                                disabled={!hasChanges || saving}
                            >
                                <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Avatar preview */}
                    <View style={styles.avatarPreviewRow}>
                        <View style={[styles.avatarPreview, { backgroundColor: avatarColor }]}>
                            <Text style={styles.avatarPreviewText}>{previewInitials}</Text>
                        </View>
                        <View style={styles.avatarPreviewMeta}>
                            <Text style={styles.avatarPreviewName}>{name || "Your Name"}</Text>
                            <Text style={styles.avatarPreviewSub}>{username || "@username"}</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={[styles.body, { backgroundColor: themeColors.bg }]}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar color picker */}
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>AVATAR COLOR</Text>
                    <View style={styles.colorGrid}>
                        {AVATAR_COLORS.map((c) => (
                            <TouchableOpacity
                                key={c}
                                onPress={() => setAvatarColor(c)}
                                style={[
                                    styles.colorSwatch,
                                    { backgroundColor: c },
                                    avatarColor === c && styles.colorSwatchActive,
                                ]}
                                activeOpacity={0.8}
                            >
                                {avatarColor === c && (
                                    <Ionicons name="checkmark" size={16} color="#fff" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Fields */}
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginTop: SPACE.xl }]}>
                        PERSONAL INFO
                    </Text>

                    <Field
                        label="Full Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Your full name"
                        maxLength={40}
                        themeColors={themeColors}
                    />
                    <Field
                        label="Username"
                        value={username}
                        onChangeText={(v) => setUsername(v.startsWith("@") ? v : `@${v}`)}
                        placeholder="@yourhandle"
                        maxLength={30}
                        themeColors={themeColors}
                    />
                    <Field
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="A short bio..."
                        multiline
                        maxLength={100}
                        themeColors={themeColors}
                    />

                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginTop: SPACE.xl }]}>
                        CONTACT
                    </Text>
                    <Field
                        label="Email"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@email.com"
                        keyboardType="email-address"
                        themeColors={themeColors}
                    />
                    <Field
                        label="Phone"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+1 (555) 000-0000"
                        keyboardType="phone-pad"
                        themeColors={themeColors}
                    />

                    <View style={{ height: 80 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.xl },
    headerRow: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", paddingTop: SPACE.xs, marginBottom: SPACE.lg,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    headerTitle: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
    saveBtn: {
        backgroundColor: "rgba(255,255,255,0.25)",
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
        borderRadius: RADIUS.pill,
        borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
    },
    saveBtnText: { fontSize: FONT.sm, fontWeight: FONT.bold, color: "#fff" },
    avatarPreviewRow: {
        flexDirection: "row", alignItems: "center", gap: SPACE.md, paddingBottom: SPACE.sm,
    },
    avatarPreview: {
        width: 56, height: 56, borderRadius: 28,
        alignItems: "center", justifyContent: "center",
        borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
    },
    avatarPreviewText: { color: "#fff", fontSize: FONT.xl, fontWeight: FONT.black },
    avatarPreviewName: { fontSize: FONT.lg, fontWeight: FONT.bold, color: "#fff" },
    avatarPreviewSub: { fontSize: FONT.sm, color: "rgba(255,255,255,0.65)", marginTop: 2 },
    body: {
        flex: 1, borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl, overflow: "hidden",
    },
    scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
    sectionLabel: {
        fontSize: FONT.xs, fontWeight: FONT.black,
        letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.md,
    },
    colorGrid: {
        flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm,
    },
    colorSwatch: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: "center", justifyContent: "center",
    },
    colorSwatchActive: {
        borderWidth: 3, borderColor: "#fff",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
    },
    fieldWrap: { marginBottom: SPACE.md },
    fieldLabel: {
        fontSize: FONT.xs, fontWeight: FONT.bold,
        letterSpacing: 0.5, marginBottom: SPACE.xs,
    },
    fieldBox: {
        borderRadius: RADIUS.lg, borderWidth: 1.5,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
    },
    fieldInput: {
        fontSize: FONT.base, fontWeight: FONT.medium, minHeight: 24,
    },
    charCount: {
        fontSize: FONT.xs, textAlign: "right", marginTop: 4,
    },
});