import axios from "axios";
import { getAuthToken, clearAuth } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/";

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

// ✅ Auto logout + redirect on 401/403
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      // ✅ clear everything
      clearAuth();
      localStorage.removeItem("pb_admin_refresh_token");
      localStorage.removeItem("pb_admin_user");

      // ✅ prevent toast loop / multi redirect
      if (!isRedirecting) {
        isRedirecting = true;
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
