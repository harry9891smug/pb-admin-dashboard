import { apiClient } from "../../axios";

/* ---------------- Pricing tiers (add-ons: team licence, SMS credits) ---------------- */

export type PaymentType = "SUBSCRIPTION" | "PREPAID";

export interface PricingTier {
  id: number;
  featureCode: string;
  name: string;
  quantity: number | null;
  durationDays: number | null;
  price: string | number; // selling price (what is charged)
  mrp?: string | number | null; // display-only
  paymentType: PaymentType;
  isActive: boolean;
}

export type PricingTierPayload = {
  featureCode: string;
  name: string;
  quantity?: number | null;
  durationDays?: number | null;
  price: number;
  mrp?: number | null;
  paymentType: PaymentType;
  isActive?: boolean;
};

export const adminListPricingTiers = async (): Promise<PricingTier[]> => {
  const res = await apiClient.get("/admin/pricing-tiers");
  return res.data?.tiers ?? [];
};

export const adminCreatePricingTier = async (p: PricingTierPayload): Promise<PricingTier> => {
  const res = await apiClient.post("/admin/pricing-tiers", p);
  return res.data?.tier;
};

export const adminUpdatePricingTier = async (
  id: number,
  p: Partial<PricingTierPayload>
): Promise<PricingTier> => {
  const res = await apiClient.patch(`/admin/pricing-tiers/${id}`, p);
  return res.data?.tier;
};

export const adminRetirePricingTier = async (id: number): Promise<void> => {
  await apiClient.patch(`/admin/pricing-tiers/${id}/retire`);
};

/* ---------------- App feedback ---------------- */

export interface FeedbackRow {
  id: number;
  userId: number;
  rating: number;
  comment: string | null;
  appVersion: string | null;
  createdAt: string;
}

export const adminListFeedback = async (params: {
  rating?: number;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ count: number; rows: FeedbackRow[] }> => {
  const res = await apiClient.get("/admin/feedback", { params });
  const d = res.data?.data;
  return { count: d?.count ?? 0, rows: d?.rows ?? [] };
};

/* ---------------- App version / force update ---------------- */

export type AppVersionPayload = {
  latestVersionName: string;
  latestVersionCode: number;
  downloadUrl: string;
  releaseNotes?: string | null;
  forceUpdate?: boolean;
};

/** Public read (the app calls this on start-up). */
export const getAppVersion = async (appKey: string): Promise<AppVersionPayload | null> => {
  try {
    const res = await apiClient.get(`/app-version/${encodeURIComponent(appKey)}`);
    return res.data?.data ?? null;
  } catch {
    return null;
  }
};

export const adminUpdateAppVersion = async (appKey: string, p: AppVersionPayload) => {
  const res = await apiClient.patch(`/admin/app-version/${encodeURIComponent(appKey)}`, p);
  return res.data?.data;
};
