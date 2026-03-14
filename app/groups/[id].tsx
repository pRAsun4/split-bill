import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "../../components/ui";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { Member, Message, Split, useAppStore } from "../../store/useAppStore";

// ─── Bubble: Expense ──────────────────────────────────────────────────────────

function ExpenseBubble({
    msg, members, currentUserId,
}: { msg: Message; members: Member[]; currentUserId: string }) {
    const isMe = msg.senderId === currentUserId;
    const sender = members.find((m) => m.id === msg.senderId);

    return (
        <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
            {!isMe && <Avatar initials={sender?.initials ?? "??"} color={sender?.avatarColor ?? COLORS.primary} size={30} />}
            <View style={[styles.expBubble, isMe && styles.expBubbleMe]}>
                <View style={styles.expBubbleHeader}>
                    <Text style={styles.expBubbleTitle}>💰 {msg.description}</Text>
                    <Text style={styles.expBubbleAmt}>${msg.amount?.toFixed(2)}</Text>
                </View>
                {msg.splits?.map((s) => {
                    const mem = members.find((m) => m.id === s.memberId);
                    return (
                        <View key={s.memberId} style={styles.splitRow}>
                            <View style={[styles.splitDot, { backgroundColor: mem?.avatarColor ?? COLORS.primary }]} />
                            <Text style={styles.splitName}>{s.memberId === currentUserId ? "You" : mem?.name ?? s.memberId}</Text>
                            <Text style={styles.splitAmt}>${s.amount.toFixed(2)}</Text>
                            {s.settled && <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />}
                        </View>
                    );
                })}
                <Text style={styles.bubbleTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
            </View>
        </View>
    );
}

// ─── Bubble: Settlement ───────────────────────────────────────────────────────

function SettleBubble({ msg, members }: { msg: Message; members: Member[] }) {
    const from = members.find((m) => m.id === msg.senderId);
    return (
        <View style={styles.settleMsgRow}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.settleMsgText}>
                {from?.name ?? "Someone"} settled ${msg.amount?.toFixed(2)}
            </Text>
        </View>
    );
}

// ─── Bubble: Text ─────────────────────────────────────────────────────────────

function TextBubble({
    msg, members, currentUserId,
}: { msg: Message; members: Member[]; currentUserId: string }) {
    const isMe = msg.senderId === currentUserId;
    const sender = members.find((m) => m.id === msg.senderId);
    return (
        <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
            {!isMe && <Avatar initials={sender?.initials ?? "??"} color={sender?.avatarColor ?? COLORS.primary} size={30} />}
            <View style={[styles.textBubble, isMe && styles.textBubbleMe]}>
                <Text style={[styles.textBubbleContent, isMe && { color: "#fff" }]}>{msg.content}</Text>
                <Text style={[styles.bubbleTime, isMe && { color: "rgba(255,255,255,0.6)" }]}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
            </View>
        </View>
    );
}

// ─── Split Confirm Panel ──────────────────────────────────────────────────────

