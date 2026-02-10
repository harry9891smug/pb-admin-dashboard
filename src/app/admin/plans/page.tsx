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
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/lib/api";

/** ✅ Backend based */
type PlanStatus = "active" | "inactive";
type BillingType = "one_time" | "recurring";
type BillingCycle = "monthly" | "yearly" | "weekly" | "daily";

type PlanForm = {
  name: string;
  description: string;
  status: PlanStatus;

  billingType: BillingType;
  billingCycle: BillingCycle;

  amount: string; // input string (convert to number on submit)
  discountAmount: string;

  smsLimit: string;
  offerLimit: string;

  isPopular: boolean;
  sortOrder: string;

  featuresText: string; // textarea -> one feature per line
  allowTopups: boolean;
  topupOptionsText: string; // textarea -> "amount,sms" per line
};

const emptyForm: PlanForm = {
  name: "",
  description: "",
  status: "active",

  billingType: "recurring",
  billingCycle: "monthly",

  amount: "",
  discountAmount: "0",

  smsLimit: "0",
  offerLimit: "0",

  isPopular: false,
  sortOrder: "0",

  featuresText: "",
  allowTopups: false,
  topupOptionsText: "",
};

function toNumber(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseFeatures(text: string) {
  return text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseTopups(text: string) {
  // format: "amount,sms" per line
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [amountStr, smsStr] = line.split(",").map((x) => x.trim());
      return { amount: toNumber(amountStr, 0), sms: toNumber(smsStr, 0) };
    })
    .filter((x) => x.amount > 0 && x.sms > 0);
}

function stringifyTopups(options: any[] | undefined) {
  if (!Array.isArray(options)) return "";
  return options.map((x) => `${x.amount},${x.sms}`).join("\n");
}

