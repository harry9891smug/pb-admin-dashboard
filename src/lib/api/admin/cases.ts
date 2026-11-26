import { apiClient } from "../../axios";

export interface CaseLookup {
  id: number;
  key: string;
  name: string;
  isFinal?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface CaseUserLite {
  id: number;
  mobile?: string | null;
  email?: string | null;
}

export interface CaseBusinessLite {
  id: number;
  publicId?: string | null;
  businessname?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  pincode?: string | null;
  logoUrl?: string | null;
}

export interface CaseRemark {
  id: number;
  remark: string;
  isPublic: boolean;
  createdBy?: number | null;
  createdAt: string;
}

export interface CaseRow {
  id: number;
  ticketNumber: string;
  userId: number | null;
  title: string;
  description?: string | null;
  categoryId: number;
  statusId: number;
  priorityId: number;
  assignedTo: number | null;
  assignedTeamId: number | null;
  createdAt: string;
  updatedAt: string;
  category?: CaseLookup;
  status?: CaseLookup;
  priority?: CaseLookup;
  user?: CaseUserLite | null;
  business?: CaseBusinessLite | null;
  assignee?: CaseUserLite | null;
  remarks?: CaseRemark[];
}

export interface CaseListParams {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: number;
  priorityId?: number;
  categoryKey?: string;
  assignedTo?: number;
  assignedTeamId?: number;
  unassigned?: boolean;
  openOnly?: boolean;
}

export interface CaseSummary {
  totalOpen: number;
  unassigned: number;
  mine: number;
  callbacks: number;
  callbacksUnassigned: number;
}

export interface SupportQueue {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface QueueUser {
  id: number;
  displayName: string;
  email?: string | null;
  mobile?: string | null;
  role?: string | null;
  profileImageUrl?: string | null;
}

export interface AdminUserLite {
  id: number;
  email?: string | null;
  mobile?: string | null;
}

const unwrap = <T,>(r: any): T => (r?.data?.data ?? r?.data) as T;

export const listCases = async (p: CaseListParams = {}) => {
  const params: Record<string, any> = {
    page: p.page ?? 1,
    limit: p.limit ?? 25,
  };
  if (p.search) params.search = p.search;
  if (p.statusId) params.statusId = p.statusId;
  if (p.priorityId) params.priorityId = p.priorityId;
  if (p.categoryKey) params.categoryKey = p.categoryKey;
  if (p.assignedTo) params.assignedTo = p.assignedTo;
  if (p.assignedTeamId) params.assignedTeamId = p.assignedTeamId;
  if (p.unassigned) params.unassigned = "1";
  if (p.openOnly) params.openOnly = "1";
  const res = await apiClient.get("/admin/cases", { params });
  // The API answers { success, data: { total, page, limit, data: rows } }.
  const body = res.data;
  const inner = body?.data && !Array.isArray(body.data) ? body.data : body;
  return {
    total: Number(inner?.total ?? 0),
    page: Number(inner?.page ?? 1),
    limit: Number(inner?.limit ?? 25),
    data: (Array.isArray(inner?.data) ? inner.data : []) as CaseRow[],
  };
};

export const getCase = async (id: number) =>
  unwrap<CaseRow>(await apiClient.get(`/admin/cases/${id}`));

export const getCaseSummary = async () =>
  unwrap<CaseSummary>(await apiClient.get("/admin/cases/summary"));

export const assignCase = async (id: number, adminUserId: number) =>
  unwrap<CaseRow>(await apiClient.put(`/admin/cases/${id}/assign`, { adminUserId }));

export const assignCaseQueue = async (id: number, assignedTeamId: number) =>
  unwrap<CaseRow>(await apiClient.put(`/admin/cases/${id}/queue`, { assignedTeamId }));

export const updateCaseStatus = async (id: number, statusId: number) =>
  unwrap<CaseRow>(await apiClient.put(`/admin/cases/${id}/status`, { statusId }));

export const updateCaseCategory = async (id: number, categoryKey: string) =>
  unwrap<CaseRow>(await apiClient.put(`/admin/cases/${id}/category`, { categoryKey }));

export const closeCase = async (id: number) =>
  unwrap<CaseRow>(await apiClient.put(`/admin/cases/${id}/close`));

export const addCaseRemark = async (id: number, remark: string, isPublic: boolean) =>
  unwrap<CaseRemark>(await apiClient.post(`/admin/cases/${id}/remarks`, { remark, isPublic }));

export const listCaseStatuses = async () =>
  unwrap<CaseLookup[]>(await apiClient.get("/admin/case-config/statuses"));
export const listCaseCategories = async () =>
  unwrap<CaseLookup[]>(await apiClient.get("/admin/case-config/categories"));
export const listCasePriorities = async () =>
  unwrap<CaseLookup[]>(await apiClient.get("/admin/case-config/priorities"));

// ---- Case settings (statuses / categories / priorities) CRUD ----
export type CaseConfigKind = "statuses" | "categories" | "priorities";

export interface CaseConfigRow {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
  isFinal?: boolean;
  order?: number;
  slaMinutes?: number | null;
}

export type CaseConfigInput = Partial<Omit<CaseConfigRow, "id">>;

export const listCaseConfig = async (kind: CaseConfigKind) =>
  unwrap<CaseConfigRow[]>(await apiClient.get(`/admin/case-config/${kind}`));
export const createCaseConfig = async (kind: CaseConfigKind, b: CaseConfigInput) =>
  unwrap<CaseConfigRow>(await apiClient.post(`/admin/case-config/${kind}`, b));
export const updateCaseConfig = async (kind: CaseConfigKind, id: number, b: CaseConfigInput) =>
  unwrap<CaseConfigRow>(await apiClient.put(`/admin/case-config/${kind}/${id}`, b));
export const deleteCaseConfig = async (kind: CaseConfigKind, id: number) => {
  await apiClient.delete(`/admin/case-config/${kind}/${id}`);
};

// ------------------------------------------------------------------ queues
export const listQueues = async () =>
  unwrap<SupportQueue[]>(await apiClient.get("/admin/support-queues"));
export const createQueue = async (b: { code: string; name: string; description?: string }) =>
  unwrap<SupportQueue>(await apiClient.post("/admin/support-queues", b));
export const updateQueue = async (
  id: number,
  b: Partial<{ code: string; name: string; description: string; isActive: boolean }>
) => unwrap<SupportQueue>(await apiClient.put(`/admin/support-queues/${id}`, b));
export const deleteQueue = async (id: number) => {
  await apiClient.delete(`/admin/support-queues/${id}`);
};
export const listQueueUsers = async (id: number) =>
  unwrap<QueueUser[]>(await apiClient.get(`/admin/support-queues/${id}/users`));
export const addQueueUser = async (id: number, userId: number) =>
  apiClient.post(`/admin/support-queues/${id}/users`, { userId });
export const removeQueueUser = async (id: number, userId: number) =>
  apiClient.delete(`/admin/support-queues/${id}/users/${userId}`);

// Admin (team) users to pick from when assigning
export const listAdminUsers = async (search = "") => {
  // Preferred: light list for anyone who can view cases. Falls back to the
  // Team Members list for roles that only have team.view / queue permissions.
  try {
    const res = await apiClient.get("/admin/cases/assignees", {
      params: { search: search || undefined },
    });
    return (res.data?.items ?? []) as AdminUserLite[];
  } catch (e: any) {
    if (e?.response?.status !== 403 && e?.response?.status !== 404) throw e;
    const res = await apiClient.get("/admin/team/list", {
      params: { limit: 100, offset: 0, search: search || undefined },
    });
    return (res.data?.items ?? []) as AdminUserLite[];
  }
};

export const apiErrorMessage = (e: any, fallback: string) =>
  e?.response?.data?.message ||
  e?.response?.data?.error?.message ||
  e?.message ||
  fallback;