function SplitConfirm({
    amount, description, members, currentUserId, onConfirm, onCancel,
}: {
    amount: number;
    description: string;
    members: Member[];
    currentUserId: string;
    onConfirm: (splits: Split[]) => void;
    onCancel: () => void;
}) {
    const [involved, setInvolved] = useState<Record<string, boolean>>(
        Object.fromEntries(members.map((m) => [m.id, true]))
    );
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    }, []);

    const count = Object.values(involved).filter(Boolean).length;
    const perPerson = count > 0 ? amount / count : 0;

    const toggle = (id: string) => {
        if (id === currentUserId) return;
        setInvolved((p) => ({ ...p, [id]: !p[id] }));
    };

    const confirm = () => {
        const splits: Split[] = members.filter((m) => involved[m.id]).map((m) => ({
            memberId: m.id,
            amount: parseFloat(perPerson.toFixed(2)),
            settled: false,
        }));
        onConfirm(splits);
    };

    return (
        <Animated.View style={[styles.splitPanel, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.splitPanelHandle} />
            <Text style={styles.splitPanelTitle}>Split ${amount.toFixed(2)}</Text>
            <Text style={styles.splitPanelDesc}>"{description}"</Text>
            <Text style={styles.splitPanelPer}>${perPerson.toFixed(2)} each · {count} people</Text>

            <View style={styles.memberToggles}>
                {members.map((m) => (
                    <TouchableOpacity
                        key={m.id}
                        onPress={() => toggle(m.id)}
                        style={[styles.memberToggle, involved[m.id] && styles.memberToggleOn, m.id === currentUserId && { opacity: 0.6 }]}
                        activeOpacity={0.8}
                    >
                        <Avatar initials={m.initials} color={m.avatarColor} size={32} />
                        <Text style={styles.memberToggleName}>{m.id === currentUserId ? "You" : m.name.split(" ")[0]}</Text>
                        <View style={[styles.toggleCheck, involved[m.id] && styles.toggleCheckOn]}>
                            {involved[m.id] && <Ionicons name="checkmark" size={10} color="#fff" />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.splitPanelBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={confirm} activeOpacity={0.85}>
                    <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.confirmBtnGrad}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.confirmBtnText}>Add Expense</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Step = "amount" | "description";

export default function GroupChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const navigation = useNavigation();
    const { getGroup, getGroupMessages, addExpense, addMessage, currentUserId } = useAppStore();

    const group = getGroup(id!);
    // const messages = useAppStore((s) => s.getGroupMessages(id!));
    const rawMessages = useAppStore((s) => s.messages); // Pull raw data

    const messages = React.useMemo(() => {
        return rawMessages
            .filter((m) => m.groupId === id)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [rawMessages, id]); // Only recalculates if rawMessages or id changes

    const [step, setStep] = useState<Step>("amount");
    const [amountText, setAmountText] = useState("");
    const [descText, setDescText] = useState("");
    const [pendingAmount, setPendingAmount] = useState<number | null>(null);
    const [showSplitPanel, setShowSplitPanel] = useState(false);

    const listRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);
    const stepAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
    }, [messages.length]);

    const animateStep = () => {
        Animated.sequence([
            Animated.timing(stepAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
            Animated.timing(stepAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]).start();
    };

    if (!group) return null;

    const handleAmountNext = () => {
        const val = parseFloat(amountText.replace(/[^0-9.]/g, ""));
        if (isNaN(val) || val <= 0) { Alert.alert("Invalid amount", "Enter a valid number."); return; }
        setPendingAmount(val);
        animateStep();
        setStep("description");
        setAmountText("");
        setTimeout(() => inputRef.current?.focus(), 200);
    };

    const handleDescNext = () => {
        if (!descText.trim()) { Alert.alert("Add description", "What was this expense for?"); return; }
        setShowSplitPanel(true);
        Keyboard.dismiss();
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            router.back();
        } else {
            // If there's no history, send them to the main tabs/home
            router.replace("/(tabs)");
        }
    };

    const handleConfirm = (splits: Split[]) => {
        const now = new Date().toISOString();
        addExpense(id!, {
            groupId: id!,
            title: descText.trim(),
            amount: pendingAmount!,
            paidById: currentUserId,
            date: now.split("T")[0],
            category: "Other",
            emoji: "💰",
            splits,
        });
        addMessage({
            groupId: id!,
            senderId: currentUserId,
            type: "expense",
            amount: pendingAmount!,
            description: descText.trim(),
            splits,
            timestamp: now,
        });
        setStep("amount"); setDescText(""); setPendingAmount(null); setShowSplitPanel(false);
    };

    const handleCancel = () => {
        setShowSplitPanel(false);
        setStep("amount");
        setPendingAmount(null);
        setDescText("");
    };

    const inputShake = stepAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 4] });

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
            <LinearGradient colors={GRAD} style={styles.header}>
                <SafeAreaView edges={["top"]}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.headerCenter}
                            onPress={() => router.push(`/groups/details?id=${id}`)}
                        >
                            <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
                            <View>
                                <Text style={styles.headerTitle}>{group.name}</Text>
                                <Text style={styles.headerSub}>{group.members.length} members · tap to view</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.push(`/groups/settle?id=${id}`)}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.body}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                {/* Chat list */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(m) => m.id}
                    contentContainerStyle={styles.msgList}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        if (item.type === "expense") return <ExpenseBubble msg={item} members={group.members} currentUserId={currentUserId} />;
                        if (item.type === "settlement") return <SettleBubble msg={item} members={group.members} />;
                        return <TextBubble msg={item} members={group.members} currentUserId={currentUserId} />;
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyMsg}>
                            <Text style={{ fontSize: 40 }}>💬</Text>
                            <Text style={styles.emptyMsgText}>No expenses yet. Add the first one!</Text>
                        </View>
                    }
                />

                {/* Split panel */}
                {showSplitPanel && pendingAmount !== null && (
                    <SplitConfirm
                        amount={pendingAmount}
                        description={descText}
                        members={group.members}
                        currentUserId={currentUserId}
                        onConfirm={handleConfirm}
                        onCancel={handleCancel}
                    />
                )}

                {/* Input bar */}
                {!showSplitPanel && (
                    <View style={styles.inputBar}>
                        {/* Step dots */}
                        <View style={styles.stepDots}>
                            <View style={[styles.stepDot, step === "amount" && styles.stepDotActive]} />
                            <View style={[styles.stepDot, step === "description" && styles.stepDotActive]} />
                            <Text style={styles.stepHint}>
                                {step === "amount" ? "How much was it?" : "What was it for?"}
                            </Text>
                        </View>

                        <Animated.View style={[styles.inputRow, { transform: [{ translateX: inputShake }] }]}>
                            {step === "amount" ? (
                                <Text style={styles.inputPrefix}>$</Text>
                            ) : (
                                <View style={styles.amountTag}>
                                    <Text style={styles.amountTagText}>${pendingAmount?.toFixed(2)}</Text>
                                </View>
                            )}

                            <TextInput
                                ref={inputRef}
                                style={styles.input}
                                placeholder={step === "amount" ? "0.00" : "Coffee, dinner, hotel..."}
                                placeholderTextColor={COLORS.textMuted}
                                value={step === "amount" ? amountText : descText}
                                onChangeText={step === "amount" ? setAmountText : setDescText}
                                keyboardType={step === "amount" ? "decimal-pad" : "default"}
                                returnKeyType="next"
                                onSubmitEditing={step === "amount" ? handleAmountNext : handleDescNext}
                                autoFocus={step === "description"}
                            />

                            <TouchableOpacity
                                onPress={step === "amount" ? handleAmountNext : handleDescNext}
                                style={styles.sendBtn}
                                activeOpacity={0.85}
                            >
                                <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtnGrad}>
                                    <Ionicons name={step === "amount" ? "arrow-forward" : "checkmark"} size={18} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                )}
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    header: {
        paddingBottom: SPACE.xl,
        paddingHorizontal: SPACE.lg,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: SPACE.xs,
        gap: SPACE.md,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center", justifyContent: "center",
    },
    headerCenter: {
        flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm,
    },
    headerTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: "#fff" },
    headerSub: { fontSize: FONT.xs, color: "rgba(255,255,255,0.65)" },
    body: {
        flex: 1, backgroundColor: COLORS.bg,
        borderTopLeftRadius: RADIUS.xxl + 4,
        borderTopRightRadius: RADIUS.xxl + 4,
        marginTop: -RADIUS.xxl,
        overflow: "hidden",
    },
    msgList: {
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.lg,
        paddingBottom: SPACE.sm,
        gap: SPACE.sm,
    },
    bubbleWrap: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: SPACE.sm,
        marginBottom: SPACE.sm,
    },
    bubbleWrapRight: { flexDirection: "row-reverse" },
    expBubble: {
        flex: 1,
        maxWidth: "80%",
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        borderBottomLeftRadius: RADIUS.xs,
        padding: SPACE.md,
        ...SHADOW.sm,
    },
    expBubbleMe: {
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xs,
        backgroundColor: "#FFF3E0",
    },
    expBubbleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACE.sm,
    },
    expBubbleTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.textPrimary, flex: 1 },
    expBubbleAmt: { fontSize: FONT.lg, fontWeight: FONT.black, color: COLORS.primary },
    splitRow: { flexDirection: "row", alignItems: "center", gap: SPACE.sm, paddingVertical: 2 },
    splitDot: { width: 6, height: 6, borderRadius: 3 },
    splitName: { flex: 1, fontSize: FONT.xs, color: COLORS.textSecondary },
    splitAmt: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textPrimary },
    bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: SPACE.xs, textAlign: "right" },
    textBubble: {
        maxWidth: "78%",
        backgroundColor: "#fff",
        borderRadius: RADIUS.xl,
        borderBottomLeftRadius: RADIUS.xs,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        ...SHADOW.sm,
    },
    textBubbleMe: {
        borderBottomLeftRadius: RADIUS.xl,
        borderBottomRightRadius: RADIUS.xs,
        backgroundColor: COLORS.primary,
    },
    textBubbleContent: { fontSize: FONT.base, color: COLORS.textPrimary },
    settleMsgRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: SPACE.xs,
        paddingVertical: SPACE.sm,
    },
    settleMsgText: { fontSize: FONT.sm, color: COLORS.success, fontWeight: FONT.semibold },
    emptyMsg: {
        alignItems: "center",
        paddingVertical: 60,
        gap: SPACE.md,
    },
    emptyMsgText: {
        fontSize: FONT.base,
        color: COLORS.textMuted,
        textAlign: "center",
    },
    splitPanel: {
        backgroundColor: "#fff",
        borderTopLeftRadius: RADIUS.xxl,
        borderTopRightRadius: RADIUS.xxl,
        padding: SPACE.xl,
        ...SHADOW.lg,
    },
    splitPanelHandle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: "center",
        marginBottom: SPACE.lg,
    },
    splitPanelTitle: {
        fontSize: FONT.xxl, fontWeight: FONT.black, color: COLORS.textPrimary, letterSpacing: -0.5,
    },
    splitPanelDesc: {
        fontSize: FONT.base, color: COLORS.textSecondary, marginTop: 2, fontStyle: "italic",
    },
    splitPanelPer: {
        fontSize: FONT.sm, color: COLORS.primary, fontWeight: FONT.bold, marginTop: SPACE.sm, marginBottom: SPACE.lg,
    },
    memberToggles: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.lg },
    memberToggle: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.lg,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        gap: SPACE.sm,
        borderWidth: 2,
        borderColor: "transparent",
    },
    memberToggleOn: { borderColor: COLORS.primary, backgroundColor: "#FFF3E0" },
    memberToggleName: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textPrimary, flex: 1 },
    toggleCheck: {
        width: 18, height: 18, borderRadius: 9,
        borderWidth: 2, borderColor: COLORS.border,
        alignItems: "center", justifyContent: "center",
    },
    toggleCheckOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    splitPanelBtns: { flexDirection: "row", gap: SPACE.md },
    cancelBtn: {
        flex: 1, paddingVertical: SPACE.md, borderRadius: RADIUS.lg,
        borderWidth: 1.5, borderColor: COLORS.border,
        alignItems: "center", justifyContent: "center",
    },
    cancelBtnText: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.textSecondary },
    confirmBtn: { flex: 2, borderRadius: RADIUS.lg, overflow: "hidden" },
    confirmBtnGrad: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        paddingVertical: SPACE.md, gap: SPACE.sm,
    },
    confirmBtnText: { color: "#fff", fontSize: FONT.base, fontWeight: FONT.bold },
    inputBar: {
        backgroundColor: "#fff",
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.sm,
        paddingBottom: SPACE.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    stepDots: {
        flexDirection: "row",
        alignItems: "center",
        gap: SPACE.xs,
        marginBottom: SPACE.sm,
    },
    stepDot: {
        width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border,
        transition: "all 0.3s",
    },
    stepDotActive: { width: 20, backgroundColor: COLORS.primary },
    stepHint: { fontSize: FONT.xs, color: COLORS.textMuted, marginLeft: SPACE.xs },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.bg,
        borderRadius: RADIUS.xl,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        gap: SPACE.sm,
    },
    inputPrefix: { fontSize: FONT.xl, fontWeight: FONT.black, color: COLORS.primary },
    amountTag: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACE.sm,
        paddingVertical: 3,
        borderRadius: RADIUS.sm,
    },
    amountTagText: { fontSize: FONT.sm, color: "#fff", fontWeight: FONT.bold },
    input: { flex: 1, fontSize: FONT.lg, color: COLORS.textPrimary, fontWeight: FONT.medium },
    sendBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
    sendBtnGrad: {
        width: 38, height: 38, alignItems: "center", justifyContent: "center",
    },
});


// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { ArrowLeft, Info, Send, X } from 'lucide-react-native';
// import React, { useRef, useState } from 'react';
// import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function GroupChatScreen() {
//     const router = useRouter();
//     const { id } = useLocalSearchParams();
//     const scrollViewRef = useRef<ScrollView>(null);

//     // 1. Create a ref for the TextInput
//     const inputRef = useRef<TextInput>(null);

//     const [inputStep, setInputStep] = useState<'amount' | 'text'>('amount');
//     const [tempAmount, setTempAmount] = useState('');
//     const [tempText, setTempText] = useState('');

//     const handleSend = () => {
//         if (inputStep === 'amount' && tempAmount) {
//             // 2. Switch step and force keyboard refresh
//             setInputStep('text');

//             // We blur and refocus after a tiny delay to force the OS to change keyboard type
//             inputRef.current?.blur();
//             setTimeout(() => {
//                 inputRef.current?.focus();
//             }, 100);

//         } else if (inputStep === 'text' && tempText) {
//             console.log(`Final: $${tempAmount} for ${tempText}`);
//             resetInput();
//             scrollViewRef.current?.scrollToEnd({ animated: true });
//         }
//     };

//     const resetInput = () => {
//         setTempAmount('');
//         setTempText('');
//         setInputStep('amount');
//         // Ensure we go back to numeric keyboard on reset
//         inputRef.current?.blur();
//         setTimeout(() => inputRef.current?.focus(), 100);
//     };

