"use client";

import { useEffect, useMemo, useState } from "react";
import { adminSmsUsageBusinesses } from "@/lib/api/admin/sms";
import { RefreshCw } from "lucide-react";

function currentMonthYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function SmsUsageBusinessesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // month filter (blank = all)
  const [month, setMonth] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await adminSmsUsageBusinesses(month ? { month } : undefined);
      setRows(res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.total += Number(r.total || 0);
        acc.sent += Number(r.sent || 0);
        acc.failed += Number(r.failed || 0);
        acc.pending += Number(r.pending || 0);
        return acc;
      },
      { total: 0, sent: 0, failed: 0, pending: 0 }
    );
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">SMS Usage – Businesses</h1>
          <p className="text-sm text-slate-400">
            Business wise summary (optional month filter)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm"
          />
          <button
            onClick={() => {
              if (!month) setMonth(currentMonthYYYYMM());
            }}
            className="px-3 py-2 rounded-lg border border-slate-700 text-sm hover:bg-slate-800 text-slate-200"
          >
            This month
          </button>

          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-sm hover:bg-slate-800 text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total" value={totals.total} />
        <StatCard title="Sent" value={totals.sent} accent="text-emerald-400" />
        <StatCard title="Failed" value={totals.failed} accent="text-red-400" />
        <StatCard title="Pending" value={totals.pending} accent="text-yellow-400" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-300">
            <tr>
              <th className="p-3 text-left">Business</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Sent</th>
              <th className="p-3 text-right">Failed</th>
              <th className="p-3 text-right">Pending</th>
            </tr>
          </thead>

          <tbody className="text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  No data found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.businessId}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="p-3">
                    <div className="font-medium text-slate-100">
                      {r.businessName || `Business #${r.businessId}`}
                    </div>
                    <div className="text-xs text-slate-500">ID: {r.businessId}</div>
                  </td>
                  <td className="p-3 text-right font-medium">{r.total}</td>
                  <td className="p-3 text-right text-emerald-400">{r.sent}</td>
                  <td className="p-3 text-right text-red-400">{r.failed}</td>
                  <td className="p-3 text-right text-yellow-400">{r.pending}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent = "text-slate-100",
}: {
  title: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="text-xs text-slate-400">{title}</div>
      <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
