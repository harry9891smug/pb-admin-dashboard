import { apiClient } from "../../axios";

export interface AuditLogRow {
  id: number | string;
  adminUserId: number | null;
  adminEmail?: string | null;
  adminMobile?: string | null;
  method: string;
  path: string;
  entity?: string | null;
  entityId?: string | null;
  statusCode: number | null;
  ip?: string | null;
  body?: Record<string, any> | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface AuditParams {
  q?: string;
  adminUserId?: number;
  method?: string;
  entity?: string;
  failedOnly?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const listAuditLogs = async (p: AuditParams = {}) => {
  const params: Record<string, any> = {};
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== false) params[k] = v;
  });
  const r = await apiClient.get("/admin/audit-logs", { params });
  return { rows: (r.data?.rows ?? []) as AuditLogRow[], total: (r.data?.total ?? 0) as number };
};
