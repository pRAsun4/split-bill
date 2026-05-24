import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
    Animated, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW, SPACE } from "../constants/theme";
import { useThemeColors } from "../store/usePrefsStore";

const TABS = [
  { name: "index",        icon: "home-outline",             activeIcon: "home",             label: "Home"    },
  { name: "transactions", icon: "swap-horizontal-outline",  activeIcon: "swap-horizontal",  label: "Activity"},
  { name: "create",       icon: "add",                      activeIcon: "add",              label: ""        },
  { name: "groups",       icon: "people-outline",           activeIcon: "people",           label: "Groups"  },
  { name: "profile",      icon: "person-outline",           activeIcon: "person",           label: "Profile" },
];

function TabItem({
  tab, isActive, isFab, onPress,
}: {
  tab: (typeof TABS)[0]; isActive: boolean; isFab: boolean; onPress: () => void;
}) {
  const tc = useThemeColors();
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

  if (isFab) {
    return (
      <TouchableOpacity
        onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
        activeOpacity={1} style={styles.fabWrapper}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={[COLORS.gradStart, COLORS.gradMid]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
      activeOpacity={1} style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={(isActive ? tab.activeIcon : tab.icon) as any}
          size={22}
          color={isActive ? COLORS.primary : tc.textMuted}
        />
        {tab.label ? (
          <Text style={[
            styles.tabLabel,
            { color: isActive ? COLORS.primary : tc.textMuted },
            isActive && { fontWeight: "700" },
          ]}>
            {tab.label}
          </Text>
        ) : null}
        <Animated.View style={[styles.activeDot, { opacity: dotAnim, transform: [{ scaleX: dotAnim }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + SPACE.xs }]}>
      <View style={[styles.bar, { backgroundColor: tc.card, borderColor: tc.border }]}>
        {state.routes.map((route, index) => {
          const tab      = TABS[index] ?? TABS[0];
          const isActive = state.index === index;
          const isFab    = route.name === "create";
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              isFab={isFab}
              onPress={() => { if (!isActive) navigation.navigate(route.name); }}
            />
          );
        })}
      </View>
    </View>
  );
}

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
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabInner: { alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.3 },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary, marginTop: 1,
  },
  fabWrapper: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: -20 },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", ...SHADOW.lg,
  },
});