//     return (
//         <SafeAreaView className="flex-1 bg-transparent">
//             <KeyboardAvoidingView
//                 behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//                 className="flex-1"
//             >
//                 {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
//                 <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
//                     <View className="flex-row items-center">
//                         <TouchableOpacity onPress={() => router.back()} className="mr-3">
//                             <ArrowLeft color="white" size={24} />
//                         </TouchableOpacity>
//                         <View>
//                             <Text className="text-white text-lg font-bold">{id || 'Group Chat'}</Text>
//                             <Text className="text-white/70 text-xs font-medium">3 members active</Text>
//                         </View>
//                     </View>
//                     <TouchableOpacity onPress={() => router.push('/group/details')} className="bg-white/20 p-2 rounded-xl">
//                         <Info color="white" size={20} />
//                     </TouchableOpacity>
//                 </View>

//                 {/* 2. Chat Area */}
//                 <ScrollView
//                     ref={scrollViewRef}
//                     className="flex-1 bg-transparent px-4"
//                     showsVerticalScrollIndicator={false}
//                 >
//                     {/* Example of the Calculated Message Result */}
//                     <View className="flex-row items-end my-6">
//                         <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-8 h-8 rounded-full mr-2" />
//                         <View className="bg-white p-4 rounded-3xl rounded-bl-none shadow-sm max-w-[85%] border border-gray-100">
//                             <Text className="text-[#FF7A51] font-bold text-[10px] uppercase mb-1">Prasun</Text>
//                             <Text className="text-gray-900 text-lg font-bold">$20 for Petrol ⛽</Text>

