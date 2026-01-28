import { apiClient } from "../../axios";

export type SubscriptionPlan = "basic" | "standard" | "premium";
export type SubscriptionStatus = "trial" | "active" | "cancelled";

export interface AdminSubscription {
  id: number;
  businessId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  nextRenewalAt: string | null;
  createdAt: string;
  updatedAt: string;
  business?: any;
}

export interface AdminSubscriptionsResponse {
  success: boolean;
  data: {
    subscriptions: AdminSubscription[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface AdminSingleSubscriptionResponse {
  success: boolean;
  data: { subscription: AdminSubscription };
}

export interface AdminBusinessSubscriptionsResponse {
  success: boolean;
  data: {
    business: any;
    subscriptions: AdminSubscription[];
  };
}

export interface CreateSubscriptionInput {
  userId: number;
  plan: SubscriptionPlan;
  status?: SubscriptionStatus;
  trialDays?: number;
  startDate?: string; // ISO
  endDate?: string;   // ISO
}

export interface UpdateSubscriptionInput {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
}

export const adminGetSubscriptions = async (params?: {
  page?: number;
  limit?: number;
  status?: SubscriptionStatus;
  plan?: SubscriptionPlan;
  businessId?: number;
  userId?: number;
}): Promise<AdminSubscriptionsResponse> => {
  const res = await apiClient.get("/admin/subscriptions", { params });
  return res.data;
};

export const adminGetSubscriptionById = async (
  subscriptionId: number
): Promise<AdminSingleSubscriptionResponse> => {
  const res = await apiClient.get(`/admin/subscriptions/${subscriptionId}`);
  return res.data;
};

export const adminGetBusinessSubscriptions = async (
  businessId: number
): Promise<AdminBusinessSubscriptionsResponse> => {
  const res = await apiClient.get(`/admin/subscriptions/business/${businessId}`);
  return res.data;
};

export const adminCreateSubscription = async (
  input: CreateSubscriptionInput
): Promise<AdminSingleSubscriptionResponse> => {
  const res = await apiClient.post("/admin/subscriptions", input);
  return res.data;
};

export const adminUpdateSubscription = async (
  subscriptionId: number,
  input: UpdateSubscriptionInput
): Promise<AdminSingleSubscriptionResponse> => {
  const res = await apiClient.put(`/admin/subscriptions/${subscriptionId}`, input);
  return res.data;
};

export const adminCancelSubscription = async (
  subscriptionId: number
): Promise<AdminSingleSubscriptionResponse> => {
  const res = await apiClient.delete(`/admin/subscriptions/${subscriptionId}/cancel`);
  return res.data;
};
