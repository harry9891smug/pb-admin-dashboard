"use client";

import { useEffect, useState } from "react";
import {
  adminSmsUsageBusinesses,
  adminSmsUsageMonthly,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdminSmsPage() {
  const [tab, setTab] = useState<"businesses" | "monthly">("businesses");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [tab, month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "businesses") {
        const res = await adminSmsUsageBusinesses(
          month ? { month } : undefined
        );
        setData(res.items || []);
      } else {
        const res = await adminSmsUsageMonthly(
          month ? { from: month, to: month } : undefined
        );
        setData(res.items || []);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white">SMS Usage</h1>
        <p className="text-sm text-slate-400">
          Track SMS consumption across businesses
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <TabButton
            active={tab === "businesses"}
            onClick={() => setTab("businesses")}
          >
            By Businesses
          </TabButton>
          <TabButton
            active={tab === "monthly"}
            onClick={() => setTab("monthly")}
          >
            Monthly Summary
          </TabButton>
        </div>

        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>

      {/* Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/70">
            <tr className="text-slate-300">
              {tab === "businesses" ? (
                <>
                  <Th>Business</Th>
                  <Th>Total</Th>
                  <Th>Sent</Th>
                  <Th>Failed</Th>
                  <Th>Pending</Th>
                </>
              ) : (
                <>
                  <Th>Month</Th>
                  <Th>Total</Th>
                  <Th>Sent</Th>
                  <Th>Failed</Th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  {tab === "businesses" ? (
                    <>
                      <Td>{row.businessName || "-"}</Td>
                      <Td>{row.total}</Td>
                      <Td className="text-emerald-400">{row.sent}</Td>
                      <Td className="text-red-400">{row.failed}</Td>
                      <Td className="text-yellow-400">{row.pending}</Td>
                    </>
                  ) : (
                    <>
                      <Td>{row.month}</Td>
                      <Td>{row.total}</Td>
                      <Td className="text-emerald-400">{row.sent}</Td>
                      <Td className="text-red-400">{row.failed}</Td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium border",
        active
          ? "bg-emerald-500/20 text-white border-emerald-500/40"
          : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
      )}
    >
      {children}
    </button>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left px-4 py-3 font-medium">{children}</th>
);

const Td = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <td className={cn("px-4 py-3 text-slate-200", className)}>{children}</td>
);
