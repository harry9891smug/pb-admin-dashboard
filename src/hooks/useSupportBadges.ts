"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCaseSummary, type CaseSummary } from "@/lib/api/admin/cases";

const POLL_MS = 15000;
const SOUND_KEY = "pb_alert_sound";

export function getAlertSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAlertSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* storage unavailable */
  }
}

// Two short beeps; browsers only allow audio after the user has clicked on the page once.
function beep() {
  try {
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.22].forEach((offset) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.18);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + offset);
      o.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => ctx.close?.(), 800);
  } catch {
    /* audio unavailable */
  }
}

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
      if (getAlertSound()) beep();
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
