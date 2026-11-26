import { apiClient } from "../../axios";

export interface Biz360SearchRow {
  id: number;
  publicId?: string | null;
  name?: string | null;
  businessname?: string | null;
  city?: string | null;
  state?: string | null;
  createdAt?: string;
  ownerMobile?: string | null;
  ownerEmail?: string | null;
  subscriptionStatus?: string | null;
  plan?: string | null;
}

export interface Biz360Section {
  key: string;
  label: string;
  count: number | null;
}

export interface Biz360Overview {
  business: Record<string, any>;
  owner: { id: number; mobile?: string; email?: string; createdAt?: string } | null;
  subscription: Record<string, any> | null;
  sections: Biz360Section[];
}

export interface Biz360SectionData {
  rows: Record<string, any>[];
  total: number;
  columns: string[];
  unavailable?: boolean;
}

export const search360 = async (q: string) =>
  ((await apiClient.get("/admin/business-360/search", { params: { q } })).data?.items ??
    []) as Biz360SearchRow[];

export const getOverview360 = async (id: number) =>
  (await apiClient.get(`/admin/business-360/${id}`)).data as Biz360Overview;

export const getSection360 = async (id: number, key: string, limit = 25, offset = 0) =>
  (
    await apiClient.get(`/admin/business-360/${id}/section/${key}`, {
      params: { limit, offset },
    })
  ).data as Biz360SectionData;

export const unlockLogin = async (businessId: number) =>
  (await apiClient.post(`/admin/business-360/${businessId}/unlock-login`)).data as {
    success: boolean;
    message: string;
  };

export const extendTrial =async (businessId: number, additionalDays: number) =>
  (
    await apiClient.patch(`/admin/support/subscriptions/${businessId}/extend-trial`, {
      additionalDays,
    })
  ).data;