export default function PlansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PlanStatus>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const [form, setForm] = useState<PlanForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getPlans();

      // ✅ API maybe {success, data} ya {items} return kare
      const list =
        (res as any)?.data ??
        (res as any)?.items ??
        (Array.isArray(res) ? res : []);

      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e.message || "Failed to load plans");
      toast.error(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return (items || []).filter((p) => {
      const matchesSearch = !q || (p.name || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = (items || []).length;
    const active = (items || []).filter((x) => x.status === "active").length;
    const inactive = (items || []).filter((x) => x.status === "inactive").length;
    return { total, active, inactive };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setIsCreateOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);

    setForm({
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      status: (plan?.status as PlanStatus) ?? "active",

      billingType: (plan?.billingType as BillingType) ?? "recurring",
      billingCycle: (plan?.billingCycle as BillingCycle) ?? "monthly",

      amount: plan?.amount != null ? String(plan.amount) : "",
      discountAmount: plan?.discountAmount != null ? String(plan.discountAmount) : "0",

      smsLimit: plan?.smsLimit != null ? String(plan.smsLimit) : "0",
      offerLimit: plan?.offerLimit != null ? String(plan.offerLimit) : "0",

      isPopular: !!plan?.isPopular,
      sortOrder: plan?.sortOrder != null ? String(plan.sortOrder) : "0",

      featuresText: Array.isArray(plan?.features) ? plan.features.join("\n") : "",
      allowTopups: !!plan?.allowTopups,
      topupOptionsText: stringifyTopups(plan?.topupOptions),
    });

    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditing(null);
    setSaving(false);
  };

  const validate = () => {
    if (!form.name.trim()) return "Name required";
    if (!form.billingType) return "Billing type required";
    if (!form.amount || toNumber(form.amount, -1) < 0) return "Amount required (>= 0)";
    if (form.billingType === "recurring" && !form.billingCycle) return "Billing cycle required";

    if (toNumber(form.smsLimit, -1) < 0) return "SMS limit invalid";
    if (toNumber(form.offerLimit, -1) < 0) return "Offer limit invalid";
    if (toNumber(form.discountAmount, -1) < 0) return "Discount invalid";
    return null;
  };

  const buildPayload = () => {
    const payload: any = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      status: form.status,

      billingType: form.billingType, // ✅ one_time | recurring
      billingCycle: form.billingType === "recurring" ? form.billingCycle : null,

      amount: toNumber(form.amount, 0), // ✅ number
      discountAmount: toNumber(form.discountAmount, 0),

      smsLimit: toNumber(form.smsLimit, 0),
      offerLimit: toNumber(form.offerLimit, 0),

      isPopular: !!form.isPopular,
      sortOrder: toNumber(form.sortOrder, 0),

      features: parseFeatures(form.featuresText),
      allowTopups: !!form.allowTopups,
      topupOptions: form.allowTopups ? parseTopups(form.topupOptionsText) : [],
    };

    return payload;
  };

  const handleCreate = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const payload = buildPayload();

      await toast.promise(createPlan(payload), {
        loading: "Creating plan...",
        success: "Plan created!",
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

      const payload = buildPayload();

      await toast.promise(updatePlan(editing.id, payload), {
        loading: "Updating plan...",
        success: "Plan updated!",
        error: (e: any) => e.message || "Update failed",
      });

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this plan?")) return;
    await toast.promise(deletePlan(id), {
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
            <h1 className="text-2xl font-semibold tracking-tight">Plans Management</h1>
            <p className="text-sm text-slate-400 mt-1">Create and manage subscription plans</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Plan
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
            <p className="text-xs uppercase text-slate-400">Total Plans</p>
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
                placeholder="Search plans by name..."
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
              No plans found
            </div>
          ) : (
            filtered.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-100">{plan.name}</h3>

                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        plan.status === "active"
                          ? "bg-emerald-500/20 text-black-300 border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }`}
                    >
                      {plan.status}
                    </span>

                    <span className="text-xs px-2 py-1 rounded-full border bg-slate-800 text-slate-200 border-slate-700">
                      {plan.billingType}
                      {plan.billingType === "recurring" && plan.billingCycle ? ` • ${plan.billingCycle}` : ""}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400">{plan.description || "—"}</p>

                  <div className="text-sm text-slate-300 flex flex-wrap gap-3">
                    <span>
                      ₹ <b>{plan.amount}</b>
                    </span>
                    <span>
                      SMS <b>{plan.smsLimit}</b>
                    </span>
                    <span>
                      Offers <b>{plan.offerLimit}</b>
                    </span>
                    {plan.discountAmount != null && (
                      <span>
                        Discount <b>{plan.discountAmount}</b>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
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
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{isEditOpen ? "Edit Plan" : "Create Plan"}</h3>
                <button onClick={closeModals} disabled={saving} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name *" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
                <Select
                  label="Status *"
                  value={form.status}
                  onChange={(v) => setForm((p) => ({ ...p, status: v as PlanStatus }))}
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />

                <div className="md:col-span-2">
                  <TextArea
                    label="Description"
                    value={form.description}
                    onChange={(v) => setForm((p) => ({ ...p, description: v }))}
                  />
                </div>

                <Select
                  label="Billing Type *"
                  value={form.billingType}
                  onChange={(v) => setForm((p) => ({ ...p, billingType: v as BillingType }))}
                  options={[
                    { value: "one_time", label: "One Time" },
                    { value: "recurring", label: "Recurring" },
                  ]}
                />

                <Select
                  label="Billing Cycle"
                  value={form.billingCycle}
                  onChange={(v) => setForm((p) => ({ ...p, billingCycle: v as BillingCycle }))}
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "yearly", label: "Yearly" },
                    { value: "weekly", label: "Weekly" },
                    { value: "daily", label: "Daily" },
                  ]}
                  disabled={form.billingType !== "recurring"}
                />

                <Field
                  label="Amount (₹) *"
                  type="number"
                  value={form.amount}
                  onChange={(v) => setForm((p) => ({ ...p, amount: v }))}
                />

                <Field
                  label="Discount Amount"
                  type="number"
                  value={form.discountAmount}
                  onChange={(v) => setForm((p) => ({ ...p, discountAmount: v }))}
                />

                <Field
                  label="SMS Limit"
                  type="number"
                  value={form.smsLimit}
                  onChange={(v) => setForm((p) => ({ ...p, smsLimit: v }))}
                />

                <Field
                  label="Offer Limit"
                  type="number"
                  value={form.offerLimit}
                  onChange={(v) => setForm((p) => ({ ...p, offerLimit: v }))}
                />

                <Field
                  label="Sort Order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(v) => setForm((p) => ({ ...p, sortOrder: v }))}
                />

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(e) => setForm((p) => ({ ...p, isPopular: e.target.checked }))}
                  />
                  <span className="text-sm text-slate-200">Popular plan</span>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={form.allowTopups}
                    onChange={(e) => setForm((p) => ({ ...p, allowTopups: e.target.checked }))}
                  />
                  <span className="text-sm text-slate-200">Allow topups</span>
                </div>

                <div className="md:col-span-2">
                  <TextArea
                    label="Features (one per line)"
                    value={form.featuresText}
                    onChange={(v) => setForm((p) => ({ ...p, featuresText: v }))}
                  />
                </div>

                {form.allowTopups && (
                  <div className="md:col-span-2">
                    <TextArea
                      label='Topup Options (one per line: "amount,sms")'
                      value={form.topupOptionsText}
                      onChange={(v) => setForm((p) => ({ ...p, topupOptionsText: v }))}
                    />
                    <p className="text-xs text-slate-500 mt-1">Example: 100,250</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={isEditOpen ? handleUpdate : handleCreate}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 flex items-center gap-2"
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

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <input
        type={props.type || "text"}
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
      />
    </div>
  );
}

function TextArea(props: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <textarea
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[90px]"
      />
    </div>
  );
}

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <select
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none disabled:opacity-50"
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
