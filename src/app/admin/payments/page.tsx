"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getAdminBillingInvoices } from "@/lib/api";
import { Search, Calendar, RefreshCw, FileText, IndianRupee } from "lucide-react";

type BillingInvoiceRow = {
  id: number;
  businessId: number;
  subscriptionId: number | null;
  invoiceNumber: string;
  razorpayPaymentId: string | null;
  invoiceDate: string;
  currency: string;
  taxableAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  totalAmount: string;
  buyerBusinessName: string | null;
  buyerGst: string | null;
  buyerState: string | null;
  taxType: string | null;
  createdAt: string;

  business?: {
    id: number;
    businessname?: string | null;
    name?: string | null;
  };

  subscription?: {
    id: number;
    plan?: string | null;
    status?: string | null;
  };
};

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BillingInvoiceRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // filters
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("2026-02-01");
  const [to, setTo] = useState("2026-02-10");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchBillingInvoices = async () => {
    setLoading(true);
    try {
      const res = await getAdminBillingInvoices({
        page,
        limit,
        from,
        to,
        q,
      });

      const invoices: BillingInvoiceRow[] = res?.data?.invoices || [];
      setRows(invoices);

      const p = res?.data?.pagination;
      if (p) setPagination(p);
    } catch (e: any) {
      // yaha toast use karna ho to add kar lena
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;

    return rows.filter((r) => {
      const businessName =
        (r.business?.businessname || r.business?.name || r.buyerBusinessName || "").toLowerCase();
      const plan = (r.subscription?.plan || "").toLowerCase();
      return (
        (r.invoiceNumber || "").toLowerCase().includes(s) ||
        (r.razorpayPaymentId || "").toLowerCase().includes(s) ||
        businessName.includes(s) ||
        plan.includes(s)
      );
    });
  }, [rows, q]);

  const stats = useMemo(() => {
    const total = filteredRows.length;

    const totalAmount = filteredRows.reduce((sum, r) => sum + parseFloat(r.totalAmount || "0"), 0);
    const taxableAmount = filteredRows.reduce((sum, r) => sum + parseFloat(r.taxableAmount || "0"), 0);

    const cgst = filteredRows.reduce((sum, r) => sum + parseFloat(r.cgstAmount || "0"), 0);
    const sgst = filteredRows.reduce((sum, r) => sum + parseFloat(r.sgstAmount || "0"), 0);
    const igst = filteredRows.reduce((sum, r) => sum + parseFloat(r.igstAmount || "0"), 0);

    const planCount: Record<string, number> = {};
    for (const r of filteredRows) {
      const plan = (r.subscription?.plan || "unknown").toLowerCase();
      planCount[plan] = (planCount[plan] || 0) + 1;
    }

    return { total, totalAmount, taxableAmount, cgst, sgst, igst, planCount };
  }, [filteredRows]);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Payments & Billing</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track subscription invoices (Razorpay payments) across all businesses.
            </p>
          </div>

          <button
            onClick={fetchBillingInvoices}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Invoices</p>
                <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Taxable Amount</p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">
                  {formatCurrency(stats.taxableAmount)}
                </p>
              </div>
              <div className="p-2 bg-slate-500/20 rounded-lg">
                <IndianRupee className="w-5 h-5 text-slate-300" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Tax</p>
                <p className="mt-2 text-2xl font-semibold text-amber-300">
                  {formatCurrency(stats.cgst + stats.sgst + stats.igst)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  CGST {formatCurrency(stats.cgst)} • SGST {formatCurrency(stats.sgst)} • IGST {formatCurrency(stats.igst)}
                </p>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <IndianRupee className="w-5 h-5 text-amber-300" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Amount</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <IndianRupee className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Invoice no, payment id, business, plan..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* From */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* To */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing <span className="text-slate-200">{filteredRows.length}</span> invoices
            </p>

            <button
              onClick={() => {
                setPage(1);
                fetchBillingInvoices();
              }}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>

        {/* List */}
        {loading && filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-4"></div>
            <p className="text-slate-300">Loading billing invoices...</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No billing invoices found</h3>
            <p className="text-sm text-slate-500">Try changing date range or search.</p>
          </div>
        ) : (
          <div className="grid gap-4">
  {filteredRows.map((inv) => {
    const businessName =
      inv.business?.businessname ||
      inv.business?.name ||
      inv.buyerBusinessName ||
      `Business #${inv.businessId}`;

    const ownerName = inv.business?.name || "—";
    const plan = (inv.subscription?.plan || "—").toUpperCase();
    const taxType = inv.taxType || "—";

    const total = parseFloat(inv.totalAmount || "0");
    const isHigh = total >= 500;

    return (
      <div
        key={inv.id}
        className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition
        hover:shadow-md hover:-translate-y-[1px]
        ${isHigh ? "ring-1 ring-emerald-100" : ""}`}
      >
        {/* top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Invoice</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-900 truncate">
              {inv.invoiceNumber}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                Plan: {plan}
              </span>

              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Tax: {taxType}
              </span>

              {inv.subscription?.status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold
                  ${
                    inv.subscription.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {inv.subscription.status}
                </span>
              )}
            </div>
          </div>

          {/* amount */}
          <div className="text-right">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-0.5 text-2xl font-bold text-emerald-600">
              {formatCurrency(inv.totalAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Invoice: {formatDate(inv.invoiceDate)}
            </p>
          </div>
        </div>

        {/* divider */}
        <div className="my-4 h-px bg-slate-100" />

        {/* details grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Business */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Business</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">
              {businessName}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Owner: {ownerName}</p>
          </div>

          {/* Taxable */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Taxable</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {formatCurrency(inv.taxableAmount)}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Currency: {inv.currency || "INR"}
            </p>
          </div>

          {/* Tax */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Tax breakup</p>
            <p className="mt-1 text-xs text-slate-700">
              CGST <span className="font-semibold">{formatCurrency(inv.cgstAmount)}</span> •
              SGST <span className="font-semibold">{formatCurrency(inv.sgstAmount)}</span> •
              IGST <span className="font-semibold">{formatCurrency(inv.igstAmount)}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Created: {formatDate(inv.createdAt)}
            </p>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">Payment</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate rounded-lg bg-white px-2 py-1 text-xs font-mono text-slate-700 border border-slate-200">
                {inv.razorpayPaymentId || "—"}
              </span>

              {/* Optional copy */}
              <button
                type="button"
                onClick={() => {
                  if (inv.razorpayPaymentId) navigator.clipboard.writeText(inv.razorpayPaymentId);
                }}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600
                hover:bg-slate-100 disabled:opacity-40"
                disabled={!inv.razorpayPaymentId}
                title="Copy payment id"
              >
                Copy
              </button>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View details →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

        )}

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} • Total {pagination.total}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages || p, p + 1))}
              disabled={loading || page >= pagination.totalPages}
              className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
