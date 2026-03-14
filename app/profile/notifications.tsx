import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FadeCard } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { NotificationSettings, usePrefsStore, useThemeColors } from "../../store/usePrefsStore";

// ─── Toggle Row ───────────────────────────────────────────────────────────────

function ToggleRow({
    icon,
    iconBg,
    iconColor,
    label,
    sublabel,
    value,
    onToggle,
    disabled,
    isLast,
    themeColors,
    delay,
}: {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    sublabel: string;
    value: boolean;
    onToggle: () => void;
    disabled?: boolean;
    isLast?: boolean;
    themeColors: ReturnType<typeof useThemeColors>;
    delay: number;
}) {
    return (
        <FadeCard delay={delay}>
            <View
                style={[
                    styles.toggleRow,
                    { borderBottomColor: themeColors.border },
                    isLast && { borderBottomWidth: 0 },
                    disabled && { opacity: 0.4 },
                ]}
            >
                <View style={[styles.toggleIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon as any} size={20} color={iconColor} />
                </View>
                <View style={styles.toggleCenter}>
                    <Text style={[styles.toggleLabel, { color: themeColors.textPrimary }]}>{label}</Text>
                    <Text style={[styles.toggleSub, { color: themeColors.textMuted }]}>{sublabel}</Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={disabled ? undefined : onToggle}
                    trackColor={{ false: themeColors.border, true: `${COLORS.primary}80` }}
                    thumbColor={value ? COLORS.primary : "#ccc"}
                    ios_backgroundColor={themeColors.border}
                    disabled={disabled}
                />
            </View>
        </FadeCard>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, updateNotification } = usePrefsStore();
    const themeColors = useThemeColors();

    const toggle = (key: keyof NotificationSettings) => {
        updateNotification(key, !notifications[key]);
    };

    return (
        <View style={[styles.root, { backgroundColor: themeColors.bg }]}>
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <View style={{ width: 38 }} />
                    </View>

                    {/* Master toggle status */}
                    <View style={styles.masterStatus}>
                        <Ionicons
                            name={notifications.pushEnabled ? "notifications" : "notifications-off"}
                            size={22}
                            color="#fff"
                        />
                        <Text style={styles.masterStatusText}>
                            {notifications.pushEnabled ? "Push notifications are ON" : "Push notifications are OFF"}
                        </Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={[styles.scroll, { backgroundColor: themeColors.bg }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Master push toggle */}
                <FadeCard delay={0}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>MASTER CONTROL</Text>
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <ToggleRow
                            icon="phone-portrait-outline"
                            iconBg="#FFF3E0"
                            iconColor={COLORS.primary}
                            label="Push Notifications"
                            sublabel="Allow Splitty to send push alerts"
                            value={notifications.pushEnabled}
                            onToggle={() => toggle("pushEnabled")}
                            isLast
                            themeColors={themeColors}
                            delay={60}
                        />
                    </View>
                </FadeCard>

                {/* Activity toggles */}
                <FadeCard delay={80}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginTop: SPACE.lg }]}>
                        ACTIVITY
                    </Text>
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <ToggleRow
                            icon="receipt-outline"
                            iconBg="#E3F2FD"
                            iconColor="#2196F3"
                            label="Expense Added"
                            sublabel="When someone adds an expense"
                            value={notifications.expenseAdded}
                            onToggle={() => toggle("expenseAdded")}
                            disabled={!notifications.pushEnabled}
                            themeColors={themeColors}
                            delay={120}
                        />
                        <ToggleRow
                            icon="people-outline"
                            iconBg="#E8F5E9"
                            iconColor={COLORS.success}
                            label="Group Activity"
                            sublabel="New members, group edits"
                            value={notifications.groupActivity}
                            onToggle={() => toggle("groupActivity")}
                            disabled={!notifications.pushEnabled}
                            themeColors={themeColors}
                            delay={160}
                        />
                        <ToggleRow
                            icon="alarm-outline"
                            iconBg="#FFF3E0"
                            iconColor="#FF9F43"
                            label="Settlement Reminders"
                            sublabel="Reminders to pay pending debts"
                            value={notifications.settlementReminder}
                            onToggle={() => toggle("settlementReminder")}
                            disabled={!notifications.pushEnabled}
                            isLast
                            themeColors={themeColors}
                            delay={200}
                        />
                    </View>
                </FadeCard>

                {/* Digest */}
                <FadeCard delay={160}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted, marginTop: SPACE.lg }]}>
                        DIGEST
                    </Text>
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <ToggleRow
                            icon="bar-chart-outline"
                            iconBg="#F3E5F5"
                            iconColor="#9C27B0"
                            label="Weekly Digest"
                            sublabel="Summary of your weekly spending"
                            value={notifications.weeklyDigest}
                            onToggle={() => toggle("weeklyDigest")}
                            disabled={!notifications.pushEnabled}
                            isLast
                            themeColors={themeColors}
                            delay={240}
                        />
                    </View>
                </FadeCard>

                {!notifications.pushEnabled && (
                    <FadeCard delay={280}>
                        <View style={[styles.disabledBanner, { backgroundColor: `${COLORS.danger}14`, borderColor: `${COLORS.danger}30` }]}>
                            <Ionicons name="information-circle-outline" size={16} color={COLORS.danger} />
                            <Text style={[styles.disabledBannerText, { color: COLORS.danger }]}>
                                Enable push notifications to manage individual alerts.
                            </Text>
                        </View>
                    </FadeCard>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>
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
    masterStatus: {
        flexDirection: "row", alignItems: "center", gap: SPACE.sm,
        backgroundColor: "rgba(255,255,255,0.18)",
        borderRadius: RADIUS.xl, padding: SPACE.md,
    },
    masterStatusText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: "#fff" },
    scroll: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl },
    scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
    sectionLabel: {
        fontSize: FONT.xs, fontWeight: FONT.black,
        letterSpacing: 1.2, textTransform: "uppercase", marginBottom: SPACE.sm,
    },
    card: { borderRadius: RADIUS.xl, overflow: "hidden", borderWidth: 1, ...SHADOW.sm },
    toggleRow: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: SPACE.md, paddingVertical: SPACE.md,
        gap: SPACE.md, borderBottomWidth: 1,
    },
    toggleIcon: { width: 38, height: 38, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center" },
    toggleCenter: { flex: 1 },
    toggleLabel: { fontSize: FONT.base, fontWeight: FONT.semibold },
    toggleSub: { fontSize: FONT.xs, marginTop: 2 },
    disabledBanner: {
        flexDirection: "row", alignItems: "flex-start", gap: SPACE.sm,
        borderRadius: RADIUS.lg, padding: SPACE.md,
        borderWidth: 1, marginTop: SPACE.md,
    },
    disabledBannerText: { flex: 1, fontSize: FONT.sm, fontWeight: FONT.medium, lineHeight: 18 },
});