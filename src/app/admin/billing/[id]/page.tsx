"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  billingGetSubscriptions,
  billingSuspend,
  billingActivate,
  billingCancel,
  billingExtendGrace,
  billingRefund,
  billingChangePlan,
  billingDisableMandate,
  billingUpdateDate,
  billingDelete,
  BillingSubscription,
} from "@/lib/api/admin/billing";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/lib/toast";

// ─── Status config ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active:          { label: "Active",          color: "#10b981", bg: "rgba(16,185,129,0.1)",  dot: "#10b981" },
  trial:           { label: "Trial",           color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  dot: "#3b82f6" },
  grace:           { label: "Grace Period",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  dot: "#f59e0b" },
  retrying:        { label: "Retrying",        color: "#f97316", bg: "rgba(249,115,22,0.1)",  dot: "#f97316" },
  payment_failed:  { label: "Payment Failed",  color: "#ef4444", bg: "rgba(239,68,68,0.1)",   dot: "#ef4444" },
  suspended:       { label: "Suspended",       color: "#f87171", bg: "rgba(239,68,68,0.12)",  dot: "#f87171" },
  mandate_pending: { label: "Mandate Pending", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", dot: "#a78bfa" },
  cancelled:       { label: "Cancelled",       color: "#6b7280", bg: "rgba(107,114,128,0.1)", dot: "#6b7280" },
  expired:         { label: "Expired",         color: "#9ca3af", bg: "rgba(156,163,175,0.1)", dot: "#9ca3af" },
  created:         { label: "Created",         color: "#94a3b8", bg: "rgba(148,163,184,0.1)", dot: "#94a3b8" },
  inactive:        { label: "Inactive",        color: "#64748b", bg: "rgba(100,116,139,0.1)", dot: "#64748b" },
};

