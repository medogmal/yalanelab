"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import type { PlayerId } from "@/lib/domino/game";

interface DominoEndDialogV2Props {
  winner: PlayerId | null;
  myId: PlayerId;
  onReplay: () => void;
  onHome: () => void;
}

function VictoryConfetti() {
  const colors = ["#f5a623", "#34d399", "#60a5fa", "#f87171", "#c084fc", "#fb923c"];
  const pts = React.useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2, color: colors[i % colors.length],
    w: 7 + Math.random() * 10, rot: Math.random() * 360,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {pts.map(p => (
        <motion.div key={p.id}
          style={{ position: "absolute", left: `${p.x}%`, top: -16, width: p.w, height: p.w * 0.5, background: p.color, borderRadius: 2 }}
          animate={{ y: ["0vh", "115vh"], rotate: [p.rot, p.rot + 540], opacity: [1, 1, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export default function DominoEndDialogV2({ winner, myId, onReplay, onHome }: DominoEndDialogV2Props) {
  const won    = winner === myId;
  const isDraw = !winner;

  useEffect(() => {
    if (won) {
      fetch("/api/domino/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: "win", coins: 100, xp: 50 }),
      }).catch(() => {});
    }
  }, [won]);

  const emoji  = won ? "🏆" : isDraw ? "🤝" : "💀";
  const title  = won ? "انتصار! 🎉" : isDraw ? "تعادل" : "خسارة";
  const msg    = won
    ? "أداء رائع! استمر على هذا المستوى 💪"
    : isDraw ? "المباراة انتهت بالتعادل"
    : "المرة القادمة ستكون مختلفة! 🔥";

  const bgGrad = won
    ? "linear-gradient(160deg,#1c1500,#2b1f00,#0e0e0e)"
    : isDraw ? "linear-gradient(160deg,#0a0a0a,#141414)"
    : "linear-gradient(160deg,#0e0e0e,#1c0505)";

  const accentColor = won ? "#f5c842" : isDraw ? "rgba(255,255,255,0.3)" : "#ef4444";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(12px)" }}
    >
      {won && <VictoryConfetti />}

      <motion.div
        initial={{ scale: 0.72, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.08 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden relative z-20"
        style={{
          background: bgGrad,
          border: `1.5px solid ${won ? "rgba(245,196,66,0.4)" : isDraw ? "rgba(255,255,255,0.1)" : "rgba(255,60,60,0.25)"}`,
          boxShadow: won ? "0 0 60px rgba(245,196,66,0.15), 0 30px 60px rgba(0,0,0,0.7)" : "0 30px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* خط ملوّن في الأعلى */}
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${accentColor},transparent)` }} />

        <div className="p-7 text-center">
          {/* الإيموجي */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 230, damping: 16, delay: 0.28 }}
            className="text-6xl mb-4 inline-block"
          >
            {emoji}
          </motion.div>

          {/* العنوان */}
          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="text-3xl font-black mb-2"
            style={{ color: accentColor, textShadow: won ? "0 0 30px rgba(245,196,66,0.6)" : "none" }}
          >
            {title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
            className="text-white/40 text-sm mb-5"
          >
            {msg}
          </motion.p>

          {/* مكافآت الفوز */}
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="flex justify-center gap-3 mb-5"
            >
              {[{ label: "كوينز", value: "+100", color: "#f5c842" }, { label: "XP", value: "+50", color: "#a78bfa" }].map(r => (
                <div key={r.label} className="px-5 py-2.5 rounded-2xl text-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-xl font-black" style={{ color: r.color }}>{r.value}</div>
                  <div className="text-xs mt-1 text-white/35">{r.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* الأزرار */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
            className="flex gap-3"
          >
            <button onClick={onHome}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-white/50 transition-colors hover:text-white"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              الرئيسية
            </button>
            <button onClick={onReplay}
              className="flex-1 py-3 rounded-2xl text-sm font-black text-white"
              style={{
                background: won ? "linear-gradient(135deg,#f5c842,#e0960a)" : "linear-gradient(135deg,#7c3aed,#4c1d95)",
                boxShadow: won ? "0 4px 20px rgba(245,196,66,0.35)" : "0 4px 20px rgba(124,58,237,0.35)",
              }}
            >
              🔄 مجدداً
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
