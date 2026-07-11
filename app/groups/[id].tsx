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
import { GroupChatSkeleton } from "../../components/Skeleton";
import { Avatar } from "../../components/ui";
import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { ApiMessage, expensesApi, messagesApi } from "../../lib/api";
import { useAppContext } from "../../lib/useAppContext";
import { useAuthStore } from "../../store/useAuthStore";
import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

// Safe socket helpers — no-op if socket.io-client not installed yet
let joinGroup = (_id: string) => { };
let leaveGroup = (_id: string) => { };
try {
  const socket = require("../../lib/socket");
  joinGroup = socket.joinGroup;
  leaveGroup = socket.leaveGroup;
} catch { }


// ─── Expense Bubble ───────────────────────────────────────────────────────────

function ExpenseBubble({
  msg, myUserId, tc, fmt,
}: {
  msg: ApiMessage; myUserId: string;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
}) {
  const isMe = msg.senderId === myUserId;
  const expense = msg.expense;

  // Participation status for current user
  const myParticipation = expense?.participants.find((p) => p.userId === myUserId);
  const needsResponse = expense?.status === "pending" && myParticipation?.participationStatus === "invited" && !isMe;

  const handleParticipate = async (status: "yes" | "no") => {
    if (!expense) return;
    const res = await expensesApi.participate(expense.id, status);
    if (res.ok) {
      useGroupStore.getState().fetchExpenses(msg.groupId);
    }
  };

  return (
    <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
      {!isMe && (
        <Avatar
          initials={getInitials(msg.sender.name)}
          color={getAvatarColor(msg.senderId)}
          size={30}
        />
      )}
      <View style={[styles.expBubble, { backgroundColor: isMe ? tc.cardAlt : tc.card }]}>
        <View style={styles.expBubbleHeader}>
          <Text style={[styles.expBubbleTitle, { color: tc.textPrimary }]}>
            💰 {msg.description ?? expense?.title ?? "Expense"}
          </Text>
          <Text style={styles.expBubbleAmt}>
            {fmt(msg.amountSnapshot ?? parseFloat(String(expense?.totalAmount ?? 0)))}
          </Text>
        </View>

        {/* Participants */}
        {expense?.participants && expense.participants.length > 0 && (
          <View style={styles.participantsRow}>
            {expense.participants.map((p) => (
              <View key={p.userId} style={styles.participantBadge}>
                <View style={[
                  styles.participantDot,
                  {
                    backgroundColor:
                      p.participationStatus === "yes" ? COLORS.success :
                        p.participationStatus === "no" ? COLORS.danger :
                          tc.border,
                  },
                ]} />
                <Text style={[styles.participantName, { color: tc.textSecondary }]}>
                  {p.userId === myUserId ? "You" : p.user.name.split(" ")[0]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Status badge */}
        {expense?.status === "locked" && (
          <View style={styles.lockedBadge}>
            <Ionicons name="lock-closed" size={11} color={COLORS.primary} />
            <Text style={styles.lockedText}>Split locked</Text>
          </View>
        )}

        {/* ARE YOU IN? buttons */}
        {needsResponse && (
          <View style={styles.participateRow}>
            <Text style={[styles.participateQuestion, { color: tc.textSecondary }]}>Are you in?</Text>
            <View style={styles.participateBtns}>
              <TouchableOpacity
                style={[styles.participateBtn, { backgroundColor: COLORS.success }]}
                onPress={() => handleParticipate("yes")}
              >
                <Text style={styles.participateBtnText}>Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.participateBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => handleParticipate("no")}
              >
                <Text style={styles.participateBtnText}>No</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={[styles.bubbleTime, { color: tc.textMuted }]}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

// ─── Text Bubble ─────────────────────────────────────────────────────────────

function TextBubble({
  msg, myUserId, tc,
}: {
  msg: ApiMessage; myUserId: string;
  tc: ReturnType<typeof useAppContext>["tc"];
}) {
  const isMe = msg.senderId === myUserId;
  return (
    <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
      {!isMe && (
        <Avatar
          initials={getInitials(msg.sender.name)}
          color={getAvatarColor(msg.senderId)}
          size={30}
        />
      )}
      <View style={[
        styles.textBubble,
        { backgroundColor: isMe ? COLORS.primary : tc.card },
      ]}>
        <Text style={[styles.textBubbleContent, { color: isMe ? "#fff" : tc.textPrimary }]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : tc.textMuted }]}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  );
}

// ─── System Bubble ────────────────────────────────────────────────────────────

function SystemBubble({ msg, tc, fmt }: {
  msg: ApiMessage;
  tc: ReturnType<typeof useAppContext>["tc"];
  fmt: (n: number) => string;
}) {
  return (
    <View style={styles.settleMsgRow}>
      <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
      <Text style={styles.settleMsgText}>{msg.content ?? "Settlement recorded"}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Step = "amount" | "description";

export default function GroupChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { tc, fmt } = useAppContext();

  const { groups, messages, fetchMessages, fetchExpenses, loadingMessages } = useGroupStore();
  const group = groups.find((g) => g.id === id);
  const msgs = (messages[id!] ?? []).slice().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const myUserId = user?.id ?? "";

  const [step, setStep] = useState<Step>("amount");
  const [amountText, setAmountText] = useState("");
  const [descText, setDescText] = useState("");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!id) return;
    fetchMessages(id);
    fetchExpenses(id);
    joinGroup(id);
    return () => { leaveGroup(id); };
  }, [id]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
  }, [msgs.length]);

  if (!group) return null;
  if (loadingMessages[id!] && msgs.length === 0) return <GroupChatSkeleton />;

  const animateStep = () => {
    Animated.sequence([
      Animated.timing(stepAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(stepAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleAmountNext = () => {
    const val = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    if (isNaN(val) || val <= 0) { Alert.alert("Invalid amount", "Enter a valid number."); return; }
    setPendingAmount(val);
    animateStep();
    setStep("description");
    setAmountText("");
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleDescNext = async () => {
    if (!descText.trim()) { Alert.alert("Add description", "What was this expense for?"); return; }
    if (pendingAmount === null) return;
    setSending(true);
    Keyboard.dismiss();

    const res = await messagesApi.sendExpense(id!, {
      amount: pendingAmount,
      description: descText.trim(),
    });

    setSending(false);
    if (res.ok) {
      // Add message optimistically with a temp flag
      // Socket will also send it — deduplicate by id in store
      useGroupStore.getState().prependMessage(id!, res.data.message);
      // Fetch full expense data so participants show immediately
      if (res.data.expense) {
        useGroupStore.getState().addExpenseToCache(id!, res.data.expense);
      }
      // Refetch expenses to get full participant list
      setTimeout(() => {
        useGroupStore.getState().fetchExpenses(id!);
      }, 800);
      setStep("amount");
      setDescText("");
      setPendingAmount(null);
    } else {
      Alert.alert("Error", res.error);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const inputShake = stepAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 4] });

  return (
    <View style={[styles.root, { backgroundColor: tc.bg }]}>
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
              <Text style={{ fontSize: 24 }}>{group.iconEmoji ?? "👥"}</Text>
              <View>
                <Text style={styles.headerTitle}>{group.name}</Text>
                <Text style={styles.headerSub}>{group.members.length} members · tap to view</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.push(`/groups/settle?id=${id}`)}>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={[styles.body, { backgroundColor: tc.bg }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={msgs}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            if (item.messageType === "expense")
              return <ExpenseBubble msg={item} myUserId={myUserId} tc={tc} fmt={fmt} />;
            if (item.messageType === "system")
              return <SystemBubble msg={item} tc={tc} fmt={fmt} />;
            return <TextBubble msg={item} myUserId={myUserId} tc={tc} />;
          }}
          ListEmptyComponent={
            <View style={styles.emptyMsg}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={[styles.emptyMsgText, { color: tc.textMuted }]}>
                No expenses yet. Add the first one!
              </Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: tc.card, borderTopColor: tc.border }]}>
          <View style={styles.stepDots}>
            <View style={[styles.stepDot, { backgroundColor: tc.border }, step === "amount" && styles.stepDotActive]} />
            <View style={[styles.stepDot, { backgroundColor: tc.border }, step === "description" && styles.stepDotActive]} />
            <Text style={[styles.stepHint, { color: tc.textMuted }]}>
              {step === "amount" ? "How much was it?" : "What was it for?"}
            </Text>
          </View>

          <Animated.View style={[styles.inputRow, { backgroundColor: tc.bg, transform: [{ translateX: inputShake }] }]}>
            {step === "amount" ? (
              <Text style={styles.inputPrefix}>$</Text>
            ) : (
              <View style={styles.amountTag}>
                <Text style={styles.amountTagText}>${pendingAmount?.toFixed(2)}</Text>
              </View>
            )}
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: tc.textPrimary }]}
              placeholder={step === "amount" ? "0.00" : "Coffee, dinner, hotel..."}
              placeholderTextColor={tc.textMuted}
              value={step === "amount" ? amountText : descText}
              onChangeText={step === "amount" ? setAmountText : setDescText}
              keyboardType={step === "amount" ? "decimal-pad" : "default"}
              returnKeyType="next"
              onSubmitEditing={step === "amount" ? handleAmountNext : handleDescNext}
              autoFocus={step === "description"}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={step === "amount" ? handleAmountNext : handleDescNext}
              style={styles.sendBtn}
              activeOpacity={0.85}
              disabled={sending}
            >
              <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtnGrad}>
                <Ionicons
                  name={sending ? "hourglass-outline" : step === "amount" ? "arrow-forward" : "checkmark"}
                  size={18} color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.lg },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: SPACE.xs, gap: SPACE.md },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
  headerTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: "#fff" },
  headerSub: { fontSize: FONT.xs, color: "rgba(255,255,255,0.65)" },
  body: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl, overflow: "hidden" },
  msgList: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm, gap: SPACE.sm },
  bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: SPACE.sm, marginBottom: SPACE.sm },
  bubbleWrapRight: { flexDirection: "row-reverse" },
  expBubble: {
    flex: 1, maxWidth: "82%",
    borderRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.sm,
    padding: SPACE.md, ...SHADOW.sm,
  },
  expBubbleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm },
  expBubbleTitle: { fontSize: FONT.base, fontWeight: FONT.bold, flex: 1 },
  expBubbleAmt: { fontSize: FONT.lg, fontWeight: FONT.black, color: COLORS.primary },
  participantsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.sm },
  participantBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  participantDot: { width: 7, height: 7, borderRadius: 4 },
  participantName: { fontSize: FONT.xs },
  lockedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#FFF3E0", alignSelf: "flex-start",
    paddingHorizontal: SPACE.sm, paddingVertical: 3,
    borderRadius: RADIUS.pill, marginBottom: SPACE.sm,
  },
  lockedText: { fontSize: 11, color: COLORS.primary, fontWeight: FONT.bold },
  participateRow: { marginTop: SPACE.sm },
  participateQuestion: { fontSize: FONT.xs, fontWeight: FONT.semibold, marginBottom: SPACE.xs },
  participateBtns: { flexDirection: "row", gap: SPACE.sm },
  participateBtn: {
    flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg,
    alignItems: "center",
  },
  participateBtnText: { color: "#fff", fontSize: FONT.sm, fontWeight: FONT.bold },
  bubbleTime: { fontSize: 10, marginTop: SPACE.xs, textAlign: "right" },
  textBubble: {
    maxWidth: "78%",
    borderRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.sm,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, ...SHADOW.sm,
  },
  textBubbleContent: { fontSize: FONT.base },
  settleMsgRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: SPACE.xs, paddingVertical: SPACE.sm,
  },
  settleMsgText: { fontSize: FONT.sm, color: COLORS.success, fontWeight: FONT.semibold },
  emptyMsg: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
  emptyMsgText: { fontSize: FONT.base, textAlign: "center" },
  inputBar: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: SPACE.lg, borderTopWidth: 1 },
  stepDots: { flexDirection: "row", alignItems: "center", gap: SPACE.xs, marginBottom: SPACE.sm },
  stepDot: { width: 6, height: 6, borderRadius: 3 },
  stepDotActive: { width: 20, backgroundColor: COLORS.primary },
  stepHint: { fontSize: FONT.xs, marginLeft: SPACE.xs },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, gap: SPACE.sm },
  inputPrefix: { fontSize: FONT.xl, fontWeight: FONT.black, color: COLORS.primary },
  amountTag: { backgroundColor: COLORS.primary, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
  amountTagText: { fontSize: FONT.sm, color: "#fff", fontWeight: FONT.bold },
  input: { flex: 1, fontSize: FONT.lg, fontWeight: FONT.medium },
  sendBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
  sendBtnGrad: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
});



// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
// import React, { useEffect, useRef, useState } from "react";
// import {
//     Alert,
//     Animated,
//     FlatList,
//     Keyboard,
//     KeyboardAvoidingView,
//     Platform,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { GroupChatSkeleton } from "../../components/Skeleton";
// import { Avatar } from "../../components/ui";
// import { COLORS, FONT, GRAD, GRAD_SHORT, RADIUS, SHADOW, SPACE } from "../../constants/theme";
// import { ApiMessage, expensesApi, messagesApi } from "../../lib/api";
// import { joinGroup, leaveGroup } from "../../lib/socket";
// import { useAppContext } from "../../lib/useAppContext";
// import { useAuthStore } from "../../store/useAuthStore";
// import { getAvatarColor, getInitials, useGroupStore } from "../../store/useGroupStore";

// // ─── Expense Bubble ───────────────────────────────────────────────────────────

// function ExpenseBubble({
//   msg, myUserId, tc, fmt,
// }: {
//   msg: ApiMessage; myUserId: string;
//   tc: ReturnType<typeof useAppContext>["tc"];
//   fmt: (n: number) => string;
// }) {
//   const isMe   = msg.senderId === myUserId;
//   const expense = msg.expense;

//   // Participation status for current user
//   const myParticipation = expense?.participants.find((p) => p.userId === myUserId);
//   const needsResponse   = expense?.status === "pending" && myParticipation?.participationStatus === "invited" && !isMe;

