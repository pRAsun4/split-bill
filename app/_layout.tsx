import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Loader } from "../components/Loader";
import { COLORS } from "../constants/theme";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import { useGroupStore } from "../store/useGroupStore";
import { usePrefsStore } from "../store/usePrefsStore";

// Safe socket helpers — no-op if socket.io-client not installed yet
let connectSocket    = (_token: string) => {};
let disconnectSocket = () => {};
try {
  const socket = require("../lib/socket");
  connectSocket    = socket.connectSocket;
  disconnectSocket = socket.disconnectSocket;
} catch {}

// ─── Themed Status Bar ────────────────────────────────────────────────────────

function ThemedStatusBar() {
  const theme = usePrefsStore((s) => s.theme);
  return <StatusBar style={theme === "dark" ? "light" : "light"} />;
}

// ─── Auth Gate ────────────────────────────────────────────────────────────────

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, token, bootstrap } = useAuthStore();
  const router   = useRouter();
  const segments = useSegments();

  // Run once on mount — reads token from AsyncStorage, validates with /auth/me
  useEffect(() => {
    bootstrap();
  }, []);

  // Connect socket and initialize stores once authenticated
  useEffect(() => {
    if (status === "authenticated" && token) {
      connectSocket(token);
      useGroupStore.getState().fetchGroups();
      useFriendStore.getState().fetchFriends();
    }

    if (status === "unauthenticated") {
      disconnectSocket();
      useGroupStore.getState().reset();
      useFriendStore.getState().reset();
    }
  }, [status]);

  // Redirect based on auth status
  useEffect(() => {
    if (status === "unknown") return; // still bootstrapping

    const inAuthGroup = segments[0] === "auth";

    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/auth/welcome");
    } else if (status === "authenticated" && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [status, segments]);

  // Show full-screen spinner while checking AsyncStorage
  if (status === "unknown") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8F0" }}>
        <Loader variant="ring" size="lg" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedStatusBar />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="auth"    options={{ animation: "fade" }} />
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