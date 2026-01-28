// lib/api/admin/jobRole.ts
import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError, unwrapList } from "../utils";

export type JobRolePolicy = { id: number; key: string; label?: string | null };
export type JobRoleGroup = { id: number; name: string; policies?: JobRolePolicy[] };

export type AdminJobRole = {
  id: number;
  name: string;
  groups?: JobRoleGroup[];
};

export const adminListJobRoles = async (): Promise<AdminJobRole[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/access/job-role/list", {
      headers: authHeader(token),
    });
    // controller returns {success:true, items: out}
    return unwrapList<AdminJobRole>(res);
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminCreateJobRole = async (payload: { name: string }) => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/access/job-role/create", payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminSetJobRoleGroups = async (jobRoleId: number, groupIds: number[]) => {
  const token = ensureToken();
  try {
    const res = await apiClient.put(
      `/admin/access/job-role/update/${jobRoleId}/groups`,
      { groupIds },
      { headers: authHeader(token) }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
