"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiErrorMessage } from "@/lib/api/admin/cases";
import { listAuditLogs, type AuditLogRow } from "@/lib/api/admin/auditLogs";

const PAGE = 50;

const inputCls =
  "h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";
const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

const methodCls = (m: string) =>
  m === "DELETE"
    ? "bg-red-100 text-red-700"
    : m === "POST"
    ? "bg-green-100 text-green-700"
    : "bg-amber-100 text-amber-700";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

function Inner() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("");
  const [entity, setEntity] = useState("");
  const [failedOnly, setFailedOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listAuditLogs({
        q: q.trim() || undefined,
        method: method || undefined,
        entity: entity.trim() || undefined,
        failedOnly,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to + "T23:59:59").toISOString() : undefined,
        limit: PAGE,
        offset: (page - 1) * PAGE,
      });
      setRows(r.rows);
      setTotal(r.total);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load audit log"));
    } finally {
      setLoading(false);
    }
  }, [q, method, entity, failedOnly, from, to, page]);

  // debounce text filters, instant for the rest
  useEffect(() => {
    const h = setTimeout(load, 300);
    return () => clearTimeout(h);
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE));
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(1);
    set(v);
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Audit Log</h1>
          <p className="text-xs text-gray-500">
            Every create / update / delete made from the admin dashboard: who did it, what and when.
          </p>
        </div>
        <button className={btnCls} onClick={load} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
        <input
          className={`${inputCls} w-56`}
          placeholder="Search admin email/mobile, path, data"
          value={q}
          onChange={(e) => resetPage(setQ)(e.target.value)}
        />
        <select className={inputCls} value={method} onChange={(e) => resetPage(setMethod)(e.target.value)}>
          <option value="">All actions</option>
          <option value="POST">Create (POST)</option>
          <option value="PUT">Update (PUT)</option>
          <option value="PATCH">Update (PATCH)</option>
          <option value="DELETE">Delete</option>
        </select>
        <input
          className={`${inputCls} w-36`}
          placeholder="Section e.g. plans"
          value={entity}
          onChange={(e) => resetPage(setEntity)(e.target.value)}
        />
        <label className="flex items-center gap-1 text-xs text-gray-600">
          From
          <input type="date" className={inputCls} value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-600">
          To
          <input type="date" className={inputCls} value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-700">
          <input type="checkbox" checked={failedOnly} onChange={(e) => resetPage(setFailedOnly)(e.target.checked)} />
          Failed only
        </label>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-2.5 py-2">When</th>
              <th className="px-2.5 py-2">Admin</th>
              <th className="px-2.5 py-2">Action</th>
              <th className="px-2.5 py-2">Section</th>
              <th className="px-2.5 py-2">Path</th>
              <th className="px-2.5 py-2">Result</th>
              <th className="px-2.5 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-gray-500">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">No activity recorded for these filters.</td></tr>
            ) : (
              rows.map((r) => (
                <Fragment key={r.id}>
                  <tr
                    className="cursor-pointer border-t border-gray-100 hover:bg-violet-50/40"
                    onClick={() => setOpen(open === r.id ? null : r.id)}
                  >
                    <td className="whitespace-nowrap px-2.5 py-1.5 text-gray-600">{fmt(r.createdAt)}</td>
                    <td className="whitespace-nowrap px-2.5 py-1.5 text-gray-900">
                      {r.adminEmail || r.adminMobile || `#${r.adminUserId}`}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span className={`rounded px-1.5 text-[10px] font-bold ${methodCls(r.method)}`}>{r.method}</span>
                    </td>
                    <td className="px-2.5 py-1.5 text-gray-700">
                      {r.entity || "-"}
                      {r.entityId ? ` #${r.entityId}` : ""}
                    </td>
                    <td className="max-w-[320px] truncate px-2.5 py-1.5 font-mono text-[11px] text-gray-600" title={r.path}>
                      {r.path}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <span
                        className={`rounded px-1.5 text-[10px] font-semibold ${
                          (r.statusCode ?? 0) >= 400 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {r.statusCode}
                      </span>
                    </td>
                    <td className="px-2.5 py-1.5 text-gray-500">{r.ip || "-"}</td>
                  </tr>
                  {open === r.id ? (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-3 py-2">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-400">
                          Data sent ({r.durationMs ?? 0} ms) - secrets are hidden
                        </div>
                        <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-2 text-[11px] text-gray-800">
                          {JSON.stringify(r.body ?? {}, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{total} records</span>
        <div className="flex items-center gap-1">
          <button className={btnCls} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span>{page} / {pages}</span>
          <button className={btnCls} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  return (
    <ProtectedRoute requiredPermission="audit.view">
      <Inner />
    </ProtectedRoute>
  );
}
