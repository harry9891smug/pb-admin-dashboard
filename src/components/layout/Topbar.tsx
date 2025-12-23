"use client";

import { usePathname } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';

export default function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function getTitle() {
    if (pathname.startsWith("/admin/businesses")) return "Businesses";
    if (pathname.startsWith("/admin/offers")) return "Offers";
    if (pathname.startsWith("/admin/subscriptions")) return "Subscriptions";
    if (pathname.startsWith("/admin/payments")) return "Payments";
    return "Dashboard";
  }

  function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      logout();
    }
  }

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between border-b border-slate-800 bg-slate-750/80 backdrop-blur-lg px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-slate-100">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-slate-400">
            Welcome, <span className="text-slate-200">
              {user ? (user.email?.split('@')[0] || 'Admin') : 'Loading...'}
            </span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:border-slate-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}