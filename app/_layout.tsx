import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import { config } from '../tamagui.config';
import "./globals.css";

// 1. Fix the Zeego Warning
import '@tamagui/native/setup-zeego';
import React from 'react';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
      <Theme name={isDark ? 'dark' : 'light'}>
        <LinearGradient
          colors={isDark ? ['#BD4F32', '#1A1A1A'] : ['#FF7A51', '#FFC56E']}
          style={{ flex: 1 }}
        >
          {/* 2. The Stack component provides the Navigation Context */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </LinearGradient>
      </Theme>
    </TamaguiProvider>
  );
}