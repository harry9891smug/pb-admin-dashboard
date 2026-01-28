import { apiClient } from "../../axios";

export interface SmsUsageBusinessRow {
  businessId: number;
  businessName: string | null;
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export interface SmsUsageBusinessesResponse {
  success: boolean;
  month: string | null; // YYYY-MM or null
  items: SmsUsageBusinessRow[];
}

export interface SmsUsageMonthlyRow {
  month: string; // YYYY-MM
  total: number;
  sent: number;
  failed: number;
}

export interface SmsUsageMonthlyResponse {
  success: boolean;
  range: { from: string | null; to: string | null };
  items: SmsUsageMonthlyRow[];
}

export interface SmsUsageBusinessMonthlyResponse {
  success: boolean;
  businessId: number;
  range: { from: string | null; to: string | null };
  items: SmsUsageMonthlyRow[];
}

export const adminSmsUsageBusinesses = async (params?: {
  month?: string; // YYYY-MM
}): Promise<SmsUsageBusinessesResponse> => {
  const res = await apiClient.get("/admin/sms/usage/businesses", { params });
  return res.data;
};

export const adminSmsUsageMonthly = async (params?: {
  from?: string; // YYYY-MM
  to?: string;   // YYYY-MM
}): Promise<SmsUsageMonthlyResponse> => {
  const res = await apiClient.get("/admin/sms/usage/monthly", { params });
  return res.data;
};

export const adminSmsUsageBusinessMonthly = async (
  businessId: number,
  params?: { from?: string; to?: string }
): Promise<SmsUsageBusinessMonthlyResponse> => {
  const res = await apiClient.get(`/admin/sms/usage/business/${businessId}/monthly`, { params });
  return res.data;
};