//                             <View className="mt-4 pt-3 border-t border-gray-100">
//                                 <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2">Are you in?</Text>
//                                 <View className="flex-row gap-2">
//                                     <TouchableOpacity className="bg-green-500 py-3 rounded-2xl flex-1 items-center shadow-sm">
//                                         <Text className="text-white font-bold">YES</Text>
//                                     </TouchableOpacity>
//                                     <TouchableOpacity className="bg-gray-100 py-3 rounded-2xl flex-1 items-center">
//                                         <Text className="text-gray-500 font-bold">NO</Text>
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>
//                         </View>
//                     </View>
//                 </ScrollView>

//                 {/* 3. INTELLIGENT INPUT AREA - Hardcoded Backgrounds */}
//                 <View className="p-4 bg-transparent">
//                     {/* Amount Chip Indicator - Hardcoded: bg-orange-100 */}
//                     {inputStep === 'text' && (
//                         <View className="flex-row justify-center mb-2">
//                             <View className="bg-orange-100 px-4 py-1 rounded-full flex-row items-center border border-orange-200">
//                                 <Text className="text-[#FF7A51] font-bold text-xs">${tempAmount}</Text>
//                                 <TouchableOpacity onPress={resetInput} className="ml-2">
//                                     <X color="#FF7A51" size={12} />
//                                 </TouchableOpacity>
//                             </View>
//                         </View>
//                     )}

//                     <View className="flex-row items-center bg-white rounded-[32px] px-4 py-2 shadow-2xl border border-gray-100">
//                         <TextInput
//                             placeholder={inputStep === 'amount' ? "Enter Amount (e.g. 20)" : "What for? (e.g. Petrol)"}
//                             keyboardType={inputStep === 'amount' ? "numeric" : "default"}
//                             value={inputStep === 'amount' ? tempAmount : tempText}
//                             onChangeText={inputStep === 'amount' ? setTempAmount : setTempText}
//                             autoFocus={true}
//                             className="flex-1 h-14 text-gray-800 text-lg px-2 font-medium"
//                             placeholderTextColor="#9CA3AF"
//                         />

//                         <TouchableOpacity
//                             onPress={handleSend}
//                             disabled={inputStep === 'amount' ? !tempAmount : !tempText}
//                             className={`p-4 rounded-full ${(!tempAmount && inputStep === 'amount') ? 'bg-gray-200' : 'bg-black'}`}
//                         >
//                             <Send color="white" size={20} />
//                         </TouchableOpacity>
//                     </View>
//                 </View>
//             </KeyboardAvoidingView>
//         </SafeAreaView>
//     );
// }

