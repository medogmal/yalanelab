"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { LudoErrorBoundary } from "@/components/GameErrorBoundary";
import StageSelector from "@/components/platform/StageSelector";
import { LUDO_STAGES, DIFFICULTY_CONFIG, type DiffLevel } from "@/lib/platform/difficulty";
import { useRouter } from "next/navigation";

const LudoTable = dynamic(
  () => import("@/components/ludo/v2/LudoTable"),
  { ssr: false, loading: () => <LoadingLudo /> }
);

function LoadingLudo() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh", background:"#0a0a14",
      color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:52 }}>🎲</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#7a7a8a" }}>تحميل اللودو...</div>
      <div style={{ width:36, height:36, border:"3px solid #6366f1",
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function LudoOnlinePage() {
  const router = useRouter();
  const [ready,   setReady]   = useState(false);
  const [thinkMs, setThinkMs] = useState(1400);

  if (!ready) {
    return (
      <StageSelector
        stages={LUDO_STAGES}
        storageKey="ludo_stage_progress"
        gameName="اللودو 🎲"
        onBack={() => router.push("/")}
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
        <LudoTable
          botThinkMs={thinkMs}
          onLeave={() => setReady(false)}
        />
      </Suspense>
    </LudoErrorBoundary>
  );
}
