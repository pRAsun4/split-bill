import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Loader } from "../components/Loader";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";

// ─── Auth Gate ────────────────────────────────────────────────────────────────
// Watches auth status and redirects:
//   unknown        → show full-screen loader (bootstrapping AsyncStorage)
//   unauthenticated → /auth/welcome
//   authenticated   → /(tabs)   (only if currently on an auth screen)

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, bootstrap } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  // Run once on mount — reads token from AsyncStorage
  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (status === "unknown") return; // still loading

    const inAuthGroup = segments[0] === "auth";

    if (status === "unauthenticated" && !inAuthGroup) {
      // Not logged in → always send to welcome/login
      router.replace("/auth/welcome");
    } else if (status === "authenticated" && inAuthGroup) {
      // Already logged in → skip auth screens
      router.replace("/(tabs)");
    }
  }, [status, segments]);

  // Show centered spinner while we check AsyncStorage
  if (status === "unknown") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8F0" }}>
        <Loader variant="ring" size="lg" color={COLORS.primary} label="Loading Splitty..." />
      </View>
    );
  }

  return <>{children}</>;
}


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="auth" options={{ animation: "fade" }} />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="groups" />
            <Stack.Screen name="friend" />
            <Stack.Screen name="profile" />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// import { LinearGradient } from 'expo-linear-gradient';
// import { Stack } from 'expo-router';
// import { useColorScheme } from 'react-native';
// import { TamaguiProvider, Theme } from 'tamagui';
// import { config } from '../tamagui.config';
// import "./globals.css";

// // 1. Fix the Zeego Warning
// import '@tamagui/native/setup-zeego';
// import React from 'react';

// export default function RootLayout() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';

//   return (
//     <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
//       <Theme name={isDark ? 'dark' : 'light'}>
//         <LinearGradient
//           colors={isDark ? ['#BD4F32', '#1A1A1A'] : ['#FF7A51', '#FFC56E']}
//           style={{ flex: 1 }}
//         >
//           {/* 2. The Stack component provides the Navigation Context */}
//           <Stack
//             screenOptions={{
//               headerShown: false,
//               contentStyle: { backgroundColor: 'transparent' },
//             }}
//           >
//             <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           </Stack>
//         </LinearGradient>
//       </Theme>
//     </TamaguiProvider>
//   );
// }