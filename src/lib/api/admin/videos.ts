import { apiClient } from "../../axios";

export type VideoType = "welcome" | "announcement";
export type VideoStatus = "active" | "inactive";

export interface AdminVideo {
  id: number;
  title: string;
  type: VideoType;
  videoUrl: string;
  status: VideoStatus;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  skipAfterSec: number;
  viewedAfterSec: number;
  viewedCount: number;
  skippedCount: number;
  createdAt: string;
}

export type AdminVideoPayload = {
  title: string;
  type: VideoType;
  videoUrl: string;
  status: VideoStatus;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  skipAfterSec: number;
  viewedAfterSec: number;
};

export const adminListVideos = async (): Promise<AdminVideo[]> => {
  const res = await apiClient.get("/admin/videos");
  return res.data?.data ?? [];
};

export const adminCreateVideo = async (payload: AdminVideoPayload): Promise<AdminVideo> => {
  const res = await apiClient.post("/admin/videos", payload);
  return res.data?.data;
};

export const adminUpdateVideo = async (
  id: number,
  payload: Partial<AdminVideoPayload>
): Promise<AdminVideo> => {
  const res = await apiClient.patch(`/admin/videos/${id}`, payload);
  return res.data?.data;
};

export const adminDeleteVideo = async (id: number): Promise<void> => {
  await apiClient.delete(`/admin/videos/${id}`);
};

/** Uploads an MP4/MOV/WebM (up to 50 MB) and returns its public URL. */
export const adminUploadVideo = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("video", file);
  const res = await apiClient.post("/admin/videos/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 5 * 60 * 1000,
  });
  return res.data?.data?.videoUrl;
};
