"use client";
import { useState, useEffect } from "react";
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

const activityColor = {
  offer: "text-purple-400 bg-purple-500/20",
  subscription: "text-blue-400 bg-blue-500/20",
  business: "text-cyan-400 bg-cyan-500/20",
} as const;

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
          title: "Total Revenue (All Time)",
          value: formatCurrency(summary.revenue.allTime),
          sub: `${formatCurrency(summary.revenue.thisMonth)} this month`,
          icon: TrendingUp,
          color: "emerald",
        },
        {
          title: "Active Businesses",
          value: summary.businesses.active.toLocaleString("en-IN"),
          sub: `${summary.businesses.total.toLocaleString("en-IN")} total`,
          icon: Users,
          color: "blue",
        },
        {
          title: "Active Offers",
          value: summary.offers.active.toLocaleString("en-IN"),
          sub: `${summary.offers.total.toLocaleString("en-IN")} total`,
          icon: Tag,
          color: "purple",
        },
        {
          title: "SMS Sent This Month",
          value: summary.sms.thisMonth.toLocaleString("en-IN"),
          sub: "current calendar month",
          icon: Activity,
          color: "orange",
        },
      ]
    : [];

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Loading analytics...</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-20"></div>
                  <div className="h-8 bg-slate-700 rounded w-24"></div>
                  <div className="h-3 bg-slate-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
              <p className="text-sm text-slate-400 mt-1">
                Welcome back! Here's what's happening with your businesses today.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900/60">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                      <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}-500/20`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue + Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-100">Revenue</h3>
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-emerald-400">
                    {formatCurrency(summary?.revenue.thisWeek ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400">This Week</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-blue-400">
                    {formatCurrency(summary?.revenue.thisMonth ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400">This Month</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-purple-400">
                    {formatCurrency(summary?.revenue.allTime ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400">All Time</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Based on billing invoices raised in each period.
              </p>
            </div>

            {/* Recent Activities */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-100">Recent Activity</h3>
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              {summary && summary.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {summary.recentActivity.map((activity, i) => {
                    const Icon = activityIcon[activity.type] ?? Activity;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                        <div className={`p-2 rounded-lg ${activityColor[activity.type] ?? "text-slate-400 bg-slate-500/20"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-100 truncate">{activity.label}</p>
                          <p className="text-xs text-slate-400 truncate">{activity.action}</p>
                        </div>
                        <div className="text-xs text-slate-500 whitespace-nowrap">{timeAgo(activity.time)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No recent activity yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
