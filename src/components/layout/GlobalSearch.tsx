"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { allNavItems, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Universal nav search — type "subscription", hit Enter, land on
 * /admin/subscriptions. Not a data search (doesn't look inside businesses,
 * invoices, etc.) — it's a fast way to jump to a *page* without hunting
 * through the sidebar's collapsible sections.
 *
 * Only ever shows pages the signed-in user has permission for — same check
 * Sidebar uses, so this can't be used to discover a page that's otherwise
 * hidden from them.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = useMemo(() => user?.permissions ?? [], [user]);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleItems = useMemo(
    () => allNavItems.filter((item) => !item.permission || permissions.includes(item.permission)),
    [permissions]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return visibleItems
      .filter((item) => {
        const haystack = [item.label, ...(item.keywords ?? [])].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 8);
  }, [query, visibleItems]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // "/" focuses the search from anywhere on the page, like most admin tools
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function goTo(item: NavItem) {
    router.push(item.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      goTo(matches[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search pages… (subscriptions, offers, team)"
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 py-1.5 pl-9 pr-12 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 focus:bg-slate-800 transition-colors"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          /
        </kbd>
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-800 bg-slate-900 shadow-xl shadow-black/40 overflow-hidden z-50">
          {matches.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500">
              No pages match &quot;{query}&quot;
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {matches.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => goTo(item)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                        i === activeIndex
                          ? "bg-emerald-500/10 text-emerald-200"
                          : "text-slate-300 hover:bg-slate-800/60"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {i === activeIndex && (
                        <CornerDownLeft className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
