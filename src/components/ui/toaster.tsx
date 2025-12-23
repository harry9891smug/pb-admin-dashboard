"use client";

import { Toaster } from "react-hot-toast";

export default function CustomToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: "#1e293b",
          color: "#f1f5f9",
          border: "1px solid #334155",
          borderRadius: "0.75rem",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: 500,
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
          style: {
            background: "#064e3b",
            color: "#d1fae5",
            border: "1px solid #10b981",
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
          style: {
            background: "#7f1d1d",
            color: "#fecaca",
            border: "1px solid #ef4444",
          },
        },
        loading: {
          duration: Infinity,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #475569",
          },
        },
      }}
    />
  );
}