//   const handleParticipate = async (status: "yes" | "no") => {
//     if (!expense) return;
//     const res = await expensesApi.participate(expense.id, status);
//     if (res.ok) {
//       useGroupStore.getState().fetchExpenses(msg.groupId);
//     }
//   };

//   return (
//     <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
//       {!isMe && (
//         <Avatar
//           initials={getInitials(msg.sender.name)}
//           color={getAvatarColor(msg.senderId)}
//           size={30}
//         />
//       )}
//       <View style={[styles.expBubble, { backgroundColor: isMe ? tc.cardAlt : tc.card }]}>
//         <View style={styles.expBubbleHeader}>
//           <Text style={[styles.expBubbleTitle, { color: tc.textPrimary }]}>
//             💰 {msg.description ?? expense?.title ?? "Expense"}
//           </Text>
//           <Text style={styles.expBubbleAmt}>
//             {fmt(msg.amountSnapshot ?? parseFloat(String(expense?.totalAmount ?? 0)))}
//           </Text>
//         </View>

//         {/* Participants */}
//         {expense?.participants && expense.participants.length > 0 && (
//           <View style={styles.participantsRow}>
//             {expense.participants.map((p) => (
//               <View key={p.userId} style={styles.participantBadge}>
//                 <View style={[
//                   styles.participantDot,
//                   {
//                     backgroundColor:
//                       p.participationStatus === "yes" ? COLORS.success :
//                       p.participationStatus === "no"  ? COLORS.danger  :
//                       tc.border,
//                   },
//                 ]} />
//                 <Text style={[styles.participantName, { color: tc.textSecondary }]}>
//                   {p.userId === myUserId ? "You" : p.user.name.split(" ")[0]}
//                 </Text>
//               </View>
//             ))}
//           </View>
//         )}

