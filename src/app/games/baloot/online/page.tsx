"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { BalootErrorBoundary } from "@/components/GameErrorBoundary";
import StageSelector from "@/components/platform/StageSelector";
import { BALOOT_STAGES, DIFFICULTY_CONFIG, type DiffLevel } from "@/lib/platform/difficulty";
import { useRouter } from "next/navigation";

const BalootTable = dynamic(
  () => import("@/components/baloot/v2/BalootTable"),
  { ssr: false, loading: () => <LoadingBaloot /> }
);

function LoadingBaloot() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh",
      background:"#0a0f1a", color:"#f4f4f8",
      fontFamily:"Cairo,sans-serif", gap:16,
    }}>
      <div style={{ fontSize:52 }}>🃏</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#a78bfa" }}>تحميل البالوت...</div>
      <div style={{ width:36, height:36, border:"3px solid #a78bfa",
        borderTopColor:"transparent", borderRadius:"50%",
        animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function BalootOnlinePage() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

  if (!ready) {
    return (
      <StageSelector
        stages={BALOOT_STAGES}
        storageKey="baloot_stage_progress"
        gameName="البالوت 🃏"
        onBack={() => router.push("/")}
        onSelect={(_diff: DiffLevel) => setReady(true)}
      />
    );
  }

  return (
    <BalootErrorBoundary>
      <Suspense fallback={<LoadingBaloot />}>
        <BalootTable onLeave={() => setReady(false)} />
      </Suspense>
    </BalootErrorBoundary>
  );
}
