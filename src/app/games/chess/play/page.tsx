"use client";
import React, { Suspense } from "react";
import ChessGameOnline2D from "@/components/chess/ChessGameOnline2D";

export default function ChessPlayPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black text-white">Loading Chess...</div>}>
      <div className="w-full h-screen bg-black">
        <ChessGameOnline2D />
      </div>
    </Suspense>
  );
}
