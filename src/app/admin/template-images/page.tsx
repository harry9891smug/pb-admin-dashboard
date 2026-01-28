"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import {
  isAuthenticated,
  adminListTemplateImages,
  adminCreateTemplateImage,
  adminUpdateTemplateImage,
  adminDeactivateTemplateImage,
  adminGetTemplateImageById,
  type AdminTemplateImage,
  type TemplateSourceType,
} from "@/lib/api";

type FormState = {
  id?: number;
  title: string;
  image_url: string;
  source_type: TemplateSourceType;
  festival_category: string;
  business_category_id: string; // keep as string for input
  business_id: string; // optional
  fallback_image_id: string; // optional
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  image_url: "",
  source_type: "PUBLIC",
  festival_category: "",
  business_category_id: "",
  business_id: "",
  fallback_image_id: "",
  is_active: true,
};

export default function TemplateImagesPage() {
  const router = useRouter();

  // ✅ auth redirect
  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  // Filters
  const [businessCategoryId, setBusinessCategoryId] = useState<string>("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [sourceType, setSourceType] = useState<"ALL" | "PUBLIC" | "INTERNAL">("ALL");
  const [includeBusinessInternal, setIncludeBusinessInternal] = useState<boolean>(false);

  // Data
  const [items, setItems] = useState<AdminTemplateImage[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal
  const [open, setOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await adminListTemplateImages({
        business_category_id: businessCategoryId ? Number(businessCategoryId) : undefined,
        active: active || undefined,
        source_type: sourceType,
        include_business_internal: includeBusinessInternal ? "true" : "false",
        limit,
        offset,
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      const msg = e?.message || "Failed to load template images";
      toast.error(msg);

      // ✅ session expired handling (common)
      if (String(msg).toLowerCase().includes("session")) {
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessCategoryId, active, sourceType, includeBusinessInternal, limit, offset]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditingId(id);
    setOpen(true);
    setSaving(true);
    try {
      const res = await adminGetTemplateImageById(id);
      const d = res?.data || res?.data?.data || res?.data?.item || res?.item || res?.data?.data?.item;

      // backend response is: { success:true, data:{...} }
      const img = res?.data?.data || res?.data?.data?.data || res?.data?.data;
      const row = img?.id ? img : res?.data?.data;

      const payload = row && row.id ? row : res?.data?.data;

      const item = payload && payload.id ? payload : (res?.data?.data?.data as any);

      const x = item && item.id ? item : (res?.data?.data as any);

      const obj = x?.id ? x : (res?.data?.data?.data as any);

      const final = obj?.id ? obj : (res?.data?.data as any);

      const data = final?.id ? final : (res?.data?.data as any);

      const source_type = (data?.source_type || "PUBLIC") as TemplateSourceType;

      setForm({
        id: data?.id,
        title: data?.title ?? "",
        image_url: data?.image_url ?? "",
        source_type,
        festival_category: data?.festival_category ?? "",
        business_category_id: data?.business_category_id ? String(data.business_category_id) : "",
        business_id: data?.business_id ? String(data.business_id) : "",
        fallback_image_id: data?.fallback_image_id ? String(data.fallback_image_id) : "",
        is_active: data?.is_active ?? true,
      });
    } catch (e: any) {
      toast.error(e?.message || "Failed to open item");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "Title is required";
    if (form.title.trim().length < 2) return "Title must be at least 2 characters";
    if (!form.image_url.trim()) return "Image URL is required";
    if (!form.business_category_id.trim()) return "Business Category ID is required";

    const bcId = Number(form.business_category_id);
    if (!Number.isFinite(bcId) || bcId <= 0) return "Business Category ID must be a valid number";

    if (form.source_type === "PUBLIC") {
      if (!form.fallback_image_id.trim()) return "PUBLIC image must have fallback_image_id";
      const fbId = Number(form.fallback_image_id);
      if (!Number.isFinite(fbId) || fbId <= 0) return "fallback_image_id must be a valid number";
      if (form.business_id.trim()) return "PUBLIC image must not have business_id";
    }

    if (form.source_type === "INTERNAL") {
      if (form.fallback_image_id.trim()) return "INTERNAL image must not have fallback_image_id";
      // business_id can be empty (base internal) OR set (business internal) — backend allows nullable
    }

    if (form.business_id.trim()) {
      const bId = Number(form.business_id);
      if (!Number.isFinite(bId) || bId <= 0) return "business_id must be a valid number";
    }

    return null;
  };

  const onSave = async () => {
    const err = validateForm();
    if (err) return toast.error(err);

    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      source_type: form.source_type,
      festival_category: form.festival_category.trim() ? form.festival_category.trim() : null,
      business_category_id: Number(form.business_category_id),
      is_active: !!form.is_active,
      business_id: form.business_id.trim() ? Number(form.business_id) : null,
      fallback_image_id: form.fallback_image_id.trim() ? Number(form.fallback_image_id) : null,
    };

    try {
      if (editingId) {
        await adminUpdateTemplateImage(editingId, payload);
        toast.success("Template image updated");
      } else {
        await adminCreateTemplateImage(payload);
        toast.success("Template image created");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
      if (String(e?.message || "").toLowerCase().includes("session")) router.replace("/login");
    } finally {
      setSaving(false);
    }
  };

  const onDeactivate = async (id: number) => {
    const ok = confirm("Deactivate this image?");
    if (!ok) return;

    const t = toast.loading("Deactivating...");
    try {
      await adminDeactivateTemplateImage(id);
      toast.success("Deactivated", { id: t });
      await fetchList();
    } catch (e: any) {
      toast.error(e?.message || "Deactivate failed", { id: t });
      if (String(e?.message || "").toLowerCase().includes("session")) router.replace("/login");
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Template Images</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage PUBLIC/INTERNAL offer template images (with fallback rules).
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/20 transition"
        >
          + Add Template Image
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-400">Business Category ID</label>
            <input
              value={businessCategoryId}
              onChange={(e) => {
                setOffset(0);
                setBusinessCategoryId(e.target.value);
              }}
              placeholder="e.g. 2"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => {
                setOffset(0);
                setSourceType(e.target.value as any);
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white"
            >
              <option value="ALL">ALL</option>
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Active</label>
            <select
              value={active}
              onChange={(e) => {
                setOffset(0);
                setActive(e.target.value as any);
              }}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white"
            >
              <option value="">All</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={includeBusinessInternal}
                onChange={(e) => {
                  setOffset(0);
                  setIncludeBusinessInternal(e.target.checked);
                }}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900"
              />
              Include business INTERNAL
            </label>
          </div>

          <div className="flex items-end gap-2 justify-end">
            <button
              onClick={() => {
                setBusinessCategoryId("");
                setActive("");
                setSourceType("ALL");
                setIncludeBusinessInternal(false);
                setOffset(0);
              }}
              className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
            >
              Reset
            </button>

            <button
              onClick={fetchList}
              className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm text-slate-300">
            Total: <span className="text-white font-semibold">{total}</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setOffset(0);
                setLimit(Number(e.target.value));
              }}
              className="px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-sm"
            >
              {[20, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}/page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60">
              <tr className="text-left text-slate-300">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">BC ID</th>
                <th className="px-4 py-3">Fallback</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={8}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-400" colSpan={8}>
                    No template images found.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="text-slate-200">
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{r.title}</div>
                      <div className="text-xs text-slate-500 break-all">{r.image_url}</div>
                      {r.festival_category ? (
                        <div className="text-xs text-slate-400 mt-1">
                          Festival: <span className="text-slate-200">{r.festival_category}</span>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.source_type === "PUBLIC"
                            ? "inline-flex px-2 py-1 rounded-md text-xs border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                            : "inline-flex px-2 py-1 rounded-md text-xs border border-purple-500/40 bg-purple-500/10 text-purple-200"
                        }
                      >
                        {r.source_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.business_category_id}</td>
                    <td className="px-4 py-3">{r.fallback_image_id ?? "-"}</td>
                    <td className="px-4 py-3">{r.usage_count ?? 0}</td>
                    <td className="px-4 py-3">
                      {r.is_active ? (
                        <span className="text-emerald-300">Yes</span>
                      ) : (
                        <span className="text-rose-300">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(r.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeactivate(r.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15 transition"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Page <span className="text-slate-200">{page}</span> /{" "}
            <span className="text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={offset <= 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 disabled:opacity-50 hover:bg-slate-800 transition"
            >
              Prev
            </button>
            <button
              disabled={offset + limit >= total || loading}
              onClick={() => setOffset(offset + limit)}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 disabled:opacity-50 hover:bg-slate-800 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">
                  {editingId ? `Edit Template Image #${editingId}` : "Add Template Image"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  PUBLIC requires fallback_image_id. INTERNAL must not have fallback_image_id.
                </div>
              </div>

              <button
                onClick={() => {
                  if (!saving) {
                    setOpen(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400">Image URL *</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Source Type *</label>
                <select
                  value={form.source_type}
                  onChange={(e) => {
                    const next = e.target.value as TemplateSourceType;
                    setForm((p) => ({
                      ...p,
                      source_type: next,
                      // helpful auto-clean
                      fallback_image_id: next === "INTERNAL" ? "" : p.fallback_image_id,
                      business_id: next === "PUBLIC" ? "" : p.business_id,
                    }));
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white"
                >
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="INTERNAL">INTERNAL</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Festival Category</label>
                <input
                  value={form.festival_category}
                  onChange={(e) => setForm((p) => ({ ...p, festival_category: e.target.value }))}
                  placeholder="e.g. Diwali"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Business Category ID *</label>
                <input
                  value={form.business_category_id}
                  onChange={(e) => setForm((p) => ({ ...p, business_category_id: e.target.value }))}
                  placeholder="e.g. 2"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Business ID {form.source_type === "PUBLIC" ? "(must be empty)" : "(optional)"}
                </label>
                <input
                  value={form.business_id}
                  onChange={(e) => setForm((p) => ({ ...p, business_id: e.target.value }))}
                  disabled={form.source_type === "PUBLIC"}
                  placeholder="e.g. 10"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white disabled:opacity-50 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">
                  Fallback Image ID{" "}
                  {form.source_type === "PUBLIC" ? "*" : "(must be empty)"}
                </label>
                <input
                  value={form.fallback_image_id}
                  onChange={(e) => setForm((p) => ({ ...p, fallback_image_id: e.target.value }))}
                  disabled={form.source_type === "INTERNAL"}
                  placeholder="e.g. 12"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white disabled:opacity-50 placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                disabled={saving}
                onClick={() => {
                  setOpen(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                onClick={onSave}
                className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/20 transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
