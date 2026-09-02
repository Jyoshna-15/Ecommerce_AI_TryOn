import apiClient from "./client";

export interface CartItem {
  id: string;
  productId: string;
  size: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrls: string[];
  };
}

export const getCart = async (): Promise<CartItem[]> => {
  const response = await apiClient.get("/cart");
  return response.data;
};

export const addToCart = async (productId: string, size: string, quantity: number = 1) => {
  const response = await apiClient.post("/cart", { productId, size, quantity });
  return response.data;
};

export const updateCartItem = async (itemId: string, quantity: number) => {
  const response = await apiClient.put(`/cart/${itemId}`, { quantity });
  return response.data;
};

export const removeCartItem = async (itemId: string) => {
  const response = await apiClient.delete(`/cart/${itemId}`);

  return response.data;
};