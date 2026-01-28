import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError, unwrapList } from "../utils";

export type AdminPermission = {
  id: number;
  key: string;
  label?: string | null;
};

export type AdminGroup = {
  id: number;
  name: string;
  permissions?: AdminPermission[];
};

// ------- My Permissions -------
export const adminGetMyPermissions = async (): Promise<AdminPermission[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/access/me/permissions", {
      headers: authHeader(token),
    });
    // controller returns {success:true, permissions: [...]}
    return (res.data?.permissions ?? res.data?.data?.permissions ?? []) as AdminPermission[];
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ------- Permissions CRUD -------
export const adminListPermissions = async (): Promise<AdminPermission[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/access/permissions", {
      headers: authHeader(token),
    });
    return unwrapList<AdminPermission>(res);
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminCreatePermission = async (payload: { key: string; label?: string | null }) => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/access/permissions", payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminDeletePermission = async (id: number) => {
  const token = ensureToken();
  try {
    const res = await apiClient.delete(`/admin/access/permissions/${id}`, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ------- Groups (Roles) CRUD -------
export const adminListGroups = async (): Promise<AdminGroup[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/access/groups", {
      headers: authHeader(token),
    });
    // controller returns {success:true, items:[{id,name,permissions:[]}]}
    return unwrapList<AdminGroup>(res);
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminCreateGroup = async (payload: { name: string }) => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/access/groups", payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminUpdateGroup = async (id: number, payload: { name: string }) => {
  const token = ensureToken();
  try {
    const res = await apiClient.patch(`/admin/access/groups/${id}`, payload, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

export const adminDeleteGroup = async (id: number) => {
  const token = ensureToken();
  try {
    const res = await apiClient.delete(`/admin/access/groups/${id}`, {
      headers: authHeader(token),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ------- Assign permissions to a group -------
export const adminSetGroupPermissions = async (groupId: number, permissionIds: number[]) => {
  const token = ensureToken();
  try {
    const res = await apiClient.put(
      `/admin/access/groups/${groupId}/permissions`,
      { permissionIds },
      { headers: authHeader(token) }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ------- Assign groups to a user -------
export const adminSetUserGroups = async (userId: number, roleIds: number[]) => {
  const token = ensureToken();
  try {
    const res = await apiClient.put(
      `/admin/access/users/${userId}/roles`,
      { roleIds },
      { headers: authHeader(token) }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
