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
import { Avatar, GradBtn } from "../../components/ui";
import { COLORS, FONT, GRAD, RADIUS, SHADOW, SPACE } from "../../constants/theme";
import { Member, useAppStore } from "../../store/useAppStore";

// ─── Available friends to add ─────────────────────────────────────────────────

const ALL_FRIENDS: Member[] = [
  { id: "john", name: "John", initials: "JO", avatarColor: "#6C63FF" },
  { id: "wade", name: "Wade Howard", initials: "WH", avatarColor: "#FF6584" },
  { id: "guy", name: "Guy Warren", initials: "GW", avatarColor: "#43BCCD" },
  { id: "jack", name: "Jack", initials: "JK", avatarColor: "#FF9F43" },
  { id: "kim", name: "Kim", initials: "KM", avatarColor: "#EE5A24" },
];

const GROUP_EMOJIS = ["🎂", "🎉", "🛍️", "✈️", "🏠", "🍕", "🎮", "💼", "⚽", "🎵"];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CreateGroupScreen() {
  const router = useRouter();
  const { addGroup, currentUserId } = useAppStore();

  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(GROUP_EMOJIS[0]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) { shake(); return; }
    if (selectedMembers.length === 0) {
      Alert.alert("Add members", "Select at least one friend for the group.");
      return;
    }

    setLoading(true);
    const me: Member = { id: "me", name: "You", initials: "ME", avatarColor: COLORS.primary };
    const members = [me, ...ALL_FRIENDS.filter((f) => selectedMembers.includes(f.id))];

    const id = addGroup({
      name: name.trim(),
      emoji: selectedEmoji,
      createdAt: new Date().toISOString().split("T")[0],
      members,
    });

    setTimeout(() => {
      setLoading(false);
      router.replace(`/groups/${id}`);
    }, 400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <LinearGradient colors={GRAD} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Group</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Emoji Picker */}
          <Text style={styles.label}>GROUP ICON</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.emojiRow}
            contentContainerStyle={{ gap: SPACE.sm, paddingHorizontal: 2 }}
          >
            {GROUP_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setSelectedEmoji(e)}
                style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnOn]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 26 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Group name */}
          <Text style={[styles.label, { marginTop: SPACE.lg }]}>GROUP NAME</Text>
          <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
            <View style={styles.emojiPreview}>
              <Text style={{ fontSize: 20 }}>{selectedEmoji}</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="e.g. Weekend Trip, Birthday..."
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              autoCorrect={false}
            />
          </Animated.View>

          {/* Friends */}
          <Text style={[styles.label, { marginTop: SPACE.xl }]}>ADD FRIENDS</Text>
          <View style={styles.friendsGrid}>
            {ALL_FRIENDS.map((f) => {
              const isOn = selectedMembers.includes(f.id);
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => toggleMember(f.id)}
                  style={[styles.friendChip, isOn && styles.friendChipOn]}
                  activeOpacity={0.8}
                >
                  <Avatar initials={f.initials} color={f.avatarColor} size={36} />
                  <Text style={[styles.friendChipName, isOn && { color: COLORS.primary }]}>
                    {f.name.split(" ")[0]}
                  </Text>
                  {isOn && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected summary */}
          {selectedMembers.length > 0 && (
            <View style={styles.selectedSummary}>
              <Ionicons name="people" size={16} color={COLORS.primary} />
              <Text style={styles.selectedSummaryText}>
                You + {selectedMembers.length} friend{selectedMembers.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          <View style={{ height: SPACE.xxxl }} />
        </ScrollView>

        {/* Create button */}
        <View style={styles.footer}>
          <GradBtn
            label={loading ? "Creating..." : "Create Group"}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    flex: 1, backgroundColor: COLORS.bg,
    borderTopLeftRadius: RADIUS.xxl + 4,
    borderTopRightRadius: RADIUS.xxl + 4,
    marginTop: -RADIUS.xxl,
    overflow: "hidden",
  },
  scrollContent: { paddingTop: SPACE.xl, paddingHorizontal: SPACE.xl },
  label: {
    fontSize: FONT.xs, fontWeight: FONT.black,
    color: COLORS.textMuted, letterSpacing: 1.2,
    textTransform: "uppercase", marginBottom: SPACE.sm,
  },
  emojiRow: { marginBottom: SPACE.sm },
  emojiBtn: {
    width: 54, height: 54, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
    ...SHADOW.sm,
  },
  emojiBtnOn: { borderColor: COLORS.primary, backgroundColor: "#FFF3E0" },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    gap: SPACE.sm, ...SHADOW.sm,
  },
  emojiPreview: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: "#FFF3E0", alignItems: "center", justifyContent: "center",
  },
  nameInput: {
    flex: 1, fontSize: FONT.lg, color: COLORS.textPrimary, fontWeight: FONT.medium,
  },
  friendsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: SPACE.sm,
  },
  friendChip: {
    flexDirection: "row", alignItems: "center", gap: SPACE.sm,
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE.md, paddingVertical: SPACE.sm,
    borderWidth: 2, borderColor: "transparent",
    ...SHADOW.sm,
  },
  friendChipOn: { borderColor: COLORS.primary, backgroundColor: "#FFF3E0" },
  friendChipName: {
    fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.textSecondary,
  },
  checkBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  selectedSummary: {
    flexDirection: "row", alignItems: "center", gap: SPACE.sm,
    backgroundColor: "#FFF3E0", borderRadius: RADIUS.xl,
    padding: SPACE.md, marginTop: SPACE.lg,
    borderWidth: 1, borderColor: "#FFD166",
  },
  selectedSummaryText: {
    fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl,
    paddingTop: SPACE.md, backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
});





