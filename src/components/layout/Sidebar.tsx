"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
  Users,
  Briefcase,
  Building2,
  BadgePercent,
  Layers3,
  Megaphone,
  Tags,
  Receipt,
  CreditCard,
  Wallet,
  ImagesIcon,
  MessageCircle,
  MessageCircleCodeIcon,
} from "lucide-react";

type LinkItem = { href: string; label: string; icon: any };
type Section = { key: string; title: string; items: LinkItem[] };

const sections: Section[] = [
  {
    key: "access",
    title: "Access Control",
    items: [
      { href: "/admin/access/permissions", label: "Permissions", icon: KeyRound },
      { href: "/admin/access/groups", label: "Groups", icon: ShieldCheck },
      { href: "/admin/access/job-roles", label: "Job Roles", icon: Briefcase },
      { href: "/admin/team", label: "Team Members", icon: Users },
    ],
  },
  {
    key: "business",
    title: "Business & Billing",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: Building2 },
      { href: "/admin/offers", label: "Offers", icon: BadgePercent },
      { href: "/admin/plans", label: "Plans", icon: Layers3 },
      { href: "/admin/advertisements", label: "Advertisements", icon: Megaphone },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    key: "finance",
    title: "Finance",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Wallet },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
    ],
  },
   {
    key: "template-images",
    title: "Template Images",
    items: [
      { href: "/admin/template-images", label: "Template Images", icon: ImagesIcon },
    ],
  },
  {
    key: "sms",
    title: "SMS Logs",
    items: [
       { href: "/admin/sms/usage/businesses", label: "SMS Usage (Businesses)", icon: MessageCircleCodeIcon },
  { href: "/admin/sms/usage/monthly", label: "SMS Usage (Monthly)", icon: MessageCircle },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href);

  // ✅ auto-open section containing current route
  const defaultOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const s of sections) {
      open[s.key] = s.items.some((it) => isActive(it.href));
    }
    return open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSections((prev) => ({ ...prev, ...defaultOpen }));
  }, [defaultOpen]);

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="hidden md:flex md:flex-col w-72 bg-slate-950 border-r border-slate-800/80">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-emerald-200 font-bold">P</span>
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-slate-100">
              PromoBandhu <span className="text-emerald-400">Admin</span>
            </div>
            <div className="text-xs text-slate-500">Internal Dashboard</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Dashboard (single) */}
        <SidebarLink
          href="/admin/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          active={isActive("/admin/dashboard")}
        />

        {/* Sections (collapsible) */}
        <div className="mt-4 space-y-3">
          {sections.map((section) => {
            const open = !!openSections[section.key];

            return (
              <div key={section.key} className="rounded-xl border border-slate-800/60 bg-slate-950">
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggle(section.key)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl",
                    "text-left transition-colors",
                    "hover:bg-slate-900/60"
                  )}
                >
                  <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-slate-500 transition-transform",
                      open ? "rotate-180" : "rotate-0"
                    )}
                  />
                </button>

                {/* Section body */}
                {open && (
                  <div className="px-2 pb-2 space-y-1">
                    {section.items.map((it) => (
                      <SidebarLink
                        key={it.href}
                        href={it.href}
                        label={it.label}
                        icon={it.icon}
                        active={isActive(it.href)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800/80">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-xs text-slate-300">
            v0.1 • <span className="text-slate-500">Internal use only</span>
          </p>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: any;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        "border border-transparent",
        active
          // ✅ HIGH CONTRAST ACTIVE (readable)
          ? "bg-slate-900 text-white border-emerald-500/50 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
          : "text-slate-300 hover:bg-slate-900/60 hover:text-white hover:border-slate-700/60"
      )}
    >
      {/* left active bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-emerald-400" />
      )}

      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center transition-colors border",
          active
            ? "bg-emerald-500/20 border-emerald-500/40"
            : "bg-slate-900/60 border-slate-800 group-hover:border-slate-700"
        )}
      >
        <Icon className={cn("w-4 h-4", active ? "text-white" : "text-slate-400")} />
      </div>

      <span className="flex-1">{label}</span>

      {active && <span className="h-2 w-2 rounded-full bg-emerald-400" />}
    </Link>
  );
}
