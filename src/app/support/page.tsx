"use client";
 
import { Suspense } from "react";
import SupportContent from "./SupportContent";
 
export const dynamic = "force-dynamic";
 
export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportContent />
    </Suspense>
  );
}
 