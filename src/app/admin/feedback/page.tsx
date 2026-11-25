"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Star, RefreshCw, MessageSquareText } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Pagination from "@/components/ui/Pagination";
import PageShell from "@/components/ui/PageShell";
import { adminListFeedback, type FeedbackRow } from "@/lib/api/admin/appAdmin";

const PAGE_SIZE = 20;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </span>
  );
}

export default function FeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState<number | "">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminListFeedback({
        rating: rating === "" ? undefined : rating,
        fromDate: fromDate || undefined,
        toDate: toDate ? `${toDate}T23:59:59` : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      setRows(res.rows);
      setTotal(res.count);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rating, fromDate, toDate]);

  const avg = rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0;
  const pageInputCls =
    "rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200";

  return (
    <ProtectedRoute requiredPermission="feedback.view">
      <PageShell
        top={<>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">App Feedback</h1>
            <p className="mt-1 text-sm text-gray-500">Ratings and comments sent by users from inside the app.</p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total feedback</p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">{total}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Average on this page</p>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-3xl font-extrabold text-gray-900">{avg ? avg.toFixed(1) : "—"}</p>
              {avg > 0 && <Stars n={Math.round(avg)} />}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <select
            value={rating}
            onChange={(e) => {
              setPage(1);
              setRating(e.target.value === "" ? "" : Number(e.target.value));
            }}
            className={pageInputCls}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setPage(1);
                setFromDate(e.target.value);
              }}
              className={pageInputCls}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-500">
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setPage(1);
                setToDate(e.target.value);
              }}
              className={pageInputCls}
            />
          </label>
        </div>
        </>}
        footer={
          total > 0 ? (
            <Pagination
              page={page}
              totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              total={total}
              loading={loading}
              onPageChange={setPage}
              itemLabel="feedback"
            />
          ) : null
        }
      >
        {loading && rows.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-white p-12 text-center">
            <MessageSquareText className="mx-auto h-10 w-10 text-violet-400" />
            <p className="mt-3 font-semibold text-gray-900">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                      {String(r.userId).slice(-2)}
                    </span>
                    <div>
                      <Stars n={r.rating} />
                      <p className="mt-0.5 text-xs text-gray-500">
                        User #{r.userId}
                        {r.appVersion ? ` · v${r.appVersion}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                    {fmt(r.createdAt)}
                  </span>
                </div>
                {r.comment && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}
