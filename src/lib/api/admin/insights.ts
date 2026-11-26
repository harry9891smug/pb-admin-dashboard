import { apiClient } from "../../axios";

type Failed = { error: string };

export interface InsightsOperations {
  businesses: { total: number; new7: number; new30: number };
  offers: { total: number; active: number };
  sms: { thisMonth: number; lastMonth: number };
  subscriptionsByStatus: { status: string; count: number }[];
  trialsEndingIn7Days: number;
  cases: { totalOpen: number; unassigned: number; mine: number; callbacks: number; callbacksUnassigned: number };
}

export interface InsightsRevenue {
  allTime: number;
  byMonth: { month: string; amount: number; invoices: number }[];
}

export interface InsightsSatisfaction {
  total: number;
  average: number | null;
  last30: { average: number | null; count: number };
  distribution: { rating: number; count: number }[];
}

export interface InsightsPayments {
  last30ByStatus: { status: string; count: number }[];
}

export interface InsightsSystem {
  environment: string;
  node: string;
  uptimeSeconds: number;
  memoryMb: { rss: number; heapUsed: number };
  disk?: { totalGb: number; freeGb: number } | null;
  host: { cpus: number; load1m: number; freeMemMb: number; totalMemMb: number };
  database: { latencyMs: number; sizeMb: number; connections: number | null };
  s3: { latencyMs: number; reachable: boolean };
  integrations: { razorpay: boolean; whatsapp: boolean; sms: boolean; smtp: boolean };
}

export interface Insights {
  generatedAt: string;
  operations: InsightsOperations | Failed;
  revenue: InsightsRevenue | Failed;
  satisfaction: InsightsSatisfaction | Failed;
  payments: InsightsPayments | Failed;
  system: InsightsSystem | Failed;
}

export const isFailed = (v: any): v is Failed => !!v && typeof v === "object" && "error" in v;

export const getInsights = async () => (await apiClient.get("/admin/insights")).data as Insights;
