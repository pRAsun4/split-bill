import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, RADIUS, SHADOW, SPACE } from "../constants/theme";

// Tab config
const TABS = [
    { name: "index", icon: "home", activeIcon: "home", label: "Home" },
    { name: "transactions", icon: "swap-horizontal-outline", activeIcon: "swap-horizontal", label: "Activity" },
    { name: "create", icon: "add", activeIcon: "add", label: "" },         // FAB
    { name: "groups", icon: "people-outline", activeIcon: "people", label: "Groups" },
    { name: "profile", icon: "person-outline", activeIcon: "person", label: "Profile" },
];

function TabItem({
    tab,
    isActive,
    isFab,
    onPress,
}: {
    tab: (typeof TABS)[0];
    isActive: boolean;
    isFab: boolean;
    onPress: () => void;
}) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const dotAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
        Animated.spring(dotAnim, {
            toValue: isActive ? 1 : 0,
            useNativeDriver: true,
            tension: 120,
            friction: 8,
        }).start();
    }, [isActive]);

    const onPressIn = () =>
        Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 10 }).start();
    const onPressOut = () =>
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 10 }).start();

    if (isFab) {
        return (
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={styles.fabWrapper}
            >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <LinearGradient
                        colors={[COLORS.gradStart, COLORS.gradMid]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
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
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={1}
            style={styles.tabItem}
        >
            <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons
                    name={(isActive ? tab.activeIcon : tab.icon) as any}
                    size={22}
                    color={isActive ? COLORS.primary : COLORS.textMuted}
                />
                {tab.label ? (
                    <Text
                        style={[
                            styles.tabLabel,
                            { color: isActive ? COLORS.primary : COLORS.textMuted },
                            isActive && { fontWeight: "700" },
                        ]}
                    >
                        {tab.label}
                    </Text>
                ) : null}
                {/* Active dot */}
                <Animated.View
                    style={[
                        styles.activeDot,
                        {
                            opacity: dotAnim,
                            transform: [{ scaleX: dotAnim }],
                        },
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom + SPACE.xs }]}>
            <View style={styles.bar}>
                {state.routes.map((route, index) => {
                    const tab = TABS[index] ?? TABS[0];
                    const isActive = state.index === index;
                    const isFab = route.name === "create";

                    return (
                        <TabItem
                            key={route.key}
                            tab={tab}
                            isActive={isActive}
                            isFab={isFab}
                            onPress={() => {
                                if (!isActive) navigation.navigate(route.name);
                            }}
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
        backgroundColor: "#fff",
        borderRadius: RADIUS.xxl,
        paddingHorizontal: SPACE.xs,
        paddingVertical: SPACE.sm,
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
    fabWrapper: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: -20,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        ...SHADOW.lg,
    },
});




// import { ArrowLeftRight, Home, Plus, Smile, Users } from 'lucide-react-native';
// import React from 'react';
// import { TouchableOpacity, View } from 'react-native';

// export default function CustomTabBar({ state, descriptors, navigation }: any) {
//     return (
//         <View className="absolute bottom-10 left-6 right-6 bg-black/90 dark:bg-[#0A0A0A]/95 flex-row justify-between items-center px-4 py-3 rounded-[40px] shadow-2xl border border-white/10">
//             {state.routes.map((route: any, index: number) => {
//                 const isFocused = state.index === index;

//                 const onPress = () => {
//                     const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
//                     if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
//                 };

//                 const renderIcon = () => {
//                     const iconColor = isFocused ? '#FF7A51' : '#FFFFFF';
//                     const size = 22;

//                     if (route.name === 'create') {
//                         return (
//                             <View className="bg-primary p-4 rounded-full -mt-12 shadow-xl border-4 border-secondary">
//                                 <Plus color="white" size={28} strokeWidth={3} />
//                             </View>
//                         );
//                     }

//                     return (
//                         <View className={`p-3 rounded-full ${isFocused ? 'bg-white/20' : 'bg-transparent'}`}>
//                             {route.name === 'index' && <Home color={iconColor} size={size} />}
//                             {route.name === 'transactions' && <ArrowLeftRight color={iconColor} size={size} />}
//                             {route.name === 'groups' && <Users color={iconColor} size={size} />}
//                             {route.name === 'profile' && <Smile color={iconColor} size={size} />}
//                         </View>
//                     );
//                 };

//                 return (
//                     <TouchableOpacity key={route.name} onPress={onPress} activeOpacity={0.8} className="flex-1 items-center justify-center">
//                         {renderIcon()}
//                     </TouchableOpacity>
//                 );
//             })}
//         </View>
//     );
// }