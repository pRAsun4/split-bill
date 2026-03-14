import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, FadeCard, PressScale } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { computeSettlements, getNetBalance, useAppStore } from "../../store/useAppStore";

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({
  group,
  currentUserId,
  delay,
  onPress,
}: {
  group: ReturnType<typeof useAppStore.getState>["groups"][0];
  currentUserId: string;
  delay: number;
  onPress: () => void;
}) {
  const bal = getNetBalance(currentUserId, group.expenses);
  const settlements = computeSettlements(group.members, group.expenses);
  const totalSpent = group.expenses.reduce((s, e) => s + e.amount, 0);
  const isSettled = settlements.length === 0;
  const isOwed = bal.owed > bal.owes;
  const net = bal.owed - bal.owes;

  // Members excluding me
  const others = group.members.filter((m) => m.id !== currentUserId);

  // Who owes what to me (simplified for display)
  const myCredits = settlements.filter((s) => s.toId === currentUserId);
  const myDebts = settlements.filter((s) => s.fromId === currentUserId);

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={styles.card}>
          {/* Header row */}
          <View style={styles.cardHeader}>
            <View style={styles.cardEmojiBox}>
              <Text style={{ fontSize: 28 }}>{group.emoji}</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardName}>{group.name}</Text>
              <Text style={styles.cardDate}>
                {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
            <Text style={styles.cardTotal}>${totalSpent.toFixed(2)}</Text>
          </View>

          {/* Member avatars */}
          <View style={styles.memberRow}>
            {others.slice(0, 4).map((m, i) => (
              <Avatar
                key={m.id}
                initials={m.initials}
                color={m.avatarColor}
                size={28}
                style={{ marginLeft: i > 0 ? -8 : 0, borderWidth: 2, borderColor: "#fff" }}
              />
            ))}
            {others.length > 4 && (
              <View style={[styles.moreAvatar, { marginLeft: -8 }]}>
                <Text style={styles.moreAvatarText}>+{others.length - 4}</Text>
              </View>
            )}
          </View>

          {/* Credits / Debts */}
          {isSettled ? (
            <View style={styles.settledBadge}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.settledText}>Settled up</Text>
            </View>
          ) : (
            <View style={styles.debtSection}>
              {myCredits.map((c) => (
                <Text key={`${c.fromId}-${c.toId}`} style={styles.creditLine}>
                  <Text style={{ fontWeight: FONT.bold }}>{c.fromName}</Text> owes you{" "}
                  <Text style={{ color: COLORS.success, fontWeight: FONT.bold }}>${c.amount.toFixed(2)}</Text>
                </Text>
              ))}
              {myDebts.map((d) => (
                <Text key={`${d.fromId}-${d.toId}`} style={styles.debtLine}>
                  You owe <Text style={{ fontWeight: FONT.bold }}>{d.toName}</Text>{" "}
                  <Text style={{ color: COLORS.danger, fontWeight: FONT.bold }}>${d.amount.toFixed(2)}</Text>
                </Text>
              ))}

              {/* Net badge */}
              <View style={[styles.netBadge, { backgroundColor: isOwed ? "#E8F5E9" : "#FFEBEE" }]}>
                <Text style={[styles.netBadgeLabel, { color: COLORS.textSecondary }]}>
                  {isOwed ? "You are owed" : "You owe"}
                </Text>
                <Text style={[styles.netBadgeAmt, { color: isOwed ? COLORS.success : COLORS.danger }]}>
                  ${Math.abs(net).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GroupsScreen() {
  const router = useRouter();
  const { groups, currentUserId } = useAppStore();

  const sorted = [...groups].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Groups</Text>
              <Text style={styles.headerSub}>You are in {groups.length} groups.</Text>
            </View>
            <TouchableOpacity style={styles.headerAvatar} onPress={() => router.push("/profile")}>
              <Avatar initials="ME" color="rgba(255,255,255,0.25)" size={38} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sorted.map((g, i) => (
          <GroupCard
            key={g.id}
            group={g}
            currentUserId={currentUserId}
            delay={i * 70}
            onPress={() => router.push(`/groups/${g.id}`)}
          />
        ))}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingBottom: SPACE.xl + 4,
    paddingHorizontal: SPACE.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: SPACE.sm,
  },
  headerTitle: {
    fontSize: FONT.display,
    fontWeight: FONT.black,
    color: "#fff",
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: FONT.sm,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
    fontWeight: FONT.medium,
  },
  headerAvatar: {},
  scroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl + 4,
    borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -RADIUS.xxl,
  },
  scrollContent: {
    paddingTop: SPACE.xl,
    paddingHorizontal: SPACE.xl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    marginBottom: SPACE.md,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
    marginBottom: SPACE.md,
  },
  cardEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderText: { flex: 1 },
  cardName: {
    fontSize: FONT.lg,
    fontWeight: FONT.bold,
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardTotal: {
    fontSize: FONT.xl,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACE.md,
  },
  moreAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  moreAvatarText: {
    fontSize: FONT.xs,
    fontWeight: FONT.bold,
    color: COLORS.textSecondary,
  },
  settledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.xs,
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.xs,
    borderRadius: RADIUS.pill,
  },
  settledText: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
    color: COLORS.success,
  },
  debtSection: {
    gap: SPACE.xs,
  },
  creditLine: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  debtLine: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
  },
  netBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACE.md,
    paddingVertical: SPACE.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACE.xs,
  },
  netBadgeLabel: {
    fontSize: FONT.sm,
    fontWeight: FONT.medium,
  },
  netBadgeAmt: {
    fontSize: FONT.md,
    fontWeight: FONT.black,
    letterSpacing: -0.3,
  },
});




