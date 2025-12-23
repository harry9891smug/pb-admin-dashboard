"use client";
import React, { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { toast } from "react-hot-toast";
import { 
  getBusinesses, 
  Business,
  User,
  subscriptionApi,
  SubscriptionPlan,
  SubscriptionFilters,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  formatCurrency,
  getAdminUsers
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
  Calendar,
  Users,
  Building2,
  FileText,
  IndianRupee,
  ChevronDown,
  Crown,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Percent,
  Mail,
  Phone,
  User as UserIcon,
  MoreVertical,
  Download,
  Copy,
  ExternalLink,
  BarChart3,
  Bell,
  Send,
  Check,
  X as XIcon,
  Play,
  Pause,
  Award,
  Gift,
  Sparkles,
  Star,
  Briefcase
} from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    trial: 0,
    cancelled: 0,
    basic: 0,
    standard: 0,
    premium: 0,
  });

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  
  // Selected subscription
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionPlan | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionPlan | null>(null);
  
  // Forms
  const [createForm, setCreateForm] = useState({
    userId: 0,
    plan: "basic" as "basic" | "standard" | "premium",
    status: "active" as "trial" | "active" | "cancelled",
    trialDays: 14,
    startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD format
  });

  const [editForm, setEditForm] = useState<UpdateSubscriptionInput>({
    plan: "basic",
    status: "active",
    trialStartsAt: null,
    trialEndsAt: null,
    currentPeriodEnd: null,
    nextRenewalAt: null,
  });

  // Business-User mapping
  const [businessUserMap, setBusinessUserMap] = useState<Array<{
    business: Business;
    user: User;
  }>>([]);
  
  // Loading states
  const [viewLoading, setViewLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [fetchingBusinesses, setFetchingBusinesses] = useState(false);

  // Fetch businesses with owners
  const fetchBusinessesWithOwners = async () => {
    try {
      setFetchingBusinesses(true);
      const res = await getBusinesses({ 
        limit: 200, 
        offset: 0,
        includeOwner: true // Assuming your API supports this
      });
      
      setBusinesses(res.items);
      
      // Create business-user mapping
      const mapping = res.items
        .filter(business => business.owner)
        .map(business => ({
          business,
          user: business.owner as User
        }));
      
      setBusinessUserMap(mapping);
    } catch (e: any) {
      toast.error(e.message || "Failed to load businesses");
    } finally {
      setFetchingBusinesses(false);
    }
  };

  // Fetch all subscriptions
  const fetchSubscriptions = async (filters?: SubscriptionFilters) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getAdminSubscriptions(filters);
      const subs = response.data.subscriptions;
      setSubscriptions(subs);
      
      // Calculate stats
      const total = subs.length;
      const active = subs.filter(sub => sub.status === "active").length;
      const trial = subs.filter(sub => sub.status === "trial").length;
      const cancelled = subs.filter(sub => sub.status === "cancelled").length;
      const basic = subs.filter(sub => sub.plan === "basic").length;
      const standard = subs.filter(sub => sub.plan === "standard").length;
      const premium = subs.filter(sub => sub.plan === "premium").length;
      
      setStats({
        total,
        active,
        trial,
        cancelled,
        basic,
        standard,
        premium,
      });
    } catch (error: any) {
      console.error("Error fetching subscriptions:", error);
      toast.error(error.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  // Create subscription
  const handleCreateSubscription = async () => {
    // ✅ FIX: Validate business selection
    if (!createForm.userId) {
      toast.error("Please select a business");
      return;
    }

    // ✅ FIX: Validate dates
    if (!createForm.startDate || !createForm.endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    // ✅ FIX: Ensure end date is after start date
    const startDate = new Date(createForm.startDate);
    const endDate = new Date(createForm.endDate);
    
    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    // ✅ FIX: Convert to proper CreateSubscriptionInput
    const subscriptionInput: CreateSubscriptionInput = {
      userId: createForm.userId,
      plan: createForm.plan,
      status: createForm.status,
      trialDays: createForm.trialDays,
      startDate: `${createForm.startDate}T00:00:00.000Z`, 
    endDate: `${createForm.endDate}T23:59:59.999Z`,
    };

    try {
      setCreating(true);
      const response = await subscriptionApi.createAdminSubscription(subscriptionInput);
      toast.success("Subscription created successfully!");
      setCreateModalOpen(false);
      
      // Reset form
      setCreateForm({
        userId: 0,
        plan: "basic",
        status: "active",
        trialDays: 14,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      
      fetchSubscriptions();
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setCreating(false);
    }
  };

  // View subscription details
  const handleViewSubscription = async (subscription: SubscriptionPlan) => {
    try {
      setViewLoading(true);
      setSelectedSubscription(subscription);
      setViewModalOpen(true);
      
      const response = await subscriptionApi.getAdminSubscriptionById(subscription.id);
      setSubscriptionDetails(response.data.subscription);
    } catch (error: any) {
      toast.error(error.message || "Failed to load subscription details");
      setSubscriptionDetails(subscription);
    } finally {
      setViewLoading(false);
    }
  };

  // Edit subscription
  const handleEditSubscription = (subscription: SubscriptionPlan) => {
    setSelectedSubscription(subscription);
    setEditForm({
      plan: subscription.plan,
      status: subscription.status,
      trialStartsAt: subscription.trialStartsAt,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextRenewalAt: subscription.nextRenewalAt,
    });
    setEditModalOpen(true);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      setUpdating(true);
      await subscriptionApi.updateAdminSubscription(selectedSubscription.id, editForm);
      toast.success("Subscription updated successfully!");
      setEditModalOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setUpdating(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = (subscription: SubscriptionPlan) => {
    setSelectedSubscription(subscription);
    setCancelModalOpen(true);
  };

  const confirmCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    if (selectedSubscription.status === "cancelled") {
      toast.error("Subscription is already cancelled");
      setCancelModalOpen(false);
      return;
    }

    try {
      setCancelling(true);
      await subscriptionApi.cancelAdminSubscription(selectedSubscription.id);
      toast.success("Subscription cancelled successfully!");
      setCancelModalOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  // Get plan badge
  const getPlanBadge = (plan: string) => {
    const config: any = {
      basic: { class: "bg-blue-500/20 text-blue-300 border-blue-500/40", label: "Basic", icon: <Zap className="w-3 h-3" /> },
      standard: { class: "bg-purple-500/20 text-purple-300 border-purple-500/40", label: "Standard", icon: <Award className="w-3 h-3" /> },
      premium: { class: "bg-amber-500/20 text-amber-300 border-amber-500/40", label: "Premium", icon: <Crown className="w-3 h-3" /> },
    };
    const c = config[plan] || config.basic;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.class}`}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: any = {
      active: { class: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", label: "Active" },
      trial: { class: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", label: "Trial" },
      cancelled: { class: "bg-red-500/20 text-red-300 border-red-500/40", label: "Cancelled" },
    };
    const c = config[status] || config.active;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.class}`}>
        {c.label}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Get plan benefits
  const getPlanBenefits = (plan: string) => {
    try {
      return subscriptionApi.getSubscriptionBenefits(plan);
    } catch {
      return {
        offers: plan === "basic" ? 5 : plan === "standard" ? 10 : 20,
        sms: plan === "basic" ? 400 : plan === "standard" ? 600 : 1000,
        features: ["Basic Features"]
      };
    }
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.business?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.business?.businessname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.business?.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.business?.owner?.mobile?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    const matchesPlan = planFilter === "all" || subscription.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate trial days remaining
  const getTrialDaysRemaining = (subscription: SubscriptionPlan) => {
    if (!subscription.trialEndsAt) return null;
    try {
      return subscriptionApi.getTrialDaysRemaining(subscription);
    } catch {
      return 0;
    }
  };

  // Initialize
  useEffect(() => {
    fetchBusinessesWithOwners();
    fetchSubscriptions();
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Subscriptions Management</h1>
            <p className="text-sm text-slate-400 mt-1">Manage all business subscriptions and plans</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Subscription
            </button>
            <button
              onClick={() => fetchSubscriptions()}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Total</p>
                <p className="mt-2 text-2xl font-semibold">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
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
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Trial</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-400">{stats.trial}</p>
              </div>
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Basic</p>
                <p className="mt-2 text-2xl font-semibold text-blue-400">{stats.basic}</p>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Standard</p>
                <p className="mt-2 text-2xl font-semibold text-purple-400">{stats.standard}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Premium</p>
                <p className="mt-2 text-2xl font-semibold text-amber-400">{stats.premium}</p>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-slate-400">Cancelled</p>
                <p className="mt-2 text-2xl font-semibold text-red-400">{stats.cancelled}</p>
              </div>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Subscriptions
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by business, email, mobile..."
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
                Status Filter
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
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Plan Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Plan Filter
              </label>
              <div className="relative">
                <Crown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                >
                  <option value="all">All Plans</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sort By
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={loading}
                  onChange={(e) => {
                    // Sort functionality can be added here
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="plan">Plan (A-Z)</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Showing {filteredSubscriptions.length} subscriptions {loading && <span className="ml-2">• Loading...</span>}
            </p>
            <div className="text-sm text-slate-400">
              Last updated: {new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {loading && filteredSubscriptions.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-4"></div>
              <p className="text-slate-300">Loading subscriptions...</p>
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center">
              <Crown className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No subscriptions found</h3>
              <p className="text-sm text-slate-500">
                {searchTerm ? "No subscriptions match your search" : "No subscriptions available yet"}
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Subscription
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSubscriptions.map((subscription) => {
                const trialDaysLeft = getTrialDaysRemaining(subscription);
                const benefits = getPlanBenefits(subscription.plan);
                
                return (
                  <div key={subscription.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-emerald-400" />
                              <h3 className="font-semibold text-slate-100">
                                {subscription.business?.name || subscription.business?.businessname || "Unnamed Business"}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {getPlanBadge(subscription.plan)}
                              {getStatusBadge(subscription.status)}
                              {trialDaysLeft !== null && subscription.status === "trial" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {trialDaysLeft} days left
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="lg:hidden">
                            <div className="text-right">
                              <p className="text-sm text-slate-400">Renewal</p>
                              <p className="text-sm text-slate-100">
                                {subscription.nextRenewalAt ? formatDate(subscription.nextRenewalAt) : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <UserIcon className="w-4 h-4" />
                            <span>{subscription.business?.owner?.email || "No email"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400">
                            <Phone className="w-4 h-4" />
                            <span>{subscription.business?.owner?.mobile || "No mobile"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Started: {formatDate(subscription.createdAt)}</span>
                          </div>
                        </div>

                        {/* Plan Benefits */}
                        <div className="pt-3 border-t border-slate-800">
                          <p className="text-xs text-slate-400 mb-2">Plan Benefits</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              {benefits.offers} Offers
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-500/10 text-green-300 text-xs">
                              <Send className="w-3 h-3 mr-1" />
                              {benefits.sms} SMS
                            </span>
                            {benefits.features.slice(0, 2).map((feature: string, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300 text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-3">
                        <div className="hidden lg:block text-right">
                          <p className="text-sm text-slate-400">Next Renewal</p>
                          <p className="text-lg font-semibold text-slate-100">
                            {subscription.nextRenewalAt ? formatDate(subscription.nextRenewalAt) : "—"}
                          </p>
                          <p className="text-sm text-slate-400 mt-1">
                            {subscription.currentPeriodEnd && `Ends: ${formatDate(subscription.currentPeriodEnd)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* VIEW */}
                          <button
                            onClick={() => handleViewSubscription(subscription)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* EDIT */}
                          <button
                            onClick={() => handleEditSubscription(subscription)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit Subscription"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* CANCEL (if active) */}
                          {subscription.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelSubscription(subscription)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Cancel Subscription"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          )}

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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================= */}
      {/* ✅ CREATE SUBSCRIPTION MODAL - FIXED */}
      {/* ========================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Subscription</h3>
              <button 
                onClick={() => setCreateModalOpen(false)} 
                className="text-slate-400 hover:text-white"
                disabled={creating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* ✅ FIXED: Business Selection with Business Name and Owner Mobile */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Select Business *</h4>
                {fetchingBusinesses ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent"></div>
                    <p className="text-sm text-slate-400 mt-2">Loading businesses...</p>
                  </div>
                ) : (
                 <select
  value={createForm.userId}
          onChange={(e) => {
            const userId = Number(e.target.value);
            setCreateForm({...createForm, userId});
          }}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
          disabled={creating}
        >
          <option value={0}>Select a business</option>
          {businessUserMap.map((item) => {

            const name = item.business.name || "Unnamed User";
            const businessName = item.business.businessname || "Unnamed Business";
            const ownerMobile = item.user.mobile || "No Mobile";
            const city = item.business.city || "";
            
            // ये format invoice page की तरह होगा
            return (
              <option key={item.user.id} value={item.user.id}>
                {businessName} : {name} (contact no: {ownerMobile} ) {city && `(${city})`}
              </option>
            );
          })}
        </select>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Only businesses with owners can have subscriptions
                </p>
                
                {/* Show selected business details */}
                {createForm.userId > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700">
                    {(() => {
                      const selected = businessUserMap.find(item => item.user.id === createForm.userId);
                      if (!selected) return null;
                      
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm text-slate-300">
                              Business: {selected.business.name || selected.business.businessname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-slate-300">
                              Owner: {selected.user.mobile}
                            </span>
                          </div>
                          {selected.business.city && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-purple-400" />
                              <span className="text-sm text-slate-300">
                                Location: {selected.business.city}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Plan Selection */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Select Plan *</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["basic", "standard", "premium"].map((plan) => {
                    const benefits = getPlanBenefits(plan);
                    return (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setCreateForm({...createForm, plan: plan as any})}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          createForm.plan === plan
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-slate-700 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {plan === "basic" && <Zap className="w-5 h-5 text-blue-400" />}
                            {plan === "standard" && <Award className="w-5 h-5 text-purple-400" />}
                            {plan === "premium" && <Crown className="w-5 h-5 text-amber-400" />}
                            <span className="font-medium text-slate-100 capitalize">{plan}</span>
                          </div>
                          {createForm.plan === plan && (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                        <ul className="space-y-1 mt-3">
                          <li className="flex items-center text-sm text-slate-300">
                            <Check className="w-3 h-3 mr-2 text-emerald-400" />
                            {benefits.offers} Active Offers
                          </li>
                          <li className="flex items-center text-sm text-slate-300">
                            <Check className="w-3 h-3 mr-2 text-emerald-400" />
                            {benefits.sms} SMS Credits
                          </li>
                          <li className="flex items-center text-sm text-slate-300">
                            <Check className="w-3 h-3 mr-2 text-emerald-400" />
                            {benefits.features[0]}
                          </li>
                        </ul>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ✅ FIXED: Subscription Settings with Date Validation */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Subscription Settings *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Status</label>
                    <select
                      value={createForm.status}
                      onChange={(e) => setCreateForm({...createForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      disabled={creating}
                    >
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Trial Days</label>
                    <input
                      type="number"
                      value={createForm.trialDays}
                      onChange={(e) => setCreateForm({...createForm, trialDays: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      min={0}
                      max={365}
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm({...createForm, startDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      disabled={creating}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Subscription activation date
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm({...createForm, endDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                      disabled={creating}
                      min={createForm.startDate}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Subscription expiry date
                    </p>
                  </div>
                </div>
                
                {/* Date validation message */}
                {createForm.startDate && createForm.endDate && (
                  (() => {
                    const start = new Date(createForm.startDate);
                    const end = new Date(createForm.endDate);
                    const isValid = end > start;
                    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div className={`mt-3 p-2 rounded-lg text-sm ${isValid ? 'bg-emerald-900/20 text-emerald-300' : 'bg-red-900/20 text-red-300'}`}>
                        {isValid 
                          ? `✓ Subscription duration: ${daysDiff} days`
                          : `✗ End date must be after start date`
                        }
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <h4 className="font-medium text-slate-200 mb-2">Subscription Summary</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Plan</span>
                    <span className="text-slate-100 capitalize">{createForm.plan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      createForm.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : createForm.status === 'trial'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {createForm.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Trial Period</span>
                    <span className="text-slate-100">{createForm.trialDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Duration</span>
                    <span className="text-slate-100">
                      {createForm.startDate} to {createForm.endDate}
                    </span>
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
                onClick={handleCreateSubscription}
                disabled={creating || !createForm.userId || !createForm.startDate || !createForm.endDate}
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
                    Create Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ VIEW SUBSCRIPTION MODAL */}
      {/* ========================= */}
      {viewModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Subscription Details</h3>
                <p className="text-xs text-slate-400 mt-1">
                  ID: {selectedSubscription.id} • Created: {formatDate(selectedSubscription.createdAt)}
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
                {/* Subscription Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Info label="Business" value={
                      subscriptionDetails?.business?.name || subscriptionDetails?.business?.businessname || "—"
                    } />
                    <Info label="Business Owner" value={
                      subscriptionDetails?.business?.owner?.email || "—"
                    } />
                    <Info label="Owner Mobile" value={
                      subscriptionDetails?.business?.owner?.mobile || "—"
                    } />
                    <Info label="Plan" value={
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${
                        selectedSubscription.plan === 'basic' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : selectedSubscription.plan === 'standard'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {selectedSubscription.plan === 'basic' && <Zap className="w-3 h-3" />}
                        {selectedSubscription.plan === 'standard' && <Award className="w-3 h-3" />}
                        {selectedSubscription.plan === 'premium' && <Crown className="w-3 h-3" />}
                        {subscriptionApi.formatSubscriptionPlan(selectedSubscription.plan)}
                      </span>
                    } />
                  </div>
                  <div className="space-y-3">
                    <Info label="Status" value={
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                        selectedSubscription.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : selectedSubscription.status === 'trial'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {subscriptionApi.formatSubscriptionStatus(selectedSubscription.status)}
                      </span>
                    } />
                    <Info label="Trial Start" value={formatDate(selectedSubscription.trialStartsAt)} />
                    <Info label="Trial End" value={formatDate(selectedSubscription.trialEndsAt)} />
                    <Info label="Next Renewal" value={formatDate(selectedSubscription.nextRenewalAt)} />
                  </div>
                </div>

                {/* Plan Benefits */}
                <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                  <h4 className="font-medium text-slate-200 mb-2">Plan Benefits</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(() => {
                      const benefits = getPlanBenefits(selectedSubscription.plan);
                      return (
                        <>
                          <div className="text-center p-4 rounded-lg border border-slate-700 bg-slate-900/60">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-3">
                              <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-100">{benefits.offers}</p>
                            <p className="text-sm text-slate-400">Active Offers</p>
                          </div>
                          <div className="text-center p-4 rounded-lg border border-slate-700 bg-slate-900/60">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
                              <Send className="w-6 h-6 text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-100">{benefits.sms}</p>
                            <p className="text-sm text-slate-400">SMS Credits</p>
                          </div>
                          <div className="text-center p-4 rounded-lg border border-slate-700 bg-slate-900/60">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-3">
                              <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-slate-100">{benefits.features.length}</p>
                            <p className="text-sm text-slate-400">Features</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-slate-300">Features:</p>
                    <ul className="mt-2 space-y-1">
                      {getPlanBenefits(selectedSubscription.plan).features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-center text-sm text-slate-400">
                          <Check className="w-3 h-3 mr-2 text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Trial Information */}
                {selectedSubscription.status === "trial" && selectedSubscription.trialEndsAt && (
                  <div className="rounded-lg border border-cyan-800 bg-cyan-900/20 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-medium text-cyan-200">Trial Period</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-cyan-300">
                          Trial ends in {getTrialDaysRemaining(selectedSubscription)} days
                        </p>
                        <p className="text-xs text-cyan-400/70 mt-1">
                          {formatDate(selectedSubscription.trialEndsAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-cyan-300">Auto-renewal</p>
                        <p className="text-xs text-cyan-400/70">
                          {selectedSubscription.nextRenewalAt ? formatDate(selectedSubscription.nextRenewalAt) : "—"}
                        </p>
                      </div>
                    </div>
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
                    onClick={() => {
                      setViewModalOpen(false);
                      handleEditSubscription(selectedSubscription);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
                  >
                    Edit Subscription
                  </button>
                  {selectedSubscription.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        handleCancelSubscription(selectedSubscription);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ EDIT SUBSCRIPTION MODAL */}
      {/* ========================= */}
      {editModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Subscription</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-white" disabled={updating}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm text-slate-400">Business</p>
                <p className="font-medium text-slate-100 mt-1">
                  {selectedSubscription.business?.name || selectedSubscription.business?.businessname || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Plan</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({...editForm, plan: e.target.value as any})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value as any})}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                    disabled={updating}
                  >
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Trial Start Date</label>
                <input
                  type="datetime-local"
                  value={editForm.trialStartsAt ? new Date(editForm.trialStartsAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm({...editForm, trialStartsAt: e.target.value || null})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Trial End Date</label>
                <input
                  type="datetime-local"
                  value={editForm.trialEndsAt ? new Date(editForm.trialEndsAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm({...editForm, trialEndsAt: e.target.value || null})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Period End</label>
                <input
                  type="datetime-local"
                  value={editForm.currentPeriodEnd ? new Date(editForm.currentPeriodEnd).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm({...editForm, currentPeriodEnd: e.target.value || null})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Next Renewal</label>
                <input
                  type="datetime-local"
                  value={editForm.nextRenewalAt ? new Date(editForm.nextRenewalAt).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditForm({...editForm, nextRenewalAt: e.target.value || null})}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-sm outline-none"
                  disabled={updating}
                />
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
                onClick={handleUpdateSubscription}
                disabled={updating}
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
                    Update Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================= */}
      {/* ✅ CANCEL CONFIRMATION MODAL */}
      {/* ========================= */}
      {cancelModalOpen && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-950 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cancel Subscription</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-white" disabled={cancelling}>
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
                <p className="text-sm text-slate-400">Subscription Details</p>
                <p className="font-medium text-slate-100 mt-1 capitalize">
                  {selectedSubscription.plan} Plan
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  Business: {selectedSubscription.business?.name || selectedSubscription.business?.businessname || "—"}
                </p>
                <p className="text-sm text-slate-400">Status: {selectedSubscription.status}</p>
                <p className="text-sm text-slate-400">Created: {formatDate(selectedSubscription.createdAt)}</p>
              </div>

              <p className="text-sm text-slate-300">
                This will immediately cancel the subscription. The business will lose access to premium features
                and their plan will be downgraded. Are you sure you want to continue?
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800"
                disabled={cancelling}
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelSubscription}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XIcon className="w-4 h-4" />
                    Cancel Subscription
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
    
    return value || "—";
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-100 break-words">{renderValue()}</p>
    </div>
  );
}