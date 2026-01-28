"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Plus, RefreshCw, AlertCircle, Trash2, CheckCircle, KeyRound } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  adminListPermissions,
  adminCreatePermission,
  adminDeletePermission,
  AdminPermission,
} from "@/lib/api";

export default function PermissionsPage() {
  const [items, setItems] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{ key: string; label: string }>({ key: "", label: "" });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminListPermissions();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load permissions");
      toast.error(e.message || "Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return items;
    return items.filter((p) => {
      const k = (p.key || "").toLowerCase();
      const l = (p.label || "").toLowerCase();
      return k.includes(q) || l.includes(q);
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    return { total: items.length };
  }, [items]);

  const openCreate = () => {
    setForm({ key: "", label: "" });
    setIsCreateOpen(true);
  };

  const close = () => {
    setIsCreateOpen(false);
    setSaving(false);
  };

  const validate = () => {
    if (!form.key.trim()) return "Permission key is required";
    if (form.key.trim().length < 3) return "Key too short";
    return null;
  };

  const handleCreate = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);
      await toast.promise(
        adminCreatePermission({ key: form.key.trim(), label: form.label.trim() || null }),
        {
          loading: "Creating permission...",
          success: "Permission created!",
          error: (e: any) => e.message || "Create failed",
        }
      );
      close();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this permission?")) return;

    await toast.promise(adminDeletePermission(id), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchData();
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
            <p className="text-sm text-slate-400 mt-1">Create and manage permission keys</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Permission
            </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search permission..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <KeyRound className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No permissions found</h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Permission
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-slate-100">{p.key}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{p.label || "-"}</p>
                </div>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create Permission</h3>
                <button
                  onClick={close}
                  disabled={saving}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Key *</label>
                  <input
                    value={form.key}
                    onChange={(e) => setForm({ ...form, key: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="BUSINESS_VIEW"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Label</label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Businesses View"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={close}
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
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Saving...
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
      </div>
    </ProtectedRoute>
  );
}
