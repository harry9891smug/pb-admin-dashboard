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
      <aside className="hidden lg:flex lg:flex-col sticky top-0 h-screen w-72 shrink-0 pb-sidebar">
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
            "absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col pb-sidebar shadow-2xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white/70 hover:bg-white/10"
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
      <div className="flex h-[72px] shrink-0 items-center gap-3 px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/30">
          <img src="/logo.png" alt="PromoBandhu" className="h-8 w-8 object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-white">PromoBandhu</div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-violet-300">Admin Console</div>
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
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.14em]",
                      hasActive ? "text-violet-300" : "text-white/35 group-hover:text-white/60"
                    )}
                  >
                    {section.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-white/35 transition-transform duration-200",
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
      <div className="shrink-0 p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-500 text-sm font-bold uppercase text-white shadow-lg shadow-violet-900/40">
            {name.charAt(0)}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold capitalize text-white">{name}</div>
            <div className="truncate text-[11px] text-white/45">{user?.email ?? "Administrator"}</div>
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
          ? "bg-gradient-to-r from-violet-500/30 to-fuchsia-500/10 text-white ring-1 ring-inset ring-white/10"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      )}
    >
      {active && (
        <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gradient-to-b from-violet-300 to-fuchsia-400" />
      )}
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
          active
            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-900/50"
            : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}
