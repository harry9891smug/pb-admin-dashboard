"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
  Edit,
  CheckCircle,
  Users,
  ShieldCheck,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  adminListGroups,
  adminCreateGroup,
  adminUpdateGroup,
  adminDeleteGroup,
  adminListPermissions,
  adminSetGroupPermissions,
  AdminGroup,
  AdminPermission,
} from "@/lib/api";

export default function GroupsPage() {
  const [items, setItems] = useState<AdminGroup[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminGroup | null>(null);

  const [isPermOpen, setIsPermOpen] = useState(false);
  const [permGroup, setPermGroup] = useState<AdminGroup | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string }>({ name: "" });

  /* ---------------- Fetch ---------------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [groups, perms] = await Promise.all([
        adminListGroups(),
        adminListPermissions(),
      ]);

      setItems(groups);
      setPermissions(perms);
    } catch (e: any) {
      setError(e.message || "Failed to load groups");
      toast.error(e.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- Derived ---------------- */
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return items;
    return items.filter((g) => (g.name || "").toLowerCase().includes(q));
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    return { total: items.length };
  }, [items]);

  /* ---------------- Helpers ---------------- */
  const openCreate = () => {
    setForm({ name: "" });
    setIsCreateOpen(true);
  };

  const openEdit = (g: AdminGroup) => {
    setEditing(g);
    setForm({ name: g.name });
    setIsEditOpen(true);
  };

  const openPermissions = (g: AdminGroup) => {
    setPermGroup(g);
    setSelectedPermIds((g.permissions || []).map((p) => p.id));
    setIsPermOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setIsPermOpen(false);
    setEditing(null);
    setPermGroup(null);
    setSaving(false);
  };

  const validate = () => {
    if (!form.name.trim()) return "Group name is required";
    if (form.name.trim().length < 2) return "Name too short";
    return null;
  };

  /* ---------------- CRUD ---------------- */
  const handleCreate = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);
      await toast.promise(adminCreateGroup({ name: form.name.trim() }), {
        loading: "Creating group...",
        success: "Group created!",
        error: (e: any) => e.message || "Create failed",
      });
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
        adminUpdateGroup(editing.id, { name: form.name.trim() }),
        {
          loading: "Updating group...",
          success: "Group updated!",
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
    if (!confirm("Delete this group?")) return;

    await toast.promise(adminDeleteGroup(id), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchData();
  };

  /* ---------------- Permissions ---------------- */
  const togglePermission = (id: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const savePermissions = async () => {
    if (!permGroup) return;

    try {
      setSaving(true);
      await toast.promise(
        adminSetGroupPermissions(permGroup.id, selectedPermIds),
        {
          loading: "Saving permissions...",
          success: "Permissions updated!",
          error: (e: any) => e.message || "Save failed",
        }
      );
      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Groups</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create groups and assign permissions
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Group
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search group..."
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
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                No groups found
              </h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" /> Create Group
              </button>
            </div>
          ) : (
            filtered.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-slate-100">{g.name}</h3>
                  </div>
                  <div className="text-sm text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    {(g.permissions || []).length} permissions
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openPermissions(g)}
                    className="px-3 py-2 rounded-lg border border-slate-700 text-sm text-slate-200 hover:bg-slate-800"
                  >
                    Set Permissions
                  </button>
                  <button
                    onClick={() => openEdit(g)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        {(isCreateOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditOpen ? "Edit Group" : "Create Group"}
                </h3>
                <button onClick={closeModals} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <label className="block text-sm text-slate-300 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModals} className="px-4 py-2 border border-slate-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={isEditOpen ? handleUpdate : handleCreate}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PERMISSIONS MODAL */}
        {isPermOpen && permGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Set Permissions</h3>
                  <p className="text-sm text-slate-400">{permGroup.name}</p>
                </div>
                <button onClick={closeModals} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[55vh] overflow-auto">
                {permissions.map((p) => (
                  <label
                    key={p.id}
                    className="flex gap-2 p-3 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermIds.includes(p.id)}
                      onChange={() => togglePermission(p.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">{p.key}</div>
                      <div className="text-xs text-slate-400">{p.label}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button onClick={closeModals} className="px-4 py-2 border border-slate-700 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={savePermissions}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