//         {/* Status badge */}
//         {expense?.status === "locked" && (
//           <View style={styles.lockedBadge}>
//             <Ionicons name="lock-closed" size={11} color={COLORS.primary} />
//             <Text style={styles.lockedText}>Split locked</Text>
//           </View>
//         )}

//         {/* ARE YOU IN? buttons */}
//         {needsResponse && (
//           <View style={styles.participateRow}>
//             <Text style={[styles.participateQuestion, { color: tc.textSecondary }]}>Are you in?</Text>
//             <View style={styles.participateBtns}>
//               <TouchableOpacity
//                 style={[styles.participateBtn, { backgroundColor: COLORS.success }]}
//                 onPress={() => handleParticipate("yes")}
//               >
//                 <Text style={styles.participateBtnText}>Yes</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.participateBtn, { backgroundColor: COLORS.danger }]}
//                 onPress={() => handleParticipate("no")}
//               >
//                 <Text style={styles.participateBtnText}>No</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         )}

//         <Text style={[styles.bubbleTime, { color: tc.textMuted }]}>
//           {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//         </Text>
//       </View>
//     </View>
//   );
// }

// // ─── Text Bubble ─────────────────────────────────────────────────────────────

// function TextBubble({
//   msg, myUserId, tc,
// }: {
//   msg: ApiMessage; myUserId: string;
//   tc: ReturnType<typeof useAppContext>["tc"];
// }) {
//   const isMe = msg.senderId === myUserId;
//   return (
//     <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
//       {!isMe && (
//         <Avatar
//           initials={getInitials(msg.sender.name)}
//           color={getAvatarColor(msg.senderId)}
//           size={30}
//         />
//       )}
//       <View style={[
//         styles.textBubble,
//         { backgroundColor: isMe ? COLORS.primary : tc.card },
//       ]}>
//         <Text style={[styles.textBubbleContent, { color: isMe ? "#fff" : tc.textPrimary }]}>
//           {msg.content}
//         </Text>
//         <Text style={[styles.bubbleTime, { color: isMe ? "rgba(255,255,255,0.6)" : tc.textMuted }]}>
//           {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
//         </Text>
//       </View>
//     </View>
//   );
// }

