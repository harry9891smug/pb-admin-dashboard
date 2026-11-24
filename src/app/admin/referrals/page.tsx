"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, AlertCircle, Gift, Copy, Power, Users } from "lucide-react";
import { toast } from "react-hot-toast";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useShowMore, ShowMoreButton } from "@/components/ui/ShowMore";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminCreateReferral,
  adminListReferrals,
  adminReferralLeaderboard,
  adminReferralSignups,
  adminUpdateReferral,
  REFERRAL_OWNER_TYPES,
  ReferralCode,
  ReferralLeader,
  ReferralOwnerType,
  ReferralSignup,
} from "@/lib/api/admin/referrals";

const OWNER_LABELS: Record<ReferralOwnerType, string> = {
  influencer: "Influencer",
  associate: "Associate",
  sales: "Sales",
  other: "Other",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20";

export default function ReferralsPage() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const canManage = permissions.includes("subscription.update");

  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [leaders, setLeaders] = useState<ReferralLeader[]>([]);
  const codesMore = useShowMore(codes, 8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ReferralOwnerType | "all">("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    ownerType: "influencer" as ReferralOwnerType,
    ownerName: "",
    notes: "",
    smsCredits: 30,
    maxUses: "",
  });

  const [signupsFor, setSignupsFor] = useState<ReferralCode | null>(null);
  const [signups, setSignups] = useState<ReferralSignup[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [list, board] = await Promise.all([
        adminListReferrals(typeFilter === "all" ? undefined : typeFilter),
        adminReferralLeaderboard(),
      ]);
      setCodes(list);
      setLeaders(board);
    } catch (e: any) {
      setError(e.message || "Failed to load referral codes");
      toast.error(e.message || "Failed to load referral codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  const openCreate = () => {
    setForm({ code: "", ownerType: "influencer", ownerName: "", notes: "", smsCredits: 30, maxUses: "" });
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error("Code: 3-30 letters, numbers, - or _");
    if (!form.ownerName.trim()) return toast.error("Owner name is required");
    if (form.smsCredits < 0) return toast.error("SMS credits cannot be negative");
    const maxUses = form.maxUses.trim() ? Number(form.maxUses) : null;
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
      return toast.error("Max uses must be a whole number of 1 or more, or empty for no limit");
    }

    try {
      setSaving(true);
      await adminCreateReferral({
        code,
        ownerType: form.ownerType,
        ownerName: form.ownerName.trim(),
        notes: form.notes.trim() || undefined,
        smsCredits: Number(form.smsCredits),
        maxUses,
      });
      toast.success(`Code ${code} created`);
      setIsCreateOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: ReferralCode) => {
    if (!confirm(`${c.isActive ? "Switch off" : "Switch on"} code ${c.code}?`)) return;
    try {
      await adminUpdateReferral(c.id, { isActive: !c.isActive });
      toast.success(c.isActive ? "Code switched off" : "Code switched on");
      fetchData();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    }
  };

  const openSignups = async (c: ReferralCode) => {
    setSignupsFor(c);
    setSignups([]);
    setSignupsLoading(true);
    try {
      setSignups(await adminReferralSignups(c.id));
    } catch (e: any) {
      toast.error(e.message || "Failed to load signups");
    } finally {
      setSignupsLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      // clipboard permission denied: not worth an error
    }
  };

  const totalSignups = codes.reduce((s, c) => s + c.signups, 0);
  const totalActive = codes.reduce((s, c) => s + c.activeBusinesses, 0);

  return (
    <ProtectedRoute requiredPermission="business.view">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Referral Codes</h1>
            <p className="text-sm text-slate-400 mt-1">
              A new business that registers with a code gets free SMS that never expire. See who brings in the
              most businesses.
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
            {canManage && (
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Code
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Codes</p>
            <p className="mt-2 text-2xl font-semibold">{codes.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Businesses signed up</p>
            <p className="mt-2 text-2xl font-semibold">{totalSignups}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Of those, made an invoice</p>
            <p className="mt-2 text-2xl font-semibold">{totalActive}</p>
          </div>
        </div>

        {/* Leaderboard: performance per person */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">Who is doing well</h2>
          {leaders.length === 0 ? (
            <p className="text-sm text-slate-500">No codes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-400">
                    <th className="py-2 pr-4">#</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4 text-right">Signups</th>
                    <th className="py-2 text-right">Made an invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((l, i) => (
                    <tr key={`${l.ownerType}-${l.ownerName}`} className="border-t border-slate-800">
                      <td className="py-2 pr-4 text-slate-500">{i + 1}</td>
                      <td className="py-2 pr-4 text-slate-100">{l.ownerName}</td>
                      <td className="py-2 pr-4 text-slate-300">{OWNER_LABELS[l.ownerType] ?? l.ownerType}</td>
                      <td className="py-2 pr-4 text-right text-slate-100">{l.signups}</td>
                      <td className="py-2 text-right text-slate-100">{l.activeBusinesses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-200 outline-none focus:border-emerald-400"
          >
            <option value="all">All owner types</option>
            {REFERRAL_OWNER_TYPES.map((t) => (
              <option key={t} value={t}>
                {OWNER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4">
          {loading && codes.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">Loading...</div>
          ) : codes.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No referral codes yet</h3>
            </div>
          ) : (
            codesMore.visible.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Gift className="w-4 h-4 text-emerald-400 shrink-0" />
                    <h3 className="font-semibold text-slate-100 tracking-wide">{c.code}</h3>
                    <button onClick={() => copy(c.code)} className="text-slate-500 hover:text-emerald-400" title="Copy">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        c.isActive
                          ? "border-emerald-700 bg-emerald-900/30 text-emerald-300"
                          : "border-slate-700 bg-slate-800 text-slate-400"
                      }`}
                    >
                      {c.isActive ? "active" : "off"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-950 text-slate-300">
                      {OWNER_LABELS[c.ownerType] ?? c.ownerType}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                    <span>
                      Owner: <span className="text-slate-200">{c.ownerName}</span>
                    </span>
                    <span>
                      Gives: <span className="text-slate-200">{c.smsCredits} SMS</span>
                    </span>
                    <span>
                      Signups:{" "}
                      <span className="text-slate-200">
                        {c.signups}
                        {c.maxUses ? ` / ${c.maxUses}` : ""}
                      </span>
                    </span>
                    <span>
                      Made an invoice: <span className="text-slate-200">{c.activeBusinesses}</span>
                    </span>
                    <span>
                      SMS used: <span className="text-slate-200">{c.creditsUsed} / {c.creditsGranted}</span>
                    </span>
                    <span>Created {formatDate(c.createdAt)}</span>
                  </div>
                  {c.notes && <p className="text-xs text-slate-500 truncate">Notes: {c.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openSignups(c)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-slate-700"
                  >
                    <Users className="w-4 h-4" />
                    Signups
                  </button>
                  {canManage && (
                    <button
                      onClick={() => toggleActive(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-300 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors border border-slate-700"
                    >
                      <Power className="w-4 h-4" />
                      {c.isActive ? "Switch off" : "Switch on"}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          <ShowMoreButton hasMore={codesMore.hasMore} rest={codesMore.rest} onClick={codesMore.more} />
        </div>

        {/* Create modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">New Referral Code</h3>
                <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="RAHUL30"
                    maxLength={30}
                    className={inputCls}
                  />
                  <p className="text-xs text-slate-500 mt-1">3-30 letters, numbers, - or _. The shopkeeper types this at login.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Type *</label>
                    <select
                      value={form.ownerType}
                      onChange={(e) => setForm({ ...form, ownerType: e.target.value as ReferralOwnerType })}
                      className={inputCls}
                    >
                      {REFERRAL_OWNER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {OWNER_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Name *</label>
                    <input
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                      placeholder="Who owns this code"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Free SMS</label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={form.smsCredits}
                      onChange={(e) => setForm({ ...form, smsCredits: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Max signups</label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                      placeholder="No limit"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signups modal */}
        {signupsFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Signups with {signupsFor.code}</h3>
                <button onClick={() => setSignupsFor(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              {signupsLoading ? (
                <p className="text-sm text-slate-400">Loading...</p>
              ) : signups.length === 0 ? (
                <p className="text-sm text-slate-500">Nobody has used this code yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3">Business</th>
                      <th className="py-2 pr-3">Joined</th>
                      <th className="py-2 text-right">Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s) => (
                      <tr key={s.id} className="border-t border-slate-800">
                        <td className="py-2 pr-3 text-slate-100">{s.businessName || `Business #${s.businessId}`}</td>
                        <td className="py-2 pr-3 text-slate-300">{formatDate(s.createdAt)}</td>
                        <td className="py-2 text-right text-slate-100">{s.invoices}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
