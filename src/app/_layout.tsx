import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { tokenCache } from '@clerk/expo/token-cache'
// import { CartProvider } from "@/context/CartContext";
// import { WishlistProvider } from "@/context/WishlistContext";
import { ClerkProvider } from '@clerk/expo'

import Toast from 'react-native-toast-message';
import "@/global.css";
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!
console.log("DEBUG - Clerk Key:", publishableKey);
// if (!publishableKey) {
//   console.error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in environment variables.");
//   throw new Error('Add your Clerk Publishable Key to the .env file')
// }
export default function RootLayout() {
  return (
     <GestureHandlerRootView style={{ flex: 1 }}>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
                
                        <Stack screenOptions={{ headerShown: false }} />
                        <Toast />
   
            </ClerkProvider>
        </GestureHandlerRootView>
  )
}
