import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Info, Send, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GroupChatScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const scrollViewRef = useRef<ScrollView>(null);

    // 1. Create a ref for the TextInput
    const inputRef = useRef<TextInput>(null);

    const [inputStep, setInputStep] = useState<'amount' | 'text'>('amount');
    const [tempAmount, setTempAmount] = useState('');
    const [tempText, setTempText] = useState('');

    const handleSend = () => {
        if (inputStep === 'amount' && tempAmount) {
            // 2. Switch step and force keyboard refresh
            setInputStep('text');

            // We blur and refocus after a tiny delay to force the OS to change keyboard type
            inputRef.current?.blur();
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);

        } else if (inputStep === 'text' && tempText) {
            console.log(`Final: $${tempAmount} for ${tempText}`);
            resetInput();
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }
    };

    const resetInput = () => {
        setTempAmount('');
        setTempText('');
        setInputStep('amount');
        // Ensure we go back to numeric keyboard on reset
        inputRef.current?.blur();
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <SafeAreaView className="flex-1 bg-transparent">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                {/* 1. Header - Hardcoded: bg-[#FF7A51] */}
                <View className="flex-row justify-between items-center px-6 py-4 bg-[#FF7A51]">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3">
                            <ArrowLeft color="white" size={24} />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-white text-lg font-bold">{id || 'Group Chat'}</Text>
                            <Text className="text-white/70 text-xs font-medium">3 members active</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/group/details')} className="bg-white/20 p-2 rounded-xl">
                        <Info color="white" size={20} />
                    </TouchableOpacity>
                </View>

                {/* 2. Chat Area */}
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1 bg-transparent px-4"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Example of the Calculated Message Result */}
                    <View className="flex-row items-end my-6">
                        <Image source={{ uri: 'https://avatar.iran.liara.run/public/3' }} className="w-8 h-8 rounded-full mr-2" />
                        <View className="bg-white p-4 rounded-3xl rounded-bl-none shadow-sm max-w-[85%] border border-gray-100">
                            <Text className="text-[#FF7A51] font-bold text-[10px] uppercase mb-1">Prasun</Text>
                            <Text className="text-gray-900 text-lg font-bold">$20 for Petrol ⛽</Text>

                            <View className="mt-4 pt-3 border-t border-gray-100">
                                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2">Are you in?</Text>
                                <View className="flex-row gap-2">
                                    <TouchableOpacity className="bg-green-500 py-3 rounded-2xl flex-1 items-center shadow-sm">
                                        <Text className="text-white font-bold">YES</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity className="bg-gray-100 py-3 rounded-2xl flex-1 items-center">
                                        <Text className="text-gray-500 font-bold">NO</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* 3. INTELLIGENT INPUT AREA - Hardcoded Backgrounds */}
                <View className="p-4 bg-transparent">
                    {/* Amount Chip Indicator - Hardcoded: bg-orange-100 */}
                    {inputStep === 'text' && (
                        <View className="flex-row justify-center mb-2">
                            <View className="bg-orange-100 px-4 py-1 rounded-full flex-row items-center border border-orange-200">
                                <Text className="text-[#FF7A51] font-bold text-xs">${tempAmount}</Text>
                                <TouchableOpacity onPress={resetInput} className="ml-2">
                                    <X color="#FF7A51" size={12} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View className="flex-row items-center bg-white rounded-[32px] px-4 py-2 shadow-2xl border border-gray-100">
                        <TextInput
                            placeholder={inputStep === 'amount' ? "Enter Amount (e.g. 20)" : "What for? (e.g. Petrol)"}
                            keyboardType={inputStep === 'amount' ? "numeric" : "default"}
                            value={inputStep === 'amount' ? tempAmount : tempText}
                            onChangeText={inputStep === 'amount' ? setTempAmount : setTempText}
                            autoFocus={true}
                            className="flex-1 h-14 text-gray-800 text-lg px-2 font-medium"
                            placeholderTextColor="#9CA3AF"
                        />

                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={inputStep === 'amount' ? !tempAmount : !tempText}
                            className={`p-4 rounded-full ${(!tempAmount && inputStep === 'amount') ? 'bg-gray-200' : 'bg-black'}`}
                        >
                            <Send color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}