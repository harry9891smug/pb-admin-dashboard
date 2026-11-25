"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  billingGetSubscriptions,
  billingSuspend,
  billingActivate,
  billingCancel,
  billingExtendGrace,
  formatBillingStatus,
  statusColor,
  BillingSubscription,
} from "@/lib/api/admin/billing";
import { cn } from "@/lib/utils";
import { toastSuccess, toastError } from "@/lib/toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageShell from "@/components/ui/PageShell";

const PAGE_SIZE = 15;

export default function BillingSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BillingSubscription[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Used to fetch the whole list (backend capped it at a hardcoded 100
      // rows with no way to see past that) and re-filter/paginate it in the
      // browser. Search, status and paging are now real backend query params.
      const res = await billingGetSubscriptions({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e: any) {
      toastError(e?.response?.data?.error?.message || "Failed to fetch");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchData();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // The backend already applied search/status/paging — `rows` is exactly
  // this page's matching results.
  const paginated = rows;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const doAction = async (id: number, action: "suspend" | "activate" | "cancel" | "grace") => {
    const labels = { suspend: "Suspend", activate: "Activate", cancel: "Cancel", grace: "Extend Grace" };
    if (!confirm(`${labels[action]} this subscription?`)) return;
    setActionLoading(id);
    try {
      if (action === "suspend") await billingSuspend(id);
      if (action === "activate") await billingActivate(id);
      if (action === "cancel") await billingCancel(id);
      if (action === "grace") await billingExtendGrace(id, 3);
      toastSuccess(`${labels[action]} successful`);
      await fetchData();
    } catch (e: any) {
      toastError(e?.response?.data?.error?.message || `${labels[action]} failed`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <ProtectedRoute requiredPermission="subscription.view">
    <PageShell
      top={<>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Billing Subscriptions</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage subscriptions — suspend, activate, cancel, refund</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 rounded-lg text-sm border border-slate-600 text-slate-200 hover:bg-slate-800">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ID, business, plan..."
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 w-64 focus:outline-none focus:border-slate-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="grace">Grace Period</option>
          <option value="retrying">Retrying</option>
          <option value="payment_failed">Payment Failed</option>
          <option value="suspended">Suspended</option>
          <option value="mandate_pending">Mandate Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
        <span className="text-sm text-slate-400">
          Showing {rows.length} of {total}
        </span>
      </div>

      </>}
      footer={
        totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg text-sm border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-400">
              Page <span className="text-slate-200 font-medium">{page}</span> of{" "}
              <span className="text-slate-200 font-medium">{totalPages}</span>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg text-sm border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        ) : null
      }
    >
      {/* Table */}
      <div className="border border-slate-700 rounded-xl overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800">
              <Th>ID</Th>
              <Th>Business</Th>
              <Th>Plan</Th>
              <Th>Status</Th>
              <Th>RZP Sub ID</Th>
              <Th>Period End</Th>
              <Th>Last Payment</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500">No subscriptions found</td></tr>
            ) : (
              paginated.map((r) => {
                const bizName = (r as any).business?.businessname || (r as any).business?.name || null;
                return (
                  <tr key={r.id} className="border-t border-slate-700/60 hover:bg-slate-800/40 transition-colors">
                    <Td>
                      <span className="text-slate-300 font-mono text-xs">{r.id}</span>
                    </Td>
                    <Td>
                      {/* ✅ business name */}
                      <div className="text-slate-100 font-medium">{bizName ?? "-"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {r.businessId}</div>
                    </Td>
                    <Td>
                      <span className="text-slate-200 capitalize">{r.plan}</span>
                    </Td>
                    <Td>
                      {/* ✅ visible status badges */}
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td>
                      <span className="text-xs text-slate-500 font-mono">
                        {r.razorpay_subscription_id ? `...${r.razorpay_subscription_id.slice(-8)}` : "-"}
                      </span>
                    </Td>
                    <Td>{r.currentPeriodEnd ? new Date(r.currentPeriodEnd).toLocaleDateString("en-IN") : "-"}</Td>
                    <Td>{r.last_payment_at ? new Date(r.last_payment_at).toLocaleDateString("en-IN") : "-"}</Td>
                    <Td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Btn color="slate" onClick={() => router.push(`/admin/billing/${r.id}`)}>View</Btn>
                        {r.status !== "active" && (
                          <Btn color="emerald" onClick={() => doAction(r.id, "activate")} disabled={actionLoading === r.id}>Activate</Btn>
                        )}
                        {r.status === "active" && (
                          <Btn color="yellow" onClick={() => doAction(r.id, "suspend")} disabled={actionLoading === r.id}>Suspend</Btn>
                        )}
                        {r.status === "grace" && (
                          <Btn color="blue" onClick={() => doAction(r.id, "grace")} disabled={actionLoading === r.id}>+3 Days</Btn>
                        )}
                        {r.status !== "cancelled" && (
                          <Btn color="red" onClick={() => doAction(r.id, "cancel")} disabled={actionLoading === r.id}>Cancel</Btn>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
    </ProtectedRoute>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    // Plain light-theme classes: the old "text-white on a 20% tint" was unreadable.
    active:          { label: "Active",          cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    trial:           { label: "Trial",           cls: "bg-sky-50 text-sky-700 border-sky-200",             dot: "bg-sky-500" },
    grace:           { label: "Grace Period",    cls: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-500" },
    retrying:        { label: "Retrying",        cls: "bg-orange-50 text-orange-700 border-orange-200",    dot: "bg-orange-500" },
    payment_failed:  { label: "Payment Failed",  cls: "bg-red-50 text-red-700 border-red-200",             dot: "bg-red-500" },
    suspended:       { label: "Suspended",       cls: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500" },
    mandate_pending: { label: "Mandate Pending", cls: "bg-violet-50 text-violet-700 border-violet-200",    dot: "bg-violet-500" },
    cancelled:       { label: "Cancelled",       cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
    expired:         { label: "Expired",         cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
    created:         { label: "Created",         cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
    inactive:        { label: "Inactive",        cls: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
  };

  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap",
      s.cls
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", s.dot)} />
      {s.label}
    </span>
  );
}
  

// ─── Button ───────────────────────────────────────────────────────────────
const btnColors: Record<string, string> = {
  emerald: "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
  yellow:  "border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100",
  red:     "border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
  blue:    "border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100",
  slate:   "border-gray-200 text-gray-700 bg-white hover:bg-gray-50",
};

function Btn({ children, color, onClick, disabled }: {
  children: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("px-2.5 py-1 rounded-lg text-xs border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed", btnColors[color] ?? btnColors.slate)}
    >
      {children}
    </button>
  );
}

// ─── Table helpers ─────────────────────────────────────────────────────────
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
    {children}
  </th>
);

const Td = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <td className={cn("px-4 py-3 align-top", className)}>
    {children}
  </td>
);