// // ─── System Bubble ────────────────────────────────────────────────────────────

// function SystemBubble({ msg, tc, fmt }: {
//   msg: ApiMessage;
//   tc: ReturnType<typeof useAppContext>["tc"];
//   fmt: (n: number) => string;
// }) {
//   return (
//     <View style={styles.settleMsgRow}>
//       <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
//       <Text style={styles.settleMsgText}>{msg.content ?? "Settlement recorded"}</Text>
//     </View>
//   );
// }

// // ─── Main Screen ──────────────────────────────────────────────────────────────

// type Step = "amount" | "description";

// export default function GroupChatScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router  = useRouter();
//   const navigation = useNavigation();
//   const { user } = useAuthStore();
//   const { tc, fmt } = useAppContext();

//   const { groups, messages, fetchMessages, fetchExpenses, loadingMessages } = useGroupStore();
//   const group = groups.find((g) => g.id === id);
//   const msgs  = (messages[id!] ?? []).slice().sort(
//     (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//   );

//   const myUserId = user?.id ?? "";

//   const [step, setStep]               = useState<Step>("amount");
//   const [amountText, setAmountText]   = useState("");
//   const [descText, setDescText]       = useState("");
//   const [pendingAmount, setPendingAmount] = useState<number | null>(null);
//   const [sending, setSending]         = useState(false);

//   const listRef  = useRef<FlatList>(null);
//   const inputRef = useRef<TextInput>(null);
//   const stepAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (!id) return;
//     fetchMessages(id);
//     fetchExpenses(id);
//     joinGroup(id);
//     return () => { leaveGroup(id); };
//   }, [id]);

//   useEffect(() => {
//     setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 200);
//   }, [msgs.length]);

//   if (!group) return null;
//   if (loadingMessages[id!] && msgs.length === 0) return <GroupChatSkeleton />;

//   const animateStep = () => {
//     Animated.sequence([
//       Animated.timing(stepAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
//       Animated.timing(stepAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
//     ]).start();
//   };

//   const handleAmountNext = () => {
//     const val = parseFloat(amountText.replace(/[^0-9.]/g, ""));
//     if (isNaN(val) || val <= 0) { Alert.alert("Invalid amount", "Enter a valid number."); return; }
//     setPendingAmount(val);
//     animateStep();
//     setStep("description");
//     setAmountText("");
//     setTimeout(() => inputRef.current?.focus(), 200);
//   };

//   const handleDescNext = async () => {
//     if (!descText.trim()) { Alert.alert("Add description", "What was this expense for?"); return; }
//     if (pendingAmount === null) return;
//     setSending(true);
//     Keyboard.dismiss();

//     const res = await messagesApi.sendExpense(id!, {
//       amount: pendingAmount,
//       description: descText.trim(),
//     });

//     setSending(false);
//     if (res.ok) {
//       useGroupStore.getState().prependMessage(id!, res.data.message);
//       if (res.data.expense) {
//         useGroupStore.getState().addExpenseToCache(id!, res.data.expense);
//       }
//       setStep("amount");
//       setDescText("");
//       setPendingAmount(null);
//     } else {
//       Alert.alert("Error", res.error);
//     }
//   };

//   const handleBack = () => {
//     if (navigation.canGoBack()) router.back();
//     else router.replace("/(tabs)");
//   };

//   const inputShake = stepAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 4] });

