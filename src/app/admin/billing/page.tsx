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

const PAGE_SIZE = 15;

export default function BillingSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BillingSubscription[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await billingGetSubscriptions();
      setRows(data);
    } catch (e: any) {
      toastError(e?.response?.data?.error?.message || "Failed to fetch");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ✅ filter
  const filtered = rows.filter((r) => {
    const matchStatus = statusFilter ? r.status === statusFilter : true;
    const matchSearch = search
      ? String(r.businessId).includes(search) ||
        String(r.id).includes(search) ||
        r.plan.toLowerCase().includes(search.toLowerCase()) ||
        (r as any).business?.businessname?.toLowerCase().includes(search.toLowerCase()) ||
        (r as any).business?.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  // ✅ pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <div className="p-6 space-y-5">
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
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search ID, business, plan..."
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 w-64 focus:outline-none focus:border-slate-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="border border-slate-700 rounded-xl overflow-x-auto bg-slate-900">
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

      {/* ✅ Pagination */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    active:          { label: "Active",          cls: "bg-emerald-500/20 text-white border-emerald-400/50 shadow-[0_0_8px_rgba(52,211,153,0.2)]", dot: "bg-emerald-400" },
    trial:           { label: "Trial",           cls: "bg-blue-500/20 text-white border-blue-400/50 shadow-[0_0_8px_rgba(96,165,250,0.2)]",          dot: "bg-blue-400" },
    grace:           { label: "Grace Period",    cls: "bg-yellow-500/20 text-white border-yellow-400/50 shadow-[0_0_8px_rgba(250,204,21,0.2)]",    dot: "bg-yellow-400" },
    retrying:        { label: "Retrying",        cls: "bg-orange-500/20 text-white border-orange-400/50 shadow-[0_0_8px_rgba(251,146,60,0.2)]",    dot: "bg-orange-400" },
    payment_failed:  { label: "Payment Failed",  cls: "bg-red-500/20 text-white border-red-400/50 shadow-[0_0_8px_rgba(248,113,113,0.2)]",            dot: "bg-red-400" },
    suspended:       { label: "Suspended",       cls: "bg-red-700/25 text-white border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)]",              dot: "bg-red-500" },
    mandate_pending: { label: "Mandate Pending", cls: "bg-purple-500/20 text-white border-purple-400/50 shadow-[0_0_8px_rgba(192,132,252,0.2)]",   dot: "bg-purple-400" },
    cancelled:       { label: "Cancelled",       cls: "bg-slate-700/40 text-white border-slate-500/40",                                             dot: "bg-slate-500" },
    expired:         { label: "Expired",         cls: "bg-slate-700/40 text-white border-slate-500/40",                                             dot: "bg-slate-500" },
    created:         { label: "Created",         cls: "bg-slate-600/30 text-white border-slate-500/40",                                             dot: "bg-slate-500" },
    inactive:        { label: "Inactive",        cls: "bg-slate-600/30 text-white border-slate-500/40",                                             dot: "bg-slate-500" },
  };

  const s = map[status] ?? { label: status, cls: "bg-slate-600/30 text-white border-slate-500/40", dot: "bg-slate-500" };

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
  emerald: "border-emerald-500 text-white bg-emerald-600/30 hover:bg-emerald-600/50",
  yellow:  "border-yellow-500 text-white bg-yellow-600/30 hover:bg-yellow-600/50",
  red:     "border-red-500 text-white bg-red-600/30 hover:bg-red-600/50",
  blue:    "border-blue-500 text-white bg-blue-600/30 hover:bg-blue-600/50",
  slate:   "border-slate-500 text-white bg-slate-700/50 hover:bg-slate-600/50",
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