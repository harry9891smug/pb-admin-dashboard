"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Trash2, Play, Upload, Clapperboard, Plus, X } from "lucide-react";

import { isAuthenticated } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageShell from "@/components/ui/PageShell";
import { useCan } from "@/hooks/useCan";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  listLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  listAddons,
  createAddon,
  updateAddon,
  deleteAddon,
  listAddonVideos,
  createAddonVideo,
  updateAddonVideo,
  deleteAddonVideo,
  uploadAddonVideo,
  listTutorialLinks,
  saveTutorialLink,
  deleteTutorialLink,
  type AppLanguage,
  type AppAddon,
  type AddonVideo,
  type TutorialLink,
} from "@/lib/api/admin/appContent";

// The dashboard stylesheet recolours every "slate" class for its light theme,
// so this page sticks to plain white / gray / violet classes.
const inputCls =
  "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const labelCls = "text-xs font-semibold text-gray-600";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50";
const btnDanger =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100";
const btnPrimary =
  "inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50";
const btnCancel =
  "rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.error?.message || e?.message || fallback;

type Tab = "videos" | "addons" | "languages" | "tutorial";

function Switch({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={on ? "Click to deactivate" : "Click to activate"}
      className="flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-gray-300"}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
      <span className="w-14 text-left text-xs font-semibold text-gray-600">{on ? "Active" : "Inactive"}</span>
    </button>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  // Rendered straight into <body>: inside the page card, "fixed" is measured
  // from the card (it has a transform/filter), which cut the popup off.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-none items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="text-base font-bold text-gray-900">{title}</div>
            {subtitle ? <div className="mt-0.5 text-xs text-gray-500">{subtitle}</div> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
          {children}
        </div>
        <div className="flex flex-none items-center justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AppContentPage() {
  const router = useRouter();
  const canManage = useCan()("content.manage");

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<AppLanguage[]>([]);
  const [addons, setAddons] = useState<AppAddon[]>([]);
  const [videos, setVideos] = useState<AddonVideo[]>([]);
  const [tutorials, setTutorials] = useState<TutorialLink[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [l, a, v, t] = await Promise.all([
        listLanguages(),
        listAddons(),
        listAddonVideos(),
        listTutorialLinks(),
      ]);
      setLanguages(l);
      setAddons(a);
      setVideos(v);
      setTutorials(t);
    } catch (e: any) {
      const msg = errMsg(e, "Failed to load");
      toast.error(msg);
      if (String(msg).toLowerCase().includes("session")) router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await refresh();
      return true;
    } catch (e: any) {
      toast.error(errMsg(e, "Action failed"));
      return false;
    }
  };

  // One confirm popup for every delete on this page (the dashboard's own
  // ConfirmDialog, not the browser's).
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);
  const askDelete = (d: NonNullable<typeof pendingDelete>) => setPendingDelete(d);

  // ------------------------------------------------------------ video modal
  type VForm = {
    addonId: string;
    languageCode: string;
    title: string;
    videoUrl: string;
    source: "url" | "upload";
    sortOrder: string;
    isActive: boolean;
  };
  const emptyV: VForm = {
    addonId: "",
    languageCode: "",
    title: "",
    videoUrl: "",
    source: "url",
    sortOrder: "0",
    isActive: true,
  };
  const [vOpen, setVOpen] = useState(false);
  const [vEditing, setVEditing] = useState<number | null>(null);
  const [vForm, setVForm] = useState<VForm>(emptyV);
  const [vSaving, setVSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openVideo = (v?: AddonVideo, addonId?: number) => {
    if (v) {
      setVEditing(v.id);
      setVForm({
        addonId: String(v.addonId),
        languageCode: v.languageCode,
        title: v.title ?? "",
        videoUrl: v.videoUrl,
        source: v.source,
        sortOrder: String(v.sortOrder),
        isActive: v.isActive,
      });
    } else {
      setVEditing(null);
      setVForm({
        ...emptyV,
        addonId: addonId ? String(addonId) : addons[0] ? String(addons[0].id) : "",
        languageCode: languages.find((l) => l.isActive)?.code ?? "",
      });
    }
    setVOpen(true);
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("Video must be under 50 MB");
    setUploading(true);
    const t = toast.loading("Uploading video...");
    try {
      const url = await uploadAddonVideo(file);
      setVForm((p) => ({ ...p, videoUrl: url, source: "upload" }));
      toast.success("Uploaded", { id: t });
    } catch (e: any) {
      toast.error(errMsg(e, "Upload failed"), { id: t });
    } finally {
      setUploading(false);
    }
  };

  const saveVideo = async () => {
    if (!vForm.addonId) return toast.error("Choose an add-on");
    if (!vForm.languageCode) return toast.error("Choose a language");
    if (!/^https?:\/\//i.test(vForm.videoUrl.trim())) return toast.error("Upload a video or paste a URL starting with http(s)://");
    const sortOrder = Number(vForm.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) return toast.error("Order must be 0 or more");

    const payload = {
      addonId: Number(vForm.addonId),
      languageCode: vForm.languageCode,
      title: vForm.title.trim() || null,
      videoUrl: vForm.videoUrl.trim(),
      source: vForm.source,
      sortOrder,
      isActive: vForm.isActive,
    };
    setVSaving(true);
    const ok = await run(
      () => (vEditing ? updateAddonVideo(vEditing, payload) : createAddonVideo(payload)),
      vEditing ? "Video updated" : "Video added"
    );
    setVSaving(false);
    if (ok) setVOpen(false);
  };

  // ------------------------------------------------------------ add-on modal
  const [aOpen, setAOpen] = useState(false);
  const [aEditing, setAEditing] = useState<AppAddon | null>(null);
  const [aForm, setAForm] = useState({ key: "", name: "", sortOrder: "100", isActive: true });
  const [aSaving, setASaving] = useState(false);

  const openAddon = (a?: AppAddon) => {
    setAEditing(a ?? null);
    setAForm(
      a
        ? { key: a.key, name: a.name, sortOrder: String(a.sortOrder), isActive: a.isActive }
        : { key: "", name: "", sortOrder: "100", isActive: true }
    );
    setAOpen(true);
  };

  const saveAddon = async () => {
    if (!aForm.name.trim()) return toast.error("Name is required");
    if (!aEditing && !/^[a-z0-9_]{2,50}$/.test(aForm.key.trim().toLowerCase()))
      return toast.error("Key: lowercase letters, digits and underscore only (min 2)");
    const sortOrder = Number(aForm.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) return toast.error("Order must be 0 or more");

    setASaving(true);
    const ok = await run(
      () =>
        aEditing
          ? updateAddon(aEditing.id, { name: aForm.name.trim(), sortOrder, isActive: aForm.isActive })
          : createAddon({
              key: aForm.key.trim().toLowerCase(),
              name: aForm.name.trim(),
              sortOrder,
              isActive: aForm.isActive,
            }),
      aEditing ? "Add-on updated" : "Add-on added"
    );
    setASaving(false);
    if (ok) setAOpen(false);
  };

  // ---------------------------------------------------------- language modal
  const [lOpen, setLOpen] = useState(false);
  const [lEditing, setLEditing] = useState<AppLanguage | null>(null);
  const [lForm, setLForm] = useState({ code: "", name: "", nativeName: "", sortOrder: "100", isActive: true });
  const [lSaving, setLSaving] = useState(false);

  const openLanguage = (l?: AppLanguage) => {
    setLEditing(l ?? null);
    setLForm(
      l
        ? { code: l.code, name: l.name, nativeName: l.nativeName ?? "", sortOrder: String(l.sortOrder), isActive: l.isActive }
        : { code: "", name: "", nativeName: "", sortOrder: "100", isActive: true }
    );
    setLOpen(true);
  };

  const saveLanguage = async () => {
    if (!lForm.name.trim()) return toast.error("Name is required");
    if (!lEditing && !/^[a-z]{2,3}(-[a-z0-9]{2,4})?$/.test(lForm.code.trim().toLowerCase()))
      return toast.error("Code like en, hi, mr, ta, bn");
    const sortOrder = Number(lForm.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0) return toast.error("Order must be 0 or more");

    setLSaving(true);
    const ok = await run(
      () =>
        lEditing
          ? updateLanguage(lEditing.code, {
              name: lForm.name.trim(),
              nativeName: lForm.nativeName.trim() || null,
              sortOrder,
              isActive: lForm.isActive,
            })
          : createLanguage({
              code: lForm.code.trim().toLowerCase(),
              name: lForm.name.trim(),
              nativeName: lForm.nativeName.trim() || null,
              sortOrder,
              isActive: lForm.isActive,
            }),
      lEditing ? "Language updated" : "Language added"
    );
    setLSaving(false);
    if (ok) setLOpen(false);
  };

  // --------------------------------------------------------- tutorial editing
  const [tDraft, setTDraft] = useState<Record<string, string>>({});
  const tutorialFor = (code: string) => tutorials.find((t) => t.languageCode === code);
  const tutorialUrl = (code: string) => tDraft[code] ?? tutorialFor(code)?.url ?? "";

  const saveTutorial = async (code: string) => {
    const url = tutorialUrl(code).trim();
    if (!/^https?:\/\//i.test(url)) return toast.error("Enter a URL starting with http(s)://");
    const ok = await run(
      () => saveTutorialLink(code, { url, isActive: tutorialFor(code)?.isActive ?? true }),
      "Tutorial link saved"
    );
    if (ok) setTDraft((p) => {
      const n = { ...p };
      delete n[code];
      return n;
    });
  };

  // ------------------------------------------------------------------ render
  const tabs: { id: Tab; label: string }[] = [
    { id: "videos", label: "Videos" },
    { id: "addons", label: "Add-ons" },
    { id: "languages", label: "Languages" },
    { id: "tutorial", label: "Tutorial" },
  ];

  return (
    <ProtectedRoute requiredPermission="business.view">
      <PageShell
        top={
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Add-on Videos &amp; Tutorial</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Videos shown on each add-on page, one per language. A customer sees the videos in the
                  language they chose in the app. If an add-on has none in that language, the English one
                  is shown.
                </p>
              </div>
            </div>
          </div>
        }
      >
        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? "bg-white text-violet-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500 shadow-sm">
            Loading...
          </div>
        ) : null}

        {/* ------------------------------------------------------------ Videos */}
        {!loading && tab === "videos" ? (
          <div className="space-y-4">
            <div className={`flex justify-end ${canManage ? "" : "hidden"}`}>
              <button onClick={() => openVideo()} className={btnPrimary} disabled={!addons.length || !languages.length}>
                <Plus className="h-4 w-4" /> Add Video
              </button>
            </div>
            {addons.map((a) => {
              const list = videos.filter((v) => v.addonId === a.id);
              const missing = languages.filter((l) => l.isActive && !list.some((v) => v.languageCode === l.code));
              return (
                <div key={a.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{a.name}</span>
                      {!a.isActive ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                          Add-on inactive
                        </span>
                      ) : null}
                    </div>
                    <button onClick={() => openVideo(undefined, a.id)} className={`${btnGhost} ${canManage ? "" : "hidden"}`}>
                      <Plus className="h-3.5 w-3.5" /> Add video
                    </button>
                  </div>
                  {list.length === 0 ? (
                    <div className="px-5 py-5 text-sm text-gray-500">No video yet.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {list.map((v) => (
                        <div key={v.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                          <span className="min-w-[84px] rounded-full bg-violet-100 px-3 py-1 text-center text-xs font-semibold text-violet-700">
                            {v.languageName ?? v.languageCode}
                          </span>
                          <div className="min-w-[200px] flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {v.title || "Untitled"}
                              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
                                {v.source === "upload" ? "Uploaded" : "URL"}
                              </span>
                            </div>
                            <a
                              href={v.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-md truncate text-xs text-violet-600 hover:underline"
                            >
                              {v.videoUrl}
                            </a>
                          </div>
                          <Switch
                            on={v.isActive}
                            disabled={!canManage}
                            onClick={() =>
                              run(() => updateAddonVideo(v.id, { isActive: !v.isActive }), v.isActive ? "Deactivated" : "Activated")
                            }
                          />
                          <div className="flex gap-2">
                            {v.source === "upload" ? (
                              <button onClick={() => setPreviewUrl(v.videoUrl)} className={btnGhost}>
                                <Play className="h-3.5 w-3.5" /> Preview
                              </button>
                            ) : null}
                            <button onClick={() => openVideo(v)} className={`${btnGhost} ${canManage ? "" : "hidden"}`}>
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() =>
                                askDelete({
                                  title: "Delete this video?",
                                  message: `The ${v.languageName ?? v.languageCode} video of ${a.name} will be removed from the app.`,
                                  confirmLabel: "Delete",
                                  action: () => run(() => deleteAddonVideo(v.id), "Deleted"),
                                })
                              }
                              className={`${btnDanger} ${canManage ? "" : "hidden"}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {missing.length && list.length ? (
                    <div className="border-t border-gray-100 bg-amber-50 px-5 py-2 text-xs text-amber-700">
                      Missing: {missing.map((l) => l.name).join(", ")}. Those customers will see the English video.
                    </div>
                  ) : null}
                </div>
              );
            })}
            {!addons.length ? (
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500 shadow-sm">
                No add-ons yet. Add them in the Add-ons tab.
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ----------------------------------------------------------- Add-ons */}
        {!loading && tab === "addons" ? (
          <div className="space-y-3">
            <div className={`flex justify-end ${canManage ? "" : "hidden"}`}>
              <button onClick={() => openAddon()} className={btnPrimary}>
                <Plus className="h-4 w-4" /> Add Add-on
              </button>
            </div>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {addons.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-semibold text-gray-900">{a.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      key: <span className="font-mono">{a.key}</span> · order {a.sortOrder} · {a.videoCount} video
                      {a.videoCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Switch disabled={!canManage} on={a.isActive} onClick={() => run(() => updateAddon(a.id, { isActive: !a.isActive }), "Updated")} />
                  <div className={`flex gap-2 ${canManage ? "" : "hidden"}`}>
                    <button onClick={() => openAddon(a)} className={btnGhost}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        askDelete({
                          title: `Delete "${a.name}"?`,
                          message:
                            a.videoCount > 0
                              ? `Its ${a.videoCount} video${a.videoCount === 1 ? "" : "s"} will be deleted too. This cannot be undone.`
                              : "This cannot be undone.",
                          confirmLabel: "Delete",
                          action: () => run(() => deleteAddon(a.id), "Deleted"),
                        })
                      }
                      className={btnDanger}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              The key is what the app uses to find an add-on&apos;s video (team, invoice_sms, offer_sms,
              delivery, stock, email). Keep these keys as they are.
            </p>
          </div>
        ) : null}

        {/* --------------------------------------------------------- Languages */}
        {!loading && tab === "languages" ? (
          <div className="space-y-3">
            <div className={`flex justify-end ${canManage ? "" : "hidden"}`}>
              <button onClick={() => openLanguage()} className={btnPrimary}>
                <Plus className="h-4 w-4" /> Add Language
              </button>
            </div>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {languages.map((l) => (
                <div key={l.code} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-[200px] flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {l.name}
                      {l.nativeName ? <span className="ml-2 text-gray-500">{l.nativeName}</span> : null}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      code: <span className="font-mono">{l.code}</span> · order {l.sortOrder} · {l.videoCount} video
                      {l.videoCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <Switch disabled={!canManage} on={l.isActive} onClick={() => run(() => updateLanguage(l.code, { isActive: !l.isActive }), "Updated")} />
                  <div className={`flex gap-2 ${canManage ? "" : "hidden"}`}>
                    <button onClick={() => openLanguage(l)} className={btnGhost}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        askDelete({
                          title: `Delete ${l.name}?`,
                          message:
                            l.videoCount > 0
                              ? "This language still has videos, so it cannot be deleted. Mark it inactive instead."
                              : "This cannot be undone.",
                          confirmLabel: "Delete",
                          action: () => run(() => deleteLanguage(l.code), "Deleted"),
                        })
                      }
                      className={btnDanger}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              The app code of a language must match the app&apos;s own language codes (en, hi, mr). A new
              language&apos;s videos show up once the app supports that language.
            </p>
          </div>
        ) : null}

        {/* ---------------------------------------------------------- Tutorial */}
        {!loading && tab === "tutorial" ? (
          <div className="space-y-3">
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {languages.map((l) => {
                const saved = tutorialFor(l.code);
                return (
                  <div key={l.code} className="flex flex-wrap items-end gap-3 px-5 py-4">
                    <div className="min-w-[110px]">
                      <div className="text-sm font-semibold text-gray-900">{l.name}</div>
                      <div className="font-mono text-xs text-gray-500">{l.code}</div>
                    </div>
                    <div className="min-w-[260px] flex-1">
                      <label className={labelCls}>Tutorial URL</label>
                      <input
                        disabled={!canManage}
                        value={tutorialUrl(l.code)}
                        onChange={(e) => setTDraft((p) => ({ ...p, [l.code]: e.target.value }))}
                        placeholder="https://..."
                        className={inputCls}
                      />
                    </div>
                    {canManage ? (
                    <button onClick={() => saveTutorial(l.code)} className={btnPrimary}>
                      Save
                    </button>
                    ) : null}
                    {saved && canManage ? (
                      <button
                        onClick={() =>
                          askDelete({
                            title: `Remove the ${l.name} link?`,
                            message: "Customers in this language will see the English link instead.",
                            confirmLabel: "Remove",
                            action: () => run(() => deleteTutorialLink(l.code), "Removed"),
                          })
                        }
                        className={btnDanger}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500">
              The Tutorial tile in the app opens the link for the customer&apos;s language (English if that
              language has none).
            </p>
          </div>
        ) : null}

        {/* ------------------------------------------------------ Video modal */}
        {vOpen ? (
          <Modal
            title={vEditing ? "Edit video" : "Add video"}
            subtitle="Upload a file or paste a URL (YouTube links work)."
            onClose={() => !vSaving && setVOpen(false)}
            footer={
              <>
                <button disabled={vSaving} onClick={() => setVOpen(false)} className={btnCancel}>
                  Cancel
                </button>
                <button disabled={vSaving || uploading} onClick={saveVideo} className={btnPrimary}>
                  {vSaving ? "Saving..." : "Save"}
                </button>
              </>
            }
          >
            <div>
              <label className={labelCls}>Add-on *</label>
              <select
                value={vForm.addonId}
                onChange={(e) => setVForm((p) => ({ ...p, addonId: e.target.value }))}
                className={inputCls}
              >
                {addons.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Language *</label>
              <select
                value={vForm.languageCode}
                onChange={(e) => setVForm((p) => ({ ...p, languageCode: e.target.value }))}
                className={inputCls}
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                    {l.isActive ? "" : " (inactive)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Title (optional)</label>
              <input
                value={vForm.title}
                onChange={(e) => setVForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. How Team Licence works"
                className={inputCls}
              />
            </div>
            {/* One choice: paste a link, or upload a file. */}
            <div className="md:col-span-2">
              <label className={labelCls}>Video *</label>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
                {(
                  [
                    { id: "url", label: "Paste a link" },
                    { id: "upload", label: "Upload a file" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setVForm((p) =>
                        p.source === m.id ? p : { ...p, source: m.id, videoUrl: "" }
                      )
                    }
                    className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                      vForm.source === m.id ? "bg-white text-violet-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {vForm.source === "url" ? (
                <div className="mt-3">
                  <input
                    value={vForm.videoUrl}
                    onChange={(e) => setVForm((p) => ({ ...p, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">YouTube link or any link that plays a video.</p>
                </div>
              ) : (
                <div className="mt-3">
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                      vForm.videoUrl && vForm.source === "upload"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-violet-200 bg-violet-50/50 hover:bg-violet-50"
                    } ${uploading ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <Upload className="h-6 w-6 text-violet-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {uploading
                        ? "Uploading..."
                        : vForm.videoUrl && vForm.source === "upload"
                        ? "Uploaded. Click to replace"
                        : "Click to choose a video"}
                    </span>
                    <span className="text-xs text-gray-500">MP4, MOV or WebM, under 50 MB</span>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={(e) => {
                        onPickFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {vForm.videoUrl && vForm.source === "upload" ? (
                    <a
                      href={vForm.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block truncate text-xs text-violet-600 hover:underline"
                    >
                      {vForm.videoUrl}
                    </a>
                  ) : null}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Status</label>
              <select
                value={vForm.isActive ? "1" : "0"}
                onChange={(e) => setVForm((p) => ({ ...p, isActive: e.target.value === "1" }))}
                className={inputCls}
              >
                <option value="1">Active (customers can see it)</option>
                <option value="0">Inactive (hidden)</option>
              </select>
            </div>

            {/* The order only matters once an add-on has a series of videos. */}
            <details className="md:col-span-2">
              <summary className="cursor-pointer text-xs font-semibold text-gray-500">More options</summary>
              <div className="mt-2">
                <label className={labelCls}>Order (for a series later)</label>
                <input
                  value={vForm.sortOrder}
                  onChange={(e) => setVForm((p) => ({ ...p, sortOrder: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </details>
          </Modal>
        ) : null}

        {/* ---------------------------------------------------- Add-on modal */}
        {aOpen ? (
          <Modal
            title={aEditing ? "Edit add-on" : "Add add-on"}
            onClose={() => !aSaving && setAOpen(false)}
            footer={
              <>
                <button disabled={aSaving} onClick={() => setAOpen(false)} className={btnCancel}>
                  Cancel
                </button>
                <button disabled={aSaving} onClick={saveAddon} className={btnPrimary}>
                  {aSaving ? "Saving..." : "Save"}
                </button>
              </>
            }
          >
            <div>
              <label className={labelCls}>Name *</label>
              <input value={aForm.name} onChange={(e) => setAForm((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Key *{aEditing ? " (cannot change)" : ""}</label>
              <input
                value={aForm.key}
                disabled={!!aEditing}
                onChange={(e) => setAForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="e.g. loyalty_points"
                className={`${inputCls} disabled:bg-gray-100`}
              />
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <input value={aForm.sortOrder} onChange={(e) => setAForm((p) => ({ ...p, sortOrder: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={aForm.isActive ? "1" : "0"}
                onChange={(e) => setAForm((p) => ({ ...p, isActive: e.target.value === "1" }))}
                className={inputCls}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </Modal>
        ) : null}

        {/* --------------------------------------------------- Language modal */}
        {lOpen ? (
          <Modal
            title={lEditing ? "Edit language" : "Add language"}
            onClose={() => !lSaving && setLOpen(false)}
            footer={
              <>
                <button disabled={lSaving} onClick={() => setLOpen(false)} className={btnCancel}>
                  Cancel
                </button>
                <button disabled={lSaving} onClick={saveLanguage} className={btnPrimary}>
                  {lSaving ? "Saving..." : "Save"}
                </button>
              </>
            }
          >
            <div>
              <label className={labelCls}>Name *</label>
              <input value={lForm.name} onChange={(e) => setLForm((p) => ({ ...p, name: e.target.value }))} placeholder="Tamil" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Native name</label>
              <input value={lForm.nativeName} onChange={(e) => setLForm((p) => ({ ...p, nativeName: e.target.value }))} placeholder="தமிழ்" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Code *{lEditing ? " (cannot change)" : ""}</label>
              <input
                value={lForm.code}
                disabled={!!lEditing}
                onChange={(e) => setLForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="ta"
                className={`${inputCls} disabled:bg-gray-100`}
              />
            </div>
            <div>
              <label className={labelCls}>Order</label>
              <input value={lForm.sortOrder} onChange={(e) => setLForm((p) => ({ ...p, sortOrder: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                value={lForm.isActive ? "1" : "0"}
                onChange={(e) => setLForm((p) => ({ ...p, isActive: e.target.value === "1" }))}
                className={inputCls}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </Modal>
        ) : null}

        <ConfirmDialog
          open={!!pendingDelete}
          tone="danger"
          title={pendingDelete?.title ?? ""}
          message={pendingDelete?.message}
          confirmLabel={pendingDelete?.confirmLabel ?? "Delete"}
          cancelLabel="Cancel"
          onConfirm={() => {
            const d = pendingDelete;
            setPendingDelete(null);
            d?.action();
          }}
          onCancel={() => setPendingDelete(null)}
        />

        {/* ------------------------------------------------------- Preview */}
        {previewUrl ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <video src={previewUrl} controls autoPlay className="max-h-[80vh] w-full bg-black" />
              <button onClick={() => setPreviewUrl(null)} className="w-full bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        ) : null}
      </PageShell>
    </ProtectedRoute>
  );
}
