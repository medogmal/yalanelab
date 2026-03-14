"use client";
import React, { Suspense } from "react";
import LudoBoardOnline2D from "@/components/ludo/LudoBoardOnline2D";
import { LudoErrorBoundary } from "@/components/GameErrorBoundary";

function LoadingLudo() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:"#0f172a", color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:52 }}>🎲</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#7a7a8a" }}>تحميل اللودو...</div>
      <div style={{ width:36, height:36, border:"3px solid #06b6d4", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LudoOnlinePage() {
  return (
    <LudoErrorBoundary>
      <Suspense fallback={<LoadingLudo />}>
        <div className="w-full h-screen bg-black">
          <LudoBoardOnline2D />
        </div>
      </Suspense>
    </LudoErrorBoundary>
  );
}
