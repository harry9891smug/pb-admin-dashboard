"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCan } from "@/hooks/useCan";
import {
  apiErrorMessage,
  createCaseConfig,
  deleteCaseConfig,
  listCaseConfig,
  updateCaseConfig,
  type CaseConfigKind,
  type CaseConfigRow,
} from "@/lib/api/admin/cases";

const inputCls =
  "h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";
const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex h-7 items-center gap-1 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

const TABS: { kind: CaseConfigKind; label: string; hint: string }[] = [
  { kind: "statuses", label: "Statuses", hint: "Stages a case moves through. Mark 'final' for closed-type statuses." },
  { kind: "categories", label: "Categories", hint: "Types of cases. The key 'callback' is used for callback requests - do not rename it." },
  { kind: "priorities", label: "Priorities", hint: "Urgency levels with an optional SLA in minutes." },
];

type Form = {
  key: string;
  name: string;
  description: string;
  order: string;
  slaMinutes: string;
  isFinal: boolean;
  isActive: boolean;
};

const emptyForm: Form = { key: "", name: "", description: "", order: "", slaMinutes: "", isFinal: false, isActive: true };

function Inner() {
  const can = useCan();
  const canManage = can("case.manage");
  const [kind, setKind] = useState<CaseConfigKind>("statuses");
  const [rows, setRows] = useState<CaseConfigRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CaseConfigRow | "new" | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CaseConfigRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listCaseConfig(kind);
      setRows([...(r || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    setEditing(null);
    load();
  }, [load]);

  const startNew = () => {
    setForm({ ...emptyForm, order: String((rows.reduce((m, r) => Math.max(m, r.order ?? 0), 0) || 0) + 1) });
    setEditing("new");
  };

  const startEdit = (r: CaseConfigRow) => {
    setForm({
      key: r.key,
      name: r.name,
      description: r.description ?? "",
      order: r.order != null ? String(r.order) : "",
      slaMinutes: r.slaMinutes != null ? String(r.slaMinutes) : "",
      isFinal: !!r.isFinal,
      isActive: r.isActive !== false,
    });
    setEditing(r);
  };

  const save = async () => {
    const body: Record<string, any> = {
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      isActive: form.isActive,
    };
    if (kind !== "categories" && form.order) body.order = Number(form.order);
    if (kind === "statuses") body.isFinal = form.isFinal;
    if (kind === "priorities") body.slaMinutes = form.slaMinutes ? Number(form.slaMinutes) : null;
    if (body.key.length < 2 || body.name.length < 2) {
      toast.error("Key and name need at least 2 characters");
      return;
    }
    setBusy(true);
    try {
      if (editing === "new") await createCaseConfig(kind, body);
      else if (editing) await updateCaseConfig(kind, editing.id, body);
      toast.success("Saved");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCaseConfig(kind, pendingDelete.id);
      toast.success("Deleted");
      setPendingDelete(null);
      load();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Delete failed (it may be in use - deactivate instead)"));
      setPendingDelete(null);
    }
  };

  const tab = TABS.find((t) => t.kind === kind)!;
  const set = (k: keyof Form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3 p-1">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Case Settings</h1>
        <p className="text-xs text-gray-500">Manage the statuses, categories and priorities used by Cases.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.kind}
              onClick={() => setKind(t.kind)}
              className={`h-7 rounded-md px-3 text-xs font-medium ${
                kind === t.kind ? "bg-violet-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {canManage ? (
          <button className={btnPrimary} onClick={startNew}>
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        ) : null}
      </div>
      <p className="text-[11px] text-gray-500">{tab.hint}</p>

      {editing && canManage ? (
        <div className="grid gap-2 rounded-lg border border-violet-200 bg-violet-50/40 p-3 sm:grid-cols-3 lg:grid-cols-6">
          <label className="text-[11px] text-gray-600">
            Key
            <input className={inputCls} value={form.key} onChange={(e) => set("key", e.target.value)} placeholder="e.g. in_progress" />
          </label>
          <label className="text-[11px] text-gray-600">
            Name
            <input className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </label>
          <label className="text-[11px] text-gray-600 sm:col-span-2">
            Description
            <input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          {kind !== "categories" ? (
            <label className="text-[11px] text-gray-600">
              Order
              <input className={inputCls} type="number" min={1} value={form.order} onChange={(e) => set("order", e.target.value)} />
            </label>
          ) : null}
          {kind === "priorities" ? (
            <label className="text-[11px] text-gray-600">
              SLA (minutes)
              <input className={inputCls} type="number" min={1} value={form.slaMinutes} onChange={(e) => set("slaMinutes", e.target.value)} />
            </label>
          ) : null}
          {kind === "statuses" ? (
            <label className="flex items-end gap-1.5 pb-1.5 text-xs text-gray-700">
              <input type="checkbox" checked={form.isFinal} onChange={(e) => set("isFinal", e.target.checked)} /> Final (closed)
            </label>
          ) : null}
          <label className="flex items-end gap-1.5 pb-1.5 text-xs text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
          </label>
          <div className="flex items-end gap-2 sm:col-span-3 lg:col-span-6">
            <button className={btnPrimary} disabled={busy} onClick={save}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button className={btnCls} onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
              {kind === "statuses" ? <th className="px-3 py-2">Final</th> : null}
              {kind === "priorities" ? <th className="px-3 py-2">SLA</th> : null}
              <th className="px-3 py-2">Active</th>
              {canManage ? <th className="px-3 py-2 text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-gray-500" colSpan={8}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={8}>Nothing here yet.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-violet-50/40">
                  <td className="px-3 py-1.5 text-gray-500">{r.order ?? "-"}</td>
                  <td className="px-3 py-1.5 font-mono text-[11px] text-gray-700">{r.key}</td>
                  <td className="px-3 py-1.5 font-medium text-gray-900">{r.name}</td>
                  <td className="max-w-[320px] truncate px-3 py-1.5 text-gray-600" title={r.description ?? ""}>{r.description || "-"}</td>
                  {kind === "statuses" ? <td className="px-3 py-1.5">{r.isFinal ? "yes" : "no"}</td> : null}
                  {kind === "priorities" ? <td className="px-3 py-1.5">{r.slaMinutes ? `${r.slaMinutes} min` : "-"}</td> : null}
                  <td className="px-3 py-1.5">
                    <span className={`rounded px-1.5 text-[10px] font-semibold ${r.isActive === false ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}>
                      {r.isActive === false ? "inactive" : "active"}
                    </span>
                  </td>
                  {canManage ? (
                    <td className="px-3 py-1.5">
                      <div className="flex justify-end gap-1">
                        <button className={btnCls} onClick={() => startEdit(r)}>
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button className={`${btnCls} text-red-600`} onClick={() => setPendingDelete(r)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this entry?"
        message={`"${pendingDelete?.name}" will be removed. If cases already use it, deactivate it instead.`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default function CaseSettingsPage() {
  return (
    <ProtectedRoute requiredPermission="case.view_all">
      <Inner />
    </ProtectedRoute>
  );
}
