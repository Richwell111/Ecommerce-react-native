import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
// import ProductCard from "@/components/ProductCard";
import { COLORS, CATEGORIES } from "@/constants";
import api from "@/constants/api";
import type { Product } from "@/constants/types";
export default function Shop() {
    const params = useLocalSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("-createdAt");
    const [category, setCategory] = useState(params.category || "");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [showFilters, setShowFilters] = useState(false);

    return(
 <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Shop" showBack showCart />

</SafeAreaView>
    )
}