//   return (
//     <View style={[styles.root, { backgroundColor: tc.bg }]}>
//       <LinearGradient colors={GRAD} style={styles.header}>
//         <SafeAreaView edges={["top"]}>
//           <View style={styles.headerRow}>
//             <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
//               <Ionicons name="arrow-back" size={22} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.headerCenter}
//               onPress={() => router.push(`/groups/details?id=${id}`)}
//             >
//               <Text style={{ fontSize: 24 }}>{group.iconEmoji ?? "👥"}</Text>
//               <View>
//                 <Text style={styles.headerTitle}>{group.name}</Text>
//                 <Text style={styles.headerSub}>{group.members.length} members · tap to view</Text>
//               </View>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.backBtn} onPress={() => router.push(`/groups/settle?id=${id}`)}>
//               <Ionicons name="swap-horizontal" size={20} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </SafeAreaView>
//       </LinearGradient>

//       <KeyboardAvoidingView
//         style={[styles.body, { backgroundColor: tc.bg }]}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//         keyboardVerticalOffset={0}
//       >
//         <FlatList
//           ref={listRef}
//           data={msgs}
//           keyExtractor={(m) => m.id}
//           contentContainerStyle={styles.msgList}
//           showsVerticalScrollIndicator={false}
//           onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
//           renderItem={({ item }) => {
//             if (item.messageType === "expense")
//               return <ExpenseBubble msg={item} myUserId={myUserId} tc={tc} fmt={fmt} />;
//             if (item.messageType === "system")
//               return <SystemBubble msg={item} tc={tc} fmt={fmt} />;
//             return <TextBubble msg={item} myUserId={myUserId} tc={tc} />;
//           }}
//           ListEmptyComponent={
//             <View style={styles.emptyMsg}>
//               <Text style={{ fontSize: 40 }}>💬</Text>
//               <Text style={[styles.emptyMsgText, { color: tc.textMuted }]}>
//                 No expenses yet. Add the first one!
//               </Text>
//             </View>
//           }
//         />

//         {/* Input bar */}
//         <View style={[styles.inputBar, { backgroundColor: tc.card, borderTopColor: tc.border }]}>
//           <View style={styles.stepDots}>
//             <View style={[styles.stepDot, { backgroundColor: tc.border }, step === "amount"      && styles.stepDotActive]} />
//             <View style={[styles.stepDot, { backgroundColor: tc.border }, step === "description" && styles.stepDotActive]} />
//             <Text style={[styles.stepHint, { color: tc.textMuted }]}>
//               {step === "amount" ? "How much was it?" : "What was it for?"}
//             </Text>
//           </View>

