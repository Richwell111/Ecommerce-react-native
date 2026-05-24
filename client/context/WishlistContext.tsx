import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Product, WishlistContextType } from '@/constants/types';
import api from '@/constants/api';
import { useAuth } from '@clerk/expo';
import Toast from 'react-native-toast-message';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const { isSignedIn, getToken } = useAuth();

    const fetchWishlist = async () => {
        setStatus('loading');
        setError(null);
        try {
            const token = await getToken();
            const { data } = await api.get("/wishlist", { headers: { Authorization: `Bearer ${token}` } });
            setWishlist(data.data);
            setStatus('success');
        } catch (err: any) {
            // Silence the full error object logging to prevent console pollution
            const is401 = err.response?.status === 401;
            
            if (is401) {
                console.warn("Wishlist: Unauthorized (401). Clearing state.");
                setError("Your session has expired. Please login again.");
                setWishlist([]); 
            } else {
                console.error("Wishlist fetch error:", err.message);
                setError("Failed to load wishlist. Please try again later.");
            }
            
            setStatus('error');

            Toast.show({
                type: 'error',
                text1: is401 ? 'Session Expired' : 'Wishlist Error',
                text2: err.response?.data?.message || err.message || "Failed to load wishlist"
            });
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
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, loading: status === 'loading', error, status }}>
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
