import { ArrowDownLeft, ArrowUpRight, Bell, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView 
        className="flex-1 bg-transparent px-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        
        {/* Header - Always white text to pop against orange */}
        <View className="flex-row justify-between items-center mt-4">
          <View className="flex-row items-center">
            <View className="bg-white/20 p-2 rounded-full mr-3">
               <View className="w-6 h-6 bg-white rounded-full items-center justify-center">
                  <View className="w-4 h-4 bg-primary rounded-sm rotate-45" />
               </View>
            </View>
            <Text className="text-white text-2xl font-bold">Splitty</Text>
          </View>
          
          <View className="flex-row items-center">
            <TouchableOpacity className="bg-white/20 p-2 rounded-full mr-3">
              <Bell color="white" size={20} />
            </TouchableOpacity>
            <Image 
              source={{ uri: 'https://avatar.iran.liara.run/public/65' }} 
              className="w-10 h-10 rounded-full border-2 border-white/30"
            />
          </View>
        </View>

        {/* Balance Cards - Darker in Dark Mode */}
        <View className="flex-row justify-between mt-8">
          <View className="bg-black/80 dark:bg-black/95 w-[48%] p-5 rounded-[32px] shadow-xl border border-white/5">
            <View className="flex-row justify-between items-start">
              <Text className="text-white/70 text-base font-medium">You Owe</Text>
              <ArrowUpRight color="#FF7A51" size={24} />
            </View>
            <Text className="text-white text-2xl font-bold mt-4">$567.58</Text>
          </View>

          <View className="bg-black/80 dark:bg-black/95 w-[48%] p-5 rounded-[32px] shadow-xl border border-white/5">
            <View className="flex-row justify-between items-start">
              <Text className="text-white/70 text-base font-medium">Owes you</Text>
              <ArrowDownLeft color="#4ADE80" size={24} />
            </View>
            <Text className="text-white text-2xl font-bold mt-4">$826.43</Text>
          </View>
        </View>

        {/* Section Header */}
        <View className="flex-row justify-between items-center mt-10 mb-4">
          <Text className="text-white text-xl font-bold">Pending Bills</Text>
          <TouchableOpacity>
            <Text className="text-white/60 text-sm font-semibold">View All</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Pending Bills Section */}
        <View className="flex-row justify-between items-center mt-10 mb-4">
          <Text className="text-white text-xl font-bold">Pending Bills</Text>
          <TouchableOpacity><Text className="text-white/60 text-sm font-semibold">View All</Text></TouchableOpacity>
        </View>

        {/* Birthday House Card */}
        <TouchableOpacity className="bg-white/90 dark:bg-white/10 p-4 rounded-[28px] mb-4 shadow-sm border border-white/20">
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
          
          <View className="flex-row justify-between items-center mt-4">
            <View className="flex-row">
              {/* Avatars Stack */}
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/1' }} className="w-8 h-8 rounded-full border-2 border-white" />
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/2' }} className="w-8 h-8 rounded-full border-2 border-white -ml-3" />
            </View>
            <View className="bg-green-100 dark:bg-green-500/20 px-3 py-1 rounded-full">
              <Text className="text-green-600 dark:text-green-400 font-semibold text-xs">You are owed $3005.54</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. Friends Section */}
        <View className="bg-white/95 dark:bg-black/40 rounded-[32px] p-6 mt-4 mb-4">
          <Text className="text-gray-900 dark:text-white text-xl font-bold mb-4">Friends</Text>
          
          {/* Friend Item 1 */}
          <TouchableOpacity className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-12 h-12 rounded-full" />
              <View className="ml-4">
                <Text className="text-gray-900 dark:text-white font-bold text-base">Wade Howard</Text>
                <Text className="text-gray-500 dark:text-white/60 text-sm">Owes you <Text className="text-green-600 dark:text-green-400 font-bold">$1502.75</Text></Text>
              </View>
            </View>
            <ChevronRight color="#9CA3AF" size={20} />
          </TouchableOpacity>

          {/* Friend Item 2 */}
          <TouchableOpacity className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <Image source={{ uri: 'https://avatar.iran.liara.run/public/4' }} className="w-12 h-12 rounded-full" />
              <View className="ml-4">
                <Text className="text-gray-900 dark:text-white font-bold text-base">Guy Warren</Text>
                <Text className="text-gray-400 dark:text-white/40 text-sm">Settled up</Text>
              </View>
            </View>
            <ChevronRight color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}