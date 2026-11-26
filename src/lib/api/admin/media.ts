import { apiClient } from "../../axios";

export type MediaKind = "image" | "video" | "document" | "other";

export interface MediaFile {
  key: string;
  name?: string;
  size: number;
  lastModified?: string;
  kind: MediaKind;
  url: string;
}

export interface MediaList {
  prefix: string;
  folders: string[];
  files: MediaFile[];
  nextToken: string | null;
  source?: "database";
  warning?: string;
}

export interface OrphanScan {
  scanned: number;
  truncated: boolean;
  totalBytes: number;
  orphanCount: number;
  orphans: MediaFile[];
}

export const listMedia = async (prefix = "", token?: string) =>
  (
    await apiClient.get("/admin/media", { params: { prefix, token, limit: 100 } })
  ).data as MediaList;

export const uploadMedia = async (file: File, folder: string) => {
  const fd = new FormData();
  fd.append("folder", folder);
  fd.append("file", file);
  return (await apiClient.post("/admin/media/upload", fd)).data as MediaFile;
};

export const deleteMedia = async (key: string) => {
  await apiClient.delete("/admin/media", { params: { key } });
};

export const scanOrphans = async (prefix = "") =>
  (await apiClient.get("/admin/media/orphans", { params: { prefix } })).data as OrphanScan;

export const deleteOrphans = async (keys: string[]) =>
  (await apiClient.post("/admin/media/orphans/delete", { keys })).data as {
    deleted: number;
    skipped: number;
  };
