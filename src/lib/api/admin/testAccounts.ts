import { apiClient } from "../../axios";
import { authHeader, ensureToken, extractApiError } from "../utils";

// Mirrors VALID_ACCOUNT_TYPES in the backend's testAccountAdmin.service.ts —
// keep these two lists in sync if a new account type is ever added there.
export const TEST_ACCOUNT_TYPES = [
  "google_reviewer",
  "internal_testing",
  "sales_demo",
  "support_qa",
] as const;

export type TestAccountType = (typeof TEST_ACCOUNT_TYPES)[number];

export type TestAccount = {
  userId: number;
  email: string | null;
  mobile: string | null;
  accountType: TestAccountType;
  status: "active" | "revoked";
  passwordLoginEnabled: boolean;
  passwordLoginExpiresAt: string | null;
  businessId: number | null;
  businessName: string | null;
  businessPublicId: string | null;
  grantExpiresAt: string | null;
  planName: string | null;
  createdAt: string;
  notes: string | null;
};

export type CreatedTestAccount = {
  userId: number;
  email: string;
  mobile: string;
  accountType: TestAccountType;
  businessId: number;
  businessName: string;
  businessPublicId: string;
  planName: string;
  grantId: number;
  grantExpiresAt: string;
  passwordLoginExpiresAt: string | null;
};

// GET /admin/test-accounts — requires test_account.view
export const adminListTestAccounts = async (params?: {
  accountType?: TestAccountType;
  status?: "active" | "revoked";
  page?: number;
  limit?: number;
}): Promise<{ items: TestAccount[]; total: number; page: number; limit: number; totalPages: number }> => {
  const token = ensureToken();
  try {
    const res = await apiClient.get("/admin/test-accounts", {
      headers: authHeader(token),
      params,
    });
    const data = res.data?.data ?? {};
    return {
      items: data.testAccounts ?? [],
      total: data.pagination?.total ?? 0,
      page: data.pagination?.page ?? 1,
      limit: data.pagination?.limit ?? 50,
      totalPages: data.pagination?.totalPages ?? 1,
    };
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// POST /admin/test-accounts — requires test_account.create
export const adminCreateTestAccount = async (payload: {
  email: string;
  password: string;
  accountType: TestAccountType;
  grantDays: number;
  notes?: string;
}): Promise<CreatedTestAccount> => {
  const token = ensureToken();
  try {
    const res = await apiClient.post("/admin/test-accounts", payload, {
      headers: authHeader(token),
    });
    return res.data?.data?.testAccount;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// PATCH /admin/test-accounts/:userId/extend — requires test_account.extend
export const adminExtendTestAccount = async (
  userId: number,
  additionalDays: number
): Promise<{ userId: number; grantExpiresAt: string | null; passwordLoginExpiresAt: string | null }> => {
  const token = ensureToken();
  try {
    const res = await apiClient.patch(
      `/admin/test-accounts/${userId}/extend`,
      { additionalDays },
      { headers: authHeader(token) }
    );
    return res.data?.data?.testAccount;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// PATCH /admin/test-accounts/:userId/revoke — requires test_account.revoke
export const adminRevokeTestAccount = async (
  userId: number
): Promise<{ userId: number; status: "revoked" }> => {
  const token = ensureToken();
  try {
    const res = await apiClient.patch(
      `/admin/test-accounts/${userId}/revoke`,
      {},
      { headers: authHeader(token) }
    );
    return res.data?.data?.testAccount;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};
