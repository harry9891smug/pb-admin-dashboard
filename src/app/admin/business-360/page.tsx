"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Search, ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCan } from "@/hooks/useCan";
import { apiErrorMessage } from "@/lib/api/admin/cases";
import {
  extendTrial,
  getOverview360,
  getSection360,
  search360,
  unlockLogin,
  type Biz360Overview,
  type Biz360SearchRow,
  type Biz360SectionData,
} from "@/lib/api/admin/business360";

const PAGE = 25;

const inputCls =
  "h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-200";
const btnCls =
  "inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";
const btnPrimary =
  "inline-flex h-7 items-center gap-1 rounded-md bg-violet-600 px-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50";

const isoRe = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}/;

function fmtDate(v: string) {
  const d = new Date(v);
  return isNaN(+d)
    ? v
    : d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Cell({ k, v }: { k: string; v: any }) {
  if (v === null || v === undefined || v === "") return <span className="text-gray-300">-</span>;
  if (typeof v === "boolean")
    return (
      <span className={`rounded px-1 text-[10px] font-semibold ${v ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {v ? "yes" : "no"}
      </span>
    );
  if (typeof v === "object") return <code className="text-[10px] text-gray-600">{JSON.stringify(v).slice(0, 80)}</code>;
  const s = String(v);
  if (isoRe.test(s)) return <>{fmtDate(s)}</>;
  if (/^https?:\/\//.test(s)) {
    const img = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(s);
    return (
      <a href={s} target="_blank" rel="noreferrer" className="text-violet-700 underline">
        {img ? <img src={s} alt="" className="h-8 w-8 rounded object-cover" /> : "open"}
      </a>
    );
  }
  return <span className={s.length > 40 ? "block max-w-[260px] truncate" : ""} title={s}>{s}</span>;
}

const pretty = (k: string) =>
  k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="truncate text-xs text-gray-900">{value === null || value === undefined || value === "" ? "-" : String(value)}</div>
    </div>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const can = useCan();

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Biz360SearchRow[]>([]);
  const [searching, setSearching] = useState(false);

  const idParam = Number(params.get("id")) || null;
  const [overview, setOverview] = useState<Biz360Overview | null>(null);
  const [tab, setTab] = useState<string>("");
  const [data, setData] = useState<Biz360SectionData | null>(null);
  const [page, setPage] = useState(1);
  const [loadingSec, setLoadingSec] = useState(false);
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);

  const open = (id: number) => router.push(`/admin/business-360?id=${id}`);

  // search (debounced)
  useEffect(() => {
    const t = term.trim();
    if (t.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const h = setTimeout(async () => {
      try {
        setResults(await search360(t));
      } catch (e) {
        toast.error(apiErrorMessage(e, "Search failed"));
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(h);
  }, [term]);

  const loadOverview = useCallback(async (id: number) => {
    try {
      const o = await getOverview360(id);
      setOverview(o);
      setTab((cur) => cur || o.sections.find((s) => (s.count ?? 0) > 0)?.key || o.sections[0]?.key || "");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to load business"));
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    setOverview(null);
    setData(null);
    setTab("");
    setPage(1);
    if (idParam) loadOverview(idParam);
  }, [idParam, loadOverview]);

  useEffect(() => {
    if (!idParam || !tab) return;
    let alive = true;
    setLoadingSec(true);
    getSection360(idParam, tab, PAGE, (page - 1) * PAGE)
      .then((d) => alive && setData(d))
      .catch((e) => toast.error(apiErrorMessage(e, "Failed to load section")))
      .finally(() => alive && setLoadingSec(false));
    return () => {
      alive = false;
    };
  }, [idParam, tab, page]);

  const b = overview?.business;
  const sub = overview?.subscription;
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE));

  const doExtend = async () => {
    if (!idParam) return;
    setBusy(true);
    try {
      await extendTrial(idParam, Number(days));
      toast.success(`Trial extended by ${days} days`);
      loadOverview(idParam);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not extend trial"));
    } finally {
      setBusy(false);
    }
  };

  const doUnlock = async () => {
    if (!idParam) return;
    if (!window.confirm("Clear login lockout and OTP attempts for this customer?")) return;
    setBusy(true);
    try {
      const r = await unlockLogin(idParam);
      toast.success(r?.message || "Login unlocked");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Could not unlock login"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 p-1">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Business 360</h1>
        <p className="text-xs text-gray-500">
          Everything a customer sees in the app. Search by business id, public id, name or mobile.
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Mobile, business name, public id or business id"
          className={`${inputCls} w-full pl-7`}
        />
        {term.trim().length >= 2 ? (
          <div className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {searching ? <div className="px-3 py-2 text-xs text-gray-500">Searching…</div> : null}
            {!searching && results.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500">No business found.</div>
            ) : null}
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setTerm("");
                  open(r.id);
                }}
                className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left text-xs hover:bg-violet-50"
              >
                <span>
                  <span className="font-semibold text-gray-900">{r.businessname || r.name || `#${r.id}`}</span>
                  <span className="ml-2 text-gray-500">
                    {r.ownerMobile} {r.city ? `• ${r.city}` : ""}
                  </span>
                </span>
                <span className="text-[11px] text-gray-500">
                  #{r.id} {r.publicId ? `• ${r.publicId}` : ""} {r.subscriptionStatus ? `• ${r.subscriptionStatus}` : ""}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {!idParam ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-xs text-gray-500">
          Search for a business to see its profile, subscription, payments, offers, invoices, inventory, team, SMS and cases.
        </div>
      ) : null}

      {b ? (
        <>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center gap-2">
                {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-9 w-9 rounded object-cover" /> : null}
                <div>
                  <div className="text-sm font-bold text-gray-900">{b.businessname || b.name}</div>
                  <div className="text-[11px] text-gray-500">Business #{b.id} • Public ID {b.publicId || "-"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Info label="Owner name" value={b.name} />
                <Info label="Owner mobile" value={overview?.owner?.mobile} />
                <Info label="Owner email" value={overview?.owner?.email} />
                <Info label="Language" value={b.preferredLanguage} />
                <Info label="City / State" value={[b.city, b.state].filter(Boolean).join(", ")} />
                <Info label="Pincode" value={b.pincode} />
                <Info label="GST" value={b.gstNumber} />
                <Info label="Registered" value={b.createdAt ? fmtDate(b.createdAt) : null} />
              </div>
              <div className="mt-2 text-[11px] text-gray-600">{[b.address, b.address1].filter(Boolean).join(", ")}</div>
              {can("support.login_unlock") && overview?.owner ? (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2">
                  <button className={btnCls} disabled={busy} onClick={doUnlock}>
                    Unlock customer login
                  </button>
                  <span className="text-[11px] text-gray-500">Clears lockout / OTP attempts. See Login attempts tab.</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-gray-800">Subscription</div>
              {sub ? (
                <div className="grid grid-cols-2 gap-2">
                  <Info label="Plan" value={sub.plan} />
                  <Info label="Status" value={sub.status} />
                  <Info label="Trial ends" value={sub.trialEndsAt ? fmtDate(sub.trialEndsAt) : null} />
                  <Info label="Current period ends" value={sub.currentPeriodEnd ? fmtDate(sub.currentPeriodEnd) : null} />
                  <Info label="Next renewal" value={sub.nextRenewalAt ? fmtDate(sub.nextRenewalAt) : null} />
                  <Info label="Billing" value={sub.billingCycle} />
                </div>
              ) : (
                <div className="text-xs text-gray-500">No subscription.</div>
              )}
              {sub?.id && can("subscription.view") ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-2">
                  <a className={btnCls} href={`/admin/subscriptions/${sub.id}`}>
                    Subscription details
                  </a>
                  <a className={btnCls} href={`/admin/billing/${sub.id}`}>
                    Billing actions (refund, cancel, retry)
                  </a>
                  {can("invoice.view") ? (
                    <a className={btnCls} href="/admin/payments">
                      Payments
                    </a>
                  ) : null}
                </div>
              ) : null}
              {can("support.trial_extend") && sub ? (
                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2">
                  <CalendarPlus className="h-3.5 w-3.5 text-gray-500" />
                  <input
                    className={`${inputCls} w-16`}
                    type="number"
                    min={1}
                    max={90}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  />
                  <span className="text-xs text-gray-600">days</span>
                  <button className={btnPrimary} disabled={busy || !Number(days)} onClick={doExtend}>
                    Extend trial
                  </button>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 text-xs font-semibold text-gray-800">At a glance</div>
              <div className="grid grid-cols-3 gap-2">
                {overview!.sections
                  .filter((s) => s.count !== null)
                  .slice(0, 9)
                  .map((s) => (
                    <button
                      key={s.key}
                      onClick={() => {
                        setTab(s.key);
                        setPage(1);
                      }}
                      className="rounded-md border border-gray-100 bg-gray-50 p-2 text-left hover:bg-violet-50"
                    >
                      <div className="text-base font-bold text-gray-900">{s.count}</div>
                      <div className="truncate text-[10px] text-gray-500">{s.label}</div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
              {overview!.sections
                .filter((s) => s.count !== null)
                .map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setTab(s.key);
                      setPage(1);
                    }}
                    className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-medium ${
                      tab === s.key ? "bg-violet-600 text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {s.label}
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === s.key ? "bg-white/25" : "bg-gray-100"}`}>
                      {s.count}
                    </span>
                  </button>
                ))}
            </div>

            <div className="max-h-[55vh] overflow-auto">
              {loadingSec ? <div className="p-4 text-xs text-gray-500">Loading…</div> : null}
              {!loadingSec && data && data.rows.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No records.</div>
              ) : null}
              {!loadingSec && data && data.rows.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 text-left text-[10px] uppercase tracking-wide text-gray-500">
                    <tr>
                      {data.columns.map((c) => (
                        <th key={c} className="whitespace-nowrap px-2.5 py-2">{pretty(c)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100 hover:bg-violet-50/40">
                        {data.columns.map((c) => (
                          <td key={c} className="whitespace-nowrap px-2.5 py-1.5 text-gray-800">
                            <Cell k={c} v={r[c]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-xs text-gray-600">
              <span>{data?.total ?? 0} records</span>
              <div className="flex items-center gap-1">
                <button className={btnCls} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span>{page} / {pages}</span>
                <button className={btnCls} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function Business360Page() {
  return (
    <ProtectedRoute requiredPermission="support.business_search">
      <Suspense fallback={null}>
        <Inner />
      </Suspense>
    </ProtectedRoute>
  );
}
