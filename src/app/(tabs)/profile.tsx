import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS, PROFILE_MENU } from "@/constants";
// import { useClerk } from "@clerk/clerk-expo";

export default function Profile(){
     const router = useRouter();
    // const { user, signOut } = useClerk();

    const handleLogout = async () => {
        // await signOut();
        // router.replace("/sign-in");
    };

    return (
     <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Profile" />
            </SafeAreaView>
    )
}