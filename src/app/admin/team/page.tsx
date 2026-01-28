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
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  adminListTeamMembers,
  adminCreateTeamMember,
  adminUpdateTeamMember,
  adminDeleteTeamMember,
  adminListJobRoles,
  adminListGroups,
  AdminTeamMember,
  AdminJobRole,
  AdminGroup,
} from "@/lib/api";

export default function TeamMembersPage() {
  const [items, setItems] = useState<AdminTeamMember[]>([]);
  const [jobRoles, setJobRoles] = useState<AdminJobRole[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTeamMember | null>(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    email: string;
    mobile: string;
    password: string;
    jobRoleId: number | "";
    extraGroupIds: number[];
  }>({
    email: "",
    mobile: "",
    password: "",
    jobRoleId: "",
    extraGroupIds: [],
  });

  /* ---------------- Fetch ---------------- */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [teamRes, jobRolesRes, groupsRes] = await Promise.all([
        adminListTeamMembers({ limit: 100, offset: 0 }),
        adminListJobRoles(),
        adminListGroups(),
      ]);

      setItems(teamRes.items || []);
      setJobRoles(jobRolesRes);
      setGroups(groupsRes);
    } catch (e: any) {
      setError(e.message || "Failed to load team members");
      toast.error(e.message || "Failed to load team members");
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

    return items.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const mob = (u.mobile || "").toLowerCase();
      const jr = (u.adminJobRole?.name || "").toLowerCase();
      return email.includes(q) || mob.includes(q) || jr.includes(q);
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    return { total: items.length };
  }, [items]);

  /* ---------------- Helpers ---------------- */
  const openCreate = () => {
    setForm({
      email: "",
      mobile: "",
      password: "",
      jobRoleId: jobRoles[0]?.id ?? "",
      extraGroupIds: [],
    });
    setIsCreateOpen(true);
  };

  const openEdit = (u: AdminTeamMember) => {
    setEditing(u);
    setForm({
      email: u.email || "",
      mobile: u.mobile || "",
      password: "", // optional update
      jobRoleId: u.adminJobRole?.id ?? "",
      extraGroupIds: (u.adminRoles || []).map((g) => g.id), // extra groups
    });
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditing(null);
    setSaving(false);
  };

  const validateCreate = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.password.trim()) return "Password is required";
    if (!form.jobRoleId) return "Job role is required";
    return null;
  };

  const validateEdit = () => {
    if (!form.email.trim()) return "Email is required";
    if (!form.jobRoleId) return "Job role is required";
    return null;
  };

  /* ---------------- Actions ---------------- */
  const handleCreate = async () => {
    const msg = validateCreate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      await toast.promise(
        adminCreateTeamMember({
          email: form.email.trim(),
          mobile: form.mobile.trim() || undefined,
          password: form.password.trim(),
          jobRoleId: Number(form.jobRoleId),
          extraGroupIds: form.extraGroupIds,
        }),
        {
          loading: "Creating team member...",
          success: "Team member created!",
          error: (e: any) => e.message || "Create failed",
        }
      );

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const msg = validateEdit();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      await toast.promise(
        adminUpdateTeamMember(editing.id, {
          email: form.email.trim(),
          mobile: form.mobile.trim() || undefined,
          password: form.password.trim() ? form.password.trim() : undefined,
          jobRoleId: Number(form.jobRoleId),
          extraGroupIds: form.extraGroupIds,
        }),
        {
          loading: "Updating team member...",
          success: "Team member updated!",
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
    if (!confirm("Delete this team member?")) return;

    await toast.promise(adminDeleteTeamMember(id), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchData();
  };

  const toggleExtraGroup = (id: number) => {
    setForm((prev) => ({
      ...prev,
      extraGroupIds: prev.extraGroupIds.includes(id)
        ? prev.extraGroupIds.filter((x) => x !== id)
        : [...prev.extraGroupIds, id],
    }));
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
            <p className="text-sm text-slate-400 mt-1">
              Create and manage support admin accounts
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
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Member
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
              placeholder="Search by email, mobile, job role..."
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
              <h3 className="text-lg font-medium text-slate-300 mb-2">No team members found</h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Member
              </button>
            </div>
          ) : (
            filtered.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-slate-100">{u.email}</h3>
                  </div>

                  <div className="text-sm text-slate-400">
                    Mobile: <span className="text-slate-200">{u.mobile || "-"}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-700 bg-slate-950 text-slate-200">
                      <Briefcase className="w-4 h-4" />
                      {u.adminJobRole?.name || "No Job Role"}
                    </span>

                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-slate-700 bg-slate-950 text-slate-200">
                      <ShieldCheck className="w-4 h-4" />
                      {(u.adminRoles || []).length} extra groups
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
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
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditOpen ? "Edit Team Member" : "Create Team Member"}
                </h3>
                <button onClick={closeModals} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Mobile</label>
                  <input
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="9999999900"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Password {isEditOpen ? "(leave empty to keep same)" : "*"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-1">Job Role *</label>
                  <select
                    value={form.jobRoleId}
                    onChange={(e) => setForm({ ...form, jobRoleId: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">Select job role</option>
                    {jobRoles.map((jr) => (
                      <option key={jr.id} value={jr.id}>
                        {jr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Extra Groups</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto">
                    {groups.map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 bg-slate-900/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.extraGroupIds.includes(g.id)}
                          onChange={() => toggleExtraGroup(g.id)}
                        />
                        <span className="text-sm text-slate-200">{g.name}</span>
                      </label>
                    ))}
                  </div>
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
