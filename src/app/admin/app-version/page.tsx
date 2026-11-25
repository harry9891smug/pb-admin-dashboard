"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Rocket, ShieldAlert, Download } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { getAppVersion, adminUpdateAppVersion } from "@/lib/api/admin/appAdmin";

// Which apps can be updated from here. Add another entry if a second app uses
// the same /app-version/:appKey endpoint.
const APPS = [{ key: "retail", label: "PromoBandhu (Retail app)" }];

const inputCls =
  "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-gray-500";

export default function AppVersionPage() {
  const [appKey, setAppKey] = useState(APPS[0].key);
  const [customKey, setCustomKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [found, setFound] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    latestVersionName: "",
    latestVersionCode: "",
    downloadUrl: "",
    releaseNotes: "",
    forceUpdate: false,
  });

  const activeKey = customKey.trim() || appKey;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const v = await getAppVersion(activeKey);
      if (cancelled) return;
      setFound(!!v);
      setForm({
        latestVersionName: v?.latestVersionName ?? "",
        latestVersionCode: v?.latestVersionCode != null ? String(v.latestVersionCode) : "",
        downloadUrl: v?.downloadUrl ?? "",
        releaseNotes: v?.releaseNotes ?? "",
        forceUpdate: !!v?.forceUpdate,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeKey]);

  const save = async () => {
    const code = Number(form.latestVersionCode);
    if (!form.latestVersionName.trim()) return toast.error("Version name is required (e.g. 1.0.3)");
    if (!Number.isInteger(code) || code <= 0) return toast.error("Version code must be a whole number > 0");
    if (!/^https?:\/\//i.test(form.downloadUrl.trim())) return toast.error("Enter a valid download URL");

    if (
      form.forceUpdate &&
      !confirm("Force update will block users on older versions until they update. Continue?")
    )
      return;

    try {
      setSaving(true);
      await adminUpdateAppVersion(activeKey, {
        latestVersionName: form.latestVersionName.trim(),
        latestVersionCode: code,
        downloadUrl: form.downloadUrl.trim(),
        releaseNotes: form.releaseNotes.trim() || null,
        forceUpdate: form.forceUpdate,
      });
      toast.success("App version updated");
      setFound(true);
    } catch (e: any) {
      const d = e?.response?.data?.error?.details;
      toast.error(Array.isArray(d) && d[0] ? `${d[0].field}: ${d[0].message}` : "Could not update version");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission="app_version.update">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">App Version</h1>
          <p className="mt-1 text-sm text-gray-500">
            Publish a new release. The app checks this on start-up and shows an update prompt, without a backend
            deploy.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a0f3c] via-[#2d1565] to-[#4c1d95] p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Rocket className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-violet-200">Currently live</p>
              <p className="text-2xl font-extrabold">
                {loading ? "…" : form.latestVersionName ? `v${form.latestVersionName}` : "Not set yet"}
                {form.latestVersionCode && !loading ? (
                  <span className="ml-2 text-sm font-medium text-violet-200">(build {form.latestVersionCode})</span>
                ) : null}
              </p>
            </div>
            {form.forceUpdate && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold">
                <ShieldAlert className="h-3.5 w-3.5" /> Force update ON
              </span>
            )}
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>App</label>
              <select
                value={appKey}
                onChange={(e) => {
                  setCustomKey("");
                  setAppKey(e.target.value);
                }}
                className={inputCls}
              >
                {APPS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Or custom app key</label>
              <input
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="e.g. promodesk"
                className={inputCls}
              />
            </div>
          </div>

          {found === false && !loading && (
            <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              No version saved for “{activeKey}” yet. Saving will create it.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Version name</label>
              <input
                value={form.latestVersionName}
                onChange={(e) => setForm({ ...form, latestVersionName: e.target.value })}
                placeholder="1.0.3"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Version code (build number)</label>
              <input
                type="number"
                min={1}
                value={form.latestVersionCode}
                onChange={(e) => setForm({ ...form, latestVersionCode: e.target.value })}
                placeholder="7"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Download URL</label>
            <div className="relative">
              <Download className="pointer-events-none absolute left-3.5 top-1/2 mt-0.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={form.downloadUrl}
                onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                placeholder="https://…/promobandhu.apk or Play Store link"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Release notes</label>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.releaseNotes}
              onChange={(e) => setForm({ ...form, releaseNotes: e.target.value })}
              placeholder="What's new in this version"
              className={inputCls}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <input
              type="checkbox"
              checked={form.forceUpdate}
              onChange={(e) => setForm({ ...form, forceUpdate: e.target.checked })}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">Force update</span>
              <span className="block text-xs text-gray-500">
                Users on older versions cannot continue until they update.
              </span>
            </span>
          </label>

          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish version"}
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
