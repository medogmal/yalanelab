"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
// ✅ استخدام الـ UI الجديد
import DominoBoard from "@/components/domino/v2/DominoTable";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════════════════════════
   RANKED DOMINO PAGE
══════════════════════════════════════════════════════════════ */
type Phase = "queuing" | "waiting" | "playing" | "error";

function RankedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoJoin = searchParams.get("auto") === "1";
  const highStakes = searchParams.get("stakes") === "high";

  const [phase, setPhase] = useState<Phase>("queuing");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [mySide, setMySide] = useState<"a" | "b">("a");
  const [queueCount, setQueueCount] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef<string | null>(null);
  const [playerName, setPlayerName] = useState("");

  useEffect(() => {
    const t = setInterval(() => setDotCount(d => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPlayerName(localStorage.getItem("playerName") || "");
    const savedPid = localStorage.getItem("dominoPlayerId");
    if (!savedPid) return;
    fetch(`/api/domino/match/_`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: savedPid, action: "reconnect" }),
    }).then(r => r.json()).then(d => {
      if (d.ok && d.matchId) {
        setPlayerId(savedPid); playerIdRef.current = savedPid;
        setMatchId(d.matchId); setMySide(d.side === "a" ? "a" : "b");
        setPhase("playing");
      }
    }).catch(() => {});
  }, []);

  const saveName = (name: string) => {
    setPlayerName(name);
    if (typeof window !== "undefined") localStorage.setItem("playerName", name);
  };

  const joinQueue = useCallback(async (nameOverride?: string) => {
    setPhase("waiting");
    try {
      const name = nameOverride || playerName || (typeof window !== "undefined" ? localStorage.getItem("playerName") : null) || "لاعب";
      const res = await fetch("/api/domino/lobby", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stakes: highStakes ? "high" : "normal" }),
      });
      const data = await res.json();
      if (!data.player?.id) { setPhase("error"); return; }
      playerIdRef.current = data.player.id;
      setPlayerId(data.player.id);
      if (data.match) {
        const side = data.match.a.id === data.player.id ? "a" : "b";
        setMySide(side); setMatchId(data.match.id);
        if (typeof window !== "undefined") localStorage.setItem("dominoPlayerId", data.player.id);
        setPhase("playing");
      } else { startPolling(data.player.id); }
    } catch { setPhase("error"); }
  }, [highStakes, playerName]);

  const startPolling = (pid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/domino/lobby?playerId=${pid}`);
        const data = await res.json();
        if (data.match) {
          clearInterval(pollRef.current!);
          const side = data.match.a.id === pid ? "a" : "b";
          setMySide(side); setMatchId(data.match.id);
          if (typeof window !== "undefined") localStorage.setItem("dominoPlayerId", pid);
          setPhase("playing");
        }
        const lobbyRes = await fetch("/api/domino/lobby");
        const lobbyData = await lobbyRes.json();
        setQueueCount(lobbyData.count ?? 0);
      } catch {}
    }, 1500);
  };

  useEffect(() => {
    if (autoJoin) joinQueue();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const leaveQueue = async () => {
    if (playerIdRef.current) {
      await fetch(`/api/domino/lobby?playerId=${playerIdRef.current}`, { method: "DELETE" });
    }
    if (pollRef.current) clearInterval(pollRef.current);
    router.push("/games/domino/online");
  };

  // ── اللعبة ──
  if (phase === "playing" && matchId && playerId) {
    return (
      <DominoBoard
        matchId={matchId}
        playerId={playerId}
        mode="online"
        onLeave={leaveQueue}
      />
    );
  }

  // ── Waiting / Queuing UI ──
  return (
    <div style={{
      minHeight:"100dvh", background:"#070910",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      fontFamily:"var(--font-cairo,sans-serif)", padding:24, gap:32,
    }}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none",
        background:"radial-gradient(ellipse 70% 50% at 50% 50%, rgba(120,60,255,0.08) 0%, transparent 70%)" }}/>

      <AnimatePresence mode="wait">
        {phase === "queuing" && (
          <motion.div key="queuing" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            style={{textAlign:"center", maxWidth:340, width:"100%"}}>
            <div style={{fontSize:56, marginBottom:16}}>🎲</div>
            <h1 style={{fontSize:28, fontWeight:900, color:"#fff", marginBottom:8}}>
              {highStakes ? "رهان عالي 💰" : "دومينو أونلاين"}
            </h1>
            <p style={{fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:28}}>
              {highStakes ? "5,000 كوين · الفائز يأخذ الكل" : "تحدى لاعبين حقيقيين"}
            </p>
            <input value={playerName} onChange={e => saveName(e.target.value)}
              placeholder="اسمك في اللعبة" maxLength={20} dir="rtl"
              style={{ width:"100%", padding:"12px 16px", borderRadius:14, marginBottom:12,
                fontFamily:"inherit", fontSize:14, background:"rgba(255,255,255,0.06)",
                border:"1px solid rgba(255,255,255,0.15)", color:"#fff", outline:"none",
                boxSizing:"border-box" as const }}/>
            <button onClick={() => joinQueue(playerName || undefined)} style={{
              width:"100%", padding:"14px", borderRadius:16, fontWeight:900, fontSize:15,
              cursor:"pointer", background:"linear-gradient(135deg,#f5c842,#e0960a)",
              color:"#1a0d00", border:"none", fontFamily:"inherit",
              boxShadow:"0 8px 28px rgba(245,196,66,0.35)"}}>
              ابحث عن منافس ⚡
            </button>
            <button onClick={() => router.push("/games/domino/online")} style={{
              marginTop:12, width:"100%", padding:"12px", borderRadius:16, fontWeight:700,
              fontSize:13, cursor:"pointer", background:"rgba(255,255,255,0.05)",
              color:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.08)",
              fontFamily:"inherit"}}>
              ← رجوع
            </button>
          </motion.div>
        )}

        {phase === "waiting" && (
          <motion.div key="waiting" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
            style={{textAlign:"center", maxWidth:340}}>
            <motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}}
              style={{fontSize:52, marginBottom:20, display:"inline-block"}}>🎲</motion.div>
            <h2 style={{fontSize:22, fontWeight:900, color:"#fff", marginBottom:8}}>
              نبحث عن منافس{".".repeat(dotCount)}
            </h2>
            {queueCount > 0 && (
              <p style={{fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:20}}>
                {queueCount} لاعب في الانتظار
              </p>
            )}
            <button onClick={leaveQueue} style={{
              padding:"10px 24px", borderRadius:12, fontWeight:700, fontSize:12,
              cursor:"pointer", background:"rgba(239,68,68,0.1)", color:"#f87171",
              border:"1px solid rgba(239,68,68,0.25)", fontFamily:"inherit"}}>
              إلغاء الانتظار
            </button>
          </motion.div>
        )}

        {phase === "error" && (
          <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}} style={{textAlign:"center"}}>
            <div style={{fontSize:48, marginBottom:12}}>⚠️</div>
            <h2 style={{color:"#f87171", fontWeight:900, marginBottom:16}}>حدث خطأ</h2>
            <button onClick={() => joinQueue()} style={{
              padding:"12px 28px", borderRadius:14, background:"#f5c842",
              color:"#000", fontWeight:900, cursor:"pointer", border:"none", fontFamily:"inherit"}}>
              حاول مجدداً
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RankedPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:"100dvh", background:"#070910", display:"flex",
        alignItems:"center", justifyContent:"center"}}>
        <div style={{color:"rgba(255,255,255,0.3)", fontSize:14}}>جاري التحميل...</div>
      </div>
    }>
      <RankedContent />
    </Suspense>
  );
}
