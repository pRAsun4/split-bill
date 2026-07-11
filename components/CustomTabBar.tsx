import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useRef } from "react";
import {
  Animated, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW, SPACE } from "../constants/theme";
import { useFriendStore } from "../store/useFriendStore";
import { useThemeColors } from "../store/usePrefsStore";

// ─── Tab config — no FAB, friends in center ───────────────────────────────────

const TABS = [
  { name: "index",        icon: "home-outline",            activeIcon: "home",            label: "Home"     },
  { name: "transactions", icon: "swap-horizontal-outline", activeIcon: "swap-horizontal", label: "Activity" },
  { name: "friends",      icon: "people-circle-outline",   activeIcon: "people-circle",   label: "Friends"  },
  { name: "groups",       icon: "people-outline",          activeIcon: "people",          label: "Groups"   },
  { name: "profile",      icon: "person-outline",          activeIcon: "person",          label: "Profile"  },
];

// ─── Tab Item ─────────────────────────────────────────────────────────────────

function TabItem({
  tab, isActive, onPress, pendingCount,
}: {
  tab: typeof TABS[0];
  isActive: boolean;
  onPress: () => void;
  pendingCount?: number;
}) {
  const tc        = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnim   = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dotAnim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true, tension: 120, friction: 8,
    }).start();
  }, [isActive]);

  const onPressIn  = () => Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {/* Icon with optional badge */}
        <View style={styles.iconWrap}>
          <Ionicons
            name={(isActive ? tab.activeIcon : tab.icon) as any}
            size={22}
            color={isActive ? COLORS.primary : tc.textMuted}
          />
          {/* Red badge for pending friend requests */}
          {pendingCount && pendingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Label */}
        <Text style={[
          styles.tabLabel,
          { color: isActive ? COLORS.primary : tc.textMuted },
          isActive && { fontWeight: "700" },
        ]}>
          {tab.label}
        </Text>

        {/* Active dot */}
        <Animated.View style={[
          styles.activeDot,
          { opacity: dotAnim, transform: [{ scaleX: dotAnim }] },
        ]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Tab Bar ─────────────────────────────────────────────────────────────

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets  = useSafeAreaInsets();
  const tc      = useThemeColors();
  // Watch pending friend requests for badge
  const received = useFriendStore((s) => s.received);
  const pendingCount = received.length;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACE.xs }]}>
      <View style={[styles.bar, { backgroundColor: tc.card, borderColor: tc.border }]}>
        {state.routes.map((route, index) => {
          const tab      = TABS[index] ?? TABS[0];
          const isActive = state.index === index;
          const isFriends = route.name === "friends";

          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              onPress={() => { if (!isActive) navigation.navigate(route.name); }}
              pendingCount={isFriends ? pendingCount : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    paddingHorizontal: SPACE.lg,
    paddingTop: SPACE.sm,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.xxl,
    paddingHorizontal: SPACE.xs,
    paddingVertical: SPACE.sm,
    borderWidth: 1,
    ...SHADOW.lg,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
  },
  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 1,
  },
});