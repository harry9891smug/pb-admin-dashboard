"use client";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Building2,
  ExternalLink,
} from "lucide-react";

import {
  Advertisement,
  getAdvertisements,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  uploadAdImage,
  uploadAdLogo,
} from "@/lib/api";

type Status = "active" | "inactive";

type FormState = {
  offerName: string;
  description: string;
  tagLine: string;
  website: string;
  contact: string;
  offerCategory: string;
  state: string;
  city: string;
  pincode: string;
  status: Status;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  offerImageUrl: string | null;
  logoUrl: string | null;
};

const emptyForm: FormState = {
  offerName: "",
  description: "",
  tagLine: "",
  website: "",
  contact: "",
  offerCategory: "",
  state: "",
  city: "",
  pincode: "",
  status: "active",
  startDate: "",
  endDate: "",
  offerImageUrl: null,
  logoUrl: null,
};

export default function AdvertisementsPage() {
  const [items, setItems] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editing, setEditing] = useState<Advertisement | null>(null);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [uploadingOfferImage, setUploadingOfferImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdvertisements();
      setItems(data);
    } catch (e: any) {
      setError(e.message || "Failed to load advertisements");
      toast.error(e.message || "Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return items.filter((ad) => {
      const matchesSearch =
        !q ||
        (ad.offerName || "").toLowerCase().includes(q) ||
        (ad.tagLine || "").toLowerCase().includes(q) ||
        (ad.city || "").toLowerCase().includes(q) ||
        (ad.state || "").toLowerCase().includes(q) ||
        (ad.offerCategory || "").toLowerCase().includes(q);

      const matchesStatus = statusFilter === "all" ? true : ad.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.status === "active").length;
    const inactive = items.filter((x) => x.status === "inactive").length;
    return { total, active, inactive };
  }, [items]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setIsCreateOpen(true);
  };

  const openEdit = (ad: Advertisement) => {
    setEditing(ad);
    setForm({
      offerName: ad.offerName || "",
      description: ad.description || "",
      tagLine: ad.tagLine || "",
      website: ad.website || "",
      contact: ad.contact || "",
      offerCategory: ad.offerCategory || "",
      state: ad.state || "",
      city: ad.city || "",
      pincode: ad.pincode || "",
      status: ad.status || "active",
      startDate: (ad.startDate || "").slice(0, 10),
      endDate: (ad.endDate || "").slice(0, 10),
      offerImageUrl: ad.offerImageUrl ?? null,
      logoUrl: ad.logoUrl ?? null,
    });
    setIsEditOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditing(null);
    setSaving(false);
    setUploadingOfferImage(false);
    setUploadingLogo(false);
  };

  const validate = () => {
    if (!form.offerName.trim()) return "Offer name is required";
    if (!form.contact.trim()) return "Contact is required";
    if (!form.offerCategory.trim()) return "Offer category is required";
    if (!form.state.trim()) return "State is required";
    if (!form.city.trim()) return "City is required";
    if (!form.pincode.trim()) return "Pincode is required";
    if (!form.startDate) return "Start date is required";
    if (!form.endDate) return "End date is required";

    const s = new Date(form.startDate);
    const e = new Date(form.endDate);
    if (e < s) return "End date must be after start date";

    return null;
  };

  const handleCreate = async () => {
    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const payload: Partial<Advertisement> = {
        offerName: form.offerName.trim(),
        description: form.description.trim(),
        tagLine: form.tagLine.trim(),
        website: form.website.trim() || undefined,
        contact: form.contact.trim(),
        offerCategory: form.offerCategory.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        offerImageUrl: form.offerImageUrl,
        logoUrl: form.logoUrl,
      };

      await toast.promise(createAdvertisement(payload), {
        loading: "Creating advertisement...",
        success: "Advertisement created!",
        error: (e: any) => e.message || "Create failed",
      });

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const msg = validate();
    if (msg) return toast.error(msg);

    try {
      setSaving(true);

      const payload: Partial<Advertisement> = {
        offerName: form.offerName.trim(),
        description: form.description.trim(),
        tagLine: form.tagLine.trim(),
        website: form.website.trim() || undefined,
        contact: form.contact.trim(),
        offerCategory: form.offerCategory.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        pincode: form.pincode.trim(),
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        offerImageUrl: form.offerImageUrl,
        logoUrl: form.logoUrl,
      };

      await toast.promise(updateAdvertisement(editing.id, payload), {
        loading: "Updating advertisement...",
        success: "Advertisement updated!",
        error: (e: any) => e.message || "Update failed",
      });

      closeModals();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this advertisement?")) return;

    await toast.promise(deleteAdvertisement(id), {
      loading: "Deleting...",
      success: "Deleted!",
      error: (e: any) => e.message || "Delete failed",
    });

    fetchData();
  };

  // ✅ Upload handlers use your api.ts (no id)
  const handleUploadOfferImage = async (file: File) => {
    try {
      setUploadingOfferImage(true);
      const res = await toast.promise(uploadAdImage(file), {
        loading: "Uploading offer image...",
        success: "Offer image uploaded!",
        error: (e: any) => e.message || "Upload failed",
      });

      // Expecting { data: { offerImageUrl } } or { offerImageUrl } etc.
      const url =
        res?.data?.data?.offerImageUrl ||
        res?.data?.offerImageUrl ||
        res?.data?.url ||
        null;

      if (!url) {
        toast.error("Upload success but URL not found in response");
        return;
      }

      setForm((p) => ({ ...p, offerImageUrl: url }));
    } finally {
      setUploadingOfferImage(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      const res = await toast.promise(uploadAdLogo(file), {
        loading: "Uploading logo...",
        success: "Logo uploaded!",
        error: (e: any) => e.message || "Upload failed",
      });

      const url =
        res?.data?.data?.logoUrl ||
        res?.data?.logoUrl ||
        res?.data?.url ||
        null;

      if (!url) {
        toast.error("Upload success but URL not found in response");
        return;
      }

      setForm((p) => ({ ...p, logoUrl: url }));
    } finally {
      setUploadingLogo(false);
    }
  };

  const statusBadge = (status: Status) => {
    const isActive = status === "active";
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
          isActive
            ? "bg-emerald-500/20 text-black-300 border-emerald-500/40"
            : "bg-red-500/20 text-black-300 border-red-500/40"
        }`}
      >
        {isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Advertisements</h1>
            <p className="text-sm text-slate-400 mt-1">Create and manage advertisements</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
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
              Create Advertisement
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Total</p>
            <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.active}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs uppercase text-slate-400">Inactive</p>
            <p className="mt-2 text-2xl font-semibold text-red-400">{stats.inactive}</p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by offer name, tagline, city, state..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:w-48 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-700 bg-slate-950 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="grid gap-4">
          {loading && items.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-slate-300">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center">
              <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No advertisements found</h3>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Advertisement
              </button>
            </div>
          ) : (
            filtered.map((ad) => (
              <div
                key={ad.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
              >
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                    {ad.logoUrl ? (
                      <img src={ad.logoUrl} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-600" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">{ad.offerName}</h3>
                      {statusBadge(ad.status)}
                    </div>

                    <p className="text-sm text-slate-400">{ad.tagLine}</p>

                    <div className="text-sm text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong className="text-slate-200">Category:</strong> {ad.offerCategory}</span>
                      <span><strong className="text-slate-200">City:</strong> {ad.city}, {ad.state}</span>
                      <span><strong className="text-slate-200">Pincode:</strong> {ad.pincode}</span>
                      <span><strong className="text-slate-200">Clicks:</strong> {ad.clicked ?? 0}</span>
                    </div>

                    <div className="text-xs text-slate-500">
                      {ad.startDate?.slice(0,10)} → {ad.endDate?.slice(0,10)}
                    </div>

                    {ad.website && (
                      <a
                        href={ad.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        Website <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {ad.offerImageUrl && (
                      <div className="pt-2">
                        <img
                          src={ad.offerImageUrl}
                          alt="offer"
                          className="h-28 w-44 object-cover rounded-lg border border-slate-700"
                          onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => openEdit(ad)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {(isCreateOpen || isEditOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isEditOpen ? "Edit Advertisement" : "Create Advertisement"}
                </h3>
                <button
                  onClick={closeModals}
                  disabled={saving || uploadingOfferImage || uploadingLogo}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-sm font-medium text-slate-200 mb-2">Offer Image</p>
                  {form.offerImageUrl ? (
                    <img
                      src={form.offerImageUrl}
                      className="w-full h-40 object-cover rounded-lg border border-slate-700 mb-3"
                      alt="offer"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                      No image
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingOfferImage || saving}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadOfferImage(f);
                    }}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700"
                  />
                  {uploadingOfferImage && (
                    <p className="text-xs text-slate-400 mt-2">Uploading...</p>
                  )}
                  {form.offerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, offerImageUrl: null }))}
                      className="mt-2 text-xs text-red-300 hover:text-red-200"
                    >
                      Remove offer image
                    </button>
                  )}
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-sm font-medium text-slate-200 mb-2">Logo</p>
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      className="w-full h-40 object-cover rounded-lg border border-slate-700 mb-3"
                      alt="logo"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                      No logo
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo || saving}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadLogo(f);
                    }}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-100 hover:file:bg-slate-700"
                  />
                  {uploadingLogo && (
                    <p className="text-xs text-slate-400 mt-2">Uploading...</p>
                  )}
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, logoUrl: null }))}
                      className="mt-2 text-xs text-red-300 hover:text-red-200"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Offer Name *"
                  value={form.offerName}
                  onChange={(v) => setForm((p) => ({ ...p, offerName: v }))}
                />
                <Field
                  label="Tagline"
                  value={form.tagLine}
                  onChange={(v) => setForm((p) => ({ ...p, tagLine: v }))}
                />

                <TextArea
                  label="Description"
                  value={form.description}
                  onChange={(v) => setForm((p) => ({ ...p, description: v }))}
                />

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    label="Contact *"
                    value={form.contact}
                    onChange={(v) => setForm((p) => ({ ...p, contact: v }))}
                  />
                  <Field
                    label="Offer Category *"
                    value={form.offerCategory}
                    onChange={(v) => setForm((p) => ({ ...p, offerCategory: v }))}
                  />
                  <Field
                    label="Website"
                    value={form.website}
                    onChange={(v) => setForm((p) => ({ ...p, website: v }))}
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field
                    label="State *"
                    value={form.state}
                    onChange={(v) => setForm((p) => ({ ...p, state: v }))}
                  />
                  <Field
                    label="City *"
                    value={form.city}
                    onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                  />
                  <Field
                    label="Pincode *"
                    value={form.pincode}
                    onChange={(v) => setForm((p) => ({ ...p, pincode: v }))}
                  />
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Status }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  disabled={saving || uploadingOfferImage || uploadingLogo}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={isEditOpen ? handleUpdate : handleCreate}
                  disabled={saving || uploadingOfferImage || uploadingLogo}
                  className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-medium hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {isEditOpen ? "Update" : "Create"}
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

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  );
}

function TextArea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm text-slate-300 mb-1">{props.label}</label>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 min-h-[110px] resize-y"
      />
    </div>
  );
}
