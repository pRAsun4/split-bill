import { Stack } from "expo-router";
import React from "react";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="edit" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="language" />
      <Stack.Screen name="currency" />
    </Stack>
  );
}