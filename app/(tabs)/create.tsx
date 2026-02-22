import { useRouter } from 'expo-router';
import { Tag, Users, X } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateScreen() {
  const router = useRouter();

  // Handle the back action safely
  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
        <TouchableOpacity onPress={handleClose}>
          <X color="white" size={24} />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Add New Expense</Text>
        <View className="w-6" /> 
      </View>

      <ScrollView 
        className="flex-1 bg-transparent" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 }}
      >
        {/* 2. Amount Input Section - Hardcoded: bg-white */}
        <View className="bg-white p-6 rounded-[32px] shadow-sm items-center mb-6">
          <Text className="text-gray-400 font-bold uppercase text-xs mb-2">Enter Amount</Text>
          <View className="flex-row items-center">
            <Text className="text-gray-900 text-4xl font-bold">$</Text>
            <TextInput 
              placeholder="0.00"
              keyboardType="decimal-pad"
              className="text-gray-900 text-5xl font-bold ml-2 w-full text-center"
              placeholderTextColor="#D1D5DB"
            />
          </View>
        </View>

        {/* 3. Details Form - Hardcoded: bg-white/90 */}
        <View className="bg-white/90 p-6 rounded-[32px] shadow-sm">
          <View className="flex-row items-center mb-6 border-b border-gray-100 pb-4">
            <View className="bg-orange-100 p-3 rounded-2xl">
              <Tag color="#FF7A51" size={20} />
            </View>
            <TextInput 
              placeholder="What was this for?"
              className="flex-1 ml-4 text-gray-800 text-lg font-medium"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity className="flex-row items-center mb-6 border-b border-gray-100 pb-4">
            <View className="bg-blue-100 p-3 rounded-2xl"><Users color="#3B82F6" size={20} /></View>
            <View className="flex-1 ml-4">
              <Text className="text-gray-400 text-xs font-bold uppercase">In Group</Text>
              <Text className="text-gray-800 text-lg font-medium">Birthday House</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Action Button - Hardcoded: bg-black */}
        <TouchableOpacity 
          className="bg-black mt-8 py-5 rounded-[24px] items-center shadow-lg"
          onPress={() => console.log("Saving...")}
        >
          <Text className="text-white font-bold text-lg">Save Expense</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}