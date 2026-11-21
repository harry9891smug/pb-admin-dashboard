import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError } from "../utils";

// Mirrors owner_type in the backend's referral_codes table.
export const REFERRAL_OWNER_TYPES = ["influencer", "associate", "sales", "other"] as const;
export type ReferralOwnerType = (typeof REFERRAL_OWNER_TYPES)[number];

export type ReferralCode = {
  id: number;
  code: string;
  ownerType: ReferralOwnerType;
  ownerName: string;
  notes: string | null;
  smsCredits: number;
  maxUses: number | null;
  isActive: boolean;
  createdAt: string;
  signups: number; // businesses that registered with this code
  activeBusinesses: number; // of those, how many created at least one invoice
  creditsGranted: number;
  creditsUsed: number;
};

export type ReferralLeader = {
  ownerType: ReferralOwnerType;
  ownerName: string;
  codes: number;
  signups: number;
  activeBusinesses: number;
};

export type ReferralSignup = {
  id: number;
  businessId: number;
  businessName: string | null;
  creditsGranted: number;
  createdAt: string;
  invoices: number;
};

// GET /admin/referrals — requires business.view
export const adminListReferrals = async (ownerType?: ReferralOwnerType): Promise<ReferralCode[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/referrals", {
      headers: authHeader(token),
      params: ownerType ? { ownerType } : undefined,
    });
    return res.data?.data ?? [];
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// GET /admin/referrals/leaderboard — requires business.view
export const adminReferralLeaderboard = async (): Promise<ReferralLeader[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/referrals/leaderboard", { headers: authHeader(token) });
    return res.data?.data ?? [];
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// GET /admin/referrals/:id/redemptions — requires business.view
export const adminReferralSignups = async (id: number): Promise<ReferralSignup[]> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get(`/admin/referrals/${id}/redemptions`, { headers: authHeader(token) });
    return res.data?.data ?? [];
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// POST /admin/referrals — requires subscription.update
export const adminCreateReferral = async (payload: {
  code: string;
  ownerType: ReferralOwnerType;
  ownerName: string;
  notes?: string;
  smsCredits?: number;
  maxUses?: number | null;
}): Promise<{ id: number; code: string }> => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/referrals", payload, { headers: authHeader(token) });
    return res.data?.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// PATCH /admin/referrals/:id — requires subscription.update
export const adminUpdateReferral = async (
  id: number,
  payload: Partial<{
    ownerType: ReferralOwnerType;
    ownerName: string;
    notes: string | null;
    smsCredits: number;
    maxUses: number | null;
    isActive: boolean;
  }>
): Promise<void> => {
  const token = ensureToken();
  try {
    await apiClient.patch(`/admin/referrals/${id}`, payload, { headers: authHeader(token) });
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
