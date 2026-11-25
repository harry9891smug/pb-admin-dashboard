"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { allNavItems } from "@/lib/navigation";
import GlobalSearch from "./GlobalSearch";

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Title = the label of the nav page this URL belongs to (longest match wins).
  function getTitle() {
    let best = "";
    let title = "Dashboard";
    for (const item of allNavItems) {
      const hit = pathname === item.href || pathname.startsWith(item.href + "/");
      if (hit && item.href.length > best.length) {
        best = item.href;
        title = item.label;
      }
    }
    return title;
  }

  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleLogout() {
    setConfirmOpen(false);
    logout();
  }

  const name = user ? user.email?.split("@")[0] || "Admin" : "";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-gray-200/80 bg-white/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden text-lg font-bold tracking-tight text-gray-900 md:block">
        {getTitle()}
      </h1>

      <div className="flex flex-1 justify-center px-1 sm:px-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-600 text-sm font-bold uppercase text-white shadow-sm">
              {name.charAt(0)}
            </div>
            <div className="hidden leading-tight xl:block">
              <div className="text-sm font-semibold capitalize text-gray-900">{name}</div>
              <div className="text-[11px] text-gray-400">Administrator</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="logout"
        title="Log out?"
        message="You will need to sign in again to continue."
        confirmLabel="Log out"
        cancelLabel="Stay"
        onConfirm={handleLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </header>
  );
}
