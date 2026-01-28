import { apiClient } from "../../axios";

export type TemplateSourceType = "PUBLIC" | "INTERNAL";

export interface AdminTemplateImage {
  id: number;
  title: string;
  image_url: string;
  source_type: TemplateSourceType;
  festival_category: string | null;
  business_category_id: number;
  usage_count: number;
  fallback_image_id: number | null;
  is_active: boolean;
}

export interface AdminTemplateImagesListResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  items: AdminTemplateImage[];
}

export const adminListTemplateImages = async (params?: {
  business_category_id?: number;
  active?: "true" | "false";
  source_type?: "PUBLIC" | "INTERNAL" | "ALL";
  include_business_internal?: "true" | "false";
  limit?: number;
  offset?: number;
}): Promise<AdminTemplateImagesListResponse> => {
  const res = await apiClient.get("/admin/template-images", { params });
  return res.data;
};

export const adminGetTemplateImageById = async (id: number): Promise<any> => {
  const res = await apiClient.get(`/admin/template-images/${id}`);
  return res.data;
};

export const adminCreateTemplateImage = async (payload: {
  title: string;
  image_url: string;
  source_type: TemplateSourceType;
  festival_category?: string | null;
  business_category_id: number;
  business_id?: number | null;
  fallback_image_id?: number | null;
  is_active?: boolean;
}): Promise<any> => {
  const res = await apiClient.post("/admin/template-images", payload);
  return res.data;
};

export const adminUpdateTemplateImage = async (
  id: number,
  payload: Partial<{
    title: string;
    image_url: string;
    source_type: TemplateSourceType;
    festival_category: string | null;
    business_category_id: number;
    business_id: number | null;
    fallback_image_id: number | null;
    is_active: boolean;
  }>
): Promise<any> => {
  const res = await apiClient.put(`/admin/template-images/${id}`, payload);
  return res.data;
};

export const adminDeactivateTemplateImage = async (id: number): Promise<any> => {
  const res = await apiClient.delete(`/admin/template-images/${id}/deactivate`);
  return res.data;
};
