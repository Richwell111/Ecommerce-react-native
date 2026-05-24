import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { COLORS } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

export default function Favorites() {
    const { wishlist, loading, error } = useWishlist();
    const router = useRouter();

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Wishlist" showMenu showCart />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Wishlist" showMenu showCart />
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                    <Text className="text-primary font-bold text-xl mt-4 text-center">Something went wrong</Text>
                    <Text className="text-secondary text-center mt-2">{error}</Text>
                    <TouchableOpacity 
                        onPress={() => router.push("/sign-in")} 
                        className="mt-6 bg-primary px-8 py-3 rounded-full"
                    >
                        <Text className="text-white font-bold">Login Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Wishlist" showMenu showCart />

            {wishlist.length > 0 ? (
                <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
                    <View className="flex-row flex-wrap justify-between">
                        {wishlist.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </View>
                </ScrollView>
            ) : (
                <View className="flex-1 items-center justify-center">
                    <Ionicons name="heart-outline" size={64} color="#CDCDE0" />
                    <Text className="text-secondary text-lg mt-4">Your wishlist is empty</Text>
                    <TouchableOpacity onPress={() => router.push("/")} className="mt-4">
                        <Text className="text-primary font-bold">Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}