export default function BillingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const [loading, setLoading] = useState(false);
  const [sub, setSub] = useState<BillingSubscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [refundModal, setRefundModal] = useState(false);
  const [refundPaymentId, setRefundPaymentId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [planModal, setPlanModal] = useState(false);
  const [newPlanId, setNewPlanId] = useState("");
  const [graceDays, setGraceDays] = useState("3");
  const [graceModal, setGraceModal] = useState(false);
  const [billingDateModal, setBillingDateModal] = useState(false);
  const [newBillingDate, setNewBillingDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const all = await billingGetSubscriptions();
      setSub(all.find((s) => s.id === id) ?? null);
    } catch {
      toastError("Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const doAction = async (action: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      toastSuccess(successMsg);
      await fetchData();
    } catch (e: any) {
      toastError(e?.response?.data?.error?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const fmt = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  };

  const statusCfg = STATUS_CONFIG[sub?.status ?? ""] ?? STATUS_CONFIG.inactive;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading subscription...</span>
      </div>
    </div>
  );

  if (!sub) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-slate-400">Subscription not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-slate-500 hover:text-slate-300 underline">Go back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6 space-y-5" style={{ background: "transparent" }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors border border-slate-700 rounded-lg px-3 py-1.5 hover:border-slate-600"
          >
            ← Back
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-slate-100">Subscription #{sub.id}</h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
                style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: `${statusCfg.color}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusCfg.dot }} />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Business ID: {sub.businessId} · Plan: {sub.plan}</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="text-xs border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-lg px-3 py-1.5 transition-colors"
        >
          ↺ Refresh
        </button>
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Business ID",   value: String(sub.businessId) },
          { label: "Plan",          value: sub.plan },
          { label: "Retry Count",   value: String(sub.retry_count ?? 0) },
          { label: "RZP Sub ID",    value: sub.razorpay_subscription_id ? `...${sub.razorpay_subscription_id.slice(-12)}` : "—" },
          { label: "Period End",    value: fmt(sub.currentPeriodEnd) },
          { label: "Next Renewal",  value: fmt(sub.nextRenewalAt) },
          { label: "Last Payment",  value: fmt(sub.last_payment_at) },
          { label: "Payment ID",    value: sub.last_payment_id ? `...${sub.last_payment_id.slice(-12)}` : "—" },
          { label: "Grace Start",   value: fmt(sub.grace_start_date) },
          { label: "Grace End",     value: fmt(sub.grace_end_date) },
          { label: "Suspended At",  value: fmt(sub.suspended_at) },
          { label: "Failure",       value: sub.last_failure_reason ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 hover:border-slate-700 transition-colors">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
            <p className="text-sm text-slate-200 font-medium break-all leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Actions ── */}
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Actions</p>
        <div className="flex flex-wrap gap-2">
          {sub.status !== "active" && (
            <ActionChip color="#10b981" bg="rgba(16,185,129,0.12)" onClick={() => doAction(() => billingActivate(sub.id), "Activated ✓")} disabled={actionLoading}>
              ✓ Activate
            </ActionChip>
          )}
          {sub.status === "active" && (
            <ActionChip color="#f59e0b" bg="rgba(245,158,11,0.12)" onClick={() => doAction(() => billingSuspend(sub.id), "Suspended")} disabled={actionLoading}>
              ⏸ Suspend
            </ActionChip>
          )}
          {sub.status !== "cancelled" && (
            <ActionChip color="#ef4444" bg="rgba(239,68,68,0.12)" onClick={() => doAction(() => billingCancel(sub.id), "Cancelled")} disabled={actionLoading}>
              ✕ Cancel
            </ActionChip>
          )}
          <ActionChip color="#3b82f6" bg="rgba(59,130,246,0.12)" onClick={() => setGraceModal(true)} disabled={actionLoading}>
            ⊕ Extend Grace
          </ActionChip>
          <ActionChip color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={() => { setRefundPaymentId(sub.last_payment_id ?? ""); setRefundModal(true); }} disabled={actionLoading}>
            ↩ Refund
          </ActionChip>
          <ActionChip color="#f97316" bg="rgba(249,115,22,0.12)" onClick={() => setPlanModal(true)} disabled={actionLoading}>
            ⇄ Change Plan
          </ActionChip>
        <ActionChip color="#06b6d4" bg="rgba(6,182,212,0.15)" onClick={() => doAction(() => billingDisableMandate(sub.id), "Mandate disabled")} disabled={actionLoading}>
  ⊘ Disable Mandate
</ActionChip>

<ActionChip color="#8b5cf6" bg="rgba(139,92,246,0.15)" onClick={() => setBillingDateModal(true)} disabled={actionLoading}>
  ✎ Billing Date
</ActionChip>
          <ActionChip color="#ef4444" bg="rgba(239,68,68,0.08)" onClick={() => {
            if (confirm("Permanently delete? This will also cancel the Razorpay subscription.")) {
              doAction(() => billingDelete(sub.id), "Deleted");
              router.push("/admin/billing");
            }
          }} disabled={actionLoading}>
            ⌫ Delete
          </ActionChip>
        </div>
      </div>

      {/* ── Modals ── */}
      {graceModal && (
        <Sheet title="Extend Grace Period" onClose={() => setGraceModal(false)}>
          <Field label="Extra days to add">
            <input type="number" value={graceDays} onChange={(e) => setGraceDays(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500" />
          </Field>
          <SheetFooter
            onCancel={() => setGraceModal(false)}
            onConfirm={() => { doAction(() => billingExtendGrace(sub.id, Number(graceDays)), "Grace extended"); setGraceModal(false); }}
            confirmLabel="Extend" confirmColor="bg-blue-600 hover:bg-blue-500"
          />
        </Sheet>
      )}

      {refundModal && (
        <Sheet title="Process Refund" onClose={() => setRefundModal(false)}>
          <Field label="Payment ID">
            <input value={refundPaymentId} onChange={(e) => setRefundPaymentId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500" />
          </Field>
          <Field label="Amount in paise (leave empty for full refund)">
            <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="e.g. 39900"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
          </Field>
          <SheetFooter
            onCancel={() => setRefundModal(false)}
            onConfirm={() => { doAction(() => billingRefund(sub.id, refundPaymentId || undefined, refundAmount ? Number(refundAmount) : undefined), "Refund processed"); setRefundModal(false); }}
            confirmLabel="Process Refund" confirmColor="bg-purple-600 hover:bg-purple-500"
          />
        </Sheet>
      )}

      {planModal && (
        <Sheet title="Change Plan" onClose={() => setPlanModal(false)}>
          <Field label="New Plan ID">
            <input type="number" value={newPlanId} onChange={(e) => setNewPlanId(e.target.value)} placeholder="1, 2, 3..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-500" />
          </Field>
          <SheetFooter
            onCancel={() => setPlanModal(false)}
            onConfirm={() => { doAction(() => billingChangePlan(sub.id, Number(newPlanId)), "Plan changed"); setPlanModal(false); }}
            confirmLabel="Change Plan" confirmColor="bg-orange-600 hover:bg-orange-500"
          />
        </Sheet>
      )}

      {billingDateModal && (
        <Sheet title="Update Billing Date" onClose={() => setBillingDateModal(false)}>
          <Field label="New billing date">
            <input type="datetime-local" value={newBillingDate} onChange={(e) => setNewBillingDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500" />
          </Field>
          <SheetFooter
            onCancel={() => setBillingDateModal(false)}
            onConfirm={() => { doAction(() => billingUpdateDate(sub.id, new Date(newBillingDate).toISOString()), "Billing date updated"); setBillingDateModal(false); }}
            confirmLabel="Update" confirmColor="bg-slate-600 hover:bg-slate-500"
          />
        </Sheet>
      )}
    </div>
  );
}

// ─── Action Chip ──────────────────────────────────────────────────────────
function ActionChip({ children, color, bg, onClick, disabled }: {
  children: React.ReactNode; color: string; bg: string;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
      style={{ color: "#ffffff", background: bg, borderColor: `${color}60` }}
    >
      {children}
    </button>
  );
}

// ─── Sheet (Modal) ────────────────────────────────────────────────────────
function Sheet({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none transition-colors">×</button>
        </div>
        <div className="px-5 py-4 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SheetFooter({ onCancel, onConfirm, confirmLabel, confirmColor }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmColor: string;
}) {
  return (
    <div className="flex gap-2 pt-2">
      <button onClick={onCancel} className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
        Cancel
      </button>
      <button onClick={onConfirm} className={cn("flex-1 px-3 py-2 rounded-lg text-sm text-white font-medium transition-colors", confirmColor)}>
        {confirmLabel}
      </button>
    </div>
  );
}