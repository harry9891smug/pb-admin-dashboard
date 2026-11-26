"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCaseSummary, type CaseSummary } from "@/lib/api/admin/cases";

const POLL_MS = 15000;

// Live counters for the sidebar plus alerts when new work arrives. Only polls
// for admins who may view cases, so others never hit the endpoint.
export function useSupportBadges() {
  const { user, isAuthenticated } = useAuth();
  const allowed = ((user?.permissions ?? []) as string[]).includes("case.view_all");
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const prev = useRef<CaseSummary | null>(null);
  const baseTitle = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !allowed) {
      setSummary(null);
      return;
    }
    if (baseTitle.current === null) baseTitle.current = document.title.replace(/^\(\d+\)\s*/, "");

    let alive = true;

    const notify = (title: string, body: string) => {
      toast(`${title}: ${body}`, { icon: "🔔", duration: 8000 });
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(title, { body });
        }
      } catch {
        /* notifications unsupported */
      }
    };

    const apply = (s: CaseSummary) => {
      const p = prev.current;
      if (p) {
        const newCb = s.callbacksUnassigned - p.callbacksUnassigned;
        const newCases = s.unassigned - p.unassigned - Math.max(newCb, 0);
        if (newCb > 0) notify("New callback request", `${newCb} new callback${newCb > 1 ? "s" : ""} waiting`);
        if (newCases > 0) notify("New support case", `${newCases} new unassigned case${newCases > 1 ? "s" : ""}`);
      }
      prev.current = s;
      setSummary(s);
      const n = (s.unassigned ?? 0) + (s.callbacksUnassigned ?? 0);
      document.title = n > 0 ? `(${n}) ${baseTitle.current}` : baseTitle.current ?? document.title;
    };

    const pull = () =>
      getCaseSummary()
        .then((s) => alive && apply(s))
        .catch(() => {});

    pull();
    const t = setInterval(pull, POLL_MS);
    const onFocus = () => pull();
    window.addEventListener("focus", onFocus);

    // Ask once for desktop notifications (only if the user hasn't decided yet).
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    } catch {
      /* ignore */
    }

    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, allowed]);

  return {
    // "needs action now": cases nobody owns yet
    cases: summary?.unassigned ?? 0,
    callbacks: summary?.callbacksUnassigned ?? 0,
  };
}
