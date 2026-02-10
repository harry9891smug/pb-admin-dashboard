"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAdminSubscriptions,
  cancelAdminSubscription,
  formatSubscriptionPlan,
  formatSubscriptionStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Row = {
  id: number;
  plan: "basic" | "standard" | "premium";
  status: "trial" | "active" | "cancelled";
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
  createdAt?: string | null;
  business?: {
    id: number;
    businessname?: string | null;
    name?: string | null;
    owner?: {
      id?: number;
      email?: string | null;
      mobile?: string | null;
    };
  };
};

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [status, setStatus] = useState<string>("");
  const [plan, setPlan] = useState<string>("");
  const [businessId, setBusinessId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

const fetchData = async () => {
  setLoading(true);
  try {
    const res = await getAdminSubscriptions({ page, limit });

    console.log("ADMIN SUBS RES =>", res);
    console.log("SUBS =>", res?.data?.subscriptions);


    const data = (res as any)?.data ?? res; // handles both patterns
    const items = (res as any)?.data?.subscriptions || (res as any)?.data?.data?.subscriptions || [];
    const tp = data?.pagination?.totalPages ?? 1;

    setRows(items);
    setTotalPages(tp);
  } catch (e: any) {
    console.error(e);
    alert(e?.message || "Failed to fetch subscriptions");
    setRows([]);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, status, plan, businessId, userId]);

  const onCancel = async (subscriptionId: number) => {
    const ok = confirm("Cancel this subscription?");
    if (!ok) return;

    try {
      await cancelAdminSubscription(subscriptionId);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert("Failed to cancel subscription");
    }
  };

  const badge = (s: string) => {
    const x = String(s);
    if (x === "active") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    if (x === "trial") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
    return "bg-red-500/15 text-red-300 border-red-500/30";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-black">Subscriptions</h1>
          <p className="text-sm text-slate-400">
            Admin view for business subscriptions (supportAdmin only)
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Page {page} / {totalPages}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-slate-800 rounded-xl p-4 bg-white-950/40">
        <div>
          <label className="text-xs text-slate-400">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Plan</label>
          <select
            value={plan}
            onChange={(e) => {
              setPage(1);
              setPlan(e.target.value);
            }}
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Business ID</label>
          <input
            value={businessId}
            onChange={(e) => {
              setPage(1);
              setBusinessId(e.target.value);
            }}
            placeholder="e.g. 12"
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">User ID</label>
          <input
            value={userId}
            onChange={(e) => {
              setPage(1);
              setUserId(e.target.value);
            }}
            placeholder="owner userId"
            className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={() => fetchData()}
            className="w-full bg-emerald-500/20 border border-emerald-500/40 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-emerald-500/25"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-900/70">
            <tr className="text-white-300">
              <Th>ID</Th>
              <Th>Business</Th>
              <Th>Owner</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>Period End</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const bName = r.business?.businessname || r.business?.name || "-";
                const owner = r.business?.owner;
                const ownerTxt = owner?.email || owner?.mobile || "-";

                return (
                  <tr
                    key={r.id}
                    className="border-t border-slate-800 hover:bg-slate-900/40"
                  >
                    <Td>{r.id}</Td>
                    <Td>
                      <div className="text-black">{bName}</div>
                      <div className="text-xs text-slate-500">
                        Business ID: {r.business?.id ?? "-"}
                      </div>
                    </Td>
                    <Td>
                      <div className="text-slate-200">{ownerTxt}</div>
                      <div className="text-xs text-slate-500">
                        User ID: {owner?.id ?? "-"}
                      </div>
                    </Td>
                    <Td className="text-slate-200">
                      {formatSubscriptionPlan(r.plan)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium",
                          badge(r.status)
                        )}
                      >
                        {formatSubscriptionStatus(r.status)}
                      </span>
                    </Td>
                    <Td className="text-slate-200">
                      {r.currentPeriodEnd
                        ? new Date(r.currentPeriodEnd).toLocaleString()
                        : "-"}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/subscriptions/${r.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                          View
                        </Link>

                        <button
                          onClick={() => onCancel(r.id)}
                          disabled={r.status === "cancelled"}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border",
                            r.status === "cancelled"
                              ? "border-slate-800 text-slate-600 cursor-not-allowed"
                              : "border-red-500/40 text-red-200 hover:bg-red-500/10"
                          )}
                        >
                          Cancel
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className={cn(
            "px-4 py-2 rounded-lg text-sm border",
            page <= 1
              ? "border-slate-800 text-slate-600 cursor-not-allowed"
              : "border-slate-700 text-slate-200 hover:bg-slate-800"
          )}
        >
          Prev
        </button>

        <div className="text-sm text-slate-400">
          Page <span className="text-white">{page}</span> of{" "}
          <span className="text-white">{totalPages}</span>
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className={cn(
            "px-4 py-2 rounded-lg text-sm border",
            page >= totalPages
              ? "border-slate-800 text-slate-600 cursor-not-allowed"
              : "border-slate-700 text-slate-200 hover:bg-slate-800"
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-4 py-3 font-medium">{children}</th>
);

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={cn("px-4 py-3 text-slate-200 align-top", className)}>
    {children}
  </td>
);
