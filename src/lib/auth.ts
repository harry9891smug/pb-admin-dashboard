const ACCESS_TOKEN_KEY = "pb_admin_access_token";

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
