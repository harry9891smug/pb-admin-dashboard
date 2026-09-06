import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError } from "../utils";

// Mirrors VALID_PROMODESK_ROLES in the backend's promoDeskUserAdmin.service.ts.
export const PROMODESK_USER_ROLES = ["salesExecutive", "salesManager", "superAdmin"] as const;
export type PromoDeskUserRole = (typeof PROMODESK_USER_ROLES)[number];

export type PromoDeskUser = {
  userId: number;
  mobile: string;
  email: string | null;
  displayName: string | null;
  isManager: boolean;
  status: string | null;
  roles: string[];
  createdAt: string;
};

export type CreatedPromoDeskUser = {
  userId: number;
  mobile: string;
  email: string | null;
  role: PromoDeskUserRole;
  displayName: string | null;
};

// GET /admin/promodesk-users — requires promodesk_user.view
export const adminListPromoDeskUsers = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: PromoDeskUser[]; total: number; page: number; limit: number; totalPages: number }> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/promodesk-users", {
      headers: authHeader(token),
      params,
    });
    const data = res.data?.data ?? {};
    return {
      items: data.promoDeskUsers ?? [],
      total: data.pagination?.total ?? 0,
      page: data.pagination?.page ?? 1,
      limit: data.pagination?.limit ?? 20,
      totalPages: data.pagination?.totalPages ?? 1,
    };
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// POST /admin/promodesk-users — requires promodesk_user.create
export const adminCreatePromoDeskUser = async (payload: {
  mobile: string;
  email: string;
  password: string;
  role: PromoDeskUserRole;
  displayName?: string;
}): Promise<CreatedPromoDeskUser> => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/promodesk-users", payload, {
      headers: authHeader(token),
    });
    return res.data?.data?.promoDeskUser;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
