import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError } from "../utils";

export type TeamMember = {
  id: number;
  email: string;
  mobile: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  adminJobRole?: { id: number; name: string } | null;
  adminRoles?: { id: number; name: string }[]; // extra groups
};

export const adminCreateTeamMember = async (payload: {
  mobile?: string;
  email: string;
  password: string;
  jobRoleId: number;
  extraGroupIds?: number[];
}) => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/team/create", payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminListTeamMembers = async (params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/team/list", {
      headers: authHeader(token),
      params,
    });
    // controller returns {success:true, items, total, limit, offset}
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminGetTeamMemberById = async (id: number) => {
  const token = ensureToken();
  try {
    const res = await apiClient.get(`/admin/team/byid/${id}`, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminUpdateTeamMember = async (
  id: number,
  payload: {
    mobile?: string;
    email?: string;
    password?: string;
    jobRoleId?: number;
    extraGroupIds?: number[];
  }
) => {
  const token = ensureToken();
  try {
    const res = await apiClient.patch(`/admin/team/update/${id}`, payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminDeleteTeamMember = async (id: number) => {
  const token = ensureToken();
  try {
    const res = await apiClient.delete(`/admin/team/delete/${id}`, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
