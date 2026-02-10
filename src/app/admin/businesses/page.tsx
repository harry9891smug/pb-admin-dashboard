"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MoreVertical } from "lucide-react";
import statesList from "@/data/states.json";

import {
  Search,
  Filter,
  Building2,
  MapPin,
  Eye,
  Edit,
  Trash2,
  User,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Plus,
  CheckCircle,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";

import {
  getBusinesses,
  type Business,
  type BusinessesResponse,
  createAdminUser,
  createBusinessAdmin,
  updateAdminUser,
  deleteAdminUser,
  uploadBusinessLogo,
  getBusinessCategoriesAdmin,
  BusinessCategory,
  updateBusinessAdmin,
  getBusinessAdminById,
} from "@/lib/api";

type CreateUserForm = {
  mobile: string;
  role: "businessOwner" | "businessAdmin" | "supportAdmin";
  email: string;
};

type CreateBusinessForm = {
  ownerUserId: number | null;
  name: string;
  businessname: string;
  category: number;
  address: string;
  address1: string;
  state: string;
  city: string;
  pincode: string;
  gstNumber: string;
  businessTagline: string;
  logoUrl: string | null;
  preferredLanguage: "en" | "hi" | "mr";
};

const emptyUserForm: CreateUserForm = {
  mobile: "",
  role: "businessOwner",
  email: "",
};


const emptyBusinessForm: CreateBusinessForm = {
  ownerUserId: null,
  name: "",
  businessname: "",
  category: 0,
  address: "",
  address1: "",
  state: "",
  city: "",
  pincode: "",
  gstNumber: "",
  businessTagline: "",
  logoUrl: null,
  preferredLanguage: "en",
};

// =========================
// ✅ CORRECTED LOGO UPLOAD COMPONENT
// =========================
function LogoUploadField({
  label = "Business Logo",
  currentLogoUrl,
  onLogoUploaded,
  disabled = false,
  uploading = false,
  businessId = null, // ✅ नया prop
}: {
  label?: string;
  currentLogoUrl?: string | null;
  onLogoUploaded: (url: string) => void;
  disabled?: boolean;
  uploading?: boolean;
  businessId?: number | null; // ✅ नया prop
}) {
  const [localUploading, setLocalUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current logo से preview set करें
  useEffect(() => {
    if (currentLogoUrl) {
      setPreviewUrl(currentLogoUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [currentLogoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Automatically upload
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setLocalUploading(true);
      
      let url: string;
      
      // ✅ Check if in edit mode (businessId is available)
      if (businessId) {
        // Edit mode - pass businessId
        url = await uploadBusinessLogo(file, businessId);
      } else {
        // Create mode - no businessId
        url = await uploadBusinessLogo(file);
      }
      
      if (url) {
        onLogoUploaded(url);
        toast.success("Logo uploaded successfully!");
      } else {
        toast.error("No URL returned from server");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Upload failed");
      // Remove preview on error
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      setLocalUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onLogoUploaded("");
    toast.success("Logo removed");
  };

  const isUploading = localUploading || uploading;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-300">
        {label}
      </label>

      {/* Logo Preview Area */}
      <div 
        className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/30 hover:border-slate-600 transition-colors min-h-[180px]"
        onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="text-center">
            <div className="relative inline-block">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="h-32 w-32 rounded-lg object-cover border-2 border-slate-700"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Click to change logo
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-1">No logo uploaded</p>
            <p className="text-xs text-slate-500">
              Click to upload logo (Max 5MB)
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading || disabled}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>

      {/* Upload Button (Alternative) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              isUploading || disabled
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {previewUrl ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </button>
          
          {previewUrl && !isUploading && !disabled && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Recommended: Square image, 400×400 pixels
        </p>
      </div>

      {/* Uploaded URL Display */}
      {currentLogoUrl && (
        <div className="mt-2">
          <p className="text-xs text-slate-400 mb-1">Logo URL:</p>
          <code className="text-xs text-emerald-300 break-all bg-slate-900/50 p-2 rounded block">
            {currentLogoUrl}
          </code>
        </div>
      )}
    </div>
  );
}


export default function BusinessesPage() {
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewBusiness, setViewBusiness] = useState<Business | null>(null);
  const [openActionForId, setOpenActionForId] = useState<number | null>(null);
  const [editBizOpen, setEditBizOpen] = useState(false);
  const [editBizSaving, setEditBizSaving] = useState(false);
  const [editBizId, setEditBizId] = useState<number | null>(null);
  const [editBizForm, setEditBizForm] = useState<CreateBusinessForm>({ ...emptyBusinessForm });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, inactive: 0 });
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [userForm, setUserForm] = useState<CreateUserForm>({ ...emptyUserForm });
  const [businessForm, setBusinessForm] = useState<CreateBusinessForm>({ ...emptyBusinessForm });
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUserSaving, setEditUserSaving] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [editUserMobile, setEditUserMobile] = useState("");
  const [editUserVerified, setEditUserVerified] = useState(false);
const stateOptions = useMemo(() => {
  return (statesList as any[])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => ({ value: s.name, label: s.name })); 
  // ✅ value = state name (simple)
}, []);
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;
      params.limit = 50;

      const data: BusinessesResponse = await getBusinesses(params);
      setBusinesses(data.items);
      setStats(data.summary);
    } catch (err: any) {
      setError(err.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const openView = async (b: Business) => {
    try {
      setViewOpen(true);
      setViewLoading(true);
      setViewBusiness(b);
      const fullDetails = await getBusinessAdminById(b.id);
      console.log("Full business details:", fullDetails);
      
      setViewBusiness(fullDetails);
      
    } catch (e: any) {
      console.error("Error loading business details:", e);
      toast.error(e?.message || "Failed to load business details");
    } finally {
      setViewLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const list = await getBusinessCategoriesAdmin();
      setCategories(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBusinesses();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (business: Business) => {
    const status = business.subscription?.status;

    const statusConfig: any = {
      active: { class: "bg-emerald-500/20 text-black-300 border-emerald-500/40", label: "Active" },
      grace: { class: "bg-blue-500/20 text-black-300 border-blue-500/40", label: "Grace" },
      trial: { class: "bg-yellow-500/20 text-black-300 border-yellow-500/40", label: "Trial" },
      cancelled: { class: "bg-red-500/20 text-black-300 border-red-500/40", label: "Cancelled" },
      failedPayment: { class: "bg-orange-500/20 text-black-300 border-orange-500/40", label: "Payment Failed" },
    };

    const config = statusConfig[status || "trial"] || statusConfig.trial;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getPlanBadge = (plan: string | undefined) => {
    const planConfig: any = {
      basic: { class: "bg-slate-500/20 text-slate-300 border-slate-500/40", label: "Basic" },
      pro: { class: "bg-purple-500/20 text-purple-300 border-purple-500/40", label: "Pro" },
      enterprise: { class: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", label: "Enterprise" },
    };

    const config = planConfig[plan || "basic"] || planConfig.basic;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewBusiness(null);
  };

  const toggleActions = (businessId: number) => {
    setOpenActionForId((prev) => (prev === businessId ? null : businessId));
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-actions-root="true"]')) return;
      setOpenActionForId(null);
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

 const openEditBusiness = async (b: Business) => {
  setOpenActionForId(null);
  fetchCategories();

  try {
    setEditBizId(b.id);

    // ✅ Always fetch full details
    const full = await getBusinessAdminById(b.id);

    setEditBizForm({
      ownerUserId: (full as any)?.owner?.id ?? null,
      name: (full as any)?.name ?? (full as any)?.owner?.name ?? "",
      businessname: (full as any)?.businessname ?? "",
      category: Number((full as any)?.categoryId ?? (full as any)?.categoryId ?? 0),
 // (see Fix #2 below)
      address: (full as any)?.address ?? "",
      address1: (full as any)?.address1 ?? "",
      state: (full as any)?.state ?? "",
      city: (full as any)?.city ?? "",
      pincode: (full as any)?.pincode ?? "",
      gstNumber: (full as any)?.gstNumber ?? "",
      businessTagline: (full as any)?.businessTagline ?? "",
      logoUrl: (full as any)?.logoUrl ?? null,
      preferredLanguage: ((full as any)?.preferredLanguage ?? "en") as any,
    });

    setEditBizOpen(true);
  } catch (e: any) {
    toast.error(e?.message || "Failed to load business for edit");
  }
};


  const closeEditBusiness = () => {
    if (editBizSaving) return;
    setEditBizOpen(false);
    setEditBizId(null);
  };

  const handleUpdateBusiness = async () => {
    if (!editBizId) return;

    if (!editBizForm.businessname.trim()) return toast.error("Business name required");
    if (!editBizForm.category || editBizForm.category <= 0) return toast.error("Category required");
    if (!editBizForm.address.trim()) return toast.error("Address required");
    if (!editBizForm.state.trim()) return toast.error("State required");
    if (!editBizForm.city.trim()) return toast.error("City required");
    if (!/^\d{6}$/.test(editBizForm.pincode.trim())) return toast.error("Pincode must be 6 digits");

    try {
      setEditBizSaving(true);

      const payload = {
        name: editBizForm.name.trim(),
        businessname: editBizForm.businessname.trim(),
        category: editBizForm.category.trim(),
        address: editBizForm.address.trim(),
        address1: editBizForm.address1.trim() || undefined,
        state: editBizForm.state.trim(),
        city: editBizForm.city.trim(),
        pincode: editBizForm.pincode.trim(),
        gstNumber: editBizForm.gstNumber.trim() || undefined,
        businessTagline: editBizForm.businessTagline.trim() || undefined,
        logoUrl: editBizForm.logoUrl ?? null,
        preferredLanguage: editBizForm.preferredLanguage,
      };

      await toast.promise(updateBusinessAdmin(editBizId, payload), {
        loading: "Updating business...",
        success: "Business updated!",
        error: (e: any) =>
          e?.response?.data?.message || e?.message || "Update business failed",
      });

      setEditBizOpen(false);
      setOpenActionForId(null);
      await fetchBusinesses();
    } finally {
      setEditBizSaving(false);
    }
  };

  // =========================
  // ✅ CREATE BUSINESS FLOW
  // =========================
  const openCreate = () => {
    setCreateOpen(true);
    setCreateStep(1);
    setSaving(false);
    fetchCategories();

    setUserForm({ ...emptyUserForm });
    setBusinessForm({ ...emptyBusinessForm });

    setCreatedUserId(null);
    setLogoFile(null);
    setLogoUploading(false);
  };

  const closeCreate = () => {
    if (saving || logoUploading) return;
    setCreateOpen(false);
  };

  const validateStep1 = () => {
    const mobile = userForm.mobile.trim();
    if (!/^\d{10}$/.test(mobile)) return "Mobile must be 10 digits";
    if (userForm.email && !/^\S+@\S+\.\S+$/.test(userForm.email.trim())) return "Invalid email";
    return null;
  };

  const handleCreateUser = async () => {
    const msg = validateStep1();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const payload = {
        mobile: userForm.mobile.trim(),
        role: userForm.role,
        email: userForm.email.trim() || undefined,
      };

      const res = await toast.promise(createAdminUser(payload), {
        loading: "Creating user...",
        success: "User created!",
        error: (e: any) => e.message || "Failed to create user",
      });

      const userId = (res as any)?.id ?? (res as any)?.user?.id ?? (res as any)?.data?.user?.id;
      if (!userId) throw new Error("User id not received from server");

      setCreatedUserId(userId);
      setBusinessForm((p) => ({ ...p, ownerUserId: userId }));
      setCreateStep(2);
    } catch (e: any) {
      toast.error(e.message || "Create user failed");
    } finally {
      setSaving(false);
    }
  };

  const validateStep2 = () => {
    if (!businessForm.ownerUserId) return "ownerUserId missing";
    if (!businessForm.name.trim()) return "Name required";
    if (!businessForm.businessname.trim()) return "Business name required";
    if (!businessForm.category || businessForm.category <= 0) return "Category required";
    if (!businessForm.address.trim()) return "Address required";
    if (!businessForm.state.trim()) return "State required";
    if (!businessForm.city.trim()) return "City required";
    if (!businessForm.pincode.trim()) return "Pincode required";
    if (!/^\d{6}$/.test(businessForm.pincode.trim())) return "Pincode must be 6 digits";
    return null;
  };

  const handleCreateBusiness = async () => {
    const msg = validateStep2();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const body = {
        ownerUserId: businessForm.ownerUserId || 0,
        name: businessForm.name.trim(),
        businessname: businessForm.businessname.trim(),
        category: businessForm.category,
        address: businessForm.address.trim(),
        address1: businessForm.address1.trim() || undefined,
        state: businessForm.state.trim(),
        city: businessForm.city.trim(),
        pincode: businessForm.pincode.trim(),
        gstNumber: businessForm.gstNumber.trim() || undefined,
        businessTagline: businessForm.businessTagline.trim() || undefined,
        logoUrl: businessForm.logoUrl ?? null,
        preferredLanguage: businessForm.preferredLanguage,
      };

      await toast.promise(createBusinessAdmin(body), {
        loading: "Creating business...",
        success: "Business created!",
        error: (e: any) => e.message || "Business create failed",
      });

      setCreateOpen(false);
      fetchBusinesses();
    } catch (e: any) {
      toast.error(e.message || "Business create failed");
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // ✅ EDIT USER
  // =========================
  const openEditUser = (business: Business) => {
    const ownerId = (business as any)?.owner?.id;
    const ownerMobile = (business as any)?.owner?.mobile;

    if (!ownerId) {
      toast.error("Owner userId not found for this business");
      return;
    }

    setEditUserId(ownerId);
    setEditUserMobile(ownerMobile || "");
    setEditUserVerified(false);
    setEditUserOpen(true);
  };

  const closeEditUser = () => {
    if (editUserSaving) return;
    setEditUserOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!editUserId) return;
    if (!/^\d{10}$/.test(editUserMobile.trim())) return toast.error("Mobile must be 10 digits");

    try {
      setEditUserSaving(true);

      await toast.promise(
        updateAdminUser(editUserId, {
          mobile: editUserMobile.trim(),
          isPhoneVerified: editUserVerified,
        }),
        {
          loading: "Updating user...",
          success: "User updated!",
          error: (e: any) => e.message || "Update failed",
        }
      );

      setEditUserOpen(false);
      fetchBusinesses();
    } finally {
      setEditUserSaving(false);
    }
  };

  // =========================
  // ✅ DELETE USER + BUSINESS
  // =========================
  const handleDelete = async (business: Business) => {
    const ownerId = (business as any)?.owner?.id;
    if (!ownerId) return toast.error("Owner userId not found");

    const ok = confirm("Delete this user? (Also delete business = true)");
    if (!ok) return;

    await toast.promise(deleteAdminUser(ownerId, true), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchBusinesses();
  };

  // =========================
  // UI
  // =========================
  if (loading && businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
            <p className="text-sm text-slate-400 mt-1">Loading businesses...</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-32"></div>
                  <div className="h-3 bg-slate-700 rounded w-24"></div>
                </div>
                <div className="h-6 bg-slate-700 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
            <p className="text-sm text-slate-400 mt-1">Manage and monitor all registered businesses</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchBusinesses}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>

            <button
              onClick={openCreate}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Business
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Businesses</p>
                <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Active</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.active}</p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Trial/Pending</p>
                <p className="mt-2 text-2xl font-semibold text-yellow-400">{stats.pending}</p>
              </div>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Inactive</p>
                <p className="mt-2 text-2xl font-semibold text-red-400">{stats.inactive}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by business name, category, address, or owner mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 appearance-none transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Trial/Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {businesses.length} businesses {loading && <span className="ml-2">• Updating...</span>}
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No businesses found</h3>
              <p className="text-sm text-slate-500">
                {searchTerm || statusFilter !== "all" ? "Try adjusting your search or filter criteria" : "No businesses registered yet"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                            <h3 className="font-semibold text-slate-100">{business.businessname}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-400">{business.category}</span>
                            {business.subscription?.plan && getPlanBadge(business.subscription.plan)}
                          </div>
                        </div>
                        <div className="lg:hidden">{getStatusBadge(business)}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{business.city || business.address || "No address"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          <User className="w-4 h-4" />
                          <span>{business.owner?.mobile || "No owner"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          <CreditCard className="w-4 h-4" />
                          <span>{business.subscription ? `Subscription: ${business.subscription.status}` : "No subscription"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>Registered: {formatDate(business.createdAt)}</span>
                        {business.subscription?.trialEndsAt && <span>Trial ends: {formatDate(business.subscription.trialEndsAt)}</span>}
                        {business.subscription?.currentPeriodEnd && <span>Renews: {formatDate(business.subscription.currentPeriodEnd)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                      <div className="hidden lg:block">{getStatusBadge(business)}</div>

                      <div className="flex items-center gap-1" data-actions-root="true">
                        {/* VIEW */}
                        <button
                          onClick={() => openView(business)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* ACTIONS */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActions(business.id);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/40 rounded-lg transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openActionForId === business.id && (
                            <div
                              data-actions-root="true"
                              className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden z-50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => openEditUser(business)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
                              >
                                Edit phone number
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditBusiness(business)}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
                              >
                                Edit business details
                              </button>

                              <div className="h-px bg-slate-800" />

                              <button
                                type="button"
                                onClick={() => handleDelete(business)}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* ✅ CREATE BUSINESS MODAL */}
        {/* ========================= */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Create Business</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Step {createStep} of 2 • {createStep === 1 ? "Create User" : "Create Business"}
                  </p>
                </div>
                <button onClick={closeCreate} disabled={saving} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-2 mb-5">
                <div className={`flex-1 h-1.5 rounded ${createStep >= 1 ? "bg-emerald-500" : "bg-slate-800"}`} />
                <div className={`flex-1 h-1.5 rounded ${createStep >= 2 ? "bg-emerald-500" : "bg-slate-800"}`} />
              </div>

              {createStep === 1 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="Mobile *"
                      value={userForm.mobile}
                      onChange={(v) => setUserForm((p) => ({ ...p, mobile: v }))}
                      placeholder="10 digit number"
                    />

                    <Select
                      label="Role"
                      value={userForm.role}
                      onChange={(v) => setUserForm((p) => ({ ...p, role: v as any }))}
                      options={[
                        { value: "businessOwner", label: "businessOwner" },
                        { value: "businessAdmin", label: "businessAdmin" },
                        { value: "supportAdmin", label: "supportAdmin" },
                      ]}
                    />

                    <Field
                      label="Email"
                      value={userForm.email}
                      onChange={(v) => setUserForm((p) => ({ ...p, email: v }))}
                      placeholder="test@dummy.com"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={closeCreate}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleCreateUser}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Save & Next
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 mb-4 text-sm text-slate-300">
                    Owner UserId: <b className="text-emerald-300">{createdUserId}</b>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name *" value={businessForm.name} onChange={(v) => setBusinessForm((p) => ({ ...p, name: v }))} />
                    <Field
                      label="Business Name *"
                      value={businessForm.businessname}
                      onChange={(v) => setBusinessForm((p) => ({ ...p, businessname: v }))}
                    />
                    
                    <Select
  label="Category *"
  value={String(businessForm.category)}
  onChange={(v) =>
    setBusinessForm((p) => ({ ...p, category: Number(v) }))
  }
  options={[
    { value: "", label: "Select category" },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ]}
/>


                    <Select
                      label="Preferred Language"
                      value={businessForm.preferredLanguage}
                      onChange={(v) => setBusinessForm((p) => ({ ...p, preferredLanguage: v as any }))}
                      options={[
                        { value: "en", label: "English" },
                        { value: "hi", label: "Hindi" },
                        { value: "mr", label: "Marathi" },
                      ]}
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Address *"
                        value={businessForm.address}
                        onChange={(v) => setBusinessForm((p) => ({ ...p, address: v }))}
                        placeholder="Main Road"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Field
                        label="Address 1"
                        value={businessForm.address1}
                        onChange={(v) => setBusinessForm((p) => ({ ...p, address1: v }))}
                        placeholder="Near Market"
                      />
                    </div>

                    <Select
                      label="State *"
                      value={businessForm.state}
                      onChange={(v) =>
                        setBusinessForm((p) => ({
                          ...p,
                          state: v,
                          city: "", 
                        }))
                      }
                      options={[{ value: "", label: "Select state" }, ...stateOptions]}
                    />

                    <Field label="City *" value={businessForm.city} onChange={(v) => setBusinessForm((p) => ({ ...p, city: v }))} />

                    <Field
                      label="Pincode *"
                      value={businessForm.pincode}
                      onChange={(v) => setBusinessForm((p) => ({ ...p, pincode: v }))}
                      placeholder="140603"
                    />

                    <Field
                      label="GST Number"
                      value={businessForm.gstNumber}
                      onChange={(v) => setBusinessForm((p) => ({ ...p, gstNumber: v }))}
                      placeholder="03ABCDE1234F1Z5"
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Business Tagline"
                        value={businessForm.businessTagline}
                        onChange={(v) => setBusinessForm((p) => ({ ...p, businessTagline: v }))}
                        placeholder="Best shop"
                      />
                    </div>

                    {/* Logo upload section - CREATE MODAL */}
                  <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <LogoUploadField
                      label="Business Logo"
                      currentLogoUrl={businessForm.logoUrl || null}
                      onLogoUploaded={(url) => setBusinessForm(p => ({ ...p, logoUrl: url }))}
                      disabled={saving}
                      uploading={logoUploading}
                      // No businessId for create mode
                    />
                  </div>
                  </div>

                  <div className="mt-6 flex justify-between gap-3">
                    <button
                      onClick={() => setCreateStep(1)}
                      disabled={saving}
                      className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                    >
                      Back
                    </button>

                    <div className="flex gap-3">
                      <button
                        onClick={closeCreate}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleCreateBusiness}
                        disabled={saving}
                        className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Create Business
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========================= */}
        {/* ✅ VIEW DETAILS MODAL */}
        {/* ========================= */}
        {viewOpen && viewBusiness && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Business Details</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {viewBusiness.businessname} • ID: {viewBusiness.id}
                  </p>
                </div>
                <button onClick={closeView} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {viewLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                  <p className="text-sm text-slate-400 mt-2">Loading details...</p>
                </div>
              ) : (
                <>
                  {/* Logo and Basic Info */}
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    {viewBusiness.logoUrl && (
                      <div className="md:w-1/3">
                        <p className="text-sm text-slate-400 mb-2">Logo</p>
                        <div className="rounded-lg border border-slate-800 p-4 bg-slate-900/40">
                          <img
                            src={viewBusiness.logoUrl}
                            alt="logo"
                            className="h-32 w-32 rounded-lg object-contain mx-auto"
                          />
                          <p className="mt-3 text-xs text-slate-500 break-all text-center">{viewBusiness.logoUrl}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className={`${viewBusiness.logoUrl ? 'md:w-2/3' : 'w-full'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Info label="Business Name" value={viewBusiness.businessname} />
                        <Info label="Category" value={viewBusiness.category || "—"} />
                        <Info label="Business Tagline" value={viewBusiness.businessTagline || "—"} />
                        <Info label="Preferred Language" value={viewBusiness.preferredLanguage || "en"} />
                        <Info label="GST Number" value={viewBusiness.gstNumber || "—"} />
                        <Info label="Status" value={
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                            viewBusiness.subscription?.status === 'active' 
                              ? 'bg-emerald-500/20 text-black-300' 
                              : viewBusiness.subscription?.status === 'trial'
                              ? 'bg-yellow-500/20 text-black-300'
                              : 'bg-slate-500/20 text-black-300'
                          }`}>
                            {viewBusiness.subscription?.status || 'N/A'}
                          </span>
                        } />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 mb-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Address Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Info label="Address" value={viewBusiness.address || "—"} />
                      <Info label="Address 1" value={viewBusiness.address1 || "—"} />
                      <Info label="City" value={viewBusiness.city || "—"} />
                      <Info label="State" value={viewBusiness.state || "—"} />
                      <Info label="Pincode" value={viewBusiness.pincode || "—"} />
                    </div>
                  </div>

                  {/* Owner Details Section */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 mb-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Owner Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Info label="Owner Name" value={viewBusiness.name || "—"} />
                      <Info label="Mobile" value={viewBusiness.owner?.mobile || "—"} />
                      <Info label="Email" value={viewBusiness.owner?.email || "—"} />
                      <Info label="User ID" value={viewBusiness.owner?.id ? String(viewBusiness.owner.id) : "—"} />
                      <Info label="Role" value={viewBusiness.owner?.role || "—"} />
                      <Info label="Phone Verified" value={
                        viewBusiness.owner?.isPhoneVerified ? 
                          <span className="text-emerald-400">✓ Verified</span> : 
                          <span className="text-red-400">✗ Not Verified</span>
                      } />
                    </div>
                  </div>

                  {/* Subscription Details */}
                  {viewBusiness.subscription && (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Subscription Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Info label="Plan" value={viewBusiness.subscription.plan || "—"} />
                        <Info label="Status" value={viewBusiness.subscription.status || "—"} />
                        <Info label="Trial Ends" value={formatDate(viewBusiness.subscription.trialEndsAt) || "—"} />
                        <Info label="Current Period End" value={formatDate(viewBusiness.subscription.currentPeriodEnd) || "—"} />
                        <Info label="Created At" value={formatDate(viewBusiness.subscription.createdAt) || "—"} />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-3">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Info label="Business ID" value={String(viewBusiness.id)} />
                      <Info label="Created At" value={formatDate(viewBusiness.createdAt) || "—"} />
                      <Info label="Updated At" value={formatDate(viewBusiness.updatedAt) || "—"} />
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeView}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================= */}
        {/* ✅ EDIT BUSINESS MODAL */}
        {/* ========================= */}
        {editBizOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Edit Business</h3>
                  <p className="text-xs text-slate-400 mt-1">Business ID: {editBizId}</p>
                </div>
                <button onClick={closeEditBusiness} disabled={editBizSaving} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name *" value={editBizForm.name} onChange={(v) => setEditBizForm((p) => ({ ...p, name: v }))} />

                <Field
                  label="Business Name *"
                  value={editBizForm.businessname}
                  onChange={(v) => setEditBizForm((p) => ({ ...p, businessname: v }))}
                />

               <Select
  label="Category *"
  value={String(editBizForm.category)}
  onChange={(v) =>
    setEditBizForm((p) => ({ ...p, category: Number(v) }))
  }
  options={[
    { value: "0", label: categoriesLoading ? "Loading..." : "Select category" },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.name,
    })),
  ]}
  disabled={categoriesLoading}
/>



                <Select
                  label="Preferred Language"
                  value={editBizForm.preferredLanguage}
                  onChange={(v) => setEditBizForm((p) => ({ ...p, preferredLanguage: v as any }))}
                  options={[
                    { value: "en", label: "English" },
                    { value: "hi", label: "Hindi" },
                    { value: "mr", label: "Marathi" },
                  ]}
                />

                <div className="md:col-span-2">
                  <Field label="Address *" value={editBizForm.address} onChange={(v) => setEditBizForm((p) => ({ ...p, address: v }))} />
                </div>

                <div className="md:col-span-2">
                  <Field label="Address 1" value={editBizForm.address1} onChange={(v) => setEditBizForm((p) => ({ ...p, address1: v }))} />
                </div>

                <Select
  label="State *"
  value={editBizForm.state}
  onChange={(v) =>
    setEditBizForm((p) => ({
      ...p,
      state: v,
      city: "", // ✅ reset
    }))
  }
  options={[{ value: "", label: "Select state" }, ...stateOptions]}
/>

                <Field label="City *" value={editBizForm.city} onChange={(v) => setEditBizForm((p) => ({ ...p, city: v }))} />

                <Field label="Pincode *" value={editBizForm.pincode} onChange={(v) => setEditBizForm((p) => ({ ...p, pincode: v }))} />

                <Field label="GST Number" value={editBizForm.gstNumber} onChange={(v) => setEditBizForm((p) => ({ ...p, gstNumber: v }))} />

                <div className="md:col-span-2">
                  <Field
                    label="Business Tagline"
                    value={editBizForm.businessTagline}
                    onChange={(v) => setEditBizForm((p) => ({ ...p, businessTagline: v }))}
                  />
                </div>

              <div className="md:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <LogoUploadField
                  label="Business Logo"
                  currentLogoUrl={editBizForm.logoUrl || null}
                  onLogoUploaded={(url) => setEditBizForm(p => ({ ...p, logoUrl: url }))}
                  disabled={editBizSaving}
                  businessId={editBizId} 
                />
              </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEditBusiness}
                  disabled={editBizSaving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdateBusiness}
                  disabled={editBizSaving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 flex items-center gap-2"
                >
                  {editBizSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================= */}
        {/* ✅ EDIT USER MODAL */}
        {/* ========================= */}
        {editUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Edit Owner User</h3>
                <button onClick={closeEditUser} disabled={editUserSaving} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Field label="Mobile *" value={editUserMobile} onChange={setEditUserMobile} placeholder="10 digit number" />

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editUserVerified}
                    onChange={(e) => setEditUserVerified(e.target.checked)}
                  />
                  <span className="text-sm text-slate-300">isPhoneVerified</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEditUser}
                  disabled={editUserSaving}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdateUser}
                  disabled={editUserSaving}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 flex items-center gap-2"
                >
                  {editUserSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Update
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

/** ======================
 * Small UI components
 * ====================== */
function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <input
        type={props.type || "text"}
        value={props.value ?? ""}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100 break-words">{value}</p>
    </div>
  );
}

function Select(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <select
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none disabled:opacity-50"
      >
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}