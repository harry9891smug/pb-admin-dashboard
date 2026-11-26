"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, LogOut, Trash2, HelpCircle } from "lucide-react";

type Tone = "danger" | "logout" | "default";

const tones: Record<Tone, { icon: any; ring: string; tile: string; btn: string }> = {
  danger: {
    icon: Trash2,
    ring: "bg-red-100",
    tile: "from-red-500 to-rose-600 shadow-red-500/30",
    btn: "from-red-500 to-rose-600 shadow-red-500/30",
  },
  logout: {
    icon: LogOut,
    ring: "bg-violet-100",
    tile: "from-violet-500 to-fuchsia-500 shadow-violet-500/30",
    btn: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
  },
  default: {
    icon: HelpCircle,
    ring: "bg-sky-100",
    tile: "from-sky-500 to-blue-600 shadow-sky-500/30",
    btn: "from-sky-500 to-blue-600 shadow-sky-500/30",
  },
};

/**
 * Replacement for the browser's window.confirm() — same PromoBandhu look as the
 * rest of the dashboard. Controlled: render it with `open` and handle both callbacks.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
  requireText,
  details,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set, the user must type this exact text before Confirm is enabled. */
  requireText?: string;
  /** Optional bullet points shown under the message (e.g. what will be deleted). */
  details?: string[];
}) {
  const [typed, setTyped] = useState("");
  const ready = !requireText || typed.trim().toLowerCase() === requireText.trim().toLowerCase();

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  // Esc closes, Enter confirms (never while a typed confirmation is still required)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && ready) onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, ready, onConfirm, onCancel]);

  if (!open || typeof document === "undefined") return null;
  const t = tones[tone] ?? tones.default;
  const Icon = tone === "danger" ? AlertTriangle : t.icon;

  // Rendered into <body> so a parent with backdrop-filter / transform (like the
  // topbar) can't trap this fixed overlay inside itself.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1a0f3c]/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="pb-confirm w-full max-w-sm overflow-hidden rounded-3xl bg-white text-center shadow-2xl shadow-violet-950/30"
        style={{ animation: "pb-rise 0.25s cubic-bezier(0.2,0.8,0.2,1) backwards" }}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400" />
        <div className="px-7 pb-6 pt-7">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${t.ring}`}>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${t.tile}`}
            >
              <Icon className="h-5 w-5" />
            </span>
          </div>
          <h3 className="mt-4 text-xl font-extrabold tracking-tight text-gray-900">{title}</h3>
          {message && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{message}</p>}

          {details && details.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-red-50 px-4 py-3 text-left text-xs text-red-800">
              {details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span>•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          )}

          {requireText && (
            <div className="mt-4 text-left">
              <label className="text-xs font-semibold text-gray-600">
                Type <span className="rounded bg-gray-100 px-1 font-mono text-gray-900">{requireText}</span> to confirm
              </label>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-red-400"
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={!ready}
              autoFocus={!requireText}
              className={`rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${t.btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