// import { useRouter } from 'expo-router';
// import React from 'react';
// import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function GroupsScreen() {
//   const router = useRouter();
//   return (
//     <SafeAreaView className="flex-1 bg-primary">
//       <ScrollView 
//         className="flex-1  px-6" 
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 140 }}
//       >
//         {/* 1. Header Section */}
//         <View className="flex-row justify-between items-center mt-4">
//           <View>
//             <Text className="text-white text-3xl font-bold">Groups</Text>
//             <Text className="text-white/70 text-sm font-medium">You are in 3 groups.</Text>
//           </View>
//           <Image 
//             source={{ uri: 'https://avatar.iran.liara.run/public/65' }} 
//             className="w-10 h-10 rounded-full border-2 border-white/30"
//           />
//         </View>

//         {/* GROUP DETAILS WILL MAP HERE FROM DB */}

//         {/* 2. Group Card - Birthday House */}
//         <TouchableOpacity
//           onPress={() => router.push('/group/Birthday-House')}
//            className="bg-white/90 dark:bg-white/10 p-5 rounded-[32px] mt-8 shadow-sm border border-white/20">
//           <View className="flex-row justify-between items-start">
//             <View className="flex-row items-center">
//               <View className="bg-red-100 p-2 rounded-xl">
//                 <Text className="text-xl">🎂</Text>
//               </View>
//               <View className="ml-3">
//                 <Text className="text-gray-900 dark:text-white font-bold text-lg">Birthday House</Text>
//                 <Text className="text-gray-500 dark:text-white/50 text-xs">Mar 24, 2023</Text>
//               </View>
//             </View>
//             <Text className="text-gray-900 dark:text-white font-bold text-lg">$4508.32</Text>
//           </View>

//           {/* Breakdown List */}
//           <View className="mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
//             <View className="flex-row items-center mb-3">
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-6 h-6 rounded-full" />
//               <Text className="text-gray-600 dark:text-white/70 text-sm ml-2">John owes you <Text className="font-bold text-gray-900 dark:text-white">$1502.75</Text></Text>
//             </View>
//             <View className="flex-row items-center mb-4">
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/4' }} className="w-6 h-6 rounded-full" />
//               <Text className="text-gray-600 dark:text-white/70 text-sm ml-2">Wade owes you <Text className="font-bold text-gray-900 dark:text-white">$1502.75</Text></Text>
//             </View>

//             {/* Status Chip */}
//             <View className="bg-green-100 dark:bg-green-500/20 p-3 rounded-2xl flex-row justify-between items-center">
//               <Text className="text-green-600 dark:text-green-400 font-bold text-sm">You are owed</Text>
//               <Text className="text-green-600 dark:text-green-400 font-bold text-base">$3005.54</Text>
//             </View>
//           </View>
//         </TouchableOpacity>

//         {/* 3. Group Card - Party Time (Settled) */}
//         <TouchableOpacity 
//           onPress={() => router.push('/group/Party-Time')}
//           className="bg-white/90 dark:bg-white/10 p-5 rounded-[32px] mt-4 shadow-sm border border-white/20">
//           <View className="flex-row justify-between items-center">
//             <View className="flex-row items-center">
//               <View className="bg-yellow-100 p-2 rounded-xl">
//                 <Text className="text-xl">🎉</Text>
//               </View>
//               <View className="ml-3">
//                 <Text className="text-gray-900 dark:text-white font-bold text-lg">Party Time</Text>
//                 <Text className="text-gray-500 dark:text-white/50 text-xs">Mar 24, 2023</Text>
//               </View>
//             </View>
//             <Text className="text-gray-900 dark:text-white font-bold text-lg">$2501.32</Text>
//           </View>
//           <View className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl mt-4 items-center">
//             <Text className="text-gray-500 dark:text-white/40 font-bold text-sm">Settled up</Text>
//           </View>
//         </TouchableOpacity>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }