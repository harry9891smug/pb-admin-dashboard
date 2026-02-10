import { apiClient } from "./axios";
import { setAuthToken, clearAuth, getAuthToken } from "./auth";
import { toastSuccess, toastError, toastLoading, toastPromise } from "./toast";

export * from "./api/admin/rbac";
export * from "./api/admin/jobRole";
export * from "./api/admin/team";
export * from "./api/admin/templateImages";
export * from "./api/admin/sms";
export * from "./api/admin/subscriptions";

const unwrapList = <T = any>(res: any): T[] => {
  // Supports: res.data.items, res.data.data, res.data.data.items
  const list =
    res?.data?.items ??
    res?.data?.data?.items ??
    res?.data?.data ??
    [];
  return Array.isArray(list) ? list : [];
};

const unwrapObj = <T = any>(res: any): T => {
  return (res?.data?.data ?? res?.data ?? {}) as T;
};


export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  mobile: string;
  role: string;
}

export interface BusinessOwner {
  id: number;
  mobile: string;
  role: string;
}

export interface BusinessSubscription {
  id: number;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface Business {
  id: number;
  ownerUserId?: number | null;

  name: string;
  businessname: string;
  category: string;

  address: string;
  address1?: string | null;

  state?: string | null;
  city?: string | null;
  pincode?: string | null;

  gstNumber?: string | null;
  businessTagline?: string | null;

  logoUrl?: string | null;

  preferredLanguage?: "en" | "hi" | "mr" | string;

  owner?: BusinessOwner | null;
  subscription?: BusinessSubscription | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}


export interface BusinessesSummary {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

export interface BusinessesResponse {
  summary: BusinessesSummary;
  items: Business[];
  limit: number;
  offset: number;
  totalFiltered: number;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CreateOfferInput {
  title: string;
  message: string;
  discountType: "percent" | "flat" | "bxy" | "dateRange";
  discountValue?: number;
  bxyX?: number;
  bxyY?: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  imageUrl?: string | null;
}

export interface AdminPlan {
  id: number;
  name: string;
  description: string | null;
  type: "trial" | "paid";
  price: number;
  smsLimit: number;
  offerLimit: number;
  durationDays: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface BusinessCategory {
  id: number;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Advertisement {
  id: number;
  offerName: string;
  description: string;
  tagLine: string;
  website?: string;
  contact: string;
  offerCategory: string;
  state: string;
  city: string;
  pincode: string;
  offerImageUrl: string | null;
  logoUrl: string | null;
  status: "active" | "inactive";
  startDate: string;
  endDate: string;
  clicked: number;
}


export const adminLogin = async (input: AdminLoginInput): Promise<{ success: boolean; user: User }> => {
  try {
    console.log("🔐 Attempting login with:", { email: input.email });
    
    const res = await apiClient.post<LoginResponse>("/admin/login", input);
    
    const { accessToken, refreshToken, user } = res.data;
    
    setAuthToken(accessToken);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('pb_admin_refresh_token', refreshToken);
      localStorage.setItem('pb_admin_user', JSON.stringify(user));
    }
    
    console.log("✅ Login successful for user:", user.email);
    return { success: true, user };
  } catch (error: any) {
    console.error("❌ Admin login error:", error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data?.error?.message || "Invalid request format");
        case 401:
          throw new Error(data?.error?.message || "Invalid email or password");
        case 403:
          throw new Error("Access denied. You don't have permission.");
        case 404:
          throw new Error("Login endpoint not found. Please check API URL.");
        case 500:
          throw new Error("Server error. Please try again later.");
        default:
          throw new Error(data?.error?.message || `Login failed (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
};

export const getBusinesses = async (params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<BusinessesResponse> => {
  try {
    console.log("📊 Fetching businesses with params:", params);
    
    if (!getAuthToken()) {
      throw new Error("Authentication required. Please login again.");
    }
    
    const res = await apiClient.get<BusinessesResponse>("/admin/businesses", { params });
    
    console.log("✅ Businesses fetched successfully, count:", res.data.items.length);
    return res.data;
  } catch (error: any) {
    console.error("❌ Get businesses error:", error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          clearAuth(); // Clear tokens on 401
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Businesses endpoint not found.");
        case 500:
          throw new Error("Server error while fetching businesses.");
        default:
          throw new Error(data?.error?.message || `Failed to fetch businesses (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else if (error.message === "Authentication required. Please login again.") {
      throw error; 
    } else {
      throw new Error("Failed to fetch businesses. Please try again.");
    }
  }
};


export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const userStr = localStorage.getItem('pb_admin_user');
    if (!userStr) return null;
    
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error("❌ Error parsing user from localStorage:", error);
    return null;
  }
};


export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const token = getAuthToken();
  const user = localStorage.getItem('pb_admin_user');
  return !!(token && user);
};

export const adminLogout = (): void => {
  console.log("👋 Logging out user");

  clearAuth();
  if (typeof window !== "undefined") {
    localStorage.removeItem("pb_admin_refresh_token");
    localStorage.removeItem("pb_admin_user");
    window.location.href = "/login"; // ✅ redirect
  }

  console.log("✅ User logged out successfully");
};


export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  }
};

export const validateSession = (): boolean => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    return false;
  }
  
  try {
    const parts = token.split('.');
    return parts.length === 3; 
  } catch {
    return false;
  }
};

