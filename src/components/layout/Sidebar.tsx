"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDown, LayoutDashboard, X } from "lucide-react";
import { navSections as sections, type NavItem as LinkItem } from "@/lib/navigation";

type SidebarProps = {
  /** Phone / tablet: the menu slides in over the page. */
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Close the drawer whenever the person picks a page.
  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock page scroll behind the open drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Desktop: fixed beside the page */}
      <aside className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-72 shrink-0 border-r border-gray-200/80 bg-white">
        <SidebarBody />
      </aside>

      {/* Mobile / tablet: drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
        <aside
          className={cn(
            "absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarBody />
        </aside>
      </div>
    </>
  );
}

function SidebarBody() {
  const pathname = usePathname();
  const { user } = useAuth();
  const permissions = useMemo(() => user?.permissions ?? [], [user]);

  const canSee = (item: LinkItem) => !item.permission || permissions.includes(item.permission);

  // Sections filtered down to only the items this user has permission for —
  // a section with nothing left is dropped entirely rather than shown empty.
  const visibleSections = useMemo(
    () =>
      sections
        .map((s) => ({ ...s, items: s.items.filter(canSee) }))
        .filter((s) => s.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions]
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // auto-open the section that holds the current page
  const defaultOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const s of visibleSections) {
      open[s.key] = s.items.some((it) => isActive(it.href));
    }
    return open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, visibleSections]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenSections((prev) => ({ ...prev, ...defaultOpen }));
  }, [defaultOpen]);

  const toggle = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const name = user?.email?.split("@")[0] || "Admin";

  return (
    <>
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-5">
        <img src="/logo.png" alt="PromoBandhu" className="h-10 w-auto shrink-0 object-contain" />
        <div className="leading-tight">
          <div className="text-[15px] font-bold text-gray-900">
            PromoBandhu <span className="text-violet-600">Admin</span>
          </div>
          <div className="text-[11px] text-gray-400">Internal dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarLink
          href="/admin/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
          active={isActive("/admin/dashboard")}
        />

        <div className="mt-5 space-y-1">
          {visibleSections.map((section) => {
            const open = !!openSections[section.key];
            const hasActive = section.items.some((it) => isActive(it.href));

            return (
              <div key={section.key}>
                <button
                  type="button"
                  onClick={() => toggle(section.key)}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50"
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      hasActive ? "text-violet-600" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  >
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-gray-400 transition-transform duration-200",
                      open ? "rotate-180" : "rotate-0"
                    )}
                  />
                </button>

                {open && (
                  <div className="mt-1 space-y-0.5 pb-2">
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

      {/* Signed-in user */}
      <div className="shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold uppercase text-violet-700">
            {name.charAt(0)}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold capitalize text-gray-900">{name}</div>
            <div className="truncate text-[11px] text-gray-400">{user?.email ?? "Administrator"}</div>
          </div>
        </div>
      </div>
    </>
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
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
        active
          ? "bg-violet-50 text-violet-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-violet-500" />
      )}
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-violet-500 text-white shadow-sm shadow-violet-500/30"
            : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-violet-600"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}
