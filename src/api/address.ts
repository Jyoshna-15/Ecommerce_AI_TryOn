import apiClient from "./client";

export interface Address {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
   lat?: number;
  lng?: number;
}

export const getAddresses = async (): Promise<Address[]> => {
  const response = await apiClient.get("/addresses");
  return response.data;
};

export const createAddress = async (data: Omit<Address, "id">) => {
  const response = await apiClient.post("/addresses", data);
  return response.data;
};