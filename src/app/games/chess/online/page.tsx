"use client";
import React, { Suspense } from "react";
import ChessGameOnline2D from "@/components/chess/ChessGameOnline2D";

function Inner() {
  return (
    <div className="w-full h-screen bg-black">
      <ChessGameOnline2D />
    </div>
  );
}

export default function ChessOnlinePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading Chess...</div>}>
      <Inner />
    </Suspense>
  );
}
