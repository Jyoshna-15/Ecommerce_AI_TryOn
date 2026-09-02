import apiClient from "./client";

export const signup = async (name: string, email: string, password: string) => {
  const response = await apiClient.post("/auth/signup", { name, email, password });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};