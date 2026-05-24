import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Product, WishlistContextType } from '@/constants/types';
import api from '@/constants/api';
import { useAuth } from '@clerk/expo';
import Toast from 'react-native-toast-message';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isSignedIn, getToken } = useAuth();

    const fetchWishlist = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getToken();
            const { data } = await api.get("/wishlist", { headers: { Authorization: `Bearer ${token}` } });
            setWishlist(data.data);
        } catch (err: any) {
            console.error("Error fetching wishlist:", err);
            
            if (err.response?.status === 401) {
                setError("Your session has expired. Please login again.");
                setWishlist([]); // Clear if unauthorized
            } else {
                setError("Failed to load wishlist. Please try again later.");
            }

            Toast.show({
                type: 'error',
                text1: 'Wishlist Error',
                text2: err.response?.data?.message || err.message || "Failed to load wishlist"
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleWishlist = async (product: Product) => {
        if (!isSignedIn) {
            Toast.show({
                type: 'error',
                text1: 'Please login',
                text2: 'You need to be logged in to add items to wishlist'
            });
            return;
        }

        try {
            const token = await getToken();
            await api.post("/wishlist/toggle", { productId: product._id }, { headers: { Authorization: `Bearer ${token}` } });
            const exists = wishlist.find((p) => p._id === product._id);
            setWishlist((prev) => {
                if (exists) {
                    return prev.filter((p) => p._id !== product._id);
                }
                return [...prev, product];
            });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: 'Failed to Update Wishlist',
                text2: error.response?.data?.message || "Something went wrong"
            });
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p._id === productId);
    };

    useEffect(() => {
        if (isSignedIn) {
            fetchWishlist();
        } else {
            setWishlist([]);
            setError(null);
        }
    }, [isSignedIn]);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading, error }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
