"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Smartphone,
  Copy,
} from "lucide-react";
import { toast } from "react-hot-toast";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Pagination from "@/components/ui/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminListPromoDeskUsers,
  adminCreatePromoDeskUser,
  PROMODESK_USER_ROLES,
  PromoDeskUser,
  PromoDeskUserRole,
} from "@/lib/api";

const ROLE_LABELS: Record<PromoDeskUserRole, string> = {
  salesExecutive: "Sales Executive (own leads)",
  salesManager: "Sales Manager (whole team)",
  superAdmin: "Super Admin",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PromoDeskUsersPage() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canCreate = permissions.includes("promodesk_user.create");

  const [items, setItems] = useState<PromoDeskUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    mobile: "",
    email: "",
    password: "",
    role: "salesExecutive" as PromoDeskUserRole,
    displayName: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await adminListPromoDeskUsers({
        search: searchTerm.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      });

      setItems(res.items);
      setTotalFiltered(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load PromoDesk users");
      toast.error(e.message || "Failed to load PromoDesk users");
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
  }, [searchTerm]);

  const openCreate = () => {
    setForm({ mobile: "", email: "", password: "", role: "salesExecutive", displayName: "" });
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!/^\d{10}$/.test(form.mobile)) {
      toast.error("Mobile must be exactly 10 digits");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);
      const result = await adminCreatePromoDeskUser({
        mobile: form.mobile,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        displayName: form.displayName.trim() || undefined,
      });
      toast.success(`PromoDesk login created for ${result.email || result.mobile}`);
      setIsCreateOpen(false);
      setPage(1);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Failed to create PromoDesk user");
    } finally {
      setSaving(false);
    }
  };

  const copyCredentials = (u: PromoDeskUser) => {
    const text = `Mobile/Email: ${u.email || u.mobile}\n`;
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <ProtectedRoute requiredPermission="promodesk_user.view">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">PromoDesk Users</h1>
            <p className="text-sm text-slate-400 mt-1">
              Logins for the PromoDesk mobile app (sales/support staff) — separate from PromoBandhu
              Test Accounts, which are customer-app demo logins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {canCreate && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create PromoDesk User
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or mobile..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid gap-4">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No PromoDesk users found</h3>
              {canCreate && (
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create PromoDesk User
                </button>
              )}
            </div>
          ) : (
            items.map((u) => (
              <div
                key={u.userId}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
                    <h3 className="font-semibold text-slate-100 truncate">
                      {u.displayName || u.email || u.mobile}
                    </h3>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                    <span>Email: {u.email || "—"}</span>
                    <span>Mobile: {u.mobile}</span>
                    <span>Created: {formatDate(u.createdAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyCredentials(u)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  <Copy className="w-4 h-4" /> Copy login
                </button>
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
            itemLabel="PromoDesk users"
          />
        )}

        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create PromoDesk User</h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  disabled={saving}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Mobile (10 digits)</label>
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                    placeholder="9999912345"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="asif.promodesk@test.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Password (min 8 characters)</label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Test@1234"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Display name (optional)</label>
                  <input
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Asif Test"
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as PromoDeskUserRole }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm outline-none focus:border-emerald-400"
                  >
                    {PROMODESK_USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
