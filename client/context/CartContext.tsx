import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import api from '@/constants/api';
import { Product } from '@/constants/types';
import { useAuth } from '@clerk/expo';
import Toast from 'react-native-toast-message';

export { Product };

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
};

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (product: Product, size: string) => Promise<void>;
    removeFromCart: (itemId: string, size: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number, size: string) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    isLoading: boolean;
    error: string | null;
    status: 'idle' | 'loading' | 'success' | 'error';
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isSignedIn } = useAuth();
    const { getToken } = useAuth();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [cartTotal, setCartTotal] = useState(0);

    const fetchCart = async () => {
        try {
            setStatus('loading');
            setError(null);
            const token = await getToken();
            const { data } = await api.get('/cart', { headers: { Authorization: `Bearer ${token}` } });
            if (data.success && data.data) {
                const serverCart = data.data;
                const mappedItems: CartItem[] = serverCart.items.map((item: any) => ({
                    id: item.product._id,
                    productId: item.product._id,
                    product: item.product,
                    quantity: item.quantity,
                    size: item?.size || "M",
                    price: item.price
                }));
                setCartItems(mappedItems);
                setCartTotal(serverCart.totalAmount);
                setStatus('success');
            }
        } catch (err: any) {
             const is401 = err.response?.status === 401;
            if (is401) {
                console.warn("Cart: Unauthorized (401). clearing state.");
                setError("Session expired. Please login again.");
                setCartItems([]);
                setCartTotal(0);
            } else {
                console.error("Failed to fetch cart:", err.message);
                setError("Failed to fetch cart.");
            }
            setStatus('error');
        }
    };

    const addToCart = async (product: Product, size: string) => {
        if (!isSignedIn) {
            return Toast.show({
                text1: 'Please login to add to cart',
                type: 'error',
            });
        }

        try {
            setStatus('loading');
            const token = await getToken();
            const { data } = await api.post('/cart/add', { productId: product._id, quantity: 1, size }, { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                await fetchCart();
            }
        } catch (error) {
            console.error("Failed to add to cart:", error);
            Toast.show({
                text1: 'Failed to add to cart',
                type: 'error',
            });
        } finally {
            setStatus('idle');
        }
    };

    const removeFromCart = async (productId: string, size: string) => {
        if (!isSignedIn) return;

        try {
            setStatus('loading');
            const token = await getToken();
            const { data } = await api.delete(`/cart/item/${productId}?size=${size}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (data.success) {
                await fetchCart();
            }
        } catch (error) {
            console.error("Failed to remove from cart:", error);
        } finally {
            setStatus('idle');
        }
    };

    const updateQuantity = async (productId: string, quantity: number, size: string = "M") => {
        if (!isSignedIn) return;
        if (quantity < 1) return;

        try {
            setStatus('loading');
            const token = await getToken();
            const { data } = await api.put(`/cart/item/${productId}`, { quantity, size }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                await fetchCart();
            }
        } catch (error) {
            console.error("Failed to update quantity:", error);
        } finally {
            setStatus('idle');
        }
    };

    const clearCart = async () => {
        if (!isSignedIn) return;

        try {
            setStatus('loading');
            const token = await getToken();
            const { data } = await api.delete('/cart', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (data.success) {
                setCartItems([]);
                setCartTotal(0);
            }
        } catch (error) {
            console.error("Failed to clear cart:", error);
        } finally {
            setStatus('idle');
        }
    };

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        if (isSignedIn) {
            fetchCart();
        } else {
            setCartItems([]);
            setCartTotal(0);
        }
    }, [isSignedIn]);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                itemCount,
                isLoading: status === 'loading',
                error,
                status
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
