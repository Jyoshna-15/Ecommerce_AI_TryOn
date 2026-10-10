import apiClient from "./client";

export const updateFcmToken = async (fcmToken: string) => {
  const response = await apiClient.post("/auth/fcm-token", { fcmToken });
  return response.data;
};