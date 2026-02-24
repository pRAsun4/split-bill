import { useRouter } from 'expo-router';
import { Check, ChevronDown, Type, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [showFriends, setShowFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);

  // Demo Friends Data
  const demoFriends = [
    { id: 1, name: 'John Doe', avatar: 'https://avatar.iran.liara.run/public/3' },
    { id: 2, name: 'Wade Howard', avatar: 'https://avatar.iran.liara.run/public/4' },
    { id: 3, name: 'Guy Warren', avatar: 'https://avatar.iran.liara.run/public/5' },
  ];

  const toggleFriend = (id: number) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
      <View className="flex-row justify-between items-center px-6 py-4 ">
        <TouchableOpacity onPress={() => router.back()}><X color="white" size={24} /></TouchableOpacity>
        <Text className="text-white text-xl font-bold">New Group</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 bg-transparent px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* 2. Group Name - Hardcoded: bg-white */}
        <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm">
          <Text className="text-gray-400 font-bold uppercase text-[10px] mb-2">Group Name</Text>
          <View className="flex-row items-center">
            <Type color="#FF7A51" size={20} /><TextInput placeholder="e.g. Goa Trip" className="flex-1 ml-3 text-lg font-bold text-gray-800" />
          </View>
        </View>

        {/* 3. Friends Selector with Dropdown Functionality */}
        <View className="bg-white rounded-[28px] mb-6 shadow-sm overflow-hidden">
          <TouchableOpacity 
            onPress={() => setShowFriends(!showFriends)}
            className="p-5 flex-row justify-between items-center border-b border-gray-50"
          >
            <View className="flex-row items-center">
              <Users color="#3B82F6" size={20} />
              <Text className="ml-3 text-lg font-medium text-gray-800">
                {selectedFriends.length > 0 ? `${selectedFriends.length} Friends Selected` : "Select Friends"}
              </Text>
            </View>
            <ChevronDown color="#9CA3AF" size={20} style={{ transform: [{ rotate: showFriends ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {/* Demo Friends List Appearance */}
          {showFriends && (
            <View className="p-4 bg-gray-50/50">
              {demoFriends.map((friend) => (
                <TouchableOpacity 
                  key={friend.id} 
                  onPress={() => toggleFriend(friend.id)}
                  className="flex-row justify-between items-center mb-4 last:mb-0"
                >
                  <View className="flex-row items-center">
                    <Image source={{ uri: friend.avatar }} className="w-10 h-10 rounded-full" />
                    <Text className="ml-3 font-bold text-gray-700">{friend.name}</Text>
                  </View>
                  {selectedFriends.includes(friend.id) && <View className="bg-green-500 rounded-full p-1"><Check color="white" size={14} /></View>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 4. Save Button - Hardcoded: bg-black */}
        <TouchableOpacity 
          className="bg-black py-5 rounded-[24px] items-center shadow-lg"
          onPress={() => router.push('/group/Chat-Room')} 
        >
          <Text className="text-white font-bold text-lg">Create & Start Chat</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}