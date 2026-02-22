import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // This captures the ID from the URL

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      {/* 1. Header Navigation - Hardcoded Background */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="white" size={24} />
        </TouchableOpacity>
        {/* Dynamic Title based on ID if needed */}
        <Text className="text-white text-xl font-bold">{id || 'Birthday House'}</Text>
        <View className="bg-white/20 p-2 rounded-xl">
          <Text className="text-lg">🎂</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 bg-transparent" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="mx-6 mt-6 p-6 bg-white rounded-[32px] shadow-sm">
           <Text className="text-gray-500 font-medium text-sm">You are owed</Text>
           <View className="flex-row justify-between items-center mt-1">
             <Text className="text-[#4ADE80] text-3xl font-bold">$1,508.32</Text>
             <TouchableOpacity className="bg-black px-6 py-2 rounded-full">
               <Text className="text-white font-bold">Settle</Text>
             </TouchableOpacity>
           </View>
        </View>
        
        {/* 2. Debt Summary Card - Hardcoded Background */}
        <View className="mx-6 mt-6 p-6 bg-white rounded-[32px] shadow-sm">
          <Text className="text-gray-500 font-medium text-sm">You are owed</Text>
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-[#4ADE80] text-3xl font-bold">$1,508.32</Text>
            <TouchableOpacity className="bg-black px-6 py-2 rounded-full">
              <Text className="text-white font-bold">Settle</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 border-t border-gray-100 pt-4">
            <Text className="text-gray-400 text-xs font-bold uppercase mb-4">Who owes whom?</Text>
            
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-10 h-10 rounded-full" />
                <Text className="text-gray-800 font-bold ml-3">John owes you</Text>
              </View>
              <Text className="text-gray-900 font-bold">$1052.75</Text>
            </View>

            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Image source={{ uri: 'https://avatar.iran.liara.run/public/4' }} className="w-10 h-10 rounded-full" />
                <Text className="text-gray-800 font-bold ml-3">Wade owes you</Text>
              </View>
              <Text className="text-gray-900 font-bold">$1052.75</Text>
            </View>
          </View>
        </View>

        {/* 3. Timeline Section */}
        <View className="px-6 mt-10">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">Mar 2024</Text>
            <TouchableOpacity className="bg-black/20 p-2 rounded-lg">
              <Calendar color="white" size={20} />
            </TouchableOpacity>
          </View>

          {/* Expense Item 1 - Hardcoded Background */}
          <View className="bg-[#FFE4E6] p-4 rounded-3xl flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="bg-white/40 p-2 rounded-xl"><Text>🎁</Text></View>
              <View className="ml-3">
                <Text className="text-gray-900 font-bold text-base">Ansh's Gift</Text>
                <Text className="text-gray-500 text-xs">Mar 26, 2024</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-red-500 font-bold text-xs uppercase">You Owe</Text>
              <Text className="text-red-500 font-bold text-lg">$200.00</Text>
            </View>
          </View>

          {/* Expense Item 2 - Hardcoded Background */}
          <View className="bg-[#F0FDF4] p-4 rounded-3xl flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="bg-white/40 p-2 rounded-xl"><Text>🍽️</Text></View>
              <View className="ml-3">
                <Text className="text-gray-900 font-bold text-base">Dining</Text>
                <Text className="text-gray-500 text-xs">Mar 20, 2024</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-green-600 font-bold text-xs uppercase">Owes you</Text>
              <Text className="text-green-600 font-bold text-lg">$120.00</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}