import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView 
        className="flex-1  px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* 1. Header Section */}
        <View className="flex-row justify-between items-center mt-4">
          <View>
            <Text className="text-white text-3xl font-bold">Groups</Text>
            <Text className="text-white/70 text-sm font-medium">You are in 3 groups.</Text>
          </View>
          <Image 
            source={{ uri: 'https://avatar.iran.liara.run/public/65' }} 
            className="w-10 h-10 rounded-full border-2 border-white/30"
          />
        </View>

        {/* GROUP DETAILS WILL MAP HERE FROM DB */}

        {/* 2. Group Card - Birthday House */}
        <TouchableOpacity
          onPress={() => router.push('/group/Birthday-House')}
           className="bg-white/90 dark:bg-white/10 p-5 rounded-[32px] mt-8 shadow-sm border border-white/20">
          <View className="flex-row justify-between items-start">
            <View className="flex-row items-center">
              <View className="bg-red-100 p-2 rounded-xl">
                <Text className="text-xl">🎂</Text>
              </View>
              <View className="ml-3">
                <Text className="text-gray-900 dark:text-white font-bold text-lg">Birthday House</Text>
                <Text className="text-gray-500 dark:text-white/50 text-xs">Mar 24, 2023</Text>
              </View>
            </View>
            <Text className="text-gray-900 dark:text-white font-bold text-lg">$4508.32</Text>
          </View>

          {/* Breakdown List */}
          <View className="mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
            <View className="flex-row items-center mb-3">
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-6 h-6 rounded-full" />
              <Text className="text-gray-600 dark:text-white/70 text-sm ml-2">John owes you <Text className="font-bold text-gray-900 dark:text-white">$1502.75</Text></Text>
            </View>
            <View className="flex-row items-center mb-4">
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/4' }} className="w-6 h-6 rounded-full" />
              <Text className="text-gray-600 dark:text-white/70 text-sm ml-2">Wade owes you <Text className="font-bold text-gray-900 dark:text-white">$1502.75</Text></Text>
            </View>

            {/* Status Chip */}
            <View className="bg-green-100 dark:bg-green-500/20 p-3 rounded-2xl flex-row justify-between items-center">
              <Text className="text-green-600 dark:text-green-400 font-bold text-sm">You are owed</Text>
              <Text className="text-green-600 dark:text-green-400 font-bold text-base">$3005.54</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 3. Group Card - Party Time (Settled) */}
        <TouchableOpacity 
          onPress={() => router.push('/group/Party-Time')}
          className="bg-white/90 dark:bg-white/10 p-5 rounded-[32px] mt-4 shadow-sm border border-white/20">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="bg-yellow-100 p-2 rounded-xl">
                <Text className="text-xl">🎉</Text>
              </View>
              <View className="ml-3">
                <Text className="text-gray-900 dark:text-white font-bold text-lg">Party Time</Text>
                <Text className="text-gray-500 dark:text-white/50 text-xs">Mar 24, 2023</Text>
              </View>
            </View>
            <Text className="text-gray-900 dark:text-white font-bold text-lg">$2501.32</Text>
          </View>
          <View className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl mt-4 items-center">
            <Text className="text-gray-500 dark:text-white/40 font-bold text-sm">Settled up</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}