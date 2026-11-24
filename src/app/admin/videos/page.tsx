"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Trash2, Play, Upload, Film, Plus, X } from "lucide-react";

import { isAuthenticated } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  adminListVideos,
  adminCreateVideo,
  adminUpdateVideo,
  adminDeleteVideo,
  adminUploadVideo,
  type AdminVideo,
  type VideoType,
  type VideoStatus,
} from "@/lib/api/admin/videos";

type FormState = {
  title: string;
  type: VideoType;
  videoUrl: string;
  status: VideoStatus;
  startDate: string; // datetime-local value
  endDate: string;
  priority: string;
  skipAfterSec: string;
  viewedAfterSec: string;
};

const emptyForm: FormState = {
  title: "",
  type: "announcement",
  videoUrl: "",
  status: "inactive",
  startDate: "",
  endDate: "",
  priority: "100",
  skipAfterSec: "3",
  viewedAfterSec: "10",
};

// ISO (UTC) <-> the value a datetime-local input expects (local time).
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);
const showDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

// The dashboard stylesheet recolours every "slate" class for its light theme,
// so this page sticks to plain white / gray / violet classes.
const inputCls =
  "mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200";
const labelCls = "text-xs font-semibold text-gray-600";
const btnGhost =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50";

export default function VideosPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.replace("/login");
  }, [router]);

  const [items, setItems] = useState<AdminVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      setItems(await adminListVideos());
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message || e?.message || "Failed to load videos";
      toast.error(msg);
      if (String(msg).toLowerCase().includes("session")) router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (v: AdminVideo) => {
    setEditingId(v.id);
    setForm({
      title: v.title,
      type: v.type,
      videoUrl: v.videoUrl,
      status: v.status,
      startDate: toLocalInput(v.startDate),
      endDate: toLocalInput(v.endDate),
      priority: String(v.priority),
      skipAfterSec: String(v.skipAfterSec),
      viewedAfterSec: String(v.viewedAfterSec),
    });
    setOpen(true);
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) return toast.error("Video must be under 50 MB");
    setUploading(true);
    const t = toast.loading("Uploading video...");
    try {
      const url = await adminUploadVideo(file);
      setForm((p) => ({ ...p, videoUrl: url }));
      toast.success("Uploaded", { id: t });
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || e?.message || "Upload failed", { id: t });
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    if (!form.videoUrl.trim()) return "Upload a video or paste its URL";
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate))
      return "End date must be after the start date";
    for (const [label, v] of [
      ["Priority", form.priority],
      ["Skip after", form.skipAfterSec],
      ["Counts as viewed after", form.viewedAfterSec],
    ] as const) {
      if (!Number.isFinite(Number(v)) || v.trim() === "") return `${label} must be a number`;
    }
    if (Number(form.viewedAfterSec) < 1) return "Counts as viewed after must be at least 1 second";
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) return toast.error(err);

    const payload = {
      title: form.title.trim(),
      type: form.type,
      videoUrl: form.videoUrl.trim(),
      status: form.status,
      startDate: fromLocalInput(form.startDate),
      endDate: fromLocalInput(form.endDate),
      priority: Number(form.priority),
      skipAfterSec: Number(form.skipAfterSec),
      viewedAfterSec: Number(form.viewedAfterSec),
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateVideo(editingId, payload);
        toast.success("Video updated");
      } else {
        await adminCreateVideo(payload);
        toast.success("Video created");
      }
      closeModal();
      await fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (v: AdminVideo) => {
    const next: VideoStatus = v.status === "active" ? "inactive" : "active";
    try {
      await adminUpdateVideo(v.id, { status: next });
      toast.success(next === "active" ? "Video is now active" : "Video deactivated");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || e?.message || "Update failed");
    }
  };

  const onDelete = async (v: AdminVideo) => {
    if (!confirm(`Delete "${v.title}"? Its view history is deleted too.`)) return;
    try {
      await adminDeleteVideo(v.id);
      toast.success("Deleted");
      await fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || e?.message || "Delete failed");
    }
  };

  return (
    <ProtectedRoute requiredPermission="business.view">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome &amp; Announcement Videos</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                A full-screen video shown before the dashboard. The Welcome video plays first until
                the user views it, then one active announcement at a time. A skipped video comes
                back at the next login.
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Add Video
          </button>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <Film className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold text-gray-900">No videos yet</div>
              <div className="mt-1 text-sm text-gray-500">
                Add the Welcome video to get started.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((v) => {
                const from = showDate(v.startDate);
                const to = showDate(v.endDate);
                return (
                  <div key={v.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    {/* Thumbnail */}
                    <button
                      onClick={() => setPreviewUrl(v.videoUrl)}
                      title="Preview"
                      className="group relative h-24 w-14 flex-none overflow-hidden rounded-xl bg-gray-900"
                    >
                      <video
                        src={`${v.videoUrl}#t=0.5`}
                        muted
                        preload="metadata"
                        className="h-full w-full object-cover opacity-80"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-900 transition group-hover:scale-110">
                          <Play className="h-3.5 w-3.5" />
                        </span>
                      </span>
                    </button>

                    {/* Info */}
                    <div className="min-w-[220px] flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{v.title}</span>
                        <span
                          className={
                            v.type === "welcome"
                              ? "rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700"
                              : "rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700"
                          }
                        >
                          {v.type === "welcome" ? "Welcome" : "Announcement"}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-500">
                        {from || to ? (
                          <>
                            {from ? `From ${from}` : "From any time"}
                            {" · "}
                            {to ? `until ${to}` : "no end date"}
                          </>
                        ) : (
                          "Runs any time while active"
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Priority {v.priority} · Skip after {v.skipAfterSec}s · Viewed after{" "}
                        {v.viewedAfterSec}s
                      </div>
                    </div>

                    {/* Counts */}
                    <div className="flex gap-3">
                      <div className="min-w-[72px] rounded-xl bg-emerald-50 px-3 py-2 text-center">
                        <div className="text-base font-bold text-emerald-700">{v.viewedCount}</div>
                        <div className="text-[11px] font-medium text-emerald-700/80">Viewed</div>
                      </div>
                      <div className="min-w-[72px] rounded-xl bg-amber-50 px-3 py-2 text-center">
                        <div className="text-base font-bold text-amber-700">{v.skippedCount}</div>
                        <div className="text-[11px] font-medium text-amber-700/80">Skipped</div>
                      </div>
                    </div>

                    {/* Active switch */}
                    <button
                      onClick={() => toggleStatus(v)}
                      title={v.status === "active" ? "Click to deactivate" : "Click to activate"}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`relative h-6 w-11 rounded-full transition ${
                          v.status === "active" ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            v.status === "active" ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </span>
                      <span className="w-14 text-left text-xs font-semibold text-gray-600">
                        {v.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(v)} className={btnGhost}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / edit modal */}
        {open ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <div className="text-base font-bold text-gray-900">
                    {editingId ? "Edit video" : "Add video"}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    Short portrait clips (30-40 sec) work best.
                  </div>
                </div>
                <button
                  onClick={() => !saving && closeModal()}
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelCls}>Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Welcome to PromoBandhu"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as VideoType }))}
                    className={inputCls}
                  >
                    <option value="welcome">Welcome (plays first)</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value as VideoStatus }))
                    }
                    className={inputCls}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>Video * (MP4, MOV or WebM, under 50 MB)</label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      value={form.videoUrl}
                      onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                      placeholder="Paste a video URL, or upload a file"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                    />
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 ${
                        uploading ? "pointer-events-none opacity-50" : ""
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload"}
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
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Start date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>End date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Priority (lower plays first)</label>
                  <input
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Skip appears after (sec)</label>
                  <input
                    value={form.skipAfterSec}
                    onChange={(e) => setForm((p) => ({ ...p, skipAfterSec: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Counts as viewed after (sec)</label>
                  <input
                    value={form.viewedAfterSec}
                    onChange={(e) => setForm((p) => ({ ...p, viewedAfterSec: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                <button
                  disabled={saving}
                  onClick={closeModal}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || uploading}
                  onClick={onSave}
                  className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Preview */}
        {previewUrl ? (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <div
              className="w-full max-w-xs overflow-hidden rounded-2xl bg-black shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <video src={previewUrl} controls autoPlay className="max-h-[80vh] w-full bg-black" />
              <button
                onClick={() => setPreviewUrl(null)}
                className="w-full bg-white py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
