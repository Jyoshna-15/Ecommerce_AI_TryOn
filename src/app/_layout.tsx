import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { Alert } from "react-native";
import { getMessaging, onMessage } from "@react-native-firebase/messaging";
import { useAuthStore } from "../store/authStore";

export default function RootLayout() {
  const loadAuthFromStorage = useAuthStore((state) => state.loadAuthFromStorage);

  useEffect(() => {
    loadAuthFromStorage();

    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      Alert.alert(
        remoteMessage.notification?.title || "Notification",
        remoteMessage.notification?.body
      );
    });

    return unsubscribe;
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="map-picker" />
    </Stack>
  );
}