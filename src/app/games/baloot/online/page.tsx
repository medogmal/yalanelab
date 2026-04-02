"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { BalootErrorBoundary } from "@/components/GameErrorBoundary";
import StageSelector from "@/components/platform/StageSelector";
import { BALOOT_STAGES, DIFFICULTY_CONFIG, type DiffLevel } from "@/lib/platform/difficulty";

const BalootBoard2D = dynamic(
  () => import("@/components/baloot/BalootBoard2D"),
  { ssr: false, loading: () => <LoadingBaloot /> }
);

function LoadingBaloot() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh",
      background:"#1a0f0a", color:"#f4f4f8",
      fontFamily:"Cairo,sans-serif", gap:16,
    }}>
      <div style={{ fontSize:52 }}>🃏</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#d4af37" }}>تحميل البلوت...</div>
      <div style={{ width:36, height:36, border:"3px solid #d4af37",
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function BalootOnlinePage() {
  const [ready,   setReady]   = useState(false);
  const [thinkMs, setThinkMs] = useState(2000);

  if (!ready) {
    return (
      <StageSelector
        stages={BALOOT_STAGES}
        storageKey="baloot_stage_progress"
        gameName="البلوت 🃏"
        onBack={() => { window.location.href = "/"; }}
        onSelect={(diff: DiffLevel) => {
          setThinkMs(DIFFICULTY_CONFIG[diff].thinkMs);
          setReady(true);
        }}
      />
    );
  }

  return (
    <BalootErrorBoundary>
      <Suspense fallback={<LoadingBaloot />}>
        <BalootBoard2D botThinkMs={thinkMs} autoStartAi={true} />
      </Suspense>
    </BalootErrorBoundary>
  );
}
