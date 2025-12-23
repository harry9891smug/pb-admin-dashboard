"use client";
import React, { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import { 
  getBusinesses, 
  Business, 
  getAdminInvoices,
  getAdminInvoiceById,
  updateAdminInvoice,
  deleteAdminInvoice,
  updateAdminInvoiceItems,
  addAdminInvoicePayment,
  resendAdminInvoiceSms,
  createAdminInvoice, // ✅ ADDED
  Invoice,
  InvoiceItem
} from "@/lib/api";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  CreditCard,
  Send,
  Download,
  MoreVertical,
  Calendar,
  Phone,
  User,
  Building2,
  FileText,
  IndianRupee,
  ChevronDown,
  Printer,
  Copy,
  Share2,
  Mail
} from "lucide-react";

export default function AdminInvoicesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | "">("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    partial: 0,
    totalAmount: 0,
    paidAmount: 0,
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false); // ✅ ADDED
  
  // Selected invoice
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  
  // Forms
  const [editForm, setEditForm] = useState({
    customerName: "",
    customerMobile: "",
    customerCompany: "",
    customerGst: "",
    customerAddress: "",
    notes: "",
    paymentStatus: "unpaid" as "unpaid" | "partial" | "paid",
    paidAmount: 0,
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    notes: "",
  });

  const [itemsForm, setItemsForm] = useState<InvoiceItem[]>([
    { name: "", price: 0, qty: 1 }
  ]);

  // ✅ CREATE FORM STATE
  const [createForm, setCreateForm] = useState({
    businessId: 0,
    customerMobile: "",
    customerName: "",
    customerCompany: "",
    customerGst: "",
    customerAddress: "",
    notes: "",
    discountAmount: 0,
    paidAmount: 0,
    sendSms: false,
    includeAmountInSms: true,
  });

  const [createItems, setCreateItems] = useState<InvoiceItem[]>([
    { name: "", price: 0, qty: 1 }
  ]);

  // Loading states
  const [viewLoading, setViewLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(false);
  const [resendingSms, setResendingSms] = useState(false);
  const [creating, setCreating] = useState(false); // ✅ ADDED

  const fetchBusinesses = async () => {
    try {
      const res = await getBusinesses({ limit: 200, offset: 0 });
      setBusinesses(res.items);

      if (res.items?.length && selectedBusinessId === "") {
        setSelectedBusinessId(res.items[0].id);
        // Set default business in create form
        setCreateForm(prev => ({ ...prev, businessId: res.items[0].id }));
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load businesses");
    }
  };

  const fetchInvoices = async () => {
    if (!selectedBusinessId) return;
    try {
      setLoading(true);
      const res = await getAdminInvoices({
        businessId: Number(selectedBusinessId),
        limit: 50,
        offset: 0,
      });
      
      const items = res.items || [];
      setInvoices(items);
      
      // Calculate stats
      const total = items.length;
      const paid = items.filter(inv => inv.paymentStatus === "paid").length;
      const unpaid = items.filter(inv => inv.paymentStatus === "unpaid").length;
      const partial = items.filter(inv => inv.paymentStatus === "partial").length;
      
      const totalAmount = items.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      const paidAmount = items.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
      
      setStats({
        total,
        paid,
        unpaid,
        partial,
        totalAmount,
        paidAmount,
      });
    } catch (e: any) {
      toast.error(e.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CREATE INVOICE
  const handleCreateInvoice = async () => {
    if (!createForm.businessId) {
      toast.error("Please select a business");
      return;
    }

    if (!createForm.customerMobile || !/^\d{10}$/.test(createForm.customerMobile)) {
      toast.error("Valid 10-digit mobile number required");
      return;
    }

    // Validate items
    const validItems = createItems.filter(item => 
      item.name.trim() && item.price > 0 && item.qty > 0
    );
    
    if (validItems.length === 0) {
      toast.error("At least one valid item required");
      return;
    }

    try {
      setCreating(true);
      const data = {
        businessId: createForm.businessId,
        customerMobile: createForm.customerMobile,
        customerName: createForm.customerName || undefined,
        customerCompany: createForm.customerCompany || undefined,
        customerGst: createForm.customerGst || undefined,
        customerAddress: createForm.customerAddress || undefined,
        items: validItems,
        notes: createForm.notes || undefined,
        discountAmount: createForm.discountAmount,
        paidAmount: createForm.paidAmount,
        sendSms: createForm.sendSms,
        includeAmountInSms: createForm.includeAmountInSms,
      };

      await createAdminInvoice(data);
      toast.success("Invoice created successfully!");
      setCreateModalOpen(false);
      
      // Reset create form
      setCreateForm({
        businessId: selectedBusinessId ? Number(selectedBusinessId) : 0,
        customerMobile: "",
        customerName: "",
        customerCompany: "",
        customerGst: "",
        customerAddress: "",
        notes: "",
        discountAmount: 0,
        paidAmount: 0,
        sendSms: false,
        includeAmountInSms: true,
      });
      setCreateItems([{ name: "", price: 0, qty: 1 }]);
      
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  // ✅ VIEW INVOICE DETAILS
  const handleViewInvoice = async (invoice: Invoice) => {
    try {
      setViewLoading(true);
      setSelectedInvoice(invoice);
      setViewModalOpen(true);
      
      // Fetch full details
      const details = await getAdminInvoiceById(invoice.id);
      setInvoiceDetails(details);
    } catch (err: any) {
      toast.error(err.message || "Failed to load invoice details");
      // Still show basic info
      setInvoiceDetails(invoice);
    } finally {
      setViewLoading(false);
    }
  };

  // ✅ EDIT INVOICE
  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      customerName: invoice.customerName || "",
      customerMobile: invoice.customerMobile,
      customerCompany: invoice.customerCompany || "",
      customerGst: invoice.customerGst || "",
      customerAddress: invoice.customerAddress || "",
      notes: invoice.notes || "",
      paymentStatus: invoice.paymentStatus,
      paidAmount: parseFloat(invoice.paidAmount),
    });
    setEditModalOpen(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    
    if (!editForm.customerMobile || !/^\d{10}$/.test(editForm.customerMobile)) {
      toast.error("Valid 10-digit mobile number required");
      return;
    }

    try {
      setUpdating(true);
      await updateAdminInvoice(selectedInvoice.id, editForm);
      toast.success("Invoice updated successfully!");
      setEditModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Failed to update invoice");
    } finally {
      setUpdating(false);
    }
  };

  // ✅ ADD PAYMENT
  const handleAddPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount),
      notes: "",
    });
    setPaymentModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedInvoice) return;
    
    if (paymentForm.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    const remaining = parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.paidAmount);
    if (paymentForm.amount > remaining) {
      toast.error(`Amount cannot exceed remaining balance ₹${remaining}`);
      return;
    }

    try {
      setAddingPayment(true);
      await addAdminInvoicePayment(
        selectedInvoice.id, 
        paymentForm.amount, 
        paymentForm.notes
      );
      toast.success("Payment added successfully!");
      setPaymentModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Failed to add payment");
    } finally {
      setAddingPayment(false);
    }
  };

  // ✅ EDIT ITEMS
  const handleEditItems = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setItemsForm(invoice.items || [{ name: "", price: 0, qty: 1 }]);
    setItemsModalOpen(true);
  };

  const handleUpdateItems = async () => {
    if (!selectedInvoice) return;
    
    // Validate items
    const validItems = itemsForm.filter(item => 
      item.name.trim() && item.price > 0 && item.qty > 0
    );
    
    if (validItems.length === 0) {
      toast.error("At least one valid item required");
      return;
    }

    try {
      setUpdatingItems(true);
      await updateAdminInvoiceItems(selectedInvoice.id, validItems);
      toast.success("Invoice items updated successfully!");
      setItemsModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message || "Failed to update items");
    } finally {
      setUpdatingItems(false);
    }
  };

  // ✅ DELETE INVOICE
  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDeleteModalOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      setDeleting(true);
      await deleteAdminInvoice(selectedInvoice.id);
      toast.success("Invoice deleted successfully!");
      setDeleteModalOpen(false);
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
      }));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ RESEND SMS
  const handleResendSms = async (invoice: Invoice) => {
    try {
      setResendingSms(true);
      await resendAdminInvoiceSms(invoice.id);
      toast.success("SMS resent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend SMS");
    } finally {
      setResendingSms(false);
    }
  };

  // ✅ UTILITIES
  const getPaymentStatusBadge = (status: string) => {
    const config: any = {
      paid: { class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "Paid" },
      unpaid: { class: "bg-red-500/20 text-red-300 border-red-500/40", label: "Unpaid" },
      partial: { class: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", label: "Partial" },
    };
    const c = config[status] || config.unpaid;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      invoice.customerMobile.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate create form totals
  const calculateCreateSubtotal = () => {
    return createItems.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const calculateCreateTotal = () => {
    const subtotal = calculateCreateSubtotal();
    const discount = createForm.discountAmount || 0;
    return Math.max(0, subtotal - discount);
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedBusinessId]);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices Management</h1>
            <p className="text-sm text-slate-400 mt-1">Manage and monitor all business invoices</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </button>
            <button
              onClick={fetchInvoices}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Invoices</p>
                <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Paid</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-400">{stats.paid}</p>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Unpaid</p>
                <p className="mt-2 text-2xl font-semibold text-red-400">{stats.unpaid}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total Amount</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-400">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <IndianRupee className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Business Select & Filters */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Business Select */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Business
              </label>
              <div className="relative">
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(Number(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
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

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Invoices
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by invoice number, customer name or mobile..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Filter by Status
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {filteredInvoices.length} invoices {loading && <span className="ml-2">• Loading...</span>}
            </p>
            {selectedBusinessId && (
              <div className="text-sm text-slate-400">
                Business: {businesses.find(b => b.id === selectedBusinessId)?.businessname}
              </div>
            )}
          </div>

          {loading && filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-4"></div>
              <p className="text-slate-300">Loading invoices...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No invoices found</h3>
              <p className="text-sm text-slate-500">
                {selectedBusinessId ? "This business has no invoices yet" : "Select a business to view invoices"}
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400" />
                            <h3 className="font-semibold text-slate-100">{invoice.invoiceNumber}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-400">
                              {invoice.customerName || "No Name"}
                            </span>
                            {getPaymentStatusBadge(invoice.paymentStatus)}
                          </div>
                        </div>
                        <div className="lg:hidden">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-100">
                              {formatCurrency(invoice.totalAmount)}
                            </p>
                            <p className="text-sm text-slate-400">
                              Paid: {formatCurrency(invoice.paidAmount)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span>{invoice.customerMobile}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400">
                          <CreditCard className="w-4 h-4" />
                          <span>Balance: {formatCurrency(parseFloat(invoice.totalAmount) - parseFloat(invoice.paidAmount))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-3">
                      <div className="hidden lg:block text-right">
                        <p className="text-xl font-semibold text-slate-100">
                          {formatCurrency(invoice.totalAmount)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Paid: {formatCurrency(invoice.paidAmount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* VIEW */}
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* ADD PAYMENT */}
                        {invoice.paymentStatus !== "paid" && (
                          <button
                            onClick={() => handleAddPayment(invoice)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Add Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}

                        {/* EDIT ITEMS */}
                        <button
                          onClick={() => handleEditItems(invoice)}
                          className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                          title="Edit Items"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* RESEND SMS */}
                        <button
                          onClick={() => handleResendSms(invoice)}
                          disabled={resendingSms}
                          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Resend SMS"
                        >
                          <Send className="w-4 h-4" />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => handleDeleteInvoice(invoice)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Invoice"
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
      {/* ✅ CREATE INVOICE MODAL */}
      {/* ========================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Invoice</h3>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                className="text-slate-400 hover:text-white"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Business Selection */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Business Details</h4>
                <select
                  value={createForm.businessId}
                  onChange={(e) => setCreateForm({...createForm, businessId: Number(e.target.value)})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={creating}
                >
                  <option value={0}>Select a business</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.businessname} {b.city ? `- ${b.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Information */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Customer Mobile *</label>
                    <input
                      type="text"
                      value={createForm.customerMobile}
                      onChange={(e) => setCreateForm({...createForm, customerMobile: e.target.value.replace(/\D/g, "").slice(0, 10)})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={createForm.customerName}
                      onChange={(e) => setCreateForm({...createForm, customerName: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      placeholder="Optional"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Company</label>
                    <input
                      type="text"
                      value={createForm.customerCompany}
                      onChange={(e) => setCreateForm({...createForm, customerCompany: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      placeholder="Optional"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={createForm.customerGst}
                      onChange={(e) => setCreateForm({...createForm, customerGst: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      placeholder="Optional"
                      disabled={creating}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm text-slate-300 mb-1">Address</label>
                  <textarea
                    value={createForm.customerAddress}
                    onChange={(e) => setCreateForm({...createForm, customerAddress: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[80px]"
                    placeholder="Optional"
                    disabled={creating}
                  />
                </div>
              </div>

              {/* Invoice Items */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-slate-200">Invoice Items *</h4>
                  <button
                    type="button"
                    onClick={() => setCreateItems([...createItems, { name: "", price: 0, qty: 1 }])}
                    className="text-sm text-blue-400 hover:text-blue-300"
                    disabled={creating}
                  >
                    + Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {createItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg bg-slate-900/60">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...createItems];
                            newItems[index].name = e.target.value;
                            setCreateItems(newItems);
                          }}
                          placeholder="Item name"
                          className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none mb-2"
                          disabled={creating}
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...createItems];
                              newItems[index].price = parseFloat(e.target.value) || 0;
                              setCreateItems(newItems);
                            }}
                            placeholder="Price"
                            className="w-1/2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                            disabled={creating}
                            min={0}
                            step={0.01}
                          />
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              const newItems = [...createItems];
                              newItems[index].qty = parseInt(e.target.value) || 1;
                              setCreateItems(newItems);
                            }}
                            placeholder="Qty"
                            className="w-1/2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                            disabled={creating}
                            min={1}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (createItems.length > 1) {
                            const newItems = createItems.filter((_, i) => i !== index);
                            setCreateItems(newItems);
                          }
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        disabled={creating || createItems.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Discount */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Payment & Discount</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Discount Amount (₹)</label>
                    <input
                      type="number"
                      value={createForm.discountAmount}
                      onChange={(e) => setCreateForm({...createForm, discountAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      min={0}
                      max={calculateCreateSubtotal()}
                      step={0.01}
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Paid Amount (₹)</label>
                    <input
                      type="number"
                      value={createForm.paidAmount}
                      onChange={(e) => setCreateForm({...createForm, paidAmount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      min={0}
                      max={calculateCreateTotal()}
                      step={0.01}
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Notes</label>
                    <textarea
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[80px]"
                      placeholder="Optional notes"
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>

              {/* SMS Options */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">SMS Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createForm.sendSms}
                      onChange={(e) => setCreateForm({...createForm, sendSms: e.target.checked})}
                      className="mr-2"
                      disabled={creating}
                    />
                    <span className="text-sm text-slate-300">Send SMS to customer</span>
                  </label>
                  {createForm.sendSms && (
                    <label className="flex items-center ml-6">
                      <input
                        type="checkbox"
                        checked={createForm.includeAmountInSms}
                        onChange={(e) => setCreateForm({...createForm, includeAmountInSms: e.target.checked})}
                        className="mr-2"
                        disabled={creating}
                      />
                      <span className="text-sm text-slate-300">Include amount in SMS</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Invoice Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Subtotal</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {formatCurrency(calculateCreateSubtotal())}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Discount</p>
                    <p className="text-lg font-semibold text-red-400">
                      - {formatCurrency(createForm.discountAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="text-xl font-bold text-emerald-400">
                      {formatCurrency(calculateCreateTotal())}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={creating || !createForm.businessId || !createForm.customerMobile || !/^\d{10}$/.test(createForm.customerMobile)}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ VIEW INVOICE MODAL */}
      {/* ========================= */}
      {viewModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Invoice Details</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedInvoice.invoiceNumber} • {formatDate(selectedInvoice.createdAt)}
                </p>
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-white">
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
                {/* Invoice Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Info label="Invoice Number" value={selectedInvoice.invoiceNumber} />
                    <Info label="Customer Name" value={invoiceDetails?.customerName || "—"} />
                    <Info label="Customer Mobile" value={selectedInvoice.customerMobile} />
                    <Info label="Customer Company" value={invoiceDetails?.customerCompany || "—"} />
                  </div>
                  <div className="space-y-3">
                    <Info label="Business" value={
                      invoiceDetails?.business?.businessname || invoiceDetails?.business?.name || "—"
                    } />
                    <Info label="Payment Status" value={
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                        selectedInvoice.paymentStatus === 'paid' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : selectedInvoice.paymentStatus === 'unpaid'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {selectedInvoice.paymentStatus}
                      </span>
                    } />
                    <Info label="Total Amount" value={formatCurrency(selectedInvoice.totalAmount)} />
                    <Info label="Paid Amount" value={formatCurrency(selectedInvoice.paidAmount)} />
                  </div>
                </div>

                {/* Items Table */}
                {(invoiceDetails?.items && invoiceDetails.items.length > 0) && (
                  <div className="rounded-lg border border-slate-800 overflow-hidden">
                    <div className="bg-slate-900/60 p-3">
                      <h4 className="font-medium text-slate-200">Invoice Items</h4>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950/50 text-slate-300">
                        <tr>
                          <th className="text-left p-3">Item Name</th>
                          <th className="text-left p-3">Price</th>
                          <th className="text-left p-3">Qty</th>
                          <th className="text-left p-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.items.map((item, index) => (
                          <tr key={index} className="border-t border-slate-800">
                            <td className="p-3">{item.name}</td>
                            <td className="p-3">{formatCurrency(item.price)}</td>
                            <td className="p-3">{item.qty}</td>
                            <td className="p-3 font-medium">
                              {formatCurrency(item.price * item.qty)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Amount Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Subtotal</p>
                    <p className="text-xl font-semibold text-slate-100 mt-1">
                      {formatCurrency(invoiceDetails?.subtotal || selectedInvoice.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Discount</p>
                    <p className="text-xl font-semibold text-red-400 mt-1">
                      {formatCurrency(invoiceDetails?.discountAmount || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-xs text-slate-400">Balance Due</p>
                    <p className="text-xl font-semibold text-emerald-400 mt-1">
                      {formatCurrency(
                        parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.paidAmount)
                      )}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {invoiceDetails?.notes && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <h4 className="font-medium text-slate-200 mb-2">Notes</h4>
                    <p className="text-slate-300 whitespace-pre-line">{invoiceDetails.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleEditInvoice(selectedInvoice)}
                    className="px-4 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
                  >
                    Edit Invoice
                  </button>
                  {selectedInvoice.paymentStatus !== "paid" && (
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        handleAddPayment(selectedInvoice);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600"
                    >
                      Add Payment
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ EDIT INVOICE MODAL */}
      {/* ========================= */}
      {editModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Invoice</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white" disabled={updating}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({...editForm, customerName: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Mobile *</label>
                  <input
                    type="text"
                    value={editForm.customerMobile}
                    onChange={(e) => setEditForm({...editForm, customerMobile: e.target.value})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.customerCompany}
                  onChange={(e) => setEditForm({...editForm, customerCompany: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">GST Number</label>
                <input
                  type="text"
                  value={editForm.customerGst}
                  onChange={(e) => setEditForm({...editForm, customerGst: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                <textarea
                  value={editForm.customerAddress}
                  onChange={(e) => setEditForm({...editForm, customerAddress: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[80px]"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[80px]"
                  disabled={updating}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Payment Status</label>
                  <select
                    value={editForm.paymentStatus}
                    onChange={(e) => setEditForm({...editForm, paymentStatus: e.target.value as any})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={editForm.paidAmount}
                    onChange={(e) => setEditForm({...editForm, paidAmount: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                    min={0}
                    max={parseFloat(selectedInvoice.totalAmount)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInvoice}
                disabled={updating || !editForm.customerMobile || !/^\d{10}$/.test(editForm.customerMobile)}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ ADD PAYMENT MODAL */}
      {/* ========================= */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Payment</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-white" disabled={addingPayment}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm text-slate-400">Invoice: {selectedInvoice.invoiceNumber}</p>
                <p className="text-lg font-semibold text-slate-100 mt-1">
                  Total: {formatCurrency(selectedInvoice.totalAmount)}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Paid: {formatCurrency(selectedInvoice.paidAmount)} • 
                  Balance: {formatCurrency(parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.paidAmount))}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={addingPayment}
                  min={0.01}
                  max={parseFloat(selectedInvoice.totalAmount) - parseFloat(selectedInvoice.paidAmount)}
                  step={0.01}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none min-h-[80px]"
                  disabled={addingPayment}
                  placeholder="Payment method, transaction ID, etc."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={addingPayment}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={addingPayment || paymentForm.amount <= 0}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Add Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ EDIT ITEMS MODAL */}
      {/* ========================= */}
      {itemsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Invoice Items</h3>
              <button onClick={() => setItemsModalOpen(false)} className="text-slate-400 hover:text-white" disabled={updatingItems}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm text-slate-400">Invoice: {selectedInvoice.invoiceNumber}</p>
                <p className="text-sm text-slate-300 mt-1">Add, edit or remove items from the invoice</p>
              </div>

              <div className="space-y-3">
                {itemsForm.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg bg-slate-900/40">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...itemsForm];
                          newItems[index].name = e.target.value;
                          setItemsForm(newItems);
                        }}
                        placeholder="Item name"
                        className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none mb-2"
                        disabled={updatingItems}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const newItems = [...itemsForm];
                            newItems[index].price = parseFloat(e.target.value) || 0;
                            setItemsForm(newItems);
                          }}
                          placeholder="Price"
                          className="w-1/2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                          disabled={updatingItems}
                          min={0}
                          step={0.01}
                        />
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const newItems = [...itemsForm];
                            newItems[index].qty = parseInt(e.target.value) || 1;
                            setItemsForm(newItems);
                          }}
                          placeholder="Qty"
                          className="w-1/2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                          disabled={updatingItems}
                          min={1}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (itemsForm.length > 1) {
                          const newItems = itemsForm.filter((_, i) => i !== index);
                          setItemsForm(newItems);
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      disabled={updatingItems || itemsForm.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setItemsForm([...itemsForm, { name: "", price: 0, qty: 1 }])}
                className="w-full py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 transition-colors"
                disabled={updatingItems}
              >
                + Add Item
              </button>

              {/* Summary */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Subtotal</p>
                    <p className="text-lg font-semibold text-slate-100">
                      {formatCurrency(itemsForm.reduce((sum, item) => sum + (item.price * item.qty), 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Number of Items</p>
                    <p className="text-lg font-semibold text-slate-100">{itemsForm.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setItemsModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={updatingItems}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateItems}
                disabled={updatingItems}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updatingItems ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Update Items
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ DELETE CONFIRMATION MODAL */}
      {/* ========================= */}
      {deleteModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Delete Invoice</h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-slate-400 hover:text-white" disabled={deleting}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-sm text-red-300">This action cannot be undone!</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm text-slate-400">Invoice Details</p>
                <p className="font-medium text-slate-100 mt-1">{selectedInvoice.invoiceNumber}</p>
                <p className="text-sm text-slate-400 mt-1">Customer: {selectedInvoice.customerName || selectedInvoice.customerMobile}</p>
                <p className="text-sm text-slate-400">Amount: {formatCurrency(selectedInvoice.totalAmount)}</p>
                <p className="text-sm text-slate-400">Created: {formatDate(selectedInvoice.createdAt)}</p>
              </div>

              <p className="text-sm text-slate-300">
                This will permanently delete the invoice and all related items and SMS logs.
                Are you sure you want to continue?
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteInvoice}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Invoice
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
  const renderValue = () => {
    if (React.isValidElement(value)) {
      return value;
    }
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value;
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100 break-words">{renderValue()}</p>
    </div>
  );
}