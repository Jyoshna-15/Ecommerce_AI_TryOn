import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const loadAuthFromStorage = useAuthStore((state) => state.loadAuthFromStorage);

  useEffect(() => {
    loadAuthFromStorage();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="home" />
       <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
    </Stack>
  );
}