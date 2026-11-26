"use client";

import { useMemo, useState } from "react";
import type { Biz360Meta } from "@/lib/api/admin/business360";

const inputCls =
  "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";

const pretty = (k: string) =>
  k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

const isDate = (t: string) => /timestamp|^date$/i.test(t);
const isBool = (t: string) => /bool/i.test(t);
const isNum = (t: string) => /int|numeric|double|real|decimal/i.test(t);
const isJson = (t: string) => /json/i.test(t);

function toLocalInput(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(+d)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initial(type: string, v: any): string {
  if (v === null || v === undefined) return "";
  if (isDate(type)) return toLocalInput(v);
  if (isJson(type)) return typeof v === "string" ? v : JSON.stringify(v, null, 2);
  return String(v);
}

/**
 * Generic form for the editable columns of one record. Only fields the admin
 * actually changed are sent. Whether a column is editable (and its type) comes
 * from the server, so nothing here can edit a protected field.
 */
export default function RecordEditor({
  meta,
  values,
  onSave,
  onCancel,
  saving,
  only,
}: {
  meta: Biz360Meta;
  values: Record<string, any>;
  onSave: (changes: Record<string, any>) => void;
  onCancel: () => void;
  saving?: boolean;
  /** Restrict to these fields (used for the owner card). */
  only?: string[];
}) {
  const fields = useMemo(
    () => meta.editable.filter((f) => (only ? only.includes(f) : true) && f in values),
    [meta, values, only]
  );
  const [form, setForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f, initial(meta.types[f], values[f])]))
  );

  const changed = fields.filter((f) => form[f] !== initial(meta.types[f], values[f]));

  const submit = () => {
    const out: Record<string, any> = {};
    for (const f of changed) {
      const t = meta.types[f];
      const raw = form[f];
      if (isDate(t)) out[f] = raw === "" ? null : new Date(raw).toISOString();
      else if (isBool(t)) out[f] = raw === "" ? null : raw === "true";
      else if (isNum(t) || isJson(t)) out[f] = raw === "" ? null : raw;
      else out[f] = raw === "" && meta.nullable[f] ? null : raw;
    }
    onSave(out);
  };

  if (fields.length === 0) {
    return <div className="text-xs text-gray-500">No editable fields for this record.</div>;
  }

  return (
    <div className="space-y-2">
      {fields.map((f) => {
        const t = meta.types[f];
        const long = (values[f] != null && String(values[f]).length > 60) || /text$/i.test(t) || isJson(t);
        return (
          <div key={f}>
            <label className="mb-0.5 block text-[10px] uppercase tracking-wide text-gray-500">{pretty(f)}</label>
            {isBool(t) ? (
              <select className={inputCls} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}>
                {meta.nullable[f] ? <option value="">-</option> : null}
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : isDate(t) ? (
              <input
                type="datetime-local"
                className={inputCls}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            ) : long ? (
              <textarea
                rows={isJson(t) ? 5 : 3}
                className={`${inputCls} ${isJson(t) ? "font-mono" : ""}`}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            ) : (
              <input
                className={inputCls}
                type={isNum(t) ? "number" : "text"}
                step={isNum(t) && !/int/i.test(t) ? "any" : undefined}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              />
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={submit}
          disabled={saving || changed.length === 0}
          className="inline-flex h-8 items-center rounded-md bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : `Save${changed.length ? ` (${changed.length})` : ""}`}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex h-8 items-center rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
