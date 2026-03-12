"use client";
import React, { Suspense } from "react";
import LudoBoardOnline2D from "@/components/ludo/LudoBoardOnline2D";

function Inner() {
  return (
    <div className="w-full h-screen bg-black">
      <LudoBoardOnline2D />
    </div>
  );
}

export default function LudoOnlinePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-white">Loading...</div>}>
      <Inner />
    </Suspense>
  );
}
