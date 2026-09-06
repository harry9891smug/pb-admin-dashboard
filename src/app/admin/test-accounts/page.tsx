"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Ban,
  CalendarPlus,
  CheckCircle,
  FlaskConical,
  Copy,
} from "lucide-react";
import { toast } from "react-hot-toast";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Pagination from "@/components/ui/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminListTestAccounts,
  adminCreateTestAccount,
  adminExtendTestAccount,
  adminRevokeTestAccount,
  TEST_ACCOUNT_TYPES,
  TestAccount,
  TestAccountType,
} from "@/lib/api";

const ACCOUNT_TYPE_LABELS: Record<TestAccountType, string> = {
  google_reviewer: "Google Reviewer",
  internal_testing: "Internal Testing",
  sales_demo: "Sales Demo",
  support_qa: "Support QA",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TestAccountsPage() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes("test_account.create");
  const canExtend = permissions.includes("test_account.extend");
  const canRevoke = permissions.includes("test_account.revoke");

  const [items, setItems] = useState<TestAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<TestAccountType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "revoked">("active");
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState<TestAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    accountType: "internal_testing" as TestAccountType,
    grantDays: 30,
    notes: "",
  });
  const [extendDays, setExtendDays] = useState(30);

  /* ---------------- Fetch ---------------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminListTestAccounts({
        accountType: typeFilter === "all" ? undefined : typeFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchTerm.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      });

      setItems(res.items);
      setTotalFiltered(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load test accounts");
      toast.error(e.message || "Failed to load test accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, page]);

  useEffect(() => {
    // Search box used to filter the already-loaded page client-side — real
    // typing now re-queries the backend (debounced) and resets to page 1.
    const t = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchData();
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const filtered = items;

  /* ---------------- Helpers ---------------- */
  const openCreate = () => {
    setForm({
      email: "",
      password: "",
      accountType: "internal_testing",
      grantDays: 30,
      notes: "",
    });
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setSaving(false);
  };

  const openExtend = (account: TestAccount) => {
    setExtendTarget(account);
    setExtendDays(30);
  };

  const closeExtend = () => {
    setExtendTarget(null);
    setSaving(false);
  };

  const validateCreate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim() || form.password.trim().length < 8)
      return "Password must be at least 8 characters";
    if (!form.grantDays || form.grantDays < 1) return "Grant days must be positive";
    return null;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      // clipboard permission denied — not worth surfacing as an error
    }
  };

  /* ---------------- Actions ---------------- */
  const handleCreate = async () => {
    const msg = validateCreate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const created = await adminCreateTestAccount({
        email: form.email.trim(),
        password: form.password.trim(),
        accountType: form.accountType,
        grantDays: Number(form.grantDays),
        notes: form.notes.trim() || undefined,
      });

      toast.success(
        `Test account created — login mobile: ${created.mobile} (email login also works)`,
        { duration: 8000 }
      );

      closeCreate();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    if (!extendDays || extendDays < 1) return toast.error("Days must be positive");

    try {
      setSaving(true);
      await adminExtendTestAccount(extendTarget.userId, Number(extendDays));
      toast.success("Test account extended");
      closeExtend();
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Extend failed");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (account: TestAccount) => {
    if (!confirm(`Revoke test account ${account.email}? This blocks login and cancels its access grant.`))
      return;

    try {
      await adminRevokeTestAccount(account.userId);
      toast.success("Test account revoked");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Revoke failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute requiredPermission="test_account.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Test Accounts</h1>
            <p className="text-sm text-slate-400 mt-1">
              Reviewer / demo / QA accounts — never touches real paid subscriptions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            {canCreate && (
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Test Account
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">
            Matching current filters ({statusFilter === "all" ? "any status" : statusFilter})
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalFiltered}</p>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email, mobile, business..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-400"
          >
            <option value="active">Active only</option>
            <option value="revoked">Revoked only</option>
            <option value="all">All statuses</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-400"
          >
            <option value="all">All account types</option>
            {TEST_ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No test accounts found</h3>
              {canCreate && (
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Test Account
                </button>
              )}
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.userId}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400 shrink-0" />
                    <h3 className="font-semibold text-slate-100 truncate">{a.email || "—"}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        a.status === "active"
                          ? "border-emerald-700 bg-emerald-900/30 text-emerald-300"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {a.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-300">
                      {ACCOUNT_TYPE_LABELS[a.accountType] ?? a.accountType}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                    <span className="flex items-center gap-1">
                      Mobile: <span className="text-slate-200">{a.mobile || "-"}</span>
                      {a.mobile && (
                        <button
                          onClick={() => copyToClipboard(a.mobile!, "Mobile")}
                          className="text-slate-500 hover:text-emerald-400"
                          title="Copy mobile"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                    <span>
                      Business:{" "}
                      <span className="text-slate-200">
                        {a.businessName || "-"} {a.businessPublicId ? `(#${a.businessPublicId})` : ""}
                      </span>
                    </span>
                    <span>
                      Plan: <span className="text-slate-200">{a.planName || "-"}</span>
                    </span>
                    <span>
                      Grant expires: <span className="text-slate-200">{formatDate(a.grantExpiresAt)}</span>
                    </span>
                    <span>
                      Login expires:{" "}
                      <span className="text-slate-200">
                        {a.accountType === "google_reviewer" ? "Never" : formatDate(a.passwordLoginExpiresAt)}
                      </span>
                    </span>
                  </div>

                  {a.notes && <p className="text-xs text-slate-500 truncate">Notes: {a.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canExtend && a.status === "active" && (
                    <button
                      onClick={() => openExtend(a)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-slate-700"
                      title="Extend trial"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Extend
                    </button>
                  )}
                  {canRevoke && a.status === "active" && (
                    <button
                      onClick={() => handleRevoke(a)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-slate-700"
                      title="Revoke"
                    >
                      <Ban className="w-4 h-4" />
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {totalFiltered > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalFiltered}
            loading={loading}
            onPageChange={setPage}
            itemLabel="test accounts"
          />
        )}

        {/* Create modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Test Account</h3>
                <button onClick={closeCreate} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="reviewer@example.com"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Password *</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Mobile number is auto-generated (9999900xxx range) — shown after creation.
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Account Type *</label>
                  <select
                    value={form.accountType}
                    onChange={(e) => setForm({ ...form, accountType: e.target.value as TestAccountType })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {TEST_ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {ACCOUNT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Grant Days *</label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={form.grantDays}
                    onChange={(e) => setForm({ ...form, grantDays: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    How many days of access from today. Ignored for Google Reviewer login expiry (that one never
                    expires).
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    placeholder="Why this account exists — e.g. Play Store review, sales demo for X"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeCreate}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extend modal */}
        {extendTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Extend Test Account</h3>
                <button onClick={closeExtend} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <p className="text-sm text-slate-400 mb-3">
                {extendTarget.email} — current grant expires {formatDate(extendTarget.grantExpiresAt)}
              </p>

              <label className="block text-sm text-slate-300 mb-1">Additional days *</label>
              <input
                type="number"
                min={1}
                max={3650}
                value={extendDays}
                onChange={(e) => setExtendDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Counted from today, not from the current expiry.</p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeExtend}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExtend}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Extending...
                    </>
                  ) : (
                    <>
                      <CalendarPlus className="w-4 h-4" />
                      Extend
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
