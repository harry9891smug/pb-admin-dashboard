import { apiClient } from "../../axios";

export interface DashboardActivityItem {
  type: "business" | "offer" | "subscription";
  label: string;
  action: string;
  time: string;
}

export interface DashboardSummary {
  businesses: { total: number; active: number };
  offers: { total: number; active: number };
  sms: { thisMonth: number };
  revenue: { thisWeek: number; thisMonth: number; allTime: number };
  recentActivity: DashboardActivityItem[];
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
}

export const getAdminDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await apiClient.get<DashboardSummaryResponse>("/admin/dashboard/summary");
  return res.data.data;
};
