import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError } from "../utils";

// Business email demand test: which paying businesses claimed which name.

export type BusinessEmailClaim = {
  id: number;
  businessId: number;
  businessName: string | null;
  city: string | null;
  mobile: string | null;
  name: string;
  address: string;
  status: string;
  isSensitive: boolean;
  sensitiveReason: string | null;
  createdAt: string;
};

export type BusinessEmailSummary = {
  claims: number;
  paidBusinesses: number;
  claimRatePercent: number;
};

export type BusinessEmailClaimList = {
  summary: BusinessEmailSummary;
  total: number;
  items: BusinessEmailClaim[];
};

// GET /admin/business-email/claims — requires business.view
export const adminListBusinessEmailClaims = async (params: {
  search?: string;
  sensitive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BusinessEmailClaimList> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/business-email/claims", {
      headers: authHeader(token),
      params: {
        search: params.search || undefined,
        sensitive: params.sensitive ? "true" : undefined,
        limit: params.limit,
        offset: params.offset,
      },
    });
    const d = res.data?.data ?? res.data;
    return {
      summary: d?.summary ?? { claims: 0, paidBusinesses: 0, claimRatePercent: 0 },
      total: d?.total ?? 0,
      items: d?.items ?? [],
    };
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
