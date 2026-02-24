import { useRouter } from 'expo-router';
import { ArrowLeft, Filter } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupDetailsListScreen() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-transparent">
            {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Group Expenses</Text>
                <TouchableOpacity>
                    <Filter color="white" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 bg-transparent px-6 pt-6">
                <Text className="text-white/70 font-bold uppercase text-[10px] mb-4 tracking-widest">Active Calculations</Text>

                {/* 2. Expense Row (The Petrol Example) - Hardcoded: bg-white */}
                <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <View className="bg-orange-100 p-3 rounded-2xl">
                            <Text className="text-lg">⛽</Text>
                        </View>
                        <View className="ml-4">
                            <Text className="text-gray-900 font-bold text-lg">Petrol</Text>
                            <Text className="text-gray-400 text-xs">Paid by A • Split with B</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-900 font-black text-xl">$20.00</Text>
                        <Text className="text-green-500 font-bold text-[10px]">SUCCESS</Text>
                    </View>
                </View>

                {/* 3. Another Expense Row - Hardcoded: bg-white */}
                <View className="bg-white p-5 rounded-[28px] mb-4 shadow-sm flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <View className="bg-blue-100 p-3 rounded-2xl">
                            <Text className="text-lg">🍱</Text>
                        </View>
                        <View className="ml-4">
                            <Text className="text-gray-900 font-bold text-lg">Dinner</Text>
                            <Text className="text-gray-400 text-xs">Paid by C • Split with A, B</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-gray-900 font-black text-xl">$60.00</Text>
                        <Text className="text-green-500 font-bold text-[10px]">SUCCESS</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}