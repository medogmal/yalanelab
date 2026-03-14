"use client";
import React, { Suspense } from "react";
import BalootBoard2D from "@/components/baloot/BalootBoard2D";
import { BalootErrorBoundary } from "@/components/GameErrorBoundary";

function LoadingBaloot() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:"#1a0f0a", color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:52 }}>🃏</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#d4af37" }}>تحميل البلوت...</div>
      <div style={{ width:36, height:36, border:"3px solid #d4af37", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function BalootOnlinePage() {
  return (
    <BalootErrorBoundary>
      <Suspense fallback={<LoadingBaloot />}>
        <BalootBoard2D />
      </Suspense>
    </BalootErrorBoundary>
  );
}
