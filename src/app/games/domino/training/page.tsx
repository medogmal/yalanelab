"use client";
import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import StageSelector from "@/components/platform/StageSelector";
import { DOMINO_STAGES, type DiffLevel, type Stage } from "@/lib/platform/difficulty";

// ✅ استخدام الـ UI الجديد
const DominoBoard = dynamic(() => import("@/components/domino/v2/DominoTable"), {
  ssr: false,
  loading: () => (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"100dvh", background:"#07090f", color:"#fff", fontFamily:"Cairo,sans-serif", gap:16 }}>
      <div style={{ fontSize:52 }}>🁣</div>
      <div style={{ fontWeight:800, fontSize:14, color:"#a78bfa" }}>تحميل الدومينو...</div>
      <div style={{ width:32, height:32, border:"3px solid #a78bfa", borderTopColor:"transparent",
        borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  ),
});

function TrainingContent() {
  const searchParams = useSearchParams();
  const isCampaign   = searchParams.get("campaign") === "true";
  const mapId        = searchParams.get("map")   ?? undefined;
  const levelId      = searchParams.get("level") ?? undefined;

  const [step,       setStep]       = useState<0|1|2>(isCampaign ? 2 : 0);
  const [difficulty, setDifficulty] = useState<DiffLevel>("easy");
  const [players,    setPlayers]    = useState<2|4>(2);
  const [gameType,   setGameType]   = useState<"classic"|"block"|"all_fives">("classic");

  /* ── Step 0: اختيار المرحلة ── */
  if (step === 0) {
    return (
      <StageSelector
        stages={DOMINO_STAGES}
        storageKey="domino_stage_progress"
        gameName="الدومينو 🁣"
        onBack={() => { window.location.href = "/games/domino/online"; }}
        onSelect={(diff: DiffLevel, _stage: Stage) => { setDifficulty(diff); setStep(1); }}
      />
    );
  }

  /* ── Step 1: إعدادات اللعبة ── */
  if (step === 1) {
    return (
      <div style={{ minHeight:"100dvh", background:"#07090f", fontFamily:"Cairo,sans-serif",
        color:"#fff", display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", padding:"20px", direction:"rtl" }}>
        <div style={{ width:"100%", maxWidth:400, background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.08)", borderRadius:24, padding:"28px 24px" }}>
          <h2 style={{ fontWeight:900, fontSize:20, textAlign:"center", marginBottom:24, color:"#a78bfa" }}>
            ⚙️ إعدادات اللعبة
          </h2>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:700, marginBottom:10 }}>عدد اللاعبين</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {([2,4] as const).map(n => (
                <button key={n} onClick={() => setPlayers(n)} style={{
                  padding:"14px", borderRadius:14, fontWeight:900, fontSize:14,
                  cursor:"pointer", fontFamily:"inherit",
                  background: players===n ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${players===n ? "#a78bfa" : "rgba(255,255,255,0.08)"}`,
                  color: players===n ? "#a78bfa" : "rgba(255,255,255,0.5)",
                }}>👥 {n} لاعبين</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:700, marginBottom:10 }}>نوع اللعبة</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {(["classic","block"] as const).map(t => (
                <button key={t} onClick={() => setGameType(t)} style={{
                  padding:"14px", borderRadius:14, fontWeight:900, fontSize:13,
                  cursor:"pointer", fontFamily:"inherit",
                  background: gameType===t ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
                  border: `2px solid ${gameType===t ? "#34d399" : "rgba(255,255,255,0.08)"}`,
                  color: gameType===t ? "#34d399" : "rgba(255,255,255,0.5)",
                }}>{t==="classic" ? "⚡ كلاسيك" : "🔒 بلوك"}</button>
              ))}
            </div>
          </div>
          <button onClick={() => setStep(2)} style={{
            width:"100%", padding:"16px", borderRadius:16, fontWeight:900, fontSize:16,
            cursor:"pointer", fontFamily:"inherit",
            background:"linear-gradient(135deg,#7c3aed,#4c1d95)", color:"#fff", border:"none",
            boxShadow:"0 8px 24px rgba(124,58,237,0.4)",
          }}>🎮 ابدأ اللعب</button>
          <button onClick={() => setStep(0)} style={{
            width:"100%", marginTop:10, padding:"10px", borderRadius:12,
            background:"transparent", border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", fontFamily:"inherit",
          }}>← تغيير المرحلة</button>
        </div>
      </div>
    );
  }

  /* ── Step 2: اللعبة ── */
  return (
    <DominoBoard
      playerId="player"
      mode="training"
      numPlayers={players}
      gameType={isCampaign ? "classic" : gameType}
      difficulty={difficulty}
      campaignMapId={mapId}
      campaignLevelId={levelId}
      onLeave={() => setStep(0)}
    />
  );
}

export default function DominoTrainingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100dvh", background:"#07090f",
        display:"flex", alignItems:"center", justifyContent:"center", color:"#fff" }}>
        جاري التحميل...
      </div>
    }>
      <TrainingContent />
    </Suspense>
  );
}
