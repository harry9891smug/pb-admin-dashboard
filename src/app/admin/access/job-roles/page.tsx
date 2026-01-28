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
  Briefcase,
  Users,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  adminListJobRoles,
  adminCreateJobRole,
  adminSetJobRoleGroups,
  adminListGroups,
  AdminJobRole,
  AdminGroup,
} from "@/lib/api";

export default function JobRolesPage() {
  const [items, setItems] = useState<AdminJobRole[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);

  const [editing, setEditing] = useState<AdminJobRole | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  /* ---------------- Fetch ---------------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [roles, allGroups] = await Promise.all([
        adminListJobRoles(),
        adminListGroups(),
      ]);

      setItems(roles);
      setGroups(allGroups);
    } catch (e: any) {
      setError(e.message || "Failed to load job roles");
      toast.error(e.message || "Failed to load job roles");
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
    return items.filter((r) => r.name.toLowerCase().includes(q));
  }, [items, searchTerm]);

  const stats = useMemo(() => ({ total: items.length }), [items]);

  /* ---------------- Helpers ---------------- */
  const openCreate = () => {
    setName("");
    setIsCreateOpen(true);
  };

  const openGroups = (role: AdminJobRole) => {
    setEditing(role);
    setSelectedGroupIds((role.groups || []).map((g) => g.id));
    setIsGroupsOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsGroupsOpen(false);
    setEditing(null);
    setSelectedGroupIds([]);
    setSaving(false);
  };

  /* ---------------- CRUD ---------------- */
  const handleCreate = async () => {
    if (!name.trim()) return toast.error("Role name required");

    try {
      setSaving(true);
      await toast.promise(adminCreateJobRole({ name: name.trim() }), {
        loading: "Creating role...",
        success: "Job role created!",
        error: (e: any) => e.message || "Create failed",
      });
      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (id: number) => {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const saveGroups = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      await toast.promise(
        adminSetJobRoleGroups(editing.id, selectedGroupIds),
        {
          loading: "Saving groups...",
          success: "Groups assigned!",
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
            <h1 className="text-2xl font-semibold tracking-tight">Job Roles</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create job roles and assign groups
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
              <Plus className="w-4 h-4 mr-2" /> Create Role
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
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase text-slate-400">Total</p>
          <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search job role..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                No job roles found
              </h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" /> Create Job Role
              </button>
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-slate-100">{r.name}</h3>
                  </div>
                  <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                    <Users className="w-4 h-4" />
                    {(r.groups || []).length} groups
                  </div>
                </div>

                <button
                  onClick={() => openGroups(r)}
                  className="px-3 py-2 rounded-lg border border-slate-700 text-sm hover:bg-slate-800"
                >
                  Assign Groups
                </button>
              </div>
            ))
          )}
        </div>

        {/* CREATE MODAL */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="text-lg font-semibold mb-4">Create Job Role</h3>

              <label className="block text-sm mb-1">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GROUPS MODAL */}
        {isGroupsOpen && editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950 p-5">
              <h3 className="text-lg font-semibold mb-4">
                Assign Groups – {editing.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-auto">
                {groups.map((g) => (
                  <label
                    key={g.id}
                    className="flex gap-2 p-3 border border-slate-800 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                    <span className="text-sm">{g.name}</span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 border border-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGroups}
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
