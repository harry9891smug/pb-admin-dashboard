"use client";
import { useEffect, useState, useRef } from "react";
import {
  Search, Filter, Tag, Calendar, Eye, Edit, Trash2, Plus,
  Users, Building2, RefreshCw, AlertCircle, CheckCircle,
  XCircle, Clock, Zap, MoreVertical, ChevronDown, X, Upload,
  Image as ImageIcon, ExternalLink, Copy, Share2, Download
} from "lucide-react";
import {
  getOffers,
  approveOffer,
  rejectOffer,
  createOffer,
  getBusinesses,
  getOffersWithFallback,
  uploadOfferImage,
  CreateOfferInput,
  Business,
  getAdminOfferById,
  updateAdminOffer,
  deleteAdminOffer,
  changeAdminOfferStatus,
} from "@/lib/api";
import { toast } from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface Offer {
  id: number;
  title: string;
  business: string;
  status: "active" | "expired" | "awaiting_approval" | "inactive";
  discount: string;
  startDate: string;
  endDate: string;
  views: number;
  redemptions: number;
  category: string;
  imageUrl: string | null;
  originalStatus: "draft" | "active" | "expired" | "inactive";
  businessId?: number;
  message?: string;
  discountType?: string;
  discountValue?: number | null;
  bxyX?: number | null;
  bxyY?: number | null;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    awaiting_approval: 0,
    expired: 0,
    inactive: 0,
  });

  const [processingOffer, setProcessingOffer] = useState<number | null>(null);

  // ✅ MODALS
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // ✅ DATA STATES
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | "">("");
  
  // Current selected offer
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Forms
  const [createForm, setCreateForm] = useState<CreateOfferInput>({
    title: "",
    message: "",
    discountType: "percent",
    discountValue: 10,
    bxyX: undefined,
    bxyY: undefined,
    startDate: "",
    endDate: "",
    imageUrl: null,
  });

  const [editForm, setEditForm] = useState<CreateOfferInput>({
    title: "",
    message: "",
    discountType: "percent",
    discountValue: 10,
    bxyX: undefined,
    bxyY: undefined,
    startDate: "",
    endDate: "",
    imageUrl: null,
  });

  // Loading states
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);

  // Image upload
  const [createImageFile, setCreateImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Reject modal
  const [selectedRejectOfferId, setSelectedRejectOfferId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ✅ FETCH OFFERS
  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (searchTerm) params.search = searchTerm;

      if (statusFilter !== "all") {
        const statusMap: Record<string, string> = {
          active: "active",
          expired: "expired",
          awaiting_approval: "draft",
          inactive: "inactive",
        };
        params.status = statusMap[statusFilter] || statusFilter;
      }

      params.limit = 50;

      let data;
      try {
        data = await getOffers(params);
      } catch {
        data = await getOffersWithFallback(params);
      }

      const formattedOffers = data.items.map((apiOffer: any) => {
        let frontendStatus: "active" | "expired" | "awaiting_approval" | "inactive";

        if (apiOffer.status === "active") frontendStatus = "active";
        else if (apiOffer.status === "expired") frontendStatus = "expired";
        else if (apiOffer.status === "draft") frontendStatus = "awaiting_approval";
        else if (apiOffer.status === "inactive") frontendStatus = "inactive";
        else frontendStatus = "active";

        let discount = "N/A";
        if (apiOffer.discountType === "percent" && apiOffer.discountValue) discount = `${apiOffer.discountValue}%`;
        else if (apiOffer.discountType === "flat" && apiOffer.discountValue) discount = `₹${apiOffer.discountValue}`;
        else if (apiOffer.discountType === "bxy") discount = `Buy ${apiOffer.bxyX} Get ${apiOffer.bxyY}`;
        else if (apiOffer.discountType === "dateRange") discount = "Date Range Offer";

        return {
          id: apiOffer.id,
          title: apiOffer.title,
          business: apiOffer.business?.name ?? "N/A",
          businessId: apiOffer.business?.id,
          status: frontendStatus,
          discount,
          startDate: apiOffer.startDate,
          endDate: apiOffer.endDate,
          views: Math.floor(Math.random() * 1000),
          redemptions: Math.floor(Math.random() * 100),
          category: apiOffer.business?.name ?? "N/A",
          imageUrl: apiOffer.imageUrl ?? null,
          originalStatus: apiOffer.status,
          message: apiOffer.message,
          discountType: apiOffer.discountType,
          discountValue: apiOffer.discountValue,
          bxyX: apiOffer.bxyX,
          bxyY: apiOffer.bxyY,
        };
      });

      setOffers(formattedOffers);

      const total = formattedOffers.length;
      const active = formattedOffers.filter((o) => o.status === "active").length;
      const awaiting_approval = formattedOffers.filter((o) => o.status === "awaiting_approval").length;
      const expired = formattedOffers.filter((o) => o.status === "expired").length;
      const inactive = formattedOffers.filter((o) => o.status === "inactive").length;
      setStats({ total, active, awaiting_approval, expired, inactive });
    } catch (err: any) {
      setError(err.message || "Failed to load offers");
      toast.error(err.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FETCH BUSINESSES
  const fetchBusinesses = async () => {
    try {
      setIsLoadingBusinesses(true);
      const businessesData = await getBusinesses({ limit: 100, offset: 0 });
      setBusinesses(businessesData.items || []);

      if ((businessesData.items || []).length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(businessesData.items[0].id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load businesses");
    } finally {
      setIsLoadingBusinesses(false);
    }
  };

  // ✅ VIEW OFFER DETAILS
  const handleViewOffer = async (offer: Offer) => {
    try {
      setViewLoading(true);
      setIsViewOpen(true);
      
      // Try to fetch full details from API
      try {
        const fullDetails = await getAdminOfferById(offer.id);
        setSelectedOffer({
          ...offer,
          ...fullDetails
        });
      } catch {
        // If API fails, use the basic data
        setSelectedOffer(offer);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load offer details");
    } finally {
      setViewLoading(false);
    }
  };

  // ✅ EDIT OFFER
  const handleEditOffer = (offer: Offer) => {
    setSelectedOffer(offer);
    setEditForm({
      title: offer.title || "",
      message: offer.message || "",
      discountType: (offer.discountType as any) || "percent",
      discountValue: offer.discountValue || 10,
      bxyX: offer.bxyX || undefined,
      bxyY: offer.bxyY || undefined,
      startDate: offer.startDate || "",
      endDate: offer.endDate || "",
      imageUrl: offer.imageUrl || null,
    });
    setEditImageFile(null);
    setIsEditOpen(true);
  };

  // ✅ UPDATE OFFER
  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    if (!editForm.title.trim() || !editForm.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (!editForm.startDate || !editForm.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    try {
      setIsUpdating(true);
      let uploadedImageUrl: string | null = editForm.imageUrl ?? null;

      // Upload new image if selected
      if (editImageFile) {
        setUploadingImage(true);
        uploadedImageUrl = await uploadOfferImage(selectedOffer.businessId || 0, editImageFile);
        setUploadingImage(false);
      }

      const payload: any = {
        title: editForm.title.trim(),
        message: editForm.message.trim(),
        discountType: editForm.discountType,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        imageUrl: uploadedImageUrl,
      };

      if (editForm.discountType === "percent" || editForm.discountType === "flat") {
        payload.discountValue = editForm.discountValue;
      } else if (editForm.discountType === "bxy") {
        payload.bxyX = editForm.bxyX;
        payload.bxyY = editForm.bxyY;
      }

      await updateAdminOffer(selectedOffer.id, payload);
      toast.success("Offer updated successfully!");
      setIsEditOpen(false);
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update offer");
    } finally {
      setIsUpdating(false);
      setUploadingImage(false);
    }
  };

  // ✅ DELETE OFFER
  const handleDeleteOffer = async (offerId: number) => {
    if (!confirm("Are you sure you want to delete this offer? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteAdminOffer(offerId);
      toast.success("Offer deleted successfully!");
      
      setOffers(prev => prev.filter(o => o.id !== offerId));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        [offers.find(o => o.id === offerId)?.status || "active"]: Math.max(0, 
          prev[offers.find(o => o.id === offerId)?.status as keyof typeof stats] - 1
        ),
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete offer");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ APPROVE OFFER
  const handleApproveOffer = async (offerId: number) => {
    if (!confirm("Are you sure you want to approve this offer?")) return;

    try {
      setProcessingOffer(offerId);
      await approveOffer(offerId);
      toast.success("Offer approved!");

      setOffers(prev =>
        prev.map((o) => (o.id === offerId ? { ...o, status: "active", originalStatus: "active" } : o))
      );

      setStats(prev => ({
        ...prev,
        awaiting_approval: Math.max(0, prev.awaiting_approval - 1),
        active: prev.active + 1,
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to approve offer");
    } finally {
      setProcessingOffer(null);
    }
  };

  // ✅ REJECT OFFER
  const openRejectModal = (offerId: number) => {
    setSelectedRejectOfferId(offerId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectOffer = async () => {
    if (!selectedRejectOfferId) return;

    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      toast.error("Please provide a valid reason (min 5 characters)");
      return;
    }

    try {
      setIsRejecting(true);
      await rejectOffer(selectedRejectOfferId, rejectReason.trim());
      toast.success("Offer rejected!");

      setOffers(prev => prev.filter(o => o.id !== selectedRejectOfferId));
      setStats(prev => ({
        ...prev,
        awaiting_approval: Math.max(0, prev.awaiting_approval - 1),
        total: Math.max(0, prev.total - 1),
      }));

      closeRejectModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject offer");
    } finally {
      setIsRejecting(false);
    }
  };

  // ✅ CHANGE STATUS (Activate/Deactivate)
  const handleChangeStatus = async (offerId: number, newStatus: string) => {
    try {
      setProcessingOffer(offerId);
      await changeAdminOfferStatus(offerId, newStatus);
      toast.success(`Offer ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);

      setOffers(prev =>
        prev.map((o) => 
          o.id === offerId 
            ? { ...o, status: newStatus as any, originalStatus: newStatus as any }
            : o
        )
      );

      // Update stats
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
        setStats(prev => {
          const newStats = { ...prev };
          // Decrease old status count
          newStats[offer.status as keyof typeof stats] = Math.max(0, 
            newStats[offer.status as keyof typeof stats] - 1
          );
          // Increase new status count
          newStats[newStatus as keyof typeof stats] = 
            newStats[newStatus as keyof typeof stats] + 1;
          return newStats;
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    } finally {
      setProcessingOffer(null);
    }
  };

  // ✅ CREATE OFFER
  const handleCreateOffer = async () => {
    if (!selectedBusinessId) {
      toast.error("Please select a business");
      return;
    }

    if (!createForm.title.trim() || !createForm.message.trim()) {
      toast.error("Title and message are required");
      return;
    }

    if (!createForm.startDate || !createForm.endDate) {
      toast.error("Start date and end date are required");
      return;
    }

    try {
      setIsCreating(true);
      let uploadedImageUrl: string | null = createForm.imageUrl ?? null;

      if (createImageFile) {
        setUploadingImage(true);
        uploadedImageUrl = await uploadOfferImage(selectedBusinessId as number, createImageFile);
        setUploadingImage(false);
      }

      const offerData: CreateOfferInput = {
        ...createForm,
        imageUrl: uploadedImageUrl,
      };

      await createOffer(selectedBusinessId as number, offerData);
      toast.success("Offer created successfully!");
      closeCreateModal();
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create offer");
    } finally {
      setIsCreating(false);
      setUploadingImage(false);
    }
  };

  // ✅ MODAL CONTROLS
  const openCreateModal = () => {
    setIsCreateOpen(true);
    fetchBusinesses();
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setCreateForm({
      title: "",
      message: "",
      discountType: "percent",
      discountValue: 10,
      bxyX: undefined,
      bxyY: undefined,
      startDate: "",
      endDate: "",
      imageUrl: null,
    });
    setSelectedBusinessId("");
    setCreateImageFile(null);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedOffer(null);
  };

  const closeViewModal = () => {
    setIsViewOpen(false);
    setSelectedOffer(null);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedRejectOfferId(null);
    setRejectReason("");
    setIsRejecting(false);
  };

  // ✅ UTILITIES
  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchOffers, 500);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const map: any = {
      active: { class: "bg-emerald-500/20 text-black-300 border-emerald-500/40", label: "Active", icon: <Zap className="w-3 h-3" /> },
      expired: { class: "bg-red-500/20 text-black-300 border-red-500/40", label: "Expired", icon: <XCircle className="w-3 h-3" /> },
      awaiting_approval: { class: "bg-yellow-500/20 text-black-300 border-yellow-500/40", label: "Awaiting Approval", icon: <Clock className="w-3 h-3" /> },
      inactive: { class: "bg-slate-500/20 text-black-300 border-slate-500/40", label: "Inactive", icon: <XCircle className="w-3 h-3" /> },
    };
    const c = map[status] || map.active;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${c.class}`}>
        {c.icon}
        <span className="ml-1.5">{c.label}</span>
      </span>
    );
  };

  const formatDate = (dateString: string) =>
    dateString ? new Date(dateString).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

  const handleDiscountTypeChange = (type: "percent" | "flat" | "bxy" | "dateRange", isEdit = false) => {
    const setter = isEdit ? setEditForm : setCreateForm;
    setter((prev) => ({
      ...prev,
      discountType: type,
      discountValue: type === "bxy" || type === "dateRange" ? undefined : (type === "flat" ? 100 : 10),
      bxyX: type === "bxy" ? 1 : undefined,
      bxyY: type === "bxy" ? 1 : undefined,
    }));
  };

  // ✅ RENDER
  if (loading && offers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Offers Management</h1>
            <p className="text-sm text-slate-400 mt-1">Loading offers...</p>
          </div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-40" />
                  <div className="h-3 bg-slate-700 rounded w-32" />
                </div>
                <div className="h-6 bg-slate-700 rounded w-20" />
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
            <h1 className="text-2xl font-semibold tracking-tight">Offers Management</h1>
            <p className="text-sm text-slate-400 mt-1">Monitor, approve, and manage all business offers</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchOffers}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-lg hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Offer
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Total Offers</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-yellow-400">{stats.awaiting_approval}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Inactive/Expired</p>
            <p className="mt-2 text-2xl font-semibold text-red-400">{stats.inactive + stats.expired}</p>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search offers by title, business name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="awaiting_approval">Awaiting Approval</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Offers list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {offers.length} offers {loading && <span className="ml-2">• Updating...</span>}
            </p>
          </div>

          {offers.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <Tag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No offers found</h3>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                <Plus className="w-4 h-4" />
                Create Your First Offer
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-400" />
                            <h3 className="font-semibold text-slate-100">{offer.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-500" />
                            <p className="text-sm text-slate-400">{offer.business}</p>
                          </div>
                        </div>
                        <div className="lg:hidden">{getStatusBadge(offer.status)}</div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="text-slate-400">
                          Discount: <strong className="text-slate-200">{offer.discount}</strong>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(offer.startDate)} to {formatDate(offer.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{offer.views} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{offer.redemptions} redeemed</span>
                          </div>
                        </div>
                      </div>

                      {offer.imageUrl && (
                        <div className="pt-2">
                          <img
                            src={offer.imageUrl}
                            alt={offer.title}
                            className="h-32 w-48 object-cover rounded-lg border border-slate-700"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/150x150?text=Image+Not+Found";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="hidden lg:block">{getStatusBadge(offer.status)}</div>
                      
                      <div className="flex items-center gap-2">
                        {/* VIEW */}
                        <button
                          onClick={() => handleViewOffer(offer)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => handleEditOffer(offer)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* APPROVE/REJECT for awaiting approval */}
                        {offer.status === "awaiting_approval" && (
                          <>
                            <button
                              onClick={() => handleApproveOffer(offer.id)}
                              disabled={processingOffer === offer.id}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {processingOffer === offer.id ? (
                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openRejectModal(offer.id)}
                              disabled={processingOffer === offer.id}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* ACTIVATE/DEACTIVATE for active/inactive */}
                        {offer.status === "active" && (
                          <button
                            onClick={() => handleChangeStatus(offer.id, "inactive")}
                            disabled={processingOffer === offer.id}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Deactivate"
                          >
                            {processingOffer === offer.id ? (
                              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {offer.status === "inactive" && (
                          <button
                            onClick={() => handleChangeStatus(offer.id, "active")}
                            disabled={processingOffer === offer.id}
                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Activate"
                          >
                            {processingOffer === offer.id ? (
                              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* DELETE */}
                        <button
                          onClick={() => handleDeleteOffer(offer.id)}
                          disabled={isDeleting}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* MORE OPTIONS */}
                        <div className="relative">
                          <button
                            className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* ✅ CREATE OFFER MODAL */}
      {/* ========================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Offer</h3>
              <button onClick={closeCreateModal} className="text-slate-400 hover:text-white" disabled={isCreating}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Business */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Select Business *</label>
                <div className="relative">
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedBusinessId(v ? Number(v) : "");
                    }}
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isLoadingBusinesses || isCreating}
                  >
                    <option value="">Select a business</option>
                    {businesses.map((b, idx) => (
                      <option key={`${b.id}-${idx}`} value={b.id}>
                        {b.businessname} {b.city ? `- ${b.city}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={isCreating}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Message *</label>
                <textarea
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[100px]"
                  disabled={isCreating}
                />
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type *</label>
                  <select
                    value={createForm.discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value as any, false)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isCreating}
                  >
                    <option value="percent">Percentage Discount</option>
                    <option value="flat">Flat Discount (₹)</option>
                    <option value="bxy">Buy X Get Y</option>
                    <option value="dateRange">Special Date Range Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {createForm.discountType === "percent"
                      ? "Discount % *"
                      : createForm.discountType === "flat"
                      ? "Discount Amount (₹) *"
                      : createForm.discountType === "bxy"
                      ? "Buy X / Get Y *"
                      : "Discount Type"}
                  </label>

                  {createForm.discountType === "bxy" ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={createForm.bxyX || ""}
                        onChange={(e) => setCreateForm({ ...createForm, bxyX: Number(e.target.value) })}
                        className="w-1/2 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                        min={1}
                      />
                      <input
                        type="number"
                        value={createForm.bxyY || ""}
                        onChange={(e) => setCreateForm({ ...createForm, bxyY: Number(e.target.value) })}
                        className="w-1/2 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                        min={1}
                      />
                    </div>
                  ) : createForm.discountType !== "dateRange" ? (
                    <input
                      type="number"
                      value={createForm.discountValue || ""}
                      onChange={(e) => setCreateForm({ ...createForm, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      min={1}
                    />
                  ) : (
                    <div className="px-3 py-2.5 text-slate-300 text-sm bg-slate-800/50 rounded-lg">
                      Special Date Range Offer
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setCreateImageFile(file);
                  }}
                  className="w-full text-sm text-slate-300"
                  disabled={isCreating}
                />
                {uploadingImage && <p className="text-xs text-emerald-400 mt-1">Uploading image...</p>}
                {createForm.imageUrl && (
                  <img
                    src={createForm.imageUrl}
                    alt="preview"
                    className="mt-2 h-24 w-40 object-cover rounded border border-slate-700"
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={isCreating}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateOffer}
                disabled={
                  isCreating ||
                  uploadingImage ||
                  !selectedBusinessId ||
                  !createForm.title.trim() ||
                  !createForm.message.trim() ||
                  !createForm.startDate ||
                  !createForm.endDate
                }
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ EDIT OFFER MODAL */}
      {/* ========================= */}
      {isEditOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Offer</h3>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-white" disabled={isUpdating}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={isUpdating}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Message *</label>
                <textarea
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[100px]"
                  disabled={isUpdating}
                />
              </div>

              {/* Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Discount Type *</label>
                  <select
                    value={editForm.discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value as any, true)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isUpdating}
                  >
                    <option value="percent">Percentage Discount</option>
                    <option value="flat">Flat Discount (₹)</option>
                    <option value="bxy">Buy X Get Y</option>
                    <option value="dateRange">Special Date Range Offer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    {editForm.discountType === "percent"
                      ? "Discount % *"
                      : editForm.discountType === "flat"
                      ? "Discount Amount (₹) *"
                      : editForm.discountType === "bxy"
                      ? "Buy X / Get Y *"
                      : "Discount Type"}
                  </label>

                  {editForm.discountType === "bxy" ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editForm.bxyX || ""}
                        onChange={(e) => setEditForm({ ...editForm, bxyX: Number(e.target.value) })}
                        className="w-1/2 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                        min={1}
                      />
                      <input
                        type="number"
                        value={editForm.bxyY || ""}
                        onChange={(e) => setEditForm({ ...editForm, bxyY: Number(e.target.value) })}
                        className="w-1/2 px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                        min={1}
                      />
                    </div>
                  ) : editForm.discountType !== "dateRange" ? (
                    <input
                      type="number"
                      value={editForm.discountValue || ""}
                      onChange={(e) => setEditForm({ ...editForm, discountValue: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      min={1}
                    />
                  ) : (
                    <div className="px-3 py-2.5 text-slate-300 text-sm bg-slate-800/50 rounded-lg">
                      Special Date Range Offer
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Offer Image</label>
                <div className="flex items-center gap-3">
                  {editForm.imageUrl && (
                    <img
                      src={editForm.imageUrl}
                      alt="Current"
                      className="h-20 w-20 object-cover rounded border border-slate-700"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setEditImageFile(file);
                      }}
                      className="w-full text-sm text-slate-300"
                      disabled={isUpdating}
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty to keep current image</p>
                  </div>
                </div>
                {uploadingImage && <p className="text-xs text-emerald-400 mt-1">Uploading image...</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={isUpdating}
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateOffer}
                disabled={
                  isUpdating ||
                  uploadingImage ||
                  !editForm.title.trim() ||
                  !editForm.message.trim() ||
                  !editForm.startDate ||
                  !editForm.endDate
                }
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
{/* ✅ VIEW OFFER MODAL */}
{/* ========================= */}
{isViewOpen && selectedOffer && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Offer Details</h3>
          <p className="text-xs text-slate-400 mt-1">ID: {selectedOffer.id}</p>
        </div>
        <button onClick={closeViewModal} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {viewLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 mt-2">Loading details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Offer Image */}
          {selectedOffer.imageUrl && (
            <div className="text-center">
              <img
                src={selectedOffer.imageUrl}
                alt={selectedOffer.title}
                className="h-48 w-full max-w-md mx-auto object-cover rounded-xl border border-slate-700"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Info label="Title" value={selectedOffer.title} />
              
              {/* ✅ FIXED: Handle business object */}
              <Info label="Business" value={
                (() => {
                  const business = selectedOffer.business;
                  if (typeof business === 'string') {
                    return business;
                  } else if (business && typeof business === 'object') {
                    return business.name || business.businessname || business.business || 'N/A';
                  }
                  return 'N/A';
                })()
              } />
              
              <Info label="Status" value={
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                  selectedOffer.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : selectedOffer.status === 'awaiting_approval'
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : selectedOffer.status === 'expired'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-slate-500/20 text-slate-300'
                }`}>
                  {selectedOffer.status}
                </span>
              } />
            </div>

            <div className="space-y-3">
              <Info label="Discount" value={selectedOffer.discount} />
              <Info label="Start Date" value={formatDate(selectedOffer.startDate)} />
              <Info label="End Date" value={formatDate(selectedOffer.endDate)} />
            </div>
          </div>

          {/* Message */}
          {selectedOffer.message && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Offer Message</p>
              <p className="text-slate-200 whitespace-pre-line">{selectedOffer.message}</p>
            </div>
          )}

          {/* Discount Details (if available) */}
          {(selectedOffer.discountType || selectedOffer.discountValue) && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="text-sm font-medium text-slate-300 mb-2">Discount Details</p>
              <div className="grid grid-cols-2 gap-4">
                {selectedOffer.discountType && (
                  <div>
                    <p className="text-xs text-slate-400">Type</p>
                    <p className="text-sm text-slate-200 capitalize">{selectedOffer.discountType}</p>
                  </div>
                )}
                {selectedOffer.discountValue && (
                  <div>
                    <p className="text-xs text-slate-400">Value</p>
                    <p className="text-sm text-slate-200">{selectedOffer.discountValue}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-center">
              <p className="text-xs text-slate-400">Views</p>
              <p className="text-2xl font-semibold text-slate-100 mt-1">{selectedOffer.views || 0}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-center">
              <p className="text-xs text-slate-400">Redemptions</p>
              <p className="text-2xl font-semibold text-emerald-400 mt-1">{selectedOffer.redemptions || 0}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-center">
              <p className="text-xs text-slate-400">Redemption Rate</p>
              <p className="text-2xl font-semibold text-blue-400 mt-1">
                {selectedOffer.views > 0 
                  ? `${(((selectedOffer.redemptions || 0) / selectedOffer.views) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-center">
              <p className="text-xs text-slate-400">Days Remaining</p>
              <p className="text-2xl font-semibold text-yellow-400 mt-1">
                {(() => {
                  if (!selectedOffer.endDate) return 'N/A';
                  const end = new Date(selectedOffer.endDate);
                  const now = new Date();
                  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return diff > 0 ? diff : 0;
                })()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={closeViewModal}
              className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
            >
              Close
            </button>
            {selectedOffer.status === "awaiting_approval" && (
              <>
                <button
                  onClick={() => handleApproveOffer(selectedOffer.id)}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => openRejectModal(selectedOffer.id)}
                  className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}

      {/* ========================= */}
      {/* ✅ REJECT MODAL */}
      {/* ========================= */}
      {rejectModalOpen && selectedRejectOfferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reject Offer</h3>
              <button onClick={closeRejectModal} className="text-slate-400 hover:text-white" disabled={isRejecting}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <textarea
                placeholder="Enter reason (min 5 characters)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[100px]"
                disabled={isRejecting}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeRejectModal}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={isRejecting}
              >
                Cancel
              </button>

              <button
                onClick={handleRejectOffer}
                disabled={isRejecting || !rejectReason.trim() || rejectReason.trim().length < 5}
                className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isRejecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

// Helper Component
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100 break-words">{value}</p>
    </div>
  );
}