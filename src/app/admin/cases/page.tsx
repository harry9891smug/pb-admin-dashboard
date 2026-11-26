"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { RefreshCw, Search, X, PhoneCall, UserCheck, Inbox, Clock3, ChevronLeft, ChevronRight } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageShell from "@/components/ui/PageShell";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCan } from "@/hooks/useCan";
import { useAuth } from "@/contexts/AuthContext";
import {
  addCaseRemark,
  apiErrorMessage,
  assignCase,
  assignCaseQueue,
  closeCase,
  getCase,
  getCaseSummary,
  listAdminUsers,
  listCaseCategories,
  listCasePriorities,
  listCaseStatuses,
  listCases,
  listQueues,
  updateCaseCategory,
  updateCaseStatus,
  type AdminUserLite,
  type CaseLookup,
  type CaseRow,
  type CaseSummary,
  type SupportQueue,
} from "@/lib/api/admin/cases";

const PAGE_SIZE = 25;

const fmt = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

// "2h", "3d" style age so the team can spot what has been waiting longest.
const ageOf = (iso?: string | null) => {
  if (!iso) return "-";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
};

const ageHours = (iso?: string | null) =>
  iso ? (Date.now() - new Date(iso).getTime()) / 3600000 : 0;

const priorityCls = (key?: string) => {
  switch (key) {
    case "urgent":
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "low":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
};

const statusCls = (s?: CaseLookup) =>
  s?.isFinal
    ? "bg-gray-100 text-gray-600"
    : s?.key === "open"
    ? "bg-amber-100 text-amber-800"
    : "bg-violet-100 text-violet-700";

const who = (u?: { mobile?: string | null; email?: string | null } | null) =>
  u ? u.email || u.mobile || "-" : "Unassigned";

const inputCls =
  "h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";
const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex h-7 items-center gap-1 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

type Scope = "all" | "open" | "unassigned" | "mine" | "callbacks";

function CasesInner() {
  const params = useSearchParams();
  const { user } = useAuth();
  const can = useCan();
  const myId = (user as any)?.id as number | undefined;

  const [scope, setScope] = useState<Scope>(
    (params.get("view") as Scope) || "open"
  );
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<CaseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CaseSummary | null>(null);

  const [statuses, setStatuses] = useState<CaseLookup[]>([]);
  const [categories, setCategories] = useState<CaseLookup[]>([]);
  const [priorities, setPriorities] = useState<CaseLookup[]>([]);
  const [queues, setQueues] = useState<SupportQueue[]>([]);
  const [admins, setAdmins] = useState<AdminUserLite[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // lookups, once
  useEffect(() => {
    (async () => {
      try {
        const [s, c, p] = await Promise.all([
          listCaseStatuses(),
          listCaseCategories(),
          listCasePriorities(),
        ]);
        setStatuses(s || []);
        setCategories(c || []);
        setPriorities(p || []);
      } catch (e) {
        toast.error(apiErrorMessage(e, "Failed to load case settings"));
      }
      // optional, depend on other permissions: ignore failures
      listQueues().then((q) => setQueues(q || [])).catch(() => {});
      listAdminUsers().then(setAdmins).catch(() => {});
    })();
  }, []);

  const loadSummary = useCallback(() => {
    getCaseSummary().then(setSummary).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCases({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        statusId: statusId ? Number(statusId) : undefined,
        priorityId: priorityId ? Number(priorityId) : undefined,
        categoryKey: scope === "callbacks" ? "callback" : categoryKey || undefined,
        unassigned: scope === "unassigned",
        openOnly: scope === "open" || scope === "unassigned" || scope === "callbacks" || scope === "mine",
        assignedTo: scope === "mine" ? myId : undefined,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load cases"));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusId, priorityId, categoryKey, scope, myId]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    loadSummary();
    const i = setInterval(loadSummary, 30000);
    return () => clearInterval(i);
  }, [loadSummary]);

  const refreshAll = () => {
    load();
    loadSummary();
  };

  useEffect(() => setPage(1), [scope, search, statusId, categoryKey, priorityId]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const chip = (key: Scope, label: string, count: number | undefined, icon: React.ReactNode, alert?: boolean) => (
    <button
      key={key}
      onClick={() => setScope(key)}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium ${
        scope === key
          ? "border-violet-600 bg-violet-600 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      {count !== undefined ? (
        <span
          className={`rounded-full px-1.5 text-[10px] font-bold ${
            scope === key
              ? "bg-white/25 text-white"
              : alert && count > 0
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );

  return (
    <PageShell
      top={
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Cases &amp; Callbacks</h1>
              <p className="text-xs text-gray-500">
                Customer queries from the app. Newest and unassigned items need action first.
              </p>
            </div>
            <button onClick={refreshAll} className={btnCls}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {chip("open", "Open", summary?.totalOpen, <Inbox className="h-3.5 w-3.5" />)}
            {chip("unassigned", "Unassigned", summary?.unassigned, <Clock3 className="h-3.5 w-3.5" />, true)}
            {chip("mine", "Mine", summary?.mine, <UserCheck className="h-3.5 w-3.5" />)}
            {chip("callbacks", "Callbacks", summary?.callbacks, <PhoneCall className="h-3.5 w-3.5" />, true)}
            {chip("all", "All cases", undefined, null)}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ticket, title, mobile, business name / id"
                className={`${inputCls} w-72 pl-7`}
              />
            </div>
            <select className={inputCls} value={statusId} onChange={(e) => setStatusId(e.target.value)}>
              <option value="">Any status</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              className={inputCls}
              value={categoryKey}
              disabled={scope === "callbacks"}
              onChange={(e) => setCategoryKey(e.target.value)}
            >
              <option value="">Any category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.key}>{c.name}</option>
              ))}
            </select>
            <select className={inputCls} value={priorityId} onChange={(e) => setPriorityId(e.target.value)}>
              <option value="">Any priority</option>
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </>
      }
      footer={
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            {total} case{total === 1 ? "" : "s"} {loading ? "• loading…" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button className={btnCls} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span>
              {page} / {pages}
            </span>
            <button className={btnCls} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      }
      modals={
        selectedId ? (
          <CaseDrawer
            id={selectedId}
            statuses={statuses}
            categories={categories}
            queues={queues}
            admins={admins}
            myId={myId}
            can={can}
            onClose={() => setSelectedId(null)}
            onChanged={refreshAll}
          />
        ) : null
      }
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Ticket</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Customer / Business</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Priority</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Assigned</th>
            <th className="px-3 py-2">Age</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const stale = !c.status?.isFinal && ageHours(c.createdAt) > 24;
            return (
              <tr
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`cursor-pointer border-t border-gray-100 hover:bg-violet-50/50 ${
                  selectedId === c.id ? "bg-violet-50" : ""
                }`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-gray-700">
                  {c.category?.key === "callback" ? (
                    <PhoneCall className="mr-1 inline h-3 w-3 text-red-500" />
                  ) : null}
                  {c.ticketNumber}
                </td>
                <td className="max-w-[260px] truncate px-3 py-2 font-medium text-gray-900">{c.title}</td>
                <td className="px-3 py-2">
                  <div className="text-gray-900">{c.business?.businessname || c.business?.name || "-"}</div>
                  <div className="text-[11px] text-gray-500">{c.user?.mobile || c.user?.email || ""}</div>
                </td>
                <td className="px-3 py-2 text-gray-700">{c.category?.name}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${priorityCls(c.priority?.key)}`}>
                    {c.priority?.name}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${statusCls(c.status)}`}>
                    {c.status?.name}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-700">
                  {c.assignee ? who(c.assignee) : <span className="font-semibold text-red-600">Unassigned</span>}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 ${stale ? "font-semibold text-red-600" : "text-gray-600"}`}>
                  {ageOf(c.createdAt)}
                </td>
              </tr>
            );
          })}
          {!loading && rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-gray-500">
                Nothing here.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </PageShell>
  );
}

// ---------------------------------------------------------------- drawer
function CaseDrawer({
  id,
  statuses,
  categories,
  queues,
  admins,
  myId,
  can,
  onClose,
  onChanged,
}: {
  id: number;
  statuses: CaseLookup[];
  categories: CaseLookup[];
  queues: SupportQueue[];
  admins: AdminUserLite[];
  myId?: number;
  can: (k?: string) => boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<CaseRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [remark, setRemark] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const reload = useCallback(async () => {
    try {
      setData(await getCase(id));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load case"));
    }
  }, [id]);

  useEffect(() => {
    setData(null);
    reload();
  }, [reload]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await reload();
      onChanged();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  const remarks = useMemo(
    () => [...(data?.remarks ?? [])].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [data]
  );

  const sel = inputCls + " w-full";
  const isFinal = data?.status?.isFinal;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-gray-500">{data?.ticketNumber}</div>
            <h2 className="truncate text-sm font-bold text-gray-900">{data?.title ?? "Loading…"}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {data ? (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs">
            {data.description ? (
              <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-2 text-gray-800">{data.description}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-2 rounded-md border border-gray-200 p-2">
              <Info label="Business" value={data.business?.businessname || data.business?.name} />
              <Info label="Public ID" value={data.business?.publicId} />
              {data.business?.id && can("support.business_search") ? (
                <div className="col-span-2">
                  <a
                    href={`/admin/business-360?id=${data.business.id}`}
                    className="text-violet-700 underline"
                  >
                    Open full Business 360 view →
                  </a>
                </div>
              ) : null}
              <Info label="Mobile" value={data.user?.mobile} />
              <Info label="Email" value={data.user?.email} />
              <Info
                label="Location"
                value={[data.business?.city, data.business?.state].filter(Boolean).join(", ")}
              />
              <Info label="Raised" value={`${fmt(data.createdAt)} (${ageOf(data.createdAt)} ago)`} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Status">
                <select
                  className={sel}
                  disabled={busy || !can("case.update_status")}
                  value={data.statusId}
                  onChange={(e) => run(() => updateCaseStatus(id, Number(e.target.value)), "Status updated")}
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Category">
                <select
                  className={sel}
                  disabled={busy || !can("case.update_category")}
                  value={data.category?.key ?? ""}
                  onChange={(e) => run(() => updateCaseCategory(id, e.target.value), "Category updated")}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Assigned to (${who(data.assignee)})`}>
                <div className="flex gap-1">
                  <select
                    className={sel}
                    disabled={busy || !can("case.assign")}
                    value={data.assignedTo ?? ""}
                    onChange={(e) =>
                      e.target.value && run(() => assignCase(id, Number(e.target.value)), "Assigned")
                    }
                  >
                    <option value="">Select person…</option>
                    {admins.map((a) => (
                      <option key={a.id} value={a.id}>{a.email || a.mobile}</option>
                    ))}
                  </select>
                  {myId && can("case.assign") && data.assignedTo !== myId ? (
                    <button
                      className={btnPrimary}
                      disabled={busy}
                      onClick={() => run(() => assignCase(id, myId), "Assigned to you")}
                    >
                      Me
                    </button>
                  ) : null}
                </div>
              </Field>
              <Field label="Queue / team">
                <select
                  className={sel}
                  disabled={busy || !can("case.assign")}
                  value={data.assignedTeamId ?? ""}
                  onChange={(e) =>
                    e.target.value && run(() => assignCaseQueue(id, Number(e.target.value)), "Queue set")
                  }
                >
                  <option value="">Select queue…</option>
                  {queues.map((q) => (
                    <option key={q.id} value={q.id}>{q.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Notes &amp; history
              </div>
              <div className="space-y-1.5">
                {remarks.length === 0 ? <div className="text-gray-400">No notes yet.</div> : null}
                {remarks.map((r) => (
                  <div key={r.id} className="rounded-md border border-gray-200 p-2">
                    <div className="whitespace-pre-wrap text-gray-900">{r.remark}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-500">
                      <span>{fmt(r.createdAt)}</span>
                      <span className={`rounded px-1 ${r.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
                        {r.isPublic ? "visible to customer" : "internal"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {can("case.add_remark") ? (
                <div className="mt-2 space-y-1.5">
                  <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    rows={3}
                    placeholder="Add a note…"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-gray-600">
                      <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                      Visible to customer
                    </label>
                    <button
                      className={btnPrimary}
                      disabled={busy || !remark.trim()}
                      onClick={() =>
                        run(async () => {
                          await addCaseRemark(id, remark.trim(), isPublic);
                          setRemark("");
                        }, "Note added")
                      }
                    >
                      Add note
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="p-6 text-xs text-gray-500">Loading…</div>
        )}

        {data && can("case.close") && !isFinal ? (
          <div className="border-t border-gray-200 px-4 py-2 text-right">
            <button
              className="inline-flex h-7 items-center rounded-md border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              disabled={busy}
              onClick={() => setConfirmClose(true)}
            >
              Close case
            </button>
          </div>
        ) : null}

        <ConfirmDialog
          open={confirmClose}
          tone="danger"
          title="Close this case?"
          message={`${data?.ticketNumber ?? ""} will be marked closed. The customer will no longer see it as open.`}
          confirmLabel="Close case"
          cancelLabel="Cancel"
          onConfirm={() => {
            setConfirmClose(false);
            run(() => closeCase(id), "Case closed");
          }}
          onCancel={() => setConfirmClose(false)}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="truncate text-gray-900">{value || "-"}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  );
}

export default function CasesPage() {
  return (
    <ProtectedRoute requiredPermission="case.view_all">
      <Suspense fallback={null}>
        <CasesInner />
      </Suspense>
    </ProtectedRoute>
  );
}