// import { useRouter } from 'expo-router';
// import { Check, ChevronDown, Type, Users, X } from 'lucide-react-native';
// import React, { useState } from 'react';
// import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function CreateGroupScreen() {
//   const router = useRouter();
//   const [showFriends, setShowFriends] = useState(false);
//   const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

//   // Demo Friends Data
//   const demoFriends = [
//     { id: 1, name: 'John Doe', avatar: 'https://avatar.iran.liara.run/public/3' },
//     { id: 2, name: 'Wade Howard', avatar: 'https://avatar.iran.liara.run/public/4' },
//     { id: 3, name: 'Guy Warren', avatar: 'https://avatar.iran.liara.run/public/5' },
//   ];

//   const toggleFriend = (id: number) => {
//     setSelectedFriends(prev => 
//       prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
//     );
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-primary">
//       {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
//       <View className="flex-row justify-between items-center px-6 py-4 ">
//         <TouchableOpacity onPress={() => router.back()}><X color="white" size={24} /></TouchableOpacity>
//         <Text className="text-white text-xl font-bold">New Group</Text>
//         <View className="w-6" />
//       </View>

//       <ScrollView className="flex-1 bg-transparent px-6 pt-6" showsVerticalScrollIndicator={false}>
//         {/* 2. Group Name - Hardcoded: bg-white */}
//         <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm">
//           <Text className="text-gray-400 font-bold uppercase text-[10px] mb-2">Group Name</Text>
//           <View className="flex-row items-center">
//             <Type color="#FF7A51" size={20} /><TextInput placeholder="e.g. Goa Trip" className="flex-1 ml-3 text-lg font-bold text-gray-800" />
//           </View>
//         </View>

//         {/* 3. Friends Selector with Dropdown Functionality */}
//         <View className="bg-white rounded-[28px] mb-6 shadow-sm overflow-hidden">
//           <TouchableOpacity 
//             onPress={() => setShowFriends(!showFriends)}
//             className="p-5 flex-row justify-between items-center border-b border-gray-50"
//           >
//             <View className="flex-row items-center">
//               <Users color="#3B82F6" size={20} />
//               <Text className="ml-3 text-lg font-medium text-gray-800">
//                 {selectedFriends.length > 0 ? `${selectedFriends.length} Friends Selected` : "Select Friends"}
//               </Text>
//             </View>
//             <ChevronDown color="#9CA3AF" size={20} style={{ transform: [{ rotate: showFriends ? '180deg' : '0deg' }] }} />
//           </TouchableOpacity>

//           {/* Demo Friends List Appearance */}
//           {showFriends && (
//             <View className="p-4 bg-gray-50/50">
//               {demoFriends.map((friend) => (
//                 <TouchableOpacity 
//                   key={friend.id} 
//                   onPress={() => toggleFriend(friend.id)}
//                   className="flex-row justify-between items-center mb-4 last:mb-0"
//                 >
//                   <View className="flex-row items-center">
//                     <Image source={{ uri: friend.avatar }} className="w-10 h-10 rounded-full" />
//                     <Text className="ml-3 font-bold text-gray-700">{friend.name}</Text>
//                   </View>
//                   {selectedFriends.includes(friend.id) && <View className="bg-green-500 rounded-full p-1"><Check color="white" size={14} /></View>}
//                 </TouchableOpacity>
//               ))}
//             </View>
//           )}
//         </View>

//         {/* 4. Save Button - Hardcoded: bg-black */}
//         <TouchableOpacity 
//           className="bg-black py-5 rounded-[24px] items-center shadow-lg"
//           onPress={() => router.push('/group/Chat-Room')} 
//         >
//           <Text className="text-white font-bold text-lg">Create & Start Chat</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }