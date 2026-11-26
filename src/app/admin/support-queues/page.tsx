"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, UserPlus, RefreshCw } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCan } from "@/hooks/useCan";
import {
  addQueueUser,
  apiErrorMessage,
  createQueue,
  deleteQueue,
  listAdminUsers,
  listQueueUsers,
  listQueues,
  removeQueueUser,
  updateQueue,
  type AdminUserLite,
  type QueueUser,
  type SupportQueue,
} from "@/lib/api/admin/cases";

const inputCls =
  "h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";
const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex h-7 items-center gap-1 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

export default function SupportQueuesPage() {
  const can = useCan();
  const [queues, setQueues] = useState<SupportQueue[]>([]);
  const [selected, setSelected] = useState<SupportQueue | null>(null);
  const [users, setUsers] = useState<QueueUser[]>([]);
  const [admins, setAdmins] = useState<AdminUserLite[]>([]);
  const [pickUser, setPickUser] = useState("");
  const [form, setForm] = useState({ code: "", name: "", description: "" });
  const [pendingDelete, setPendingDelete] = useState<SupportQueue | null>(null);
  const [busy, setBusy] = useState(false);

  const loadQueues = useCallback(async () => {
    try {
      const q = await listQueues();
      setQueues(q || []);
      setSelected((cur) => (cur ? (q || []).find((x) => x.id === cur.id) ?? null : cur));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load queues"));
    }
  }, []);

  const loadUsers = useCallback(async (id: number) => {
    try {
      setUsers((await listQueueUsers(id)) || []);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load queue members"));
    }
  }, []);

  useEffect(() => {
    loadQueues();
    listAdminUsers().then(setAdmins).catch(() => {});
  }, [loadQueues]);

  useEffect(() => {
    if (selected) loadUsers(selected.id);
    else setUsers([]);
  }, [selected?.id, loadUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn: () => Promise<unknown>, ok: string, after?: () => void) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      after?.();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Action failed"));
    } finally {
      setBusy(false);
    }
  };

  const memberIds = new Set(users.map((u) => u.id));

  return (
    <ProtectedRoute requiredPermission="support_queue.view">
      <div className="space-y-3 p-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Support Queues</h1>
            <p className="text-xs text-gray-500">Teams that cases are routed to, and who is in each team.</p>
          </div>
          <button className={btnCls} onClick={loadQueues}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
          {/* queues */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Active</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {queues.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => setSelected(q)}
                    className={`cursor-pointer border-t border-gray-100 hover:bg-violet-50/50 ${
                      selected?.id === q.id ? "bg-violet-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-[11px]">{q.code}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{q.name}</td>
                    <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={q.isActive}
                        disabled={busy || !can("support_queue.update")}
                        onChange={(e) =>
                          act(() => updateQueue(q.id, { isActive: e.target.checked }), "Updated", loadQueues)
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {can("support_queue.delete") ? (
                        <button
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          onClick={() => setPendingDelete(q)}
                          title="Delete queue"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {queues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-gray-500">No queues yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>

            {can("support_queue.create") ? (
              <div className="flex flex-wrap items-end gap-2 border-t border-gray-200 p-3">
                <input
                  className={`${inputCls} w-28`}
                  placeholder="code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
                <input
                  className={`${inputCls} w-40`}
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className={`${inputCls} min-w-[8rem] flex-1`}
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button
                  className={btnPrimary}
                  disabled={busy || !form.code.trim() || !form.name.trim()}
                  onClick={() =>
                    act(
                      () =>
                        createQueue({
                          code: form.code.trim(),
                          name: form.name.trim(),
                          description: form.description.trim() || undefined,
                        }),
                      "Queue created",
                      () => {
                        setForm({ code: "", name: "", description: "" });
                        loadQueues();
                      }
                    )
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
            ) : null}
          </div>

          {/* members */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800">
              {selected ? `Members of ${selected.name}` : "Select a queue to see its members"}
            </div>
            {selected ? (
              <>
                <ul className="divide-y divide-gray-100 text-xs">
                  {users.map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <div className="font-medium text-gray-900">{u.displayName}</div>
                        <div className="text-[11px] text-gray-500">{u.email || u.mobile}</div>
                      </div>
                      {can("support_queue.remove_user") ? (
                        <button
                          className={btnCls}
                          disabled={busy}
                          onClick={() =>
                            act(() => removeQueueUser(selected.id, u.id), "Removed", () => loadUsers(selected.id))
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {users.length === 0 ? (
                    <li className="px-3 py-6 text-center text-gray-500">No members.</li>
                  ) : null}
                </ul>
                {can("support_queue.assign_user") ? (
                  <div className="flex items-center gap-2 border-t border-gray-200 p-3">
                    <select className={`${inputCls} flex-1`} value={pickUser} onChange={(e) => setPickUser(e.target.value)}>
                      <option value="">Add a team member…</option>
                      {admins
                        .filter((a) => !memberIds.has(a.id))
                        .map((a) => (
                          <option key={a.id} value={a.id}>{a.email || a.mobile}</option>
                        ))}
                    </select>
                    <button
                      className={btnPrimary}
                      disabled={busy || !pickUser}
                      onClick={() =>
                        act(
                          () => addQueueUser(selected.id, Number(pickUser)),
                          "Member added",
                          () => {
                            setPickUser("");
                            loadUsers(selected.id);
                          }
                        )
                      }
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <ConfirmDialog
          open={!!pendingDelete}
          tone="danger"
          title="Delete this queue?"
          message={`${pendingDelete?.name ?? ""} will be removed. Cases already routed to it keep their history.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            const q = pendingDelete;
            setPendingDelete(null);
            if (q)
              act(() => deleteQueue(q.id), "Queue deleted", () => {
                if (selected?.id === q.id) setSelected(null);
                loadQueues();
              });
          }}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
