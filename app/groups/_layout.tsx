import { Stack } from "expo-router";
import React from "react";

export default function GroupsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
            <Stack.Screen name="[id]" options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="details" />
            <Stack.Screen name="settle" options={{ animation: "slide_from_bottom" }} />
        </Stack>
    );
}