"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import DominoBoard from "@/components/domino/DominoBoardOnline2D";

/* ══════════════════════════════════════════════════════════════
   MATCHMAKING SCREEN
══════════════════════════════════════════════════════════════ */
function MatchmakingScreen({
  playerName,
  onNameChange,
  onJoin,
  joining,
}: {
  playerName: string;
  onNameChange: (v: string) => void;
  onJoin: () => void;
  joining: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#020310",
      fontFamily: "var(--font-cairo), sans-serif",
    }}>
      {/* Stars */}
      <div className="stars-layer stars-sm" style={{ opacity: 0.5 }}/>
      <div className="stars-layer stars-md"/>

      {/* Nebula */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-20%", width: "70%", height: "70%", borderRadius: "50%", background: "radial-gradient(ellipse,rgba(245,166,35,0.06),transparent 70%)", filter: "blur(80px)" }}/>
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60%", height: "60%", borderRadius: "50%", background: "radial-gradient(ellipse,rgba(155,95,224,0.07),transparent 70%)", filter: "blur(70px)" }}/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: 380, margin: "0 16px",
          background: "rgba(5,8,24,0.9)",
          border: "1px solid rgba(245,166,35,0.18)",
          borderRadius: 24,
          backdropFilter: "blur(28px)",
          overflow: "hidden",
          padding: "32px 24px",
        }}
        dir="rtl"
      >
        {/* Top glow */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg,transparent,rgba(245,166,35,0.6),transparent)" }}/>

        {/* Domino icon */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            fontSize: 56, lineHeight: 1, marginBottom: 12,
            filter: "drop-shadow(0 0 20px rgba(245,166,35,0.5))",
            animation: "float 3s ease-in-out infinite",
          }}>🁣</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: "#fff", marginBottom: 4 }}>
            دومينو أونلاين
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(245,166,35,0.6)" }}>
            العب ضد لاعب حقيقي الآن
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "rgba(245,166,35,0.6)", marginBottom: 6 }}>
            اسمك في اللعبة
          </label>
          <input
            value={playerName}
            onChange={e => onNameChange(e.target.value)}
            placeholder="أدخل اسمك..."
            maxLength={20}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              background: "rgba(245,166,35,0.05)",
              border: "1px solid rgba(245,166,35,0.2)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              fontFamily: "inherit", outline: "none",
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(245,166,35,0.5)"}
            onBlur={e  => (e.target as HTMLInputElement).style.borderColor = "rgba(245,166,35,0.2)"}
            onKeyDown={e => e.key === "Enter" && !joining && onJoin()}
          />
        </div>

        {/* Join button */}
        <button
          onClick={onJoin}
          disabled={joining || !playerName.trim()}
          style={{
            width: "100%", padding: "14px", borderRadius: 14,
            fontWeight: 900, fontSize: 15,
            background: joining || !playerName.trim()
              ? "rgba(245,166,35,0.3)"
              : "linear-gradient(135deg,#f5a623,#ffd060)",
            color: "#000", border: "none", cursor: joining ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: playerName.trim() ? "0 8px 28px rgba(245,166,35,0.35)" : "none",
            transition: "all .2s",
          }}
        >
          {joining ? "🔍 يبحث عن خصم..." : "🎮 ابحث عن خصم"}
        </button>

        {/* Or train */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>
          أو{" "}
          <Link href="/games/domino/training" style={{ color: "#00d4ff", textDecoration: "none", fontWeight: 900 }}>
            العب ضد الكمبيوتر
          </Link>
        </div>

        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   WAITING SCREEN (ينتظر خصم)
══════════════════════════════════════════════════════════════ */
function WaitingScreen({ playerName, onCancel }: { playerName: string; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#020310",
      fontFamily: "var(--font-cairo), sans-serif",
    }}>
      <div className="stars-layer stars-sm" style={{ opacity: 0.5 }}/>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: 340, margin: "0 16px",
          background: "rgba(5,8,24,0.9)",
          border: "1px solid rgba(0,212,255,0.18)",
          borderRadius: 24,
          backdropFilter: "blur(28px)",
          padding: "36px 24px",
          textAlign: "center",
        }}
        dir="rtl"
      >
        {/* Pulse ring */}
        <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 20px" }}>
          {[1,2,3].map(i => (
            <motion.div key={i}
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "2px solid rgba(0,212,255,0.4)",
              }}
              animate={{ scale: [1, 1.5 + i * 0.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
            />
          ))}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
            background: "rgba(0,212,255,0.1)",
            border: "2px solid rgba(0,212,255,0.3)",
          }}>🁣</div>
        </div>

        <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", marginBottom: 8 }}>
          يبحث عن خصم...
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(0,212,255,0.5)", marginBottom: 20 }}>
          {playerName} — {seconds} ثانية
        </div>

        {/* Animated dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {[0,1,2].map(i => (
            <motion.div key={i}
              style={{ width: 10, height: 10, borderRadius: "50%", background: "#00d4ff" }}
              animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>

        <button onClick={onCancel} style={{
          padding: "10px 28px", borderRadius: 12,
          fontWeight: 800, fontSize: 13,
          background: "rgba(255,45,85,0.1)",
          border: "1px solid rgba(255,45,85,0.25)",
          color: "#ff2d55", cursor: "pointer",
          fontFamily: "inherit",
        }}>
          إلغاء
        </button>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INNER — LOGIC
══════════════════════════════════════════════════════════════ */
function Inner() {
  const params = useSearchParams();
  const isHighStakes = params.get("stakes") === "high";

  const [playerName, setPlayerName] = useState("لاعب");
  const [player,     setPlayer]     = useState<{ id: string; name: string } | null>(null);
  const [match,      setMatch]      = useState<{ id: string; a: string; b: string } | null>(null);
  const [side,       setSide]       = useState<"a" | "b">("a");
  const [joining,    setJoining]    = useState(false);
  const [waiting,    setWaiting]    = useState(false);

  /* ── Load username from profile ── */
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user?.name) setPlayerName(d.user.name); })
      .catch(() => {});
  }, []);

  /* ── Join lobby ── */
  const join = useCallback(async () => {
    if (joining) return;
    const name = playerName.trim() || "لاعب";
    setJoining(true);

    try {
      const endpoint = isHighStakes
        ? "/api/domino/highstakes"
        : "/api/domino/lobby";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      setPlayer({ id: data.player.id, name: data.player.name });

      if (data.match) {
        setMatch({ id: data.match.id, a: data.match.a?.name, b: data.match.b?.name });
        setSide(data.match.a?.id === data.player.id ? "a" : "b");
        setWaiting(false);
      } else {
        setWaiting(true);
      }
    } catch {
      alert("فشل الاتصال، حاول مجدداً");
    } finally {
      setJoining(false);
    }
  }, [playerName, isHighStakes, joining]);

  /* ── Poll for match ── */
  useEffect(() => {
    if (!waiting || !player || match) return;

    let active = true;
    const poll = async () => {
      if (!active) return;
      try {
        const res  = await fetch(`/api/domino/lobby?playerId=${player.id}`, { cache: "no-store" });
        const data = await res.json();
        if (data.match) {
          setMatch({ id: data.match.id, a: data.match.a?.name, b: data.match.b?.name });
          setSide(data.match.a?.id === player.id ? "a" : "b");
          setWaiting(false);
          return;
        }
      } catch {/* ignore */}
      if (active) setTimeout(poll, 1500);
    };
    setTimeout(poll, 1000);
    return () => { active = false; };
  }, [waiting, player?.id, match]);

  /* ── Auto-join ── */
  useEffect(() => {
    if (params.get("auto") === "1" && !player && !joining) {
      join();
    }
  }, []);

  /* ── Cancel ── */
  function cancel() {
    if (player) {
      fetch(`/api/domino/lobby?playerId=${player.id}`, { method: "DELETE" }).catch(() => {});
    }
    setPlayer(null);
    setWaiting(false);
    setJoining(false);
  }

  /* ── States ── */
  if (match && player) {
    return (
      <DominoBoard
        matchId={match.id}
        playerId={player.id}
        initialSide={side}
        mode="online"
      />
    );
  }

  if (waiting) return <WaitingScreen playerName={playerName} onCancel={cancel} />;

  return (
    <MatchmakingScreen
      playerName={playerName}
      onNameChange={setPlayerName}
      onJoin={join}
      joining={joining}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function DominoRankedPage() {
  return (
    <Suspense fallback={
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#020310" }}>
        <div style={{ color: "#f5a623", fontWeight: 900, fontSize: 14 }}>يتحمّل...</div>
      </div>
    }>
      <Inner />
    </Suspense>
  );
}
