import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { getMessaging, requestPermission, getToken, AuthorizationStatus } from "@react-native-firebase/messaging";
import { updateFcmToken } from "../../api/notifications";

export default function TabsLayout() {
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (Platform.OS === "android") {
          const { status } = await Notifications.requestPermissionsAsync();
          console.log("Android notification permission status:", status);
        }

        const messaging = getMessaging();
        const authStatus = await requestPermission(messaging);
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await getToken(messaging);
          console.log("FCM Token:", token);
          await updateFcmToken(token);
        }
      } catch (error) {
        console.error("Failed to setup notifications:", error);
      }
    };

    setupNotifications();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8, borderTopColor: "#eee" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}