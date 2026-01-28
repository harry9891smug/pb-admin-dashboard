import { getAuthToken } from "../auth";

export const unwrapList = <T = any>(res: any): T[] => {
  const list = res?.data?.items ?? res?.data?.data?.items ?? res?.data?.data ?? [];
  return Array.isArray(list) ? list : [];
};

export const unwrapObj = <T = any>(res: any): T => {
  return (res?.data?.data ?? res?.data ?? {}) as T;
};

export const ensureToken = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");
  return token;
};

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const extractApiError = (err: any) => {
  const data = err?.response?.data;
  const msg =
    data?.error?.message ||
    data?.message ||
    err?.message ||
    "Request failed";

  const fieldErrors = data?.error?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const lines = Object.entries(fieldErrors)
      .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v.join(", ") : String(v))}`)
      .join(" | ");
    return `${msg} (${lines})`;
  }
  return msg;
};
