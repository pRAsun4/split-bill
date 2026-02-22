import { Tabs } from 'expo-router';
import React from 'react';
import CustomTabBar from '../../components/CustomTabBar';

export default function TabLayout() {
    return (
        <Tabs
            // This line injects your custom component
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="transactions" options={{ title: 'Activity' }} />
            <Tabs.Screen name="create" options={{ title: 'Add' }} />
            <Tabs.Screen name="groups" options={{ title: 'Groups' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
        </Tabs>
    );
}