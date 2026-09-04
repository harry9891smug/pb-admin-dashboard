"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * ProtectedRoute sends people here when they're logged in but missing the
 * permission a page requires. Didn't exist before — every requiredPermission
 * redirect was landing on Next's default 404 until this was added.
 */
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-5">
          <ShieldAlert className="w-7 h-7 text-red-400" />
        </div>

        <h1 className="text-xl font-semibold text-slate-100 mb-2">
          You don&apos;t have access to this page
        </h1>

        <p className="text-sm text-slate-400 mb-6">
          Your account doesn&apos;t have the permission this section needs.
          Ask an admin to grant it from Access Control, or head back to your
          dashboard.
        </p>

        <Link
          href="/admin/dashboard"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/25 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
