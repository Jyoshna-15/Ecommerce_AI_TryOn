import apiClient from "./client";

export const createPaymentOrder = async (amount: number) => {
  const response = await apiClient.post("/payments/create-order", { amount });
  return response.data;
};

export const verifyPaymentAndCreateOrder = async (paymentData: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  addressId: string;
}) => {
  const response = await apiClient.post("/payments/verify", paymentData);
  return response.data;
};