import { apiClient } from "../../axios";

export interface AppLanguage {
  code: string;
  name: string;
  nativeName: string | null;
  isActive: boolean;
  sortOrder: number;
  videoCount: number;
}

export interface AppAddon {
  id: number;
  key: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  videoCount: number;
}

export type VideoSource = "url" | "upload";

export interface AddonVideo {
  id: number;
  addonId: number;
  addonKey: string;
  addonName: string;
  languageCode: string;
  languageName: string | null;
  title: string | null;
  videoUrl: string;
  source: VideoSource;
  sortOrder: number;
  isActive: boolean;
}

export type AddonVideoPayload = {
  addonId: number;
  languageCode: string;
  title: string | null;
  videoUrl: string;
  source: VideoSource;
  sortOrder: number;
  isActive: boolean;
};

export interface TutorialLink {
  languageCode: string;
  languageName: string | null;
  url: string;
  isActive: boolean;
}

const base = "/admin/content";

// ---- languages
export const listLanguages = async (): Promise<AppLanguage[]> =>
  (await apiClient.get(`${base}/languages`)).data?.data ?? [];

export const createLanguage = async (p: {
  code: string;
  name: string;
  nativeName: string | null;
  isActive: boolean;
  sortOrder: number;
}) => (await apiClient.post(`${base}/languages`, p)).data?.data as AppLanguage;

export const updateLanguage = async (code: string, p: Partial<Omit<AppLanguage, "code" | "videoCount">>) =>
  (await apiClient.patch(`${base}/languages/${code}`, p)).data?.data as AppLanguage;

export const deleteLanguage = async (code: string) => {
  await apiClient.delete(`${base}/languages/${code}`);
};

// ---- add-ons
export const listAddons = async (): Promise<AppAddon[]> =>
  (await apiClient.get(`${base}/addons`)).data?.data ?? [];

export const createAddon = async (p: {
  key: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}) => (await apiClient.post(`${base}/addons`, p)).data?.data as AppAddon;

export const updateAddon = async (id: number, p: Partial<Pick<AppAddon, "name" | "isActive" | "sortOrder">>) =>
  (await apiClient.patch(`${base}/addons/${id}`, p)).data?.data as AppAddon;

export const deleteAddon = async (id: number) => {
  await apiClient.delete(`${base}/addons/${id}`);
};

// ---- add-on videos
export const listAddonVideos = async (): Promise<AddonVideo[]> =>
  (await apiClient.get(`${base}/addon-videos`)).data?.data ?? [];

export const createAddonVideo = async (p: AddonVideoPayload) =>
  (await apiClient.post(`${base}/addon-videos`, p)).data?.data as AddonVideo;

export const updateAddonVideo = async (id: number, p: Partial<AddonVideoPayload>) =>
  (await apiClient.patch(`${base}/addon-videos/${id}`, p)).data?.data as AddonVideo;

export const deleteAddonVideo = async (id: number) => {
  await apiClient.delete(`${base}/addon-videos/${id}`);
};

/** Uploads an MP4/MOV/WebM (up to 50 MB) and returns its public URL. */
export const uploadAddonVideo = async (file: File): Promise<string> => {
  const fd = new FormData();
  fd.append("video", file);
  const res = await apiClient.post(`${base}/upload`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 5 * 60 * 1000,
  });
  return res.data?.data?.videoUrl;
};

// ---- tutorial links
export const listTutorialLinks = async (): Promise<TutorialLink[]> =>
  (await apiClient.get(`${base}/tutorial`)).data?.data ?? [];

export const saveTutorialLink = async (languageCode: string, p: { url: string; isActive: boolean }) =>
  (await apiClient.put(`${base}/tutorial/${languageCode}`, p)).data?.data as TutorialLink;

export const deleteTutorialLink = async (languageCode: string) => {
  await apiClient.delete(`${base}/tutorial/${languageCode}`);
};
