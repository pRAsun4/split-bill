import { ArrowLeftRight, Home, Plus, Smile, Users } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function CustomTabBar({ state, descriptors, navigation }: any) {
    return (
        <View className="absolute bottom-10 left-6 right-6 bg-black/90 dark:bg-[#0A0A0A]/95 flex-row justify-between items-center px-4 py-3 rounded-[40px] shadow-2xl border border-white/10">
            {state.routes.map((route: any, index: number) => {
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                const renderIcon = () => {
                    const iconColor = isFocused ? '#FF7A51' : '#FFFFFF';
                    const size = 22;

                    if (route.name === 'create') {
                        return (
                            <View className="bg-primary p-4 rounded-full -mt-12 shadow-xl border-4 border-secondary">
                                <Plus color="white" size={28} strokeWidth={3} />
                            </View>
                        );
                    }

                    return (
                        <View className={`p-3 rounded-full ${isFocused ? 'bg-white/20' : 'bg-transparent'}`}>
                            {route.name === 'index' && <Home color={iconColor} size={size} />}
                            {route.name === 'transactions' && <ArrowLeftRight color={iconColor} size={size} />}
                            {route.name === 'groups' && <Users color={iconColor} size={size} />}
                            {route.name === 'profile' && <Smile color={iconColor} size={size} />}
                        </View>
                    );
                };

                return (
                    <TouchableOpacity key={route.name} onPress={onPress} activeOpacity={0.8} className="flex-1 items-center justify-center">
                        {renderIcon()}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}