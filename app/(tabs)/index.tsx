import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, BalancePill, FadeCard, PressScale, SectionHeader } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { computeFriendBalances, getNetBalance, useAppStore } from "../../store/useAppStore";

// ─── Balance Card ─────────────────────────────────────────────────────────────

function BalanceCard({
  label,
  amount,
  icon,
  delay,
}: {
  label: string;
  amount: number;
  icon: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: anim, flex: 1 }}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceCardIcon}>
          <Ionicons name={icon as any} size={16} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.balanceAmount}>${amount.toFixed(2)}</Text>
        <Text style={styles.balanceLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Group Row ────────────────────────────────────────────────────────────────

function GroupRow({
  group,
  balance,
  delay,
  onPress,
}: {
  group: ReturnType<typeof useAppStore.getState>["groups"][0];
  balance: { owes: number; owed: number };
  delay: number;
  onPress: () => void;
}) {
  const isOwed = balance.owed > balance.owes;
  const net = Math.abs(balance.owed - balance.owes);
  const type = balance.owed === 0 && balance.owes === 0 ? "settled" : isOwed ? "owed" : "owes";
  const label = type === "settled" ? "Settled up" : isOwed ? "You are owed" : "You owe";

  // Group member avatars (first 3)
  const shownMembers = group.members.filter((m) => m.id !== "me").slice(0, 3);

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={styles.groupRow}>
          <View style={styles.groupRowEmoji}>
            <Text style={{ fontSize: 24 }}>{group.emoji}</Text>
          </View>
          <View style={styles.groupRowCenter}>
            <Text style={styles.groupRowName}>{group.name}</Text>
            <Text style={styles.groupRowDate}>
              {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
            <View style={styles.groupRowAvatars}>
              {shownMembers.map((m, i) => (
                <Avatar key={m.id} initials={m.initials} color={m.avatarColor} size={22} style={{ marginLeft: i > 0 ? -6 : 0, borderWidth: 1.5, borderColor: "#fff" }} />
              ))}
            </View>
          </View>
          <View style={styles.groupRowRight}>
            <Text style={styles.groupRowTotal}>${group.expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)}</Text>
            <BalancePill label={label} amount={net} type={type} />
          </View>
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Friend Row ───────────────────────────────────────────────────────────────

function FriendRow({
  name,
  initials,
  avatarColor,
  net,
  delay,
  onPress,
}: {
  name: string;
  initials: string;
  avatarColor: string;
  net: number;
  delay: number;
  onPress: () => void;
}) {
  const isOwed = net > 0;
  const isSettled = Math.abs(net) < 0.01;

  return (
    <FadeCard delay={delay}>
      <PressScale onPress={onPress}>
        <View style={styles.friendRow}>
          <Avatar initials={initials} color={avatarColor} size={44} />
          <View style={styles.friendRowCenter}>
            <Text style={styles.friendRowName}>{name}</Text>
            <Text
              style={[
                styles.friendRowStatus,
                { color: isSettled ? COLORS.textMuted : isOwed ? COLORS.success : COLORS.danger },
              ]}
            >
              {isSettled ? "Settled up" : isOwed ? `Owes you $${net.toFixed(2)}` : `You owe $${(-net).toFixed(2)}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </View>
      </PressScale>
    </FadeCard>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { groups, currentUserId, getMyNetBalance } = useAppStore();
  const { totalOwed, totalOwes } = getMyNetBalance();
  // const friendBalances = useAppStore((s) => s.getFriendBalances());
  const friendBalances = React.useMemo(() => {
    return computeFriendBalances(currentUserId, groups);
  }, [groups, currentUserId])

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({ inputRange: [0, 80], outputRange: [0, -30], extrapolate: "clamp" });

  // Sort groups by most recent expense
  const sortedGroups = [...groups].sort((a, b) => {
    const aLast = a.expenses[a.expenses.length - 1]?.date ?? a.createdAt;
    const bLast = b.expenses[b.expenses.length - 1]?.date ?? b.createdAt;
    return bLast.localeCompare(aLast);
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRAD} style={styles.gradientBg}>
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          {/* ── Top bar ── */}
          <Animated.View style={[styles.topBar, { transform: [{ translateY: headerHeight }] }]}>
            <View style={styles.topBarLeft}>
              <View style={styles.logoMark}>
                <Ionicons name="flash" size={14} color="#fff" />
              </View>
              <Text style={styles.logoText}>Splitty</Text>
            </View>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/friend/me")}>
                <Avatar initials="ME" color="rgba(255,255,255,0.25)" size={36} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Balance Cards ── */}
          <View style={styles.balanceRow}>
            <BalanceCard label="You Owe" amount={totalOwes} icon="arrow-up-circle" delay={100} />
            <View style={{ width: SPACE.md }} />
            <BalanceCard label="Owes you" amount={totalOwed} icon="arrow-down-circle" delay={220} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── White body ── */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        {/* Pending Bills */}
        <FadeCard delay={80}>
          <SectionHeader
            title="Pending Bills"
            action="View All"
            onAction={() => router.push("/(tabs)/groups")}
          />
        </FadeCard>

        {sortedGroups.map((g, i) => {
          const bal = getNetBalance(currentUserId, g.expenses);
          return (
            <GroupRow
              key={g.id}
              group={g}
              balance={bal}
              delay={120 + i * 60}
              onPress={() => router.push(`/groups/${g.id}`)}
            />
          );
        })}

        {/* Friends */}
        <FadeCard delay={300}>
          <SectionHeader title="Friends" style={{ marginTop: SPACE.xl }} />
        </FadeCard>

        {friendBalances.length === 0 && (
          <FadeCard delay={350}>
            <Text style={styles.emptyFriends}>No friend balances yet</Text>
          </FadeCard>
        )}

        {friendBalances.map((f, i) => (
          <FriendRow
            key={f.memberId}
            name={f.name}
            initials={f.initials}
            avatarColor={f.avatarColor}
            net={f.net}
            delay={340 + i * 55}
            onPress={() => router.push(`/friend/${f.memberId}`)}
          />
        ))}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  gradientBg: {
    paddingBottom: SPACE.xl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.sm,
    paddingBottom: SPACE.md,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.sm,
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: FONT.xl,
    fontWeight: FONT.black,
    color: "#fff",
    letterSpacing: -0.5,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceRow: {
    flexDirection: "row",
    paddingHorizontal: SPACE.xl,
    paddingTop: SPACE.sm,
  },
  balanceCard: {
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    gap: SPACE.xs,
  },
  balanceCardIcon: {
    marginBottom: SPACE.xs,
  },
  balanceAmount: {
    fontSize: FONT.xxl,
    fontWeight: FONT.black,
    color: "#fff",
    letterSpacing: -0.8,
  },
  balanceLabel: {
    fontSize: FONT.sm,
    color: "rgba(255,255,255,0.75)",
    fontWeight: FONT.medium,
  },
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
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    marginBottom: SPACE.md,
    gap: SPACE.md,
    ...SHADOW.sm,
  },
  groupRowEmoji: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
  },
  groupRowCenter: {
    flex: 1,
    gap: 3,
  },
  groupRowName: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.textPrimary,
  },
  groupRowDate: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  groupRowAvatars: {
    flexDirection: "row",
    marginTop: 5,
  },
  groupRowRight: {
    alignItems: "flex-end",
    gap: SPACE.xs,
  },
  groupRowTotal: {
    fontSize: FONT.lg,
    fontWeight: FONT.black,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    marginBottom: SPACE.md,
    gap: SPACE.md,
    ...SHADOW.sm,
  },
  friendRowCenter: {
    flex: 1,
    gap: 3,
  },
  friendRowName: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.textPrimary,
  },
  friendRowStatus: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
  },
  emptyFriends: {
    fontSize: FONT.base,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: SPACE.xl,
  },
});





// import { ArrowDownLeft, ArrowUpRight, Bell, ChevronRight } from 'lucide-react-native';
// import React from 'react';
// import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function HomeScreen() {
//   return (
//     <SafeAreaView className="flex-1 bg-primary">
//       <ScrollView 
//         className="flex-1 bg-transparent px-6" 
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 140 }}
//       >
        
//         {/* Header - Always white text to pop against orange */}
//         <View className="flex-row justify-between items-center mt-4">
//           <View className="flex-row items-center">
//             <View className="bg-white/20 p-2 rounded-full mr-3">
//                <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
//                   <View className="w-4 h-4 bg-primary rounded-sm rotate-45" />
//                </View>
//             </View>
//             <Text className="text-white text-2xl font-bold">Splitty</Text>
//           </View>
          
//           <View className="flex-row items-center">
//             <TouchableOpacity className="bg-white/20 p-2 rounded-full mr-3">
//               <Bell color="white" size={20} />
//             </TouchableOpacity>
//             <Image 
//               source={{ uri: 'https://avatar.iran.liara.run/public/65' }} 
//               className="w-10 h-10 rounded-full border-2 border-white/30"
//             />
//           </View>
//         </View>

//         {/* Balance Cards - Darker in Dark Mode */}
//         <View className="flex-row justify-between mt-8">
//           <View className="bg-black/80 dark:bg-black/95 w-[48%] p-5 rounded-[32px] shadow-xl border border-white/5">
//             <View className="flex-row justify-between items-start">
//               <Text className="text-white/70 text-base font-medium">You Owe</Text>
//               <ArrowUpRight color="#FF7A51" size={24} />
//             </View>
//             <Text className="text-white text-2xl font-bold mt-4">$567.58</Text>
//           </View>

//           <View className="bg-black/80 dark:bg-black/95 w-[48%] p-5 rounded-[32px] shadow-xl border border-white/5">
//             <View className="flex-row justify-between items-start">
//               <Text className="text-white/70 text-base font-medium">Owes you</Text>
//               <ArrowDownLeft color="#4ADE80" size={24} />
//             </View>
//             <Text className="text-white text-2xl font-bold mt-4">$826.43</Text>
//           </View>
//         </View>

//         {/* Section Header */}
//         <View className="flex-row justify-between items-center mt-10 mb-4">
//           <Text className="text-white text-xl font-bold">Pending Bills</Text>
//           <TouchableOpacity>
//             <Text className="text-white/60 text-sm font-semibold">View All</Text>
//           </TouchableOpacity>
//         </View>

//         {/* 1. Pending Bills Section */}
//         <View className="flex-row justify-between items-center mt-10 mb-4">
//           <Text className="text-white text-xl font-bold">Pending Bills</Text>
//           <TouchableOpacity><Text className="text-white/60 text-sm font-semibold">View All</Text></TouchableOpacity>
//         </View>

//         {/* Birthday House Card */}
//         <TouchableOpacity className="bg-white/90 dark:bg-white/10 p-4 rounded-[28px] mb-4 shadow-sm border border-white/20">
//           <View className="flex-row justify-between items-start">
//             <View className="flex-row items-center">
//               <View className="bg-red-100 p-2 rounded-xl">
//                  <Text className="text-xl">🎂</Text>
//               </View>
//               <View className="ml-3">
//                 <Text className="text-gray-900 dark:text-white font-bold text-lg">Birthday House</Text>
//                 <Text className="text-gray-500 dark:text-white/50 text-xs">Mar 24, 2023</Text>
//               </View>
//             </View>
//             <Text className="text-gray-900 dark:text-white font-bold text-lg">$4508.32</Text>
//           </View>
          
//           <View className="flex-row justify-between items-center mt-4">
//             <View className="flex-row">
//               {/* Avatars Stack */}
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/1' }} className="w-8 h-8 rounded-full border-2 border-white" />
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/2' }} className="w-8 h-8 rounded-full border-2 border-white -ml-3" />
//             </View>
//             <View className="bg-green-100 dark:bg-green-500/20 px-3 py-1 rounded-full">
//               <Text className="text-green-600 dark:text-green-400 font-semibold text-xs">You are owed $3005.54</Text>
//             </View>
//           </View>
//         </TouchableOpacity>

//         {/* 2. Friends Section */}
//         <View className="bg-white/95 dark:bg-black/40 rounded-[32px] p-6 mt-4 mb-4">
//           <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">Friends</Text>
          
//           {/* Friend Item 1 */}
//           <TouchableOpacity className="flex-row justify-between items-center mb-6">
//             <View className="flex-row items-center">
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-12 h-12 rounded-full" />
//               <View className="ml-4">
//                 <Text className="text-gray-900 dark:text-white font-bold text-base">Wade Howard</Text>
//                 <Text className="text-gray-500 dark:text-white/60 text-sm">Owes you <Text className="text-green-600 dark:text-green-400 font-bold">$1502.75</Text></Text>
//               </View>
//             </View>
//             <ChevronRight color="#9CA3AF" size={20} />
//           </TouchableOpacity>

//           {/* Friend Item 2 */}
//           <TouchableOpacity className="flex-row justify-between items-center">
//             <View className="flex-row items-center">
//               <Image source={{ uri: 'https://avatar.iran.liara.run/public/4' }} className="w-12 h-12 rounded-full" />
//               <View className="ml-4">
//                 <Text className="text-gray-900 dark:text-white font-bold text-base">Guy Warren</Text>
//                 <Text className="text-gray-400 dark:text-white/40 text-sm">Settled up</Text>
//               </View>
//             </View>
//             <ChevronRight color="#9CA3AF" size={20} />
//           </TouchableOpacity>
//         </View>

//       </ScrollView>
//     </SafeAreaView>
//   );
// }