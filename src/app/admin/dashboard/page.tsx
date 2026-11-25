"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Tag, CreditCard, Calendar, Activity, AlertCircle } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getAdminDashboardSummary, DashboardSummary } from "@/lib/api";

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const activityIcon = {
  offer: Tag,
  subscription: CreditCard,
  business: Users,
} as const;

// Full class names are written out (not built from strings) so Tailwind keeps them.
const activityTone = {
  offer: "bg-violet-100 text-violet-600",
  subscription: "bg-sky-100 text-sky-600",
  business: "bg-emerald-100 text-emerald-600",
} as const;

const tones = {
  emerald: { tile: "from-emerald-400 to-emerald-600 shadow-emerald-500/25", bar: "bg-emerald-500", glow: "bg-emerald-400/10" },
  blue: { tile: "from-sky-400 to-blue-600 shadow-blue-500/25", bar: "bg-sky-500", glow: "bg-sky-400/10" },
  purple: { tile: "from-violet-400 to-violet-600 shadow-violet-500/25", bar: "bg-violet-500", glow: "bg-violet-400/10" },
  orange: { tile: "from-amber-400 to-orange-500 shadow-orange-500/25", bar: "bg-orange-500", glow: "bg-orange-400/10" },
} as const;

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200/70 ${className}`} />;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getAdminDashboardSummary();
        if (!cancelled) setSummary(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = summary
    ? [
        {
          title: "Total Revenue",
          value: formatCurrency(summary.revenue.allTime),
          sub: `${formatCurrency(summary.revenue.thisMonth)} this month`,
          icon: TrendingUp,
          tone: "emerald" as const,
        },
        {
          title: "Active Businesses",
          value: summary.businesses.active.toLocaleString("en-IN"),
          sub: `${summary.businesses.total.toLocaleString("en-IN")} total`,
          icon: Users,
          tone: "blue" as const,
        },
        {
          title: "Active Offers",
          value: summary.offers.active.toLocaleString("en-IN"),
          sub: `${summary.offers.total.toLocaleString("en-IN")} total`,
          icon: Tag,
          tone: "purple" as const,
        },
        {
          title: "SMS Sent This Month",
          value: summary.sms.thisMonth.toLocaleString("en-IN"),
          sub: "current calendar month",
          icon: Activity,
          tone: "orange" as const,
        },
      ]
    : [];

  const revenueRows = summary
    ? [
        { label: "This week", value: summary.revenue.thisWeek, bar: "bg-emerald-500" },
        { label: "This month", value: summary.revenue.thisMonth, bar: "bg-sky-500" },
        { label: "All time", value: summary.revenue.allTime, bar: "bg-violet-500" },
      ]
    : [];
  const revenueMax = Math.max(1, ...revenueRows.map((r) => r.value));

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1a0f3c] via-[#2d1565] to-[#4c1d95] p-6 text-white shadow-xl shadow-violet-900/25 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute right-10 top-8 h-24 w-24 rotate-12 rounded-3xl border border-white/15 bg-white/5 backdrop-blur" />
          <div className="pointer-events-none absolute bottom-6 right-40 h-12 w-12 -rotate-6 rounded-2xl border border-white/15 bg-white/5" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-violet-100 backdrop-blur">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live overview
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Welcome back <span className="bg-gradient-to-r from-violet-200 to-emerald-200 bg-clip-text text-transparent">👋</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm text-violet-200/90">
                Here is what is happening across your businesses today.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur lg:self-auto">
              <Calendar className="h-4 w-4 text-violet-200" />
              {today}
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-2">
            {[
              { href: "/admin/businesses", label: "Businesses" },
              { href: "/admin/offers", label: "Offers" },
              { href: "/admin/invoices", label: "Invoices" },
              { href: "/admin/videos", label: "Welcome Videos" },
              { href: "/admin/test-accounts", label: "Test Accounts" },
            ].map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {q.label} →
              </Link>
            ))}
          </div>
        </div>

        {loading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-4 h-8 w-28" />
                  <Skeleton className="mt-3 h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-6 h-24 w-full" />
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-6 h-24 w-full" />
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const t = tones[stat.tone];
                return (
                  <div
                    key={stat.title}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${t.glow}`} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                        <p className="mt-1.5 text-xs text-gray-400">{stat.sub}</p>
                      </div>
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${t.tile} text-white shadow-lg`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              {/* Revenue */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Revenue</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                </div>
                <div className="space-y-5">
                  {revenueRows.map((r) => (
                    <div key={r.label}>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-sm font-medium text-gray-500">{r.label}</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(r.value)}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${r.bar} transition-all duration-700`}
                          style={{ width: `${Math.max(3, (r.value / revenueMax) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs text-gray-400">
                  Based on billing invoices raised in each period.
                </p>
              </div>

              {/* Recent activity */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">Recent activity</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Activity className="h-5 w-5" />
                  </span>
                </div>
                {summary && summary.recentActivity.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {summary.recentActivity.map((activity, i) => {
                      const Icon = activityIcon[activity.type] ?? Activity;
                      return (
                        <div key={i} className="flex items-center gap-3 py-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              activityTone[activity.type] ?? "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900">{activity.label}</p>
                            <p className="truncate text-xs text-gray-500">{activity.action}</p>
                          </div>
                          <div className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
                            {timeAgo(activity.time)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-gray-400">No recent activity yet.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
