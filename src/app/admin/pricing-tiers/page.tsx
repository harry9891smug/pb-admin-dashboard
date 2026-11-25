"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Power, Users, MessageSquare, Tag, RefreshCw } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageShell from "@/components/ui/PageShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  adminListPricingTiers,
  adminCreatePricingTier,
  adminUpdatePricingTier,
  adminRetirePricingTier,
  type PricingTier,
  type PaymentType,
} from "@/lib/api/admin/appAdmin";

const FEATURES: Record<string, { label: string; icon: any; tone: string }> = {
  team_licence: { label: "Team Licence", icon: Users, tone: "from-violet-500 to-fuchsia-500" },
  sms_credit: { label: "SMS Credits", icon: MessageSquare, tone: "from-emerald-500 to-teal-500" },
};

type Form = {
  featureCode: string;
  name: string;
  quantity: string;
  durationDays: string;
  price: string;
  paymentType: PaymentType;
  isActive: boolean;
};

const empty: Form = {
  featureCode: "team_licence",
  name: "",
  quantity: "",
  durationDays: "30",
  price: "",
  paymentType: "SUBSCRIPTION",
  isActive: true,
};

const inputCls =
  "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

const inr = (v: string | number) => `₹${Number(v).toLocaleString("en-IN")}`;

export default function PricingTiersPage() {
  const { user } = useAuth();
  const perms = user?.permissions ?? [];
  const canCreate = perms.includes("subscription.create");
  const canUpdate = perms.includes("subscription.update");

  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PricingTier | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTiers(await adminListPricingTiers());
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || e.message || "Failed to load pricing tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, PricingTier[]> = {};
    tiers.forEach((t) => (map[t.featureCode] ||= []).push(t));
    return Object.entries(map);
  }, [tiers]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (t: PricingTier) => {
    setEditing(t);
    setForm({
      featureCode: t.featureCode,
      name: t.name,
      quantity: t.quantity != null ? String(t.quantity) : "",
      durationDays: t.durationDays != null ? String(t.durationDays) : "",
      price: String(Number(t.price)),
      paymentType: t.paymentType,
      isActive: t.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    const price = Number(form.price);
    if (form.price === "" || Number.isNaN(price) || price < 0) return toast.error("Enter a valid price");

    const payload = {
      featureCode: form.featureCode.trim(),
      name: form.name.trim(),
      quantity: form.quantity ? Number(form.quantity) : null,
      durationDays: form.durationDays ? Number(form.durationDays) : null,
      price,
      paymentType: form.paymentType,
      isActive: form.isActive,
    };

    try {
      setSaving(true);
      if (editing) await adminUpdatePricingTier(editing.id, payload);
      else await adminCreatePricingTier(payload);
      toast.success(editing ? "Tier updated" : "Tier created");
      setOpen(false);
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message;
      toast.error(typeof msg === "string" ? msg : "Could not save tier");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (t: PricingTier) => {
    try {
      if (t.isActive) {
        if (!confirm(`Retire "${t.name}"? Users will no longer see it.`)) return;
        await adminRetirePricingTier(t.id);
      } else {
        await adminUpdatePricingTier(t.id, { isActive: true });
      }
      load();
    } catch {
      toast.error("Could not change status");
    }
  };

  return (
    <ProtectedRoute requiredPermission="subscription.view">
      <PageShell
        top={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add-on Pricing</h1>
            <p className="mt-1 text-sm text-gray-500">
              Prices shown in the app for Team Licences and SMS credits. Retire a tier instead of deleting it so
              past purchases keep their price.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            {canCreate && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" /> New tier
              </button>
            )}
          </div>
        </div>
        }
      >
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading…
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-white p-12 text-center">
            <Tag className="mx-auto h-10 w-10 text-violet-400" />
            <p className="mt-3 font-semibold text-gray-900">No pricing tiers yet</p>
            <p className="mt-1 text-sm text-gray-500">Create the first tier to show prices in the app.</p>
          </div>
        ) : (
          groups.map(([code, list]) => {
            const meta = FEATURES[code] ?? { label: code, icon: Tag, tone: "from-sky-500 to-blue-500" };
            const Icon = meta.icon;
            return (
              <section key={code} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.tone} text-white shadow`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-bold text-gray-900">{meta.label}</h2>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    {list.length} tier{list.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((t) => (
                    <div
                      key={t.id}
                      className={`relative rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                        t.isActive ? "border-gray-200" : "border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">{t.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {t.paymentType === "SUBSCRIPTION" ? "Recurring" : "One-time"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            t.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.isActive ? "Active" : "Retired"}
                        </span>
                      </div>

                      <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{inr(t.price)}</p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                        {t.quantity != null && (
                          <span className="rounded-lg bg-violet-50 px-2 py-1 font-medium text-violet-700">
                            {t.quantity.toLocaleString("en-IN")} {code === "sms_credit" ? "SMS" : "units"}
                          </span>
                        )}
                        {t.durationDays != null && (
                          <span className="rounded-lg bg-sky-50 px-2 py-1 font-medium text-sky-700">
                            {t.durationDays} days
                          </span>
                        )}
                      </div>

                      {canUpdate && (
                        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3">
                          <button
                            onClick={() => openEdit(t)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-violet-300 hover:bg-violet-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => toggle(t)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-amber-300 hover:bg-amber-50"
                          >
                            <Power className="h-3.5 w-3.5" /> {t.isActive ? "Retire" : "Reactivate"}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{editing ? "Edit tier" : "New pricing tier"}</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400">
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Feature</label>
                  <input
                    list="feature-codes"
                    value={form.featureCode}
                    onChange={(e) => setForm({ ...form, featureCode: e.target.value })}
                    className={inputCls}
                  />
                  <datalist id="feature-codes">
                    <option value="team_licence" />
                    <option value="sms_credit" />
                  </datalist>
                </div>

                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. 1 member / 30 days"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Payment type</label>
                    <select
                      value={form.paymentType}
                      onChange={(e) => setForm({ ...form, paymentType: e.target.value as PaymentType })}
                      className={inputCls}
                    >
                      <option value="SUBSCRIPTION">Recurring</option>
                      <option value="PREPAID">One-time</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      placeholder="e.g. 500 SMS"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Duration (days)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.durationDays}
                      onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Visible to users
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Saving…" : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
