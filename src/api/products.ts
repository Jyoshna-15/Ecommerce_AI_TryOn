import apiClient from "./client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string[];
  stock: number;
  imageUrls: string[];
}

export const getProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get("/products");
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};