import {
  LayoutDashboard,
  ShieldCheck,
  KeyRound,
  Users,
  Briefcase,
  Building2,
  BadgePercent,
  Layers3,
  Megaphone,
  Tags,
  Receipt,
  CreditCard,
  Wallet,
  ImagesIcon,
  MessageCircle,
  MessageCircleCodeIcon,
  FlaskConical,
  Smartphone,
} from "lucide-react";

// Single source of truth for every navigable admin page — Sidebar renders it
// as the collapsible nav, and GlobalSearch (Topbar) searches it as a flat
// list. Keeping one list means a new page only has to be added here once.
//
// permission: the RBAC key this link's page checks via ProtectedRoute.
// undefined means every logged-in admin sees it (currently just Dashboard).
//
// keywords: extra words a search should also match on, beyond the visible
// label — e.g. someone typing "staff" should still find "Team Members".
export type NavItem = {
  href: string;
  label: string;
  icon: any;
  permission?: string;
  keywords?: string[];
};

export type NavSection = { key: string; title: string; items: NavItem[] };

export const navSections: NavSection[] = [
  {
    key: "access",
    title: "Access Control",
    items: [
      { href: "/admin/access/permissions", label: "Permissions", icon: KeyRound, permission: "permission.view_permission" },
      { href: "/admin/access/groups", label: "Groups", icon: ShieldCheck, permission: "role.maintain_role", keywords: ["roles"] },
      { href: "/admin/access/job-roles", label: "Job Roles", icon: Briefcase, permission: "access.view_job_roles" },
      { href: "/admin/team", label: "Team Members", icon: Users, permission: "team.view", keywords: ["staff", "employees", "users"] },
    ],
  },
  {
    key: "business",
    title: "Business & Billing",
    items: [
      { href: "/admin/businesses", label: "Businesses", icon: Building2, permission: "business.view", keywords: ["shops", "stores", "merchants"] },
      { href: "/admin/offers", label: "Offers", icon: BadgePercent, permission: "offer.view", keywords: ["deals", "discounts", "promotions"] },
      { href: "/admin/plans", label: "Plans", icon: Layers3, permission: "subscription.view", keywords: ["pricing", "packages"] },
      { href: "/admin/advertisements", label: "Advertisements", icon: Megaphone, permission: "offer.view", keywords: ["ads"] },
      { href: "/admin/categories", label: "Categories", icon: Tags, permission: "business.view" },
    ],
  },
  {
    key: "finance",
    title: "Finance",
    items: [
      { href: "/admin/invoices", label: "Invoices", icon: Receipt, permission: "invoice.view", keywords: ["bills"] },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: Wallet, permission: "subscription.view", keywords: ["subs", "trial", "renewal"] },
      { href: "/admin/billing", label: "Billing Management", icon: CreditCard, permission: "subscription.view", keywords: ["billing"] },
      { href: "/admin/payments", label: "Payments", icon: CreditCard, permission: "invoice.view", keywords: ["razorpay", "transactions"] },
    ],
  },
  {
    key: "template-images",
    title: "Template Images",
    items: [
      { href: "/admin/template-images", label: "Template Images", icon: ImagesIcon, permission: "offer.view", keywords: ["templates", "images"] },
    ],
  },
  {
    key: "sms",
    title: "SMS Logs",
    items: [
      { href: "/admin/sms/usage/businesses", label: "SMS Usage (Businesses)", icon: MessageCircleCodeIcon, permission: "business.view", keywords: ["sms", "messages"] },
      { href: "/admin/sms/usage/monthly", label: "SMS Usage (Monthly)", icon: MessageCircle, permission: "business.view", keywords: ["sms", "messages"] },
    ],
  },
  {
    key: "support-tools",
    title: "Support Tools",
    items: [
      { href: "/admin/test-accounts", label: "PromoBandhu Test Accounts", icon: FlaskConical, permission: "test_account.view", keywords: ["reviewer", "demo", "qa", "trial", "google review", "promobandhu"] },
      { href: "/admin/promodesk-users", label: "PromoDesk Users", icon: Smartphone, permission: "promodesk_user.view", keywords: ["promodesk", "sales executive", "sales manager", "field staff", "support app login"] },
    ],
  },
];

// Dashboard isn't inside a section (it's the single top-level link in
// Sidebar), but the search should still be able to jump there.
export const dashboardNavItem: NavItem = {
  href: "/admin/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
};

export const allNavItems: NavItem[] = [
  dashboardNavItem,
  ...navSections.flatMap((s) => s.items),
];
