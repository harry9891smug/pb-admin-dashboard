"use client";
import { useState, useEffect } from "react";
import { TrendingUp, Users, Tag, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, Activity, BarChart3 } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute"; // Add this import

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const stats = [
    {
      title: "Total Revenue",
      value: "₹2,84,240",
      change: "+12.5%",
      trend: "up",
      icon: TrendingUp,
      color: "emerald"
    },
    {
      title: "Active Businesses",
      value: "142",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "blue"
    },
    {
      title: "Active Offers",
      value: "1,234",
      change: "+3.1%",
      trend: "up",
      icon: Tag,
      color: "purple"
    },
    {
      title: "SMS Credits Used",
      value: "45,678",
      change: "-2.4%",
      trend: "down",
      icon: CreditCard,
      color: "orange"
    }
  ];

  const recentActivities = [
    { id: 1, business: "Tech Solutions", action: "created new offer", time: "2 min ago", type: "offer" },
    { id: 2, business: "Cafe Delight", action: "updated subscription", time: "15 min ago", type: "subscription" },
    { id: 3, business: "Fitness Center", action: "sent SMS campaign", time: "1 hour ago", type: "sms" },
    { id: 4, business: "Book Store", action: "payment received", time: "2 hours ago", type: "payment" },
    { id: 5, business: "Fashion Hub", action: "registered new business", time: "3 hours ago", type: "business" }
  ];

  const getActivityIcon = (type: string) => {
    const icons = {
      offer: Tag,
      subscription: CreditCard,
      sms: Activity,
      payment: TrendingUp,
      business: Users
    };
    const Icon = icons[type as keyof typeof icons] || Activity;
    return <Icon className="w-4 h-4" />;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      offer: "text-purple-400 bg-purple-500/20",
      subscription: "text-blue-400 bg-blue-500/20",
      sms: "text-orange-400 bg-orange-500/20",
      payment: "text-emerald-400 bg-emerald-500/20",
      business: "text-cyan-400 bg-cyan-500/20"
    };
    return colors[type as keyof typeof colors] || "text-slate-400 bg-slate-500/20";
  };

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-slate-400 mt-1">Loading analytics...</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
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
              <span className="text-sm text-slate-300">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.change} from last month
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl bg-${stat.color}-500/20`}>
                      <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts and Activities Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart Placeholder */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-100">Revenue Analytics</h3>
                <BarChart3 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                <div className="h-64 flex items-center justify-center rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Revenue chart will appear here</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold text-emerald-400">₹84.2K</p>
                    <p className="text-xs text-slate-400">This Week</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-blue-400">₹1.2L</p>
                    <p className="text-xs text-slate-400">This Month</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-purple-400">₹2.8L</p>
                    <p className="text-xs text-slate-400">All Time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-100">Recent Activities</h3>
                <Activity className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {activity.business}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {activity.action}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                View All Activities →
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Avg. Session</p>
                  <p className="mt-1 text-xl font-semibold">12m 34s</p>
                </div>
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Conversion Rate</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-400">8.4%</p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Support Tickets</p>
                  <p className="mt-1 text-xl font-semibold">23</p>
                </div>
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}