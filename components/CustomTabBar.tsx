import { ArrowLeftRight, Home, Plus, Smile, Users } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View className="absolute bottom-10 left-6 right-6 bg-dark-tab/90 flex-row justify-between items-center px-6 py-4 rounded-[40px] shadow-2xl border border-white/10">
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Mapping icons to your 5 design tabs
        const renderIcon = () => {
          const color = isFocused ? "#FF7A51" : "#FFFFFF";
          const size = 24;

          switch (route.name) {
            case "index":
              return <Home color={color} size={size} />;
            case "transactions":
              return <ArrowLeftRight color={color} size={size} />;
            case "create":
              return (
                <View className="bg-primary-orange p-3 rounded-full -mt-12 shadow-lg">
                  <Plus color="white" size={32} strokeWidth={3} />
                </View>
              );
            case "groups":
              return <Users color={color} size={size} />;
            case "profile":
              return <Smile color={color} size={size} />;
            default:
              return null;
          }
        };

        return (
          <TouchableOpacity
            key={route.name}
            onPress={onPress}
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            {renderIcon()}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
