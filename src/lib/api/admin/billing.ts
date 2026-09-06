import { apiClient } from "../../axios";

// ─── Types ─────────────────────────────────────────────────────────────────

export type BillingSubscriptionStatus =
  | "created" | "mandate_pending" | "trial" | "active"
  | "payment_failed" | "grace" | "retrying" | "suspended"
  | "inactive" | "expired" | "cancelled";

export interface BillingSubscription {
  id: number;
  businessId: number;
  plan_id: number | null;
  plan: string;
  status: BillingSubscriptionStatus;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  nextRenewalAt: string | null;
  razorpay_subscription_id: string | null;
  razorpay_customer_id: string | null;
  last_payment_id: string | null;
  last_payment_at: string | null;
  grace_start_date: string | null;
  grace_end_date: string | null;
  retry_count: number;
  suspended_at: string | null;
  activated_at: string | null;
  last_failure_reason: string | null;
  next_billing_date: string | null;
  next_retry_date: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── GET ALL ───────────────────────────────────────────────────────────────

export interface BillingSubscriptionsPage {
  items: BillingSubscription[];
  total: number;
  limit: number;
  offset: number;
}

export async function billingGetSubscriptions(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BillingSubscriptionsPage> {
  const res = await apiClient.get("/admin/billing/subscriptions", { params });
  // backend: { success: true, data: [...], total, limit, offset }
  return {
    items: res.data?.data ?? [],
    total: res.data?.total ?? (res.data?.data ?? []).length,
    limit: res.data?.limit ?? params?.limit ?? 20,
    offset: res.data?.offset ?? params?.offset ?? 0,
  };
}

export async function billingGetSubscriptionById(id: number): Promise<BillingSubscription | null> {
  const res = await apiClient.get(`/admin/billing/subscriptions/${id}`);
  return res.data?.data ?? null;
}

// ─── SUSPEND ──────────────────────────────────────────────────────────────

export async function billingSuspend(id: number): Promise<BillingSubscription> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/suspend`);
  return res.data?.data;
}

// ─── ACTIVATE ─────────────────────────────────────────────────────────────

export async function billingActivate(id: number): Promise<BillingSubscription> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/activate`);
  return res.data?.data;
}

// ─── EXTEND GRACE ─────────────────────────────────────────────────────────

export async function billingExtendGrace(id: number, days: number = 3): Promise<BillingSubscription> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/extend-grace`, { days });
  return res.data?.data;
}

// ─── CANCEL ───────────────────────────────────────────────────────────────

export async function billingCancel(id: number): Promise<{ status: string; cancelledAt: string }> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/cancel`);
  return res.data?.data;
}

// ─── REFUND ───────────────────────────────────────────────────────────────

export async function billingRefund(
  id: number,
  opts?: { paymentId?: string; amountPaise?: number; reason?: string }
): Promise<{ refundId: string; amount: number; status: string }> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/refund`, opts ?? {});
  return res.data?.data;
}

// ─── CHANGE PLAN ──────────────────────────────────────────────────────────

export async function billingChangePlan(id: number, planId: number): Promise<{ subscriptionId: number; newPlanId: number; planName: string }> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/change-plan`, { planId });
  return res.data?.data;
}

// ─── DISABLE MANDATE ──────────────────────────────────────────────────────

export async function billingDisableMandate(id: number): Promise<{ message: string; status: string }> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/disable-mandate`);
  return res.data?.data;
}

// ─── UPDATE BILLING DATE ──────────────────────────────────────────────────

export async function billingUpdateDate(id: number, billingDate: string): Promise<BillingSubscription> {
  const res = await apiClient.post(`/admin/billing/subscriptions/${id}/billing-date`, { billingDate });
  return res.data?.data;
}

// ─── DELETE ───────────────────────────────────────────────────────────────

export async function billingDelete(id: number): Promise<{ message: string }> {
  const res = await apiClient.delete(`/admin/billing/subscriptions/${id}`);
  return res.data?.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

export function formatBillingStatus(status: BillingSubscriptionStatus): string {
  const map: Record<string, string> = {
    created: "Created",
    mandate_pending: "Mandate Pending",
    trial: "Trial",
    active: "Active",
    payment_failed: "Payment Failed",
    grace: "Grace Period",
    retrying: "Retrying",
    suspended: "Suspended",
    inactive: "Inactive",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return map[status] ?? status;
}

export function statusColor(status: BillingSubscriptionStatus): string {
  if (status === "active" || status === "trial")
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (status === "grace" || status === "retrying" || status === "payment_failed")
    return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  if (status === "suspended" || status === "cancelled" || status === "expired")
    return "bg-red-500/15 text-red-300 border-red-500/30";
  return "bg-slate-500/15 text-slate-300 border-slate-500/30";
}