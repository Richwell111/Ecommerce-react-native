import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { COLORS } from "@/constants";

export default function ProductDetails() {
    const { id } = useLocalSearchParams();

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <Header title="Product Details" showBack showCart />
            <ScrollView className="flex-1">
                <View className="p-4">
                    <Text className="text-2xl font-bold">Product ID: {id}</Text>
                    <Text className="text-gray-500 mt-2">Details coming soon...</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
