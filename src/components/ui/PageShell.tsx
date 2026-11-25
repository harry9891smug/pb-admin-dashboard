"use client";

import React from "react";

/**
 * Standard layout for every list page:
 *
 *   ┌ top card (fixed) ─ title, stats, search & filters ┐
 *   ┌ list card (scrolls) ─ rows ........................ ┐
 *   └ footer (pagination / counts) ─────────────────────┘
 *
 * `top`   – header, stat tiles and filter bar (stays put while the list scrolls)
 * `footer`– pagination or a "showing N of M" line, pinned under the list
 * children– the list itself; it gets its own scroll bar
 * `modals`– dialogs, rendered outside the scrolling area
 */
export default function PageShell({
  top,
  footer,
  modals,
  children,
}: {
  top: React.ReactNode;
  footer?: React.ReactNode;
  modals?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-shell">
      <section className="pb-top-card">
        <div className="pb-top-glow" aria-hidden />
        <div className="relative space-y-5">{top}</div>
      </section>

      <section className="pb-list-card">
        <div className="pb-list-scroll">{children}</div>
        {footer ? <div className="pb-list-footer">{footer}</div> : null}
      </section>

      {modals}
    </div>
  );
}
