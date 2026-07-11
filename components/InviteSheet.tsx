/**
 * components/InviteSheet.tsx
 * ──────────────────────────
 * Reusable invite component.
 * Handles both email and phone number invites.
 * Opens native email app or SMS app depending on input.
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
    Alert,
    Animated,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from "../constants/theme";
import { useThemeColors } from "../store/usePrefsStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isPhone(value: string): boolean {
    return /^[+]?[\d\s\-().]{7,15}$/.test(value.trim());
}

function detectType(value: string): "email" | "phone" | "unknown" {
    if (isEmail(value)) return "email";
    if (isPhone(value)) return "phone";
    return "unknown";
}

const APP_INVITE_MESSAGE =
    "Hey! I use Splitty to split bills with friends. Join me here: https://splitty.app";

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    prefill?: string;
    onClose?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function InviteSheet({ prefill = "", onClose }: Props) {
    const tc = useThemeColors();
    const [value, setValue] = useState(prefill);
    const [sending, setSending] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.97)).current;

    const type = detectType(value.trim());

    const handleInvite = async () => {
        if (!value.trim()) return;
        setSending(true);

        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, tension: 200, friction: 8 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
        ]).start();

        try {
            if (type === "email") {
                const subject = encodeURIComponent("Join me on Splitty!");
                const body = encodeURIComponent(APP_INVITE_MESSAGE);
                const url = `mailto:${value.trim()}?subject=${subject}&body=${body}`;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    Alert.alert("No email app found", "Please install an email app to send invites.");
                }
            } else if (type === "phone") {
                const body = encodeURIComponent(APP_INVITE_MESSAGE);
                const sep = Platform.OS === "ios" ? "&" : "?";
                const url = `sms:${value.trim()}${sep}body=${body}`;
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    Alert.alert("Cannot open SMS", "SMS is not available on this device.");
                }
            } else {
                Alert.alert("Invalid input", "Please enter a valid email address or phone number.");
                setSending(false);
                return;
            }
        } catch {
            Alert.alert("Error", "Could not open the invite app. Please try manually.");
        }

        setSending(false);
        onClose?.();
    };

    const iconName =
        type === "email" ? "mail-outline" :
            type === "phone" ? "phone-portrait-outline" :
                "person-add-outline";

    const buttonLabel =
        type === "email" ? "Send Email Invite" :
            type === "phone" ? "Send SMS Invite" :
                "Send Invite";

    return (
        <View style={[styles.container, { backgroundColor: tc.card, borderColor: tc.border }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: tc.border }]} />

            {/* Title row */}
            <View style={styles.titleRow}>
                <View style={styles.titleIcon}>
                    <Ionicons name="send-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: tc.textPrimary }]}>Invite to Splitty</Text>
                    <Text style={[styles.subtitle, { color: tc.textMuted }]}>
                        Enter an email or phone number
                    </Text>
                </View>
                {onClose && (
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Ionicons name="close" size={20} color={tc.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Input */}
            <View style={[styles.inputRow, { backgroundColor: tc.inputBg, borderColor: tc.border }]}>
                <Ionicons
                    name={iconName as any}
                    size={18}
                    color={type === "unknown" ? tc.textMuted : COLORS.primary}
                />
                <TextInput
                    style={[styles.input, { color: tc.textPrimary }]}
                    placeholder="email@example.com or +1 234 567 8900"
                    placeholderTextColor={tc.textMuted}
                    value={value}
                    onChangeText={setValue}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {value.length > 0 && (
                    <TouchableOpacity onPress={() => setValue("")}>
                        <Ionicons name="close-circle" size={16} color={tc.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Type hint */}
            {value.trim().length > 0 && (
                <View style={styles.hintRow}>
                    {type === "email" ? (
                        <>
                            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                            <Text style={[styles.hint, { color: COLORS.success }]}>
                                Email detected — will open email app
                            </Text>
                        </>
                    ) : type === "phone" ? (
                        <>
                            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                            <Text style={[styles.hint, { color: COLORS.success }]}>
                                Phone detected — will open SMS app
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="information-circle-outline" size={13} color={tc.textMuted} />
                            <Text style={[styles.hint, { color: tc.textMuted }]}>
                                Enter a valid email or phone number
                            </Text>
                        </>
                    )}
                </View>
            )}

            {/* Message preview */}
            <View style={[styles.previewBox, { backgroundColor: tc.sectionBg, borderColor: tc.border }]}>
                <Text style={[styles.previewLabel, { color: tc.textMuted }]}>MESSAGE PREVIEW</Text>
                <Text style={[styles.previewText, { color: tc.textSecondary }]}>
                    {APP_INVITE_MESSAGE}
                </Text>
            </View>

            {/* Send button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    style={[styles.sendBtn, { opacity: type === "unknown" || sending ? 0.5 : 1 }]}
                    onPress={handleInvite}
                    disabled={type === "unknown" || sending}
                    activeOpacity={0.85}
                >
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.sendBtnText}>
                        {sending ? "Opening..." : buttonLabel}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        borderRadius: RADIUS.xxl,
        borderWidth: 1,
        padding: SPACE.xl,
        gap: SPACE.md,
        ...SHADOW.md,
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        alignSelf: "center", marginBottom: SPACE.sm,
    },
    titleRow: {
        flexDirection: "row", alignItems: "center", gap: SPACE.md,
    },
    titleIcon: {
        width: 40, height: 40, borderRadius: RADIUS.md,
        backgroundColor: "#FFF3E0",
        alignItems: "center", justifyContent: "center",
    },
    title: { fontSize: FONT.md, fontWeight: FONT.bold },
    subtitle: { fontSize: FONT.xs, marginTop: 2 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: "center", justifyContent: "center",
    },
    inputRow: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        borderRadius: RADIUS.xl, borderWidth: 1.5,
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm + 2,
    },
    input: { flex: 1, fontSize: FONT.base },
    hintRow: {
        flexDirection: "row", alignItems: "center", gap: 4,
        marginTop: -SPACE.xs,
    },
    hint: { fontSize: FONT.xs, fontWeight: FONT.medium },
    previewBox: {
        borderRadius: RADIUS.lg, borderWidth: 1,
        padding: SPACE.md, gap: 4,
    },
    previewLabel: {
        fontSize: 10, fontWeight: FONT.black,
        letterSpacing: 1, textTransform: "uppercase",
    },
    previewText: { fontSize: FONT.sm, lineHeight: 18 },
    sendBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: SPACE.sm, backgroundColor: COLORS.primary,
        borderRadius: RADIUS.xl, paddingVertical: SPACE.md + 2,
    },
    sendBtnText: { color: "#fff", fontSize: FONT.base, fontWeight: FONT.bold },
});