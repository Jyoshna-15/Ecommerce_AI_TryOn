import apiClient from "./client";

export const createOrder = async (addressId: string) => {
  const response = await apiClient.post("/orders", { addressId });
  return response.data;
};

export const getUserOrders = async () => {
  const response = await apiClient.get("/orders");
  return response.data;
};