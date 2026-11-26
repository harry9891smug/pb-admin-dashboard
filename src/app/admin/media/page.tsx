"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Folder, Upload, Trash2, Copy, RefreshCw, FileText, Film, Search } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCan } from "@/hooks/useCan";
import { apiErrorMessage } from "@/lib/api/admin/cases";
import {
  deleteMedia,
  deleteOrphans,
  listMedia,
  scanOrphans,
  uploadMedia,
  type MediaFile,
  type OrphanScan,
} from "@/lib/api/admin/media";

const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex h-7 items-center gap-1 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

const human = (b: number) =>
  b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`;

const when = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

function Thumb({ f }: { f: MediaFile }) {
  if (f.kind === "image")
    return <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />;
  const Icon = f.kind === "video" ? Film : FileText;
  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
      <Icon className="h-8 w-8" />
    </div>
  );
}

function Inner() {
  const can = useCan();
  const [tab, setTab] = useState<"files" | "unused">("files");
  const [prefix, setPrefix] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listWarning, setListWarning] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MediaFile | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // unused-files state
  const [scan, setScan] = useState<OrphanScan | null>(null);
  const [scanning, setScanning] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirmOrphans, setConfirmOrphans] = useState(false);

  const load = useCallback(
    async (p: string, token?: string) => {
      setLoading(true);
      setListError(null);
      try {
        const r = await listMedia(p, token);
        setFolders(r.folders);
        setFiles((cur) => (token ? [...cur, ...r.files] : r.files));
        setNext(r.nextToken);
        setListWarning(r.warning ?? null);
      } catch (e) {
        const msg = apiErrorMessage(e, "Failed to load files");
        setListError(msg);
        setFolders([]);
        setFiles([]);
        setNext(null);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(prefix);
  }, [prefix, load]);

  const crumbs = prefix.split("/").filter(Boolean);

  const onUpload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const folder = prefix.replace(/\/$/, "") || "media";
    setUploading(true);
    try {
      for (const f of Array.from(list)) await uploadMedia(f, folder);
      toast.success(`${list.length} file(s) uploaded`);
      load(prefix);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const doDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMedia(pendingDelete.key);
      toast.success("Deleted");
      setFiles((cur) => cur.filter((f) => f.key !== pendingDelete.key));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Delete failed"));
    }
    setPendingDelete(null);
  };

  const copy = (url: string) => {
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy")
    );
  };

  const runScan = async () => {
    setScanning(true);
    setScan(null);
    setPicked(new Set());
    try {
      setScan(await scanOrphans(""));
    } catch (e) {
      toast.error(apiErrorMessage(e, "Scan failed"));
    } finally {
      setScanning(false);
    }
  };

  const togglePick = (k: string) =>
    setPicked((cur) => {
      const n = new Set(cur);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });

  const removePicked = async () => {
    setConfirmOrphans(false);
    try {
      const r = await deleteOrphans(Array.from(picked));
      toast.success(`${r.deleted} deleted${r.skipped ? `, ${r.skipped} skipped (now in use)` : ""}`);
      runScan();
    } catch (e) {
      toast.error(apiErrorMessage(e, "Delete failed"));
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Media Manager</h1>
          <p className="text-xs text-gray-500">Photos, videos and documents stored in S3.</p>
        </div>
        <div className="flex gap-1">
          {(["files", "unused"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-7 rounded-md px-3 text-xs font-medium ${
                tab === t ? "bg-violet-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {t === "files" ? "Files" : "Unused files"}
            </button>
          ))}
        </div>
      </div>

      {tab === "files" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <button className="font-semibold text-violet-700 hover:underline" onClick={() => setPrefix("")}>
                root
              </button>
              {crumbs.map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  /
                  <button
                    className="hover:underline"
                    onClick={() => setPrefix(crumbs.slice(0, i + 1).join("/") + "/")}
                  >
                    {c}
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <button className={btnCls} onClick={() => load(prefix)} disabled={loading}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
              {can("media.upload") ? (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => onUpload(e.target.files)}
                  />
                  <button className={btnPrimary} disabled={uploading} onClick={() => fileInput.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : `Upload to ${prefix || "media/"}`}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {folders.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => setPrefix(f)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-800 hover:bg-violet-50"
                >
                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                  {f.slice(prefix.length).replace(/\/$/, "")}
                </button>
              ))}
            </div>
          ) : null}

          {listWarning ? (
            <div className="mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              {listWarning}
            </div>
          ) : null}

          {listError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              Could not load files: {listError}
            </div>
          ) : files.length === 0 && !loading ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-xs text-gray-500">
              No files in this folder.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {files.map((f) => (
                <div key={f.key} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <button className="block h-24 w-full" onClick={() => setPreview(f)}>
                    <Thumb f={f} />
                  </button>
                  <div className="space-y-1 p-2">
                    <div className="truncate text-[11px] font-medium text-gray-800" title={f.key}>
                      {f.name}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {human(f.size)} • {when(f.lastModified)}
                    </div>
                    <div className="flex gap-1">
                      <button className={btnCls} title="Copy link" onClick={() => copy(f.url)}>
                        <Copy className="h-3 w-3" />
                      </button>
                      {can("media.delete") ? (
                        <button className={`${btnCls} text-red-600`} title="Delete" onClick={() => setPendingDelete(f)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {next ? (
            <button className={btnCls} disabled={loading} onClick={() => load(prefix, next)}>
              Load more
            </button>
          ) : null}
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-600">
            Finds uploaded files that no database record refers to any more. Only files created by the app and older
            than 24 hours are listed, so nothing in use or just uploaded is touched. Review before deleting - deletion
            cannot be undone.
          </div>
          <div className="flex items-center gap-2">
            <button className={btnPrimary} disabled={scanning} onClick={runScan}>
              <Search className="h-3.5 w-3.5" /> {scanning ? "Scanning… (can take a minute)" : "Scan for unused files"}
            </button>
            {scan && can("media.delete") && picked.size > 0 ? (
              <button className={`${btnCls} text-red-600`} onClick={() => setConfirmOrphans(true)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete {picked.size} selected
              </button>
            ) : null}
            {scan && scan.orphans.length > 0 ? (
              <button
                className={btnCls}
                onClick={() =>
                  setPicked(picked.size === scan.orphans.length ? new Set() : new Set(scan.orphans.map((o) => o.key)))
                }
              >
                {picked.size === scan.orphans.length ? "Clear selection" : "Select all"}
              </button>
            ) : null}
          </div>

          {scan ? (
            <>
              <div className="text-xs text-gray-600">
                Scanned {scan.scanned} files{scan.truncated ? " (limit reached - bucket has more)" : ""}. Unused:{" "}
                <b>{scan.orphanCount}</b> ({human(scan.totalBytes)}).
                {scan.orphanCount > scan.orphans.length ? ` Showing first ${scan.orphans.length}.` : ""}
              </div>
              <div className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="w-8 px-2.5 py-2"></th>
                      <th className="px-2.5 py-2">Preview</th>
                      <th className="px-2.5 py-2">File</th>
                      <th className="px-2.5 py-2">Size</th>
                      <th className="px-2.5 py-2">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scan.orphans.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">No unused files found.</td></tr>
                    ) : (
                      scan.orphans.map((o) => (
                        <tr key={o.key} className="border-t border-gray-100 hover:bg-violet-50/40">
                          <td className="px-2.5 py-1.5">
                            <input type="checkbox" checked={picked.has(o.key)} onChange={() => togglePick(o.key)} />
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div className="h-9 w-9 overflow-hidden rounded">
                              <Thumb f={o} />
                            </div>
                          </td>
                          <td className="max-w-[420px] truncate px-2.5 py-1.5 font-mono text-[11px]" title={o.key}>
                            <a href={o.url} target="_blank" rel="noreferrer" className="text-violet-700 hover:underline">
                              {o.key}
                            </a>
                          </td>
                          <td className="px-2.5 py-1.5">{human(o.size)}</td>
                          <td className="px-2.5 py-1.5">{when(o.lastModified)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      )}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setPreview(null)}
        >
          <div className="max-h-full max-w-3xl overflow-auto rounded-lg bg-white p-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 break-all text-xs text-gray-600">{preview.key}</div>
            {preview.kind === "image" ? (
              <img src={preview.url} alt="" className="max-h-[70vh] rounded" />
            ) : preview.kind === "video" ? (
              <video src={preview.url} controls className="max-h-[70vh] rounded" />
            ) : (
              <a href={preview.url} target="_blank" rel="noreferrer" className="text-sm text-violet-700 underline">
                Open file
              </a>
            )}
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this file?"
        message={`${pendingDelete?.key} will be removed from S3. If the app still uses it, that image or video will break.`}
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmDialog
        open={confirmOrphans}
        title={`Delete ${picked.size} unused files?`}
        message="They will be removed from S3 permanently. Files that became in use since the scan are skipped."
        confirmLabel="Delete"
        onConfirm={removePicked}
        onCancel={() => setConfirmOrphans(false)}
      />
    </div>
  );
}

export default function MediaPage() {
  return (
    <ProtectedRoute requiredPermission="media.view">
      <Inner />
    </ProtectedRoute>
  );
}
