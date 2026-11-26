"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { apiErrorMessage } from "@/lib/api/admin/cases";
import { getInsights, isFailed, type Insights } from "@/lib/api/admin/insights";

const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const num = (n: number) => n.toLocaleString("en-IN");

function uptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

function Card({ title, children, error }: { title: string; children?: React.ReactNode; error?: string }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-3">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h2>
      {error ? <div className="text-xs text-red-600">Could not load: {error}</div> : children}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" | "bad" | "ok" }) {
  const c = tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-green-600" : "text-gray-900";
  return (
    <div>
      <div className={`text-lg font-bold leading-tight ${c}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; display?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-xs">
          <div className="w-16 shrink-0 text-gray-600">{r.label}</div>
          <div className="h-3 flex-1 rounded bg-gray-100">
            <div className="h-3 rounded bg-violet-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <div className="w-20 shrink-0 text-right font-medium text-gray-800">{r.display ?? r.value}</div>
        </div>
      ))}
    </div>
  );
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
      {label}
    </span>
  );
}

function Inner() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getInsights());
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load insights"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ops = data && !isFailed(data.operations) ? data.operations : null;
  const rev = data && !isFailed(data.revenue) ? data.revenue : null;
  const sat = data && !isFailed(data.satisfaction) ? data.satisfaction : null;
  const pay = data && !isFailed(data.payments) ? data.payments : null;
  const sys = data && !isFailed(data.system) ? data.system : null;

  const payTotal = pay?.last30ByStatus.reduce((s, p) => s + p.count, 0) ?? 0;
  const payFailed = pay?.last30ByStatus.filter((p) => /fail|error|declin/i.test(p.status)).reduce((s, p) => s + p.count, 0) ?? 0;

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Insights</h1>
          <p className="text-xs text-gray-500">
            Business operations, revenue, customer satisfaction and system health
            {data ? ` - updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN")}` : ""}.
          </p>
        </div>
        <button className={btnCls} onClick={load} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" /> {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {!data ? <div className="p-6 text-xs text-gray-500">Loading…</div> : null}

      {data ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Card title="Business operations" error={isFailed(data.operations) ? data.operations.error : undefined}>
            {ops ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  <Stat label="Businesses" value={num(ops.businesses.total)} />
                  <Stat label="New (7 days)" value={num(ops.businesses.new7)} />
                  <Stat label="New (30 days)" value={num(ops.businesses.new30)} />
                  <Stat label="Trials ending in 7d" value={num(ops.trialsEndingIn7Days)} tone={ops.trialsEndingIn7Days ? "warn" : undefined} />
                  <Stat label="Offers (active / all)" value={`${num(ops.offers.active)} / ${num(ops.offers.total)}`} />
                  <Stat label="SMS this month" value={num(ops.sms.thisMonth)} />
                  <Stat label="SMS last month" value={num(ops.sms.lastMonth)} />
                </div>
                <div>
                  <div className="mb-1 text-[11px] text-gray-500">Subscriptions by status</div>
                  <Bars rows={ops.subscriptionsByStatus.map((s) => ({ label: s.status, value: s.count }))} />
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-2 sm:grid-cols-5">
                  <Stat label="Open cases" value={num(ops.cases.totalOpen)} />
                  <Stat label="Unassigned" value={num(ops.cases.unassigned)} tone={ops.cases.unassigned ? "warn" : "ok"} />
                  <Stat label="Assigned to me" value={num(ops.cases.mine)} />
                  <Stat label="Callbacks" value={num(ops.cases.callbacks)} />
                  <Stat label="Callbacks unassigned" value={num(ops.cases.callbacksUnassigned)} tone={ops.cases.callbacksUnassigned ? "bad" : "ok"} />
                </div>
              </div>
            ) : null}
          </Card>

          <Card title="Revenue" error={isFailed(data.revenue) ? data.revenue.error : undefined}>
            {rev ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="All time" value={inr(rev.allTime)} />
                  <Stat
                    label="This month"
                    value={inr(rev.byMonth[rev.byMonth.length - 1]?.amount ?? 0)}
                  />
                  <Stat
                    label="Last month"
                    value={inr(rev.byMonth[rev.byMonth.length - 2]?.amount ?? 0)}
                  />
                </div>
                <Bars
                  rows={rev.byMonth.map((m) => ({
                    label: m.month,
                    value: m.amount,
                    display: `${inr(m.amount)} (${m.invoices})`,
                  }))}
                />
                <div className="text-[11px] text-gray-400">Bars show billed invoice totals per month (invoice count in brackets).</div>
              </div>
            ) : null}
          </Card>

          <Card title="Customer satisfaction" error={isFailed(data.satisfaction) ? data.satisfaction.error : undefined}>
            {sat ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Average rating" value={sat.average ?? "-"} />
                  <Stat label="Last 30 days" value={sat.last30.average ?? "-"} />
                  <Stat label="Total responses" value={num(sat.total)} />
                </div>
                <Bars rows={[...sat.distribution].reverse().map((d) => ({ label: `${d.rating} star`, value: d.count }))} />
              </div>
            ) : null}
          </Card>

          <Card title="System health" error={isFailed(data.system) ? data.system.error : undefined}>
            {sys ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  <Stat label="Environment" value={sys.environment} />
                  <Stat label="API uptime" value={uptime(sys.uptimeSeconds)} />
                  <Stat label="DB latency" value={`${sys.database.latencyMs} ms`} tone={sys.database.latencyMs > 200 ? "warn" : "ok"} />
                  <Stat
                    label="S3 latency"
                    value={sys.s3.reachable ? `${sys.s3.latencyMs} ms` : "unreachable"}
                    tone={sys.s3.reachable ? undefined : "bad"}
                  />
                  <Stat label="DB size" value={`${num(sys.database.sizeMb)} MB`} />
                  <Stat label="DB connections" value={sys.database.connections ?? "-"} />
                  <Stat label="API memory" value={`${sys.memoryMb.rss} MB`} />
                  <Stat
                    label="Server load (1m / cpus)"
                    value={`${sys.host.load1m} / ${sys.host.cpus}`}
                    tone={sys.host.load1m > sys.host.cpus ? "warn" : undefined}
                  />
                </div>
                <div className="text-[11px] text-gray-500">
                  Server memory free: {num(sys.host.freeMemMb)} / {num(sys.host.totalMemMb)} MB
                  {sys.disk ? ` • Disk free: ${sys.disk.freeGb} / ${sys.disk.totalGb} GB` : ""}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Dot ok={sys.integrations.razorpay} label="Razorpay keys" />
                  <Dot ok={sys.integrations.whatsapp} label="WhatsApp token set" />
                  <Dot ok={sys.integrations.sms} label="SMS key" />
                  <Dot ok={sys.integrations.smtp} label="SMTP" />
                </div>
                <div className="text-[11px] text-gray-400">
                  Integration dots only show whether a key is configured, not that it is still valid.
                </div>
              </div>
            ) : null}
          </Card>

          <Card title="Payments (last 30 days)" error={isFailed(data.payments) ? data.payments.error : undefined}>
            {pay ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Payment attempts" value={num(payTotal)} />
                  <Stat label="Failed" value={num(payFailed)} tone={payFailed ? "warn" : "ok"} />
                  <Stat label="Failure rate" value={payTotal ? `${Math.round((payFailed / payTotal) * 100)}%` : "-"} />
                </div>
                <Bars rows={pay.last30ByStatus.map((p) => ({ label: p.status, value: p.count }))} />
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default function InsightsPage() {
  return (
    <ProtectedRoute requiredPermission="insights.view">
      <Inner />
    </ProtectedRoute>
  );
}