//           <Animated.View style={[styles.inputRow, { backgroundColor: tc.bg, transform: [{ translateX: inputShake }] }]}>
//             {step === "amount" ? (
//               <Text style={styles.inputPrefix}>$</Text>
//             ) : (
//               <View style={styles.amountTag}>
//                 <Text style={styles.amountTagText}>${pendingAmount?.toFixed(2)}</Text>
//               </View>
//             )}
//             <TextInput
//               ref={inputRef}
//               style={[styles.input, { color: tc.textPrimary }]}
//               placeholder={step === "amount" ? "0.00" : "Coffee, dinner, hotel..."}
//               placeholderTextColor={tc.textMuted}
//               value={step === "amount" ? amountText : descText}
//               onChangeText={step === "amount" ? setAmountText : setDescText}
//               keyboardType={step === "amount" ? "decimal-pad" : "default"}
//               returnKeyType="next"
//               onSubmitEditing={step === "amount" ? handleAmountNext : handleDescNext}
//               autoFocus={step === "description"}
//               editable={!sending}
//             />
//             <TouchableOpacity
//               onPress={step === "amount" ? handleAmountNext : handleDescNext}
//               style={styles.sendBtn}
//               activeOpacity={0.85}
//               disabled={sending}
//             >
//               <LinearGradient colors={GRAD_SHORT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendBtnGrad}>
//                 <Ionicons
//                   name={sending ? "hourglass-outline" : step === "amount" ? "arrow-forward" : "checkmark"}
//                   size={18} color="#fff"
//                 />
//               </LinearGradient>
//             </TouchableOpacity>
//           </Animated.View>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   header: { paddingBottom: SPACE.xl, paddingHorizontal: SPACE.lg },
//   headerRow: { flexDirection: "row", alignItems: "center", paddingTop: SPACE.xs, gap: SPACE.md },
//   backBtn: {
//     width: 38, height: 38, borderRadius: 19,
//     backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
//   },
//   headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: SPACE.sm },
//   headerTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: "#fff" },
//   headerSub: { fontSize: FONT.xs, color: "rgba(255,255,255,0.65)" },
//   body: { flex: 1, borderTopLeftRadius: RADIUS.xxl + 4, borderTopRightRadius: RADIUS.xxl + 4, marginTop: -RADIUS.xxl, overflow: "hidden" },
//   msgList: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.lg, paddingBottom: SPACE.sm, gap: SPACE.sm },
//   bubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: SPACE.sm, marginBottom: SPACE.sm },
//   bubbleWrapRight: { flexDirection: "row-reverse" },
//   expBubble: {
//     flex: 1, maxWidth: "82%",
//     borderRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xs,
//     padding: SPACE.md, ...SHADOW.sm,
//   },
//   expBubbleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.sm },
//   expBubbleTitle: { fontSize: FONT.base, fontWeight: FONT.bold, flex: 1 },
//   expBubbleAmt: { fontSize: FONT.lg, fontWeight: FONT.black, color: COLORS.primary },
//   participantsRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm, marginBottom: SPACE.sm },
//   participantBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
//   participantDot: { width: 7, height: 7, borderRadius: 4 },
//   participantName: { fontSize: FONT.xs },
//   lockedBadge: {
//     flexDirection: "row", alignItems: "center", gap: 4,
//     backgroundColor: "#FFF3E0", alignSelf: "flex-start",
//     paddingHorizontal: SPACE.sm, paddingVertical: 3,
//     borderRadius: RADIUS.pill, marginBottom: SPACE.sm,
//   },
//   lockedText: { fontSize: 11, color: COLORS.primary, fontWeight: FONT.bold },
//   participateRow: { marginTop: SPACE.sm },
//   participateQuestion: { fontSize: FONT.xs, fontWeight: FONT.semibold, marginBottom: SPACE.xs },
//   participateBtns: { flexDirection: "row", gap: SPACE.sm },
//   participateBtn: {
//     flex: 1, paddingVertical: SPACE.sm, borderRadius: RADIUS.lg,
//     alignItems: "center",
//   },
//   participateBtnText: { color: "#fff", fontSize: FONT.sm, fontWeight: FONT.bold },
//   bubbleTime: { fontSize: 10, marginTop: SPACE.xs, textAlign: "right" },
//   textBubble: {
//     maxWidth: "78%",
//     borderRadius: RADIUS.xl, borderBottomLeftRadius: RADIUS.xs,
//     paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, ...SHADOW.sm,
//   },
//   textBubbleContent: { fontSize: FONT.base },
//   settleMsgRow: {
//     flexDirection: "row", alignItems: "center", justifyContent: "center",
//     gap: SPACE.xs, paddingVertical: SPACE.sm,
//   },
//   settleMsgText: { fontSize: FONT.sm, color: COLORS.success, fontWeight: FONT.semibold },
//   emptyMsg: { alignItems: "center", paddingVertical: 60, gap: SPACE.md },
//   emptyMsgText: { fontSize: FONT.base, textAlign: "center" },
//   inputBar: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.sm, paddingBottom: SPACE.lg, borderTopWidth: 1 },
//   stepDots: { flexDirection: "row", alignItems: "center", gap: SPACE.xs, marginBottom: SPACE.sm },
//   stepDot: { width: 6, height: 6, borderRadius: 3 },
//   stepDotActive: { width: 20, backgroundColor: COLORS.primary },
//   stepHint: { fontSize: FONT.xs, marginLeft: SPACE.xs },
//   inputRow: { flexDirection: "row", alignItems: "center", borderRadius: RADIUS.xl, paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm, gap: SPACE.sm },
//   inputPrefix: { fontSize: FONT.xl, fontWeight: FONT.black, color: COLORS.primary },
//   amountTag: { backgroundColor: COLORS.primary, paddingHorizontal: SPACE.sm, paddingVertical: 3, borderRadius: RADIUS.sm },
//   amountTagText: { fontSize: FONT.sm, color: "#fff", fontWeight: FONT.bold },
//   input: { flex: 1, fontSize: FONT.lg, fontWeight: FONT.medium },
//   sendBtn: { borderRadius: RADIUS.md, overflow: "hidden" },
//   sendBtnGrad: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
// });