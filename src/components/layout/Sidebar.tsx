"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/offers", label: "Offers" },

  // ✅ NEW

  { href: "/admin/plans", label: "Plans" },

  { href: "/admin/advertisements", label: "Advertisements" },
  { href: "/admin/categories", label: "Categories" },

  { href: "/admin/invoices", label: "Invoice" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/payments", label: "Payments" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-slate-950 border-r border-slate-800/80">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-lg font-semibold tracking-tight">
          PromoBandhu <span className="text-emerald-400">Admin</span>
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/10 text-purple-500 border border-emerald-500/40"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 text-xs text-slate-500">
        v0.1 • Internal use only
      </div>
    </aside>
  );
}
