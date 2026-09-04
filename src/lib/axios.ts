import axios from "axios";
import { getAuthToken, clearAuth } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-staging.promobandhu.com/";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

// ✅ Attach token on every request
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

// ✅ Auto logout + redirect on 401 only (not 403 - permission error)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 && typeof window !== "undefined") {
      clearAuth();
      localStorage.removeItem("pb_admin_refresh_token");
      localStorage.removeItem("pb_admin_user");

      if (!isRedirecting) {
        isRedirecting = true;
        window.location.href = "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);