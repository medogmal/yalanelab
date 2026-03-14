"use client";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { ChessErrorBoundary } from "@/components/GameErrorBoundary";

const ChessGameOnline2D = dynamic(
  () => import("@/components/chess/ChessGameOnline2D"),
  { ssr: false, loading: () => <LoadingChess /> }
);

function LoadingChess() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:"#0c0c0e", color:"#f4f4f8", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:56 }}>♟</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#7a7a8a" }}>تحميل الشطرنج...</div>
      <div style={{ width:36, height:36, border:"3px solid #8b5cf6", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function ChessOnlinePage() {
  return (
    <ChessErrorBoundary>
      <Suspense fallback={<LoadingChess />}>
        <div className="w-full h-screen bg-black">
          <ChessGameOnline2D />
        </div>
      </Suspense>
    </ChessErrorBoundary>
  );
}
