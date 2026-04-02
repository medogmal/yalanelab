"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { ChessErrorBoundary } from "@/components/GameErrorBoundary";
import StageSelector from "@/components/platform/StageSelector";
import { CHESS_STAGES, type DiffLevel } from "@/lib/platform/difficulty";

const ChessGameOnline2D = dynamic(
  () => import("@/components/chess/ChessGameOnline2D"),
  { ssr: false, loading: () => <LoadingChess /> }
);

function LoadingChess() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", minHeight:"100dvh", background:"#0c0c0e",
      color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:56 }}>♟</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#7a7a8a" }}>تحميل الشطرنج...</div>
      <div style={{ width:36, height:36, border:"3px solid #8b5cf6",
        borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// تحويل DiffLevel لـ Stockfish depth (0-20)
const DIFF_TO_DEPTH: Record<DiffLevel, number> = {
  beginner: 2, easy: 5, medium: 10, hard: 15, expert: 20,
};

export default function ChessPlayPage() {
  const [ready, setReady]   = useState(false);
  const [depth, setDepth]   = useState(5);

  if (!ready) {
    return (
      <StageSelector
        stages={CHESS_STAGES}
        storageKey="chess_stage_progress"
        gameName="الشطرنج ♟"
        onBack={() => { window.location.href = "/games/chess/online"; }}
        onSelect={(diff) => { setDepth(DIFF_TO_DEPTH[diff]); setReady(true); }}
      />
    );
  }

  return (
    <ChessErrorBoundary>
      <Suspense fallback={<LoadingChess />}>
        <div className="w-full h-screen bg-black">
          <ChessGameOnline2D initialAiDifficulty={depth} />
        </div>
      </Suspense>
    </ChessErrorBoundary>
  );
}
