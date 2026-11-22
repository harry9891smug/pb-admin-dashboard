"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle, Mail, Copy, Search } from "lucide-react";
import { toast } from "react-hot-toast";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  adminListBusinessEmailClaims,
  BusinessEmailClaim,
  BusinessEmailSummary,
} from "@/lib/api/admin/businessEmail";

const PAGE_SIZE = 50;

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BusinessEmailPage() {
  const [items, setItems] = useState<BusinessEmailClaim[]>([]);
  const [summary, setSummary] = useState<BusinessEmailSummary>({
    claims: 0,
    paidBusinesses: 0,
    claimRatePercent: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sensitiveOnly, setSensitiveOnly] = useState(false);
  const [page, setPage] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminListBusinessEmailClaims({
        search,
        sensitive: sensitiveOnly,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setItems(res.items);
      setSummary(res.summary);
      setTotal(res.total);
    } catch (e: any) {
      setError(e.message || "Failed to load claims");
      toast.error(e.message || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sensitiveOnly, page]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      // clipboard permission denied: not worth an error
    }
  };

  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <ProtectedRoute requiredPermission="business.view">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Business Email</h1>
            <p className="text-sm text-slate-400 mt-1">
              Demand test: paying businesses that asked for a free business email. Names are reserved only; no
              mailbox is created yet.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Claims</p>
            <p className="mt-2 text-2xl font-semibold">{summary.claims}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Paying businesses</p>
            <p className="mt-2 text-2xl font-semibold">{summary.paidBusinesses}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Claim rate</p>
            <p className="mt-2 text-2xl font-semibold">{summary.claimRatePercent}%</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setSearch(searchInput.trim());
          }}
          className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row gap-3 sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search a name"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={sensitiveOnly}
              onChange={(e) => {
                setPage(0);
                setSensitiveOnly(e.target.checked);
              }}
              className="accent-emerald-500"
            />
            Sensitive names only
          </label>
        </form>

        <div className="grid gap-3">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading...</div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No claims yet</h3>
            </div>
          ) : (
            items.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h3 className="font-semibold text-slate-100">{c.address}</h3>
                  <button onClick={() => copy(c.address)} className="text-slate-500 hover:text-emerald-400" title="Copy">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-300">
                    {c.status === "early_access" ? "early access" : c.status}
                  </span>
                  {c.isSensitive && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-amber-700 bg-amber-900/30 text-amber-300">
                      sensitive{c.sensitiveReason ? `: ${c.sensitiveReason}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                  <span>
                    Business: <span className="text-slate-200">{c.businessName ?? `#${c.businessId}`}</span>
                  </span>
                  {c.city && (
                    <span>
                      City: <span className="text-slate-200">{c.city}</span>
                    </span>
                  )}
                  {c.mobile && (
                    <span>
                      Mobile: <span className="text-slate-200">{c.mobile}</span>
                    </span>
                  )}
                  <span>Claimed {formatDate(c.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Page {page + 1} of {lastPage + 1} · {total} claims
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= lastPage || loading}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
