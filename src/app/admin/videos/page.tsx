"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Pencil, Trash2, Eye, Upload } from "lucide-react";

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
const showDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "-");

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

  const input =
    "mt-1 w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500";

  return (
    <ProtectedRoute requiredPermission="business.view">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-black">Welcome & Announcement Videos</h1>
            <p className="text-sm text-slate-400 mt-1">
              Full-screen video shown before the dashboard. The Welcome video plays first until
              the user views it; then one active announcement at a time. A skipped video comes
              back at the next login.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-black hover:bg-emerald-500/20 transition whitespace-nowrap"
          >
            + Add Video
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr className="text-left text-slate-300">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Runs</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Viewed</th>
                  <th className="px-4 py-3">Skipped</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={8}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-400" colSpan={8}>
                      No videos yet. Add the Welcome video to get started.
                    </td>
                  </tr>
                ) : (
                  items.map((v) => (
                    <tr key={v.id} className="text-slate-200 hover:bg-slate-900/40 transition">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-black">{v.title}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Skip after {v.skipAfterSec}s · viewed after {v.viewedAfterSec}s
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={
                            v.type === "welcome"
                              ? "inline-flex px-2.5 py-1 rounded-full text-xs border border-purple-500/40 bg-purple-500/10 text-black"
                              : "inline-flex px-2.5 py-1 rounded-full text-xs border border-slate-700 bg-slate-900 text-white"
                          }
                        >
                          {v.type === "welcome" ? "Welcome" : "Announcement"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <button
                          onClick={() => toggleStatus(v)}
                          title="Click to switch"
                          className={
                            v.status === "active"
                              ? "inline-flex px-2.5 py-1 rounded-full text-xs border border-emerald-500/40 bg-emerald-500/10 text-black"
                              : "inline-flex px-2.5 py-1 rounded-full text-xs border border-rose-500/30 bg-rose-500/10 text-black"
                          }
                        >
                          {v.status === "active" ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-400">
                        <div>From: {showDate(v.startDate)}</div>
                        <div>To: {showDate(v.endDate)}</div>
                      </td>
                      <td className="px-4 py-4 align-top">{v.priority}</td>
                      <td className="px-4 py-4 align-top">{v.viewedCount}</td>
                      <td className="px-4 py-4 align-top">{v.skippedCount}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPreviewUrl(v.videoUrl)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white hover:bg-slate-800 transition"
                          >
                            <Eye className="h-4 w-4" /> Preview
                          </button>
                          <button
                            onClick={() => openEdit(v)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white hover:bg-slate-800 transition"
                          >
                            <Pencil className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => onDelete(v)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-black hover:bg-rose-500/15 transition"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {open ? (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-950 border border-slate-800 rounded-2xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="text-white font-semibold">
                  {editingId ? `Edit Video #${editingId}` : "Add Video"}
                </div>
                <button
                  onClick={() => !saving && closeModal()}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Welcome to PromoBandhu"
                    className={input}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as VideoType }))}
                    className={input}
                  >
                    <option value="welcome">Welcome (plays first)</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Status *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as VideoStatus }))}
                    className={input}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400">
                    Video * (short portrait MP4, under 50 MB)
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={form.videoUrl}
                      onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
                      placeholder="Paste a video URL, or upload a file ->"
                      className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500"
                    />
                    <label
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition cursor-pointer whitespace-nowrap ${
                        uploading ? "opacity-50 pointer-events-none" : ""
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
                  <label className="text-xs text-slate-400">Start date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                    className={input}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">End date (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                    className={input}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Priority (lower plays first)</label>
                  <input
                    value={form.priority}
                    onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                    className={input}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Skip appears after (sec)</label>
                  <input
                    value={form.skipAfterSec}
                    onChange={(e) => setForm((p) => ({ ...p, skipAfterSec: e.target.value }))}
                    className={input}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Counts as viewed after (sec)</label>
                  <input
                    value={form.viewedAfterSec}
                    onChange={(e) => setForm((p) => ({ ...p, viewedAfterSec: e.target.value }))}
                    className={input}
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  disabled={saving}
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  disabled={saving || uploading}
                  onClick={onSave}
                  className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/20 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {previewUrl ? (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="text-white font-semibold">Preview</div>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
              <video src={previewUrl} controls autoPlay className="w-full max-h-[75vh] bg-black" />
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
