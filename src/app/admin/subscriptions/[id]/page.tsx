"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminSubscriptionById,
  cancelAdminSubscription,
  formatSubscriptionPlan,
  formatSubscriptionStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type SubDetail = {
  id: number;
  plan: "basic" | "standard" | "premium";
  status: "trial" | "active" | "cancelled";
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: {
    id: number;
    name?: string | null;
    businessname?: string | null;
    owner?: {
      id?: number;
      email?: string | null;
      mobile?: string | null;
      role?: string | null;
    };
  };
};

export default function SubscriptionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = useMemo(() => Number(params?.id), [params]);

  const [loading, setLoading] = useState(false);
  const [row, setRow] = useState<SubDetail | null>(null);
  const [err, setErr] = useState<string>("");

  const fetchOne = async () => {
    if (!id || Number.isNaN(id)) return;
    setLoading(true);
    setErr("");
    try {
      const res = await getAdminSubscriptionById(id);
      const sub = res?.data?.subscription;
      setRow(sub ?? null);
    } catch (e: any) {
      console.error(e);
      setRow(null);
      setErr(e?.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line
  }, [id]);

  const badge = (s: string) => {
    if (s === "active") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (s === "trial") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    return "bg-red-500/15 text-red-300 border-red-500/30";
  };

  const fmt = (d?: string | null) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString();
  };

  const onCancel = async () => {
    if (!row) return;
    if (row.status === "cancelled") return;

    const ok = confirm("Cancel this subscription?");
    if (!ok) return;

    try {
      await cancelAdminSubscription(row.id);
      await fetchOne();
      alert("Subscription cancelled");
    } catch (e) {
      console.error(e);
      alert("Failed to cancel subscription");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-black">
              Subscription #{id}
            </h1>

            {row?.status ? (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium",
                  badge(row.status)
                )}
              >
                {formatSubscriptionStatus(row.status)}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-slate-400">
            View subscription details and actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/subscriptions"
            className="px-4 py-2 rounded-lg text-sm border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Back
          </Link>

          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg text-sm border border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            Refresh
          </button>

          <button
            onClick={onCancel}
            disabled={!row || row.status === "cancelled"}
            className={cn(
              "px-4 py-2 rounded-lg text-sm border",
              !row || row.status === "cancelled"
                ? "border-slate-800 text-slate-600 cursor-not-allowed"
                : "border-red-500/40 text-red-200 hover:bg-red-500/10"
            )}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <Card>
          <div className="text-slate-400">Loading...</div>
        </Card>
      ) : err ? (
        <Card>
          <div className="text-red-300 text-sm">{err}</div>
        </Card>
      ) : !row ? (
        <Card>
          <div className="text-slate-400">No data found.</div>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Label>Plan</Label>
              <Value>{formatSubscriptionPlan(row.plan)}</Value>
            </Card>
            <Card>
              <Label>Status</Label>
              <Value>{formatSubscriptionStatus(row.status)}</Value>
            </Card>
            <Card>
              <Label>Business</Label>
              <Value>
                {row.business?.businessname || row.business?.name || "-"}
              </Value>
              <div className="text-xs text-slate-500 mt-1">
                Business ID: {row.business?.id ?? "-"}
              </div>
            </Card>
          </div>

          {/* Dates */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <KV label="Trial Starts" value={fmt(row.trialStartsAt)} />
              <KV label="Trial Ends" value={fmt(row.trialEndsAt)} />
              <KV label="Current Period End" value={fmt(row.currentPeriodEnd)} />
              <KV label="Next Renewal" value={fmt(row.nextRenewalAt)} />
              <KV label="Created At" value={fmt(row.createdAt)} />
              <KV label="Updated At" value={fmt(row.updatedAt)} />
            </div>
          </Card>

          {/* Owner */}
          <Card>
            <h2 className="text-sm font-semibold text-black mb-3">Owner</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KV label="User ID" value={String(row.business?.owner?.id ?? "-")} />
              <KV label="Email" value={row.business?.owner?.email ?? "-"} />
              <KV label="Mobile" value={row.business?.owner?.mobile ?? "-"} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ---------- small UI helpers ---------- */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-slate-800 rounded-xl bg-black-950/40 p-4">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-slate-400">{children}</div>;
}

function Value({ children }: { children: React.ReactNode }) {
  return <div className="text-base font-semibold text-black mt-1">{children}</div>;
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-800 rounded-xl p-3 bg-white-750/30">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-200 mt-1 break-words">{value}</div>
    </div>
  );
}
