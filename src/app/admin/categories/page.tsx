"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Tag,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  getBusinessCategoriesAdmin,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory,
  BusinessCategory,
} from "@/lib/api";

type Status = "active" | "inactive";

export default function CategoriesPage() {
  const [items, setItems] = useState<BusinessCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessCategory | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{ name: string; status: Status }>({
    name: "",
    status: "active",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ API doesn't accept params, so filter on frontend
      const data = await getBusinessCategoriesAdmin();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load categories");
      toast.error(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((c) => {
      const matchesSearch = !q || (c.name || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ? true : c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.status === "active").length;
    const inactive = items.filter((x) => x.status === "inactive").length;
    return { total, active, inactive };
  }, [items]);

  const openCreate = () => {
    setForm({ name: "", status: "active" });
    setIsCreateOpen(true);
  };

  const openEdit = (cat: BusinessCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, status: cat.status });
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditing(null);
    setSaving(false);
  };

  const validate = () => {
    if (!form.name.trim()) return "Category name is required";
    if (form.name.trim().length < 2) return "Category name too short";
    return null;
  };

  const handleCreate = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      // ✅ API expects string: (name)
      await toast.promise(createBusinessCategory(form.name.trim()), {
        loading: "Creating category...",
        success: "Category created!",
        error: (e: any) => e.message || "Create failed",
      });

      // Optional: if you want status on create, do update after create
      // but easiest: keep default "active" on backend, and edit later.

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      await toast.promise(
        updateBusinessCategory(editing.id, {
          name: form.name.trim(),
          status: form.status,
        }),
        {
          loading: "Updating category...",
          success: "Category updated!",
          error: (e: any) => e.message || "Update failed",
        }
      );

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;

    await toast.promise(deleteBusinessCategory(id), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchData();
  };

  const badge = (status: Status) => {
    const isActive = status === "active";
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
          isActive
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            : "bg-red-500/20 text-red-300 border-red-500/40"
        }`}
      >
        {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Business Categories</h1>
            <p className="text-sm text-slate-400 mt-1">Create and manage business categories</p>
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
              Create Category
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Inactive</p>
            <p className="mt-2 text-2xl font-semibold text-red-400">{stats.inactive}</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search category..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              <Tag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No categories found</h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Category
              </button>
            </div>
          ) : (
            filtered.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-slate-100">{cat.name}</h3>
                  </div>
                  <div>{badge(cat.status)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {(isCreateOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditOpen ? "Edit Category" : "Create Category"}
                </h3>
                <button
                  onClick={closeModals}
                  disabled={saving}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={isEditOpen ? handleUpdate : handleCreate}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isEditOpen ? "Update" : "Create"}
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
