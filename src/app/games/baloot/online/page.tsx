"use client";
import React, { Suspense } from "react";
import BalootBoard2D from "@/components/baloot/BalootBoard2D";

export default function BalootOnlinePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white bg-black">Loading Baloot...</div>}>
      <BalootBoard2D />
    </Suspense>
  );
}
