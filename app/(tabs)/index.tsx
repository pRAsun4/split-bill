// app/(tabs)/index.tsx

import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f5f5f5" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? "#ffffff" : "#000000" },
        ]}
      >
        Expense Tracker
      </Text>

      <Text
        style={[
          styles.subtitle,
          { color: isDark ? "#cccccc" : "#555555" },
        ]}
      >
        Track group expenses easily during trips.
      </Text>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: isDark ? "#ffffff" : "#000000" },
        ]}
        onPress={() => router.push("/(modals)/add-expense")}
      >
        <Text
          style={{
            color: isDark ? "#000000" : "#ffffff",
            fontWeight: "600",
          }}
        >
          Add Expense
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
});
