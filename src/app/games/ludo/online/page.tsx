"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { LudoErrorBoundary } from "@/components/GameErrorBoundary";
import StageSelector from "@/components/platform/StageSelector";
import { LUDO_STAGES, DIFFICULTY_CONFIG, type DiffLevel } from "@/lib/platform/difficulty";

const LudoBoardOnline2D = dynamic(
  () => import("@/components/ludo/LudoBoardOnline2D"),
  { ssr: false, loading: () => <LoadingLudo /> }
);

function LoadingLudo() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh", background:"#0f172a",
      color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:52 }}>🎲</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#7a7a8a" }}>تحميل اللودو...</div>
      <div style={{ width:36, height:36, border:"3px solid #06b6d4",
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LudoOnlinePage() {
  const [ready,      setReady]      = useState(false);
  const [thinkMs,    setThinkMs]    = useState(2000);

  if (!ready) {
    return (
      <StageSelector
        stages={LUDO_STAGES}
        storageKey="ludo_stage_progress"
        gameName="اللودو 🎲"
        onBack={() => { window.location.href = "/"; }}
        onSelect={(diff: DiffLevel) => {
          setThinkMs(DIFFICULTY_CONFIG[diff].thinkMs);
          setReady(true);
        }}
      />
    );
  }

  return (
    <LudoErrorBoundary>
      <Suspense fallback={<LoadingLudo />}>
        <LudoBoardOnline2D botThinkMs={thinkMs} />
      </Suspense>
    </LudoErrorBoundary>
  );
}