export const clearAllAuthData = (): void => {
  clearAuth();
  adminLogout();
};

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  if (!token) return {};
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export interface OfferBusiness {
  id: number;
  name: string;
}

export interface ApiOffer {
  id: number;
  title: string;
  message: string;
  status: "draft" | "active" | "expired" | "inactive";
  discountType: "percent" | "flat" | "bxy" | "dateRange";
  discountValue: string | null;
  bxyX: number | null;
  bxyY: number | null;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  business: OfferBusiness;
  createdAt: string;
}

export interface OffersResponse {
  items: ApiOffer[];
  total: number;
  limit: number;
  offset: number;
}

export const getOffers = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<OffersResponse> => {
  try {
    console.log("📋 [API] Fetching offers with params:", params);
    
    const token = getAuthToken();
    if (!token) {
      console.error("❌ [API] No auth token found");
      throw new Error("Authentication required. Please login again.");
    }
    
    console.log("📋 [API] Making request to /admin/offers with token:", token.substring(0, 20) + "...");
    
    const res = await apiClient.get<OffersResponse>("/admin/offers", { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("✅ [API] Offers fetched successfully, count:", res.data.items.length);
    console.log("📊 [API] Response data:", JSON.stringify(res.data, null, 2));
    
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get offers error:", error);
    console.error("❌ [API] Error response:", error.response?.data);
    console.error("❌ [API] Error status:", error.response?.status);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Offers endpoint not found.");
        default:
          throw new Error(data?.error?.message || `Failed to fetch offers (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to fetch offers. Please try again.");
    }
  }
};

export const getOfferById = async (id: number): Promise<ApiOffer> => {
  try {
    const res = await apiClient.get<ApiOffer>(`/admin/offers/${id}`);
    return res.data;
  } catch (error: any) {
    console.error("Get offer error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to fetch offer");
  }
};

export const updateOfferStatus = async (id: number, status: string): Promise<any> => {
  try {
    const endpoint = status === "inactive" 
      ? `/admin/offers/change-status/${id}/deactivate`
      : `/admin/offers/update/${id}`;
    
    const res = await apiClient.patch(endpoint, { status });
    return res.data;
  } catch (error: any) {
    console.error("Update offer status error:", error);
    throw new Error(error.response?.data?.error?.message || "Failed to update offer status");
  }
};


export const approveOffer = async (offerId: number): Promise<any> => {
  try {
    console.log(`✅ Approving offer ${offerId}...`);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }
    
    const res = await apiClient.patch(
      `/admin/offers/${offerId}/moderate`,
      { action: "approve" },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Offer ${offerId} approved successfully`);
    return res.data;
  } catch (error: any) {
    console.error(`❌ Approve offer error for ID ${offerId}:`, error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Offer not found.");
        default:
          throw new Error(data?.error?.message || `Failed to approve offer (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to approve offer. Please try again.");
    }
  }
};


export const getOffersWithFallback = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<OffersResponse> => {
  try {
    console.log("📋 [API] Fetching offers with params:", params);
    
    const token = getAuthToken();
    if (!token) {
      console.error("❌ [API] No auth token found");
      throw new Error("Authentication required. Please login again.");
    }
    
    console.log("📋 [API] Making request to /admin/offers with token:", token.substring(0, 20) + "...");
    
    const res = await apiClient.get<OffersResponse>("/admin/offers", { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("✅ [API] Offers fetched successfully, count:", res.data.items.length);
    console.log("📊 [API] Response data:", JSON.stringify(res.data, null, 2));
    
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get offers error, returning mock data for testing:", error);
    
    // ✅ Temporary mock data for testing
    const mockOffers: ApiOffer[] = [
      {
        id: 1,
        title: "Test Summer Sale",
        message: "Get 50% off on all items",
        status: "draft",
        discountType: "percent",
        discountValue: "50",
        bxyX: null,
        bxyY: null,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        imageUrl: null,
        business: {
          id: 1,
          name: "Test Business 1"
        },
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: 2,
        title: "Winter Discount",
        message: "Flat ₹1000 off on purchases above ₹5000",
        status: "active",
        discountType: "flat",
        discountValue: "1000",
        bxyX: null,
        bxyY: null,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        imageUrl: null,
        business: {
          id: 2,
          name: "Test Business 2"
        },
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        id: 3,
        title: "Buy 2 Get 1 Free",
        message: "Buy any 2 items and get 1 free",
        status: "active",
        discountType: "bxy",
        discountValue: null,
        bxyX: 2,
        bxyY: 1,
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        imageUrl: null,
        business: {
          id: 3,
          name: "Test Business 3"
        },
        createdAt: "2025-01-01T00:00:00.000Z"
      }
    ];
    
    return {
      items: mockOffers,
      total: mockOffers.length,
      limit: params?.limit || 50,
      offset: params?.offset || 0
    };
  }
};

export const rejectOffer = async (offerId: number, reason?: string): Promise<any> => {
  try {
    console.log(`❌ Rejecting offer ${offerId}...`);
    
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }
    
    // ✅ ACTION CHANGE: "disapprove" use karo, "reject" nahi
    const res = await apiClient.patch(
      `/admin/offers/${offerId}/moderate`,
      { 
        action: "disapprove", // ✅ Yeh change karo
        reason 
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Offer ${offerId} rejected successfully`);
    return res.data;
  } catch (error: any) {
    console.error(`❌ Reject offer error for ID ${offerId}:`, error);
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Offer not found.");
        default:
          throw new Error(data?.error?.message || `Failed to reject offer (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to reject offer. Please try again.");
    }
  }
};


export const createOffer = async (businessId: number, input: CreateOfferInput) => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const payload: any = {
    title: input.title,
    message: input.message,
    startDate: input.startDate, // "YYYY-MM-DD"
    endDate: input.endDate,
    imageUrl: input.imageUrl ?? null,
  };

  if (input.discountType === "percent" || input.discountType === "flat") {
    payload.discount = { type: input.discountType, value: input.discountValue };
  } else if (input.discountType === "bxy") {
    payload.discount = { type: "bxy", x: input.bxyX, y: input.bxyY };
  } else {
    payload.discount = { type: "dateRange" };
  }

  return apiClient.post("/offer/create", payload, {
    headers: { Authorization: `Bearer ${token}` },
    params: { businessId }, // ✅ query param
  });
};


// =====================
// Plans API (FIXED)
// =====================

export type PlanStatus = "active" | "inactive";
export type BillingType = "one_time" | "recurring";
export type BillingCycle = "monthly" | "yearly" | "weekly" | "daily";

const ensureToken = () => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");
  return token;
};

const extractApiError = (err: any) => {
  const data = err?.response?.data;
  const msg =
    data?.error?.message ||
    data?.message ||
    err?.message ||
    "Request failed";

  // fieldErrors ko readable bana do
  const fieldErrors = data?.error?.details?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const lines = Object.entries(fieldErrors)
      .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v.join(", ") : String(v))}`)
      .join(" | ");
    return `${msg} (${lines})`;
  }
  return msg;
};

const normalizeBillingType = (v: any): BillingType => {
  const x = String(v ?? "").toLowerCase().trim();

  if (x === "one_time" || x === "onetime" || x === "one-time") return "one_time";
  if (x === "recurring" || x === "subscription") return "recurring";

  // old UI mapping (safe defaults)
  if (x === "paid") return "recurring";
  if (x === "trial") return "one_time";

  return "recurring";
};

const normalizeBillingCycle = (v: any): BillingCycle => {
  const x = String(v ?? "").toLowerCase().trim();
  if (x === "monthly" || x === "month") return "monthly";
  if (x === "yearly" || x === "annual" || x === "year") return "yearly";
  if (x === "weekly" || x === "week") return "weekly";
  if (x === "daily" || x === "day") return "daily";
  return "monthly";
};

const toNumber = (v: any, fallback?: number) => {
  if (v === null || v === undefined || v === "") return fallback as any;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback as any;
};

const requiredNumber = (v: any, field: string) => {
  const n = toNumber(v, NaN);
  if (!Number.isFinite(n)) throw new Error(`${field} is required and must be a number`);
  return n;
};

// ✅ List plans (always returns array)
export const getPlans = async (): Promise<any[]> => {
  const token = ensureToken();

  try {
    const res = await apiClient.get("/admin/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // API can be: {success:true, data:[...]} OR {items:[...]} OR direct array
    const list = res?.data?.data ?? res?.data?.items ?? res?.data;
    return Array.isArray(list) ? list : [];
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ✅ Create plan (force correct schema)
export const createPlan = async (payload: any) => {
  const token = ensureToken();

  try {
    const billingType = normalizeBillingType(payload?.billingType ?? payload?.type);

    const body: any = {
      name: String(payload?.name ?? "").trim(),
      status: (payload?.status ?? "active") as PlanStatus,
      description: payload?.description ?? null,

      billingType,
      billingCycle: billingType === "recurring"
        ? normalizeBillingCycle(payload?.billingCycle)
        : undefined,

      amount: requiredNumber(payload?.amount ?? payload?.price, "amount"),

      discountAmount: toNumber(payload?.discountAmount, 0),
      smsLimit: toNumber(payload?.smsLimit, 0),
      offerLimit: toNumber(payload?.offerLimit, 0),

      isPopular: !!payload?.isPopular,
      sortOrder: toNumber(payload?.sortOrder, 0),

      features: Array.isArray(payload?.features) ? payload.features : [],

      allowTopups: !!payload?.allowTopups,
      topupOptions: Array.isArray(payload?.topupOptions) ? payload.topupOptions : [],
    };

    if (!body.name) throw new Error("name is required");

    // backend ko one_time me billingCycle nahi chahiye hota, clean kar do
    if (body.billingType === "one_time") delete body.billingCycle;

    const res = await apiClient.post("/admin/plans", body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ✅ Update plan (normalize + prevent null amount)
export const updatePlan = async (id: number, payload: any) => {
  const token = ensureToken();

  try {
    const body: any = {};

    if (payload?.name !== undefined) body.name = String(payload.name).trim();
    if (payload?.status !== undefined) body.status = payload.status;
    if (payload?.description !== undefined) body.description = payload.description ?? null;

    // billingType normalize if present
    if (payload?.billingType !== undefined || payload?.type !== undefined) {
      body.billingType = normalizeBillingType(payload?.billingType ?? payload?.type);
    }

    // billingCycle only valid when recurring
    if (payload?.billingCycle !== undefined) {
      body.billingCycle = normalizeBillingCycle(payload.billingCycle);
    }

    // IMPORTANT: amount only send if provided AND valid number (never null)
    if (payload?.amount !== undefined || payload?.price !== undefined) {
      body.amount = requiredNumber(payload?.amount ?? payload?.price, "amount");
    }

    if (payload?.discountAmount !== undefined) body.discountAmount = toNumber(payload.discountAmount, 0);
    if (payload?.smsLimit !== undefined) body.smsLimit = toNumber(payload.smsLimit, 0);
    if (payload?.offerLimit !== undefined) body.offerLimit = toNumber(payload.offerLimit, 0);

    if (payload?.isPopular !== undefined) body.isPopular = !!payload.isPopular;
    if (payload?.sortOrder !== undefined) body.sortOrder = toNumber(payload.sortOrder, 0);

    if (payload?.features !== undefined) body.features = Array.isArray(payload.features) ? payload.features : [];
    if (payload?.allowTopups !== undefined) body.allowTopups = !!payload.allowTopups;
    if (payload?.topupOptions !== undefined) body.topupOptions = Array.isArray(payload.topupOptions) ? payload.topupOptions : [];

    // clean: if one_time, billingCycle remove
    if (body.billingType === "one_time") delete body.billingCycle;

    const res = await apiClient.patch(`/admin/plans/${id}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};

// ✅ Delete plan
export const deletePlan = async (id: number) => {
  const token = ensureToken();
  try {
    const res = await apiClient.delete(`/admin/plans/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err: any) {
    throw new Error(extractApiError(err));
  }
};


export const getBusinessCategoriesAdmin = async (): Promise<BusinessCategory[]> => {
  const token = getAuthToken();
  const res = await apiClient.get("/admin/business-categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
      return unwrapList<BusinessCategory>(res); 
};

export const createBusinessCategory = async (name: string) => {
  const token = getAuthToken();
  return apiClient.post(
    "/admin/business-categories",
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
};

export const updateBusinessCategory = async (
  id: number,
  payload: Partial<BusinessCategory>
) => {
  const token = getAuthToken();
  return apiClient.patch(`/admin/business-categories/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteBusinessCategory = async (id: number) => {
  const token = getAuthToken();
  return apiClient.delete(`/admin/business-categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getBusinessCategoriesUser = async (): Promise<BusinessCategory[]> => {
  const token = getAuthToken();
  const res = await apiClient.get("/business-categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.items;
};


export const getAdvertisements = async (): Promise<Advertisement[]> => {
  const token = getAuthToken();
  const res = await apiClient.get("/admin/ads", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const rows = res.data.data;

  // ✅ Convert backend keys -> frontend keys
  return rows.map((r: any) => ({
    id: r.id,
    offerName: r.offerName ?? "",
    description: r.offerDescription ?? "",     // ✅
    tagLine: r.tagLine ?? "",
    website: r.website ?? "",
    contact: r.contact ?? "",
    offerCategory: r.offerCategory ?? "",
    state: r.offerState ?? "",                  // ✅
    city: r.offerCity ?? "",                    // ✅
    pincode: r.offerPin ?? "",                  // ✅
    offerImageUrl: r.offerImageUrl ?? null,
    logoUrl: r.logoUrl ?? null,
    status: r.offerStatus ?? "inactive",        // ✅
    startDate: r.offerStart ?? "",              // ✅
    endDate: r.offerEnding ?? "",               // ✅
    clicked: r.offerClicked ?? 0,               // ✅
  }));
};


export const createAdvertisement = async (payload: Partial<Advertisement>) => {
  const token = getAuthToken();

  // ✅ map frontend -> backend keys
  const body = {
    offerName: payload.offerName,
    offerDescription: payload.description, // ✅
    tagLine: payload.tagLine,
    website: payload.website,
    contact: payload.contact,
    offerCategory: payload.offerCategory,

    offerState: payload.state,   // ✅
    offerCity: payload.city,     // ✅
    offerPin: payload.pincode,   // ✅

    offerStatus: payload.status, // ✅

    offerStart: typeof payload.startDate === "string"
      ? new Date(payload.startDate).toISOString()
      : payload.startDate, // in case already ISO
    offerEnding: typeof payload.endDate === "string"
      ? new Date(payload.endDate).toISOString()
      : payload.endDate,

    offerImageUrl: payload.offerImageUrl ?? null,
    logoUrl: payload.logoUrl ?? null,
  };

  return apiClient.post("/admin/ads", body, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const updateAdvertisement = async (
  id: number,
  payload: Partial<Advertisement>
) => {
  const token = getAuthToken();

  const body = {
    offerName: payload.offerName,
    offerDescription: payload.description,
    tagLine: payload.tagLine,
    website: payload.website,
    contact: payload.contact,
    offerCategory: payload.offerCategory,

    offerState: payload.state,
    offerCity: payload.city,
    offerPin: payload.pincode,

    offerStatus: payload.status,

    offerStart: typeof payload.startDate === "string"
      ? new Date(payload.startDate).toISOString()
      : payload.startDate,
    offerEnding: typeof payload.endDate === "string"
      ? new Date(payload.endDate).toISOString()
      : payload.endDate,

    offerImageUrl: payload.offerImageUrl ?? null,
    logoUrl: payload.logoUrl ?? null,
  };

  return apiClient.patch(`/admin/ads/${id}`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteAdvertisement = async (id: number) => {
  const token = getAuthToken();
  return apiClient.delete(`/admin/ads/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


export const uploadAdImage = async (file: File) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("image", file);

  return apiClient.post("/admin/ads/offer-image", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadAdLogo = async (file: File) => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append("image", file);

  return apiClient.post("/admin/ads/logo", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadOfferImage = async (businessId: number, file: File) => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");
  if (!businessId) throw new Error("businessId required");

  const fd = new FormData();
  fd.append("image", file);

  const res = await apiClient.post("/offer/upload/offer-image", fd, {
    headers: { Authorization: `Bearer ${token}` },
    params: { businessId }, // ✅ REQUIRED for supportAdmin
  });

  return res.data?.data?.url; // ✅ correct
};

// export const getAdminInvoices = async (params: {
//   businessId: number;   // ✅ required
//   limit?: number;
//   offset?: number;
// }) => {
//   const token = getAuthToken();
//   if (!token) throw new Error("Auth required");

//   const res = await apiClient.get("/admin/invoices", {
//     headers: { Authorization: `Bearer ${token}` },
//     params,
//   });

//   return res.data; 
// };


export interface AdminCreateUserInput {
  mobile: string;
  role: "businessOwner" | "businessAdmin" | "supportAdmin";
  email?: string;
}

export interface AdminUser {
  id: number;
  mobile: string;
  role: string;
  email: string | null;
  isPhoneVerified: boolean;
  createdAt: string;
}

export const createAdminUser = async (
  input: AdminCreateUserInput
): Promise<AdminUser> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post("/admin-user/users", input, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.user;
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get("/admin-user/users", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.items ?? res.data.data ?? res.data;
};


export const updateAdminUser = async (
  userId: number,
  payload: {
    mobile?: string;
    isPhoneVerified?: boolean;
  }
): Promise<AdminUser> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(`/admin-user/users/${userId}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data.user ?? res.data;
};

export const deleteAdminUser = async (
  userId: number,
  deleteBusiness = false
) => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.delete(`/admin-user/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { deleteBusiness },
  });

  return res.data;
};

export interface CreateBusinessInput {
  ownerUserId: number;
  name: string;
  businessname: string;
  category: string;
  address: string;
  address1?: string;
  state: string;
  city: string;
  pincode: string;
  gstNumber?: string;
  businessTagline?: string;
  logoUrl?: string | null;
  preferredLanguage?: string;
}

export const createBusinessAdmin = async (
  payload: CreateBusinessInput
): Promise<Business> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post("/admin-business/businesses", payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};


export const updateBusinessAdmin = async (
  businessId: number,
  payload: {
    name?: string;
    businessname?: string;
    category?: string;
    address?: string;
    address1?: string;
    state?: string;
    city?: string;
    pincode?: string;
    gstNumber?: string;
    businessTagline?: string;
    logoUrl?: string | null;
    preferredLanguage?: string;
  }
) => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(
    `/admin-business/businesses/${businessId}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data;
};


export const uploadBusinessLogo = async (file: File, businessId?: number): Promise<string> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  console.log("📤 Uploading business logo...", { businessId });

  const formData = new FormData();
  formData.append("image", file);

  const params: any = {};
  if (businessId) {
    params.businessId = businessId;
  }

  const res = await apiClient.post(
    "/admin-business/upload-logo",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params, 
    }
  );

  console.log("✅ Logo upload response:", res.data);
  
  if (res.data?.success && res.data?.data?.logoUrl) {
    return res.data.data.logoUrl;
  }
  
  if (res.data?.data?.url) {
    return res.data.data.url;
  }
  
  if (res.data?.url) {
    return res.data.url;
  }
  
  throw new Error("No logo URL in response: " + JSON.stringify(res.data));
};

export const getBusinessAdminById = async (id: number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get(`/admin-business/businesses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log("API Response:", res.data);
  
  if (res.data && res.data.business) {
    return {
      ...res.data.business,
      owner: res.data.owner
    };
  }
  
  throw new Error("Invalid response structure");
};



// ✅ GET OFFER BY ID (ADMIN)
export const getAdminOfferById = async (id: number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get(`/admin/offers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data?.data || res.data;
};

// ✅ UPDATE OFFER (ADMIN)
export const updateAdminOffer = async (id: number, payload: any): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(`/admin/offers/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ DELETE OFFER (ADMIN)
export const deleteAdminOffer = async (id: number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.delete(`/admin/offers/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ CHANGE OFFER STATUS (ADMIN)
export const changeAdminOfferStatus = async (id: number, status: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(`/admin/offers/${id}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};
// ✅ INVOICE TYPES
export interface InvoiceItem {
  id?: number;
  name: string;
  price: number;
  qty: number;
}

export interface Invoice {
  id: number;
  businessId: number;
  invoiceNumber: string;
  customerMobile: string;
  customerName: string | null;
  customerCompany: string | null;
  customerGst: string | null;
  customerAddress: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  notes: string | null;
  createdAt: string;
  items?: InvoiceItem[];
  business?: Business;
  smsLogs?: any[];
}

export interface CreateInvoiceData {
  businessId: number;
  customerMobile: string;
  customerName?: string;
  customerCompany?: string;
  customerGst?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  notes?: string;
  discountAmount?: number;
  paidAmount?: number;
  sendSms?: boolean;
  includeAmountInSms?: boolean;
}

export interface UpdateInvoiceData {
  customerName?: string | null;
  customerMobile?: string;
  customerCompany?: string | null;
  customerGst?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  paymentStatus?: "unpaid" | "partial" | "paid";
  paidAmount?: number;
}

export interface InvoiceFilters {
  businessId?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvoicesResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    stats: {
      totalInvoices: number;
      totalRevenue: number;
      totalCollected: number;
      pendingAmount: number;
    };
  };
}

// ✅ CREATE INVOICE (ADMIN)
export const createAdminInvoice = async (data: CreateInvoiceData): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post("/admin/invoices", data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ GET ALL INVOICES WITH FILTERS (ADMIN)
export const getAdminAllInvoices = async (filters?: InvoiceFilters): Promise<InvoicesResponse> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get("/admin/invoices/all", {
    headers: { Authorization: `Bearer ${token}` },
    params: filters,
  });

  return res.data;
};

// ✅ GET INVOICE BY ID (ADMIN)
export const getAdminInvoiceById = async (id: number): Promise<{ success: boolean; data: Invoice }> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get(`/admin/invoices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ UPDATE INVOICE (ADMIN)
export const updateAdminInvoice = async (id: number, payload: UpdateInvoiceData): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(`/admin/invoices/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ DELETE INVOICE (ADMIN)
export const deleteAdminInvoice = async (id: number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.delete(`/admin/invoices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ UPDATE INVOICE ITEMS (ADMIN)
export const updateAdminInvoiceItems = async (id: number, items: InvoiceItem[]): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.patch(`/admin/invoices/${id}/items`, { items }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ ADD PAYMENT (ADMIN)
export const addAdminInvoicePayment = async (id: number, amount: number, notes?: string): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post(`/admin/invoices/${id}/payment`, { amount, notes }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ RESEND INVOICE SMS (ADMIN)
export const resendAdminInvoiceSms = async (id: number): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post(`/admin/invoices/${id}/resend-sms`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ GET BUSINESS-SPECIFIC INVOICES (ADMIN - Legacy/Simple)
export const getAdminInvoices = async (params: {
  businessId: number;
  limit?: number;
  offset?: number;
}): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get("/admin/invoices", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });

  return res.data;
};

// ✅ SEND SMS FOR INVOICE (GENERAL)
export const sendInvoiceSms = async (invoiceId: number, includeAmountInSms: boolean = true): Promise<any> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.post(`/invoices/${invoiceId}/send`, {
    via: "sms",
    includeAmountInSms,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
};

// ✅ GENERATE WHATSAPP LINK FOR INVOICE
export const generateInvoiceWhatsAppLink = (invoiceNumber: string, totalAmount: number): string => {
  const text = `Invoice ${invoiceNumber}\nTotal Amount: ₹${totalAmount}\nView invoice: ${window.location.origin}/invoices/public/${invoiceNumber}`;
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/?text=${encodedText}`;
};

// ✅ GET PUBLIC INVOICE LINK
export const getPublicInvoiceLink = (invoiceNumber: string): string => {
  return `${window.location.origin}/invoices/public/${invoiceNumber}`;
};

// ✅ DOWNLOAD INVOICE AS PDF (Optional - agar aapke backend mein hai toh)
export const downloadInvoiceAsPDF = async (invoiceId: number): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error("Auth required");

  const res = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `invoice-${invoiceId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// =====================
// ADMIN SUBSCRIPTION TYPES
// =====================

export interface SubscriptionPlan {
  id: number;
  businessId: number;
  planId?: number | null;
  plan: "basic" | "standard" | "premium";
  status: "trial" | "active" | "cancelled";
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
  createdAt: string;
  updatedAt: string;
  business?: Business;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: "trial" | "active" | "cancelled";
  plan?: "basic" | "standard" | "premium";
  businessId?: number;
  userId?: number;
}

export interface SubscriptionResponse {
  success: boolean;
  data: {
    subscriptions: SubscriptionPlan[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface SingleSubscriptionResponse {
  success: boolean;
  data: {
    subscription: SubscriptionPlan;
  };
}

export interface BusinessSubscriptionsResponse {
  success: boolean;
  data: {
    business: Business;
    subscriptions: SubscriptionPlan[];
  };
}

export interface CreateSubscriptionInput {
  userId: number;
  plan: "basic" | "standard" | "premium";
  status?: "trial" | "active" | "cancelled";
  trialDays?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface UpdateSubscriptionInput {
  plan?: "basic" | "standard" | "premium";
  status?: "trial" | "active" | "cancelled";
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  nextRenewalAt?: string | null;
}

// =====================
// ADMIN SUBSCRIPTION API FUNCTIONS
// =====================

/**
 * Get all subscriptions with filters (Admin only)
 */
export const getAdminSubscriptions = async (
  filters?: SubscriptionFilters
): Promise<SubscriptionResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Fetching admin subscriptions with filters:", filters);

    const res = await apiClient.get<SubscriptionResponse>("/admin/subscriptions", {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });

    console.log("✅ [API] Admin subscriptions fetched successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get admin subscriptions error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to fetch subscriptions (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to fetch subscriptions. Please try again.");
    }
  }
};

/**
 * Get subscription by ID (Admin only)
 */
export const getAdminSubscriptionById = async (
  subscriptionId: number
): Promise<SingleSubscriptionResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Fetching subscription by ID:", subscriptionId);

    const res = await apiClient.get<SingleSubscriptionResponse>(
      `/admin/subscriptions/${subscriptionId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ [API] Subscription fetched successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get subscription by ID error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Subscription not found.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to fetch subscription (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to fetch subscription. Please try again.");
    }
  }
};

/**
 * Get all subscriptions for a business (Admin only)
 */
export const getAdminBusinessSubscriptions = async (
  businessId: number
): Promise<BusinessSubscriptionsResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Fetching subscriptions for business:", businessId);

    const res = await apiClient.get<BusinessSubscriptionsResponse>(
      `/admin/subscriptions/business/${businessId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ [API] Business subscriptions fetched successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get business subscriptions error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Business not found.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to fetch business subscriptions (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to fetch business subscriptions. Please try again.");
    }
  }
};

/**
 * Create subscription for a user (Admin only)
 */
export const createAdminSubscription = async (
  input: CreateSubscriptionInput
): Promise<SingleSubscriptionResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Creating subscription for user:", input.userId);

    const res = await apiClient.post<SingleSubscriptionResponse>(
      "/admin/subscriptions",
      input,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ [API] Subscription created successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Create subscription error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data?.error?.message || "Invalid request data");
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("User or business not found.");
        case 409:
          throw new Error("User already has an active subscription.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to create subscription (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to create subscription. Please try again.");
    }
  }
};

/**
 * Update subscription (Admin only)
 */
export const updateAdminSubscription = async (
  subscriptionId: number,
  input: UpdateSubscriptionInput
): Promise<SingleSubscriptionResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Updating subscription:", subscriptionId);

    const res = await apiClient.put<SingleSubscriptionResponse>(
      `/admin/subscriptions/${subscriptionId}`,
      input,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ [API] Subscription updated successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Update subscription error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data?.error?.message || "Invalid request data");
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Subscription not found.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to update subscription (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to update subscription. Please try again.");
    }
  }
};

/**
 * Cancel subscription (Admin only)
 */
export const cancelAdminSubscription = async (
  subscriptionId: number
): Promise<SingleSubscriptionResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Cancelling subscription:", subscriptionId);

    const res = await apiClient.delete<SingleSubscriptionResponse>(
      `/admin/subscriptions/${subscriptionId}/cancel`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ [API] Subscription cancelled successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Cancel subscription error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data?.error?.message || "Subscription already cancelled");
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Subscription not found.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to cancel subscription (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to cancel subscription. Please try again.");
    }
  }
};

/**
 * Get user's own subscription (Regular user)
 */
export const getUserSubscription = async (): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Fetching user subscription");

    const res = await apiClient.get("/subscriptions/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ [API] User subscription fetched successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get user subscription error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 404:
          throw new Error("No subscription found.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to fetch subscription (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to fetch subscription. Please try again.");
    }
  }
};

/**
 * Choose/upgrade subscription plan (Regular user)
 */
export const chooseSubscriptionPlan = async (
  planId: number
): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Authentication required. Please login again.");
    }

    console.log("📋 [API] Choosing subscription plan:", planId);

    const res = await apiClient.post(
      "/subscriptions/choose",
      { planId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ [API] Subscription plan chosen successfully");
    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Choose subscription plan error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data?.error?.message || "Invalid plan selection");
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        default:
          throw new Error(
            data?.error?.message ||
            `Failed to choose plan (Status: ${status})`
          );
      }
    } else if (error.request) {
      throw new Error("Network error. Cannot connect to server.");
    } else {
      throw new Error("Failed to choose plan. Please try again.");
    }
  }
};

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Format subscription status for display
 */
export const formatSubscriptionStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    trial: "Trial",
    active: "Active",
    cancelled: "Cancelled",
  };
  return statusMap[status] || status;
};

/**
 * Format subscription plan for display
 */
export const formatSubscriptionPlan = (plan: string): string => {
  const planMap: Record<string, string> = {
    basic: "Basic",
    standard: "Standard",
    premium: "Premium",
  };
  return planMap[plan] || plan;
};

/**
 * Check if subscription is active
 */
export const isSubscriptionActive = (subscription: SubscriptionPlan): boolean => {
  return subscription.status === "active" || subscription.status === "trial";
};

/**
 * Check if subscription is in trial
 */
export const isSubscriptionTrial = (subscription: SubscriptionPlan): boolean => {
  return subscription.status === "trial";
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = (subscription: SubscriptionPlan): number | null => {
  if (!subscription.trialEndsAt) return null;
  
  const trialEnd = new Date(subscription.trialEndsAt);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Get subscription benefits based on plan
 */
export const getSubscriptionBenefits = (plan: string) => {
  const benefits: Record<string, { offers: number; sms: number; features: string[] }> = {
    basic: {
      offers: 5,
      sms: 400,
      features: ["5 Active Offers", "400 SMS Credits", "Basic Support"],
    },
    standard: {
      offers: 10,
      sms: 600,
      features: ["10 Active Offers", "600 SMS Credits", "Priority Support", "Analytics"],
    },
    premium: {
      offers: 20,
      sms: 1000,
      features: ["20 Active Offers", "1000 SMS Credits", "24/7 Support", "Advanced Analytics", "Custom Features"],
    },
  };
  
  return benefits[plan] || benefits.basic;
};

// =====================
// EXPORT ALL SUBSCRIPTION FUNCTIONS
// =====================

export const subscriptionApi = {
  // Admin functions
  getAdminSubscriptions,
  getAdminSubscriptionById,
  getAdminBusinessSubscriptions,
  createAdminSubscription,
  updateAdminSubscription,
  cancelAdminSubscription,
  
  // User functions
  getUserSubscription,
  chooseSubscriptionPlan,
  
  // Helper functions
  formatSubscriptionStatus,
  formatSubscriptionPlan,
  isSubscriptionActive,
  isSubscriptionTrial,
  getTrialDaysRemaining,
  getSubscriptionBenefits,
};


// =====================
// ADMIN BILLING INVOICES TYPES
// =====================

export type BillingTaxType = "IGST" | "CGST_SGST" | string;

export interface AdminBillingInvoiceRow {
  id: number;
  businessId: number;
  subscriptionId: number | null;
  razorpayPaymentId?: string | null;
  invoiceNumber: string;
  financialYear?: string | null;
  seq?: number | null;
  invoiceDate?: string | null;
  currency?: string | null;

  taxableAmount?: string | number | null;
  cgstAmount?: string | number | null;
  sgstAmount?: string | number | null;
  igstAmount?: string | number | null;
  totalAmount?: string | number | null;

  buyerBusinessName?: string | null;
  buyerGst?: string | null;
  buyerState?: string | null;
  taxType?: BillingTaxType | null;
  createdAt?: string | null;

  business?: {
    id: number;
    businessname?: string | null;
    name?: string | null;
  };

  subscription?: {
    id: number;
    plan?: "basic" | "standard" | "premium" | string;
    status?: "trial" | "active" | "cancelled" | string;
  };
}

export interface AdminBillingInvoicesFilters {
  page?: number;
  limit?: number;
  q?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  // optional future:
  // plan?: "basic" | "standard" | "premium";
  // status?: "trial" | "active" | "cancelled";
}

export interface AdminBillingInvoicesResponse {
  success: boolean;
  data: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    invoices: AdminBillingInvoiceRow[];
  };
}

export interface AdminBillingInvoiceByIdResponse {
  success: boolean;
  data: AdminBillingInvoiceRow;
}

// =====================
// ADMIN BILLING INVOICES API FUNCTIONS
// =====================

export const getAdminBillingInvoices = async (
  filters?: AdminBillingInvoicesFilters
): Promise<AdminBillingInvoicesResponse> => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required. Please login again.");

    const res = await apiClient.get<AdminBillingInvoicesResponse>(
      "/admin/billing-invoices",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: filters,
      }
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get admin billing invoices error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        default:
          throw new Error(
            data?.error?.message || `Failed to fetch billing invoices (Status: ${status})`
          );
      }
    }
    if (error.request) throw new Error("Network error. Cannot connect to server.");
    throw new Error("Failed to fetch billing invoices. Please try again.");
  }
};

export const getAdminBillingInvoiceById = async (
  id: number
): Promise<AdminBillingInvoiceByIdResponse> => {
  try {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required. Please login again.");

    const res = await apiClient.get<AdminBillingInvoiceByIdResponse>(
      `/admin/billing-invoices/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data;
  } catch (error: any) {
    console.error("❌ [API] Get admin billing invoice by id error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          clearAuth();
          throw new Error("Session expired. Please login again.");
        case 403:
          throw new Error("Access denied. Admin privileges required.");
        case 404:
          throw new Error("Invoice not found.");
        default:
          throw new Error(
            data?.error?.message || `Failed to fetch invoice (Status: ${status})`
          );
      }
    }
    if (error.request) throw new Error("Network error. Cannot connect to server.");
    throw new Error("Failed to fetch invoice. Please try again.");
  }
};
