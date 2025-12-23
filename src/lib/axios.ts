import axios from "axios";
import { getAuthToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
