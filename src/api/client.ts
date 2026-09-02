import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with YOUR computer's IP address from ipconfig
const BASE_URL = "https://ecommerce-ai-tryon.onrender.com/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Attach the auth token to every request automatically, if it exists
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;