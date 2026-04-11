"use client";
import React from "react";
import { motion } from "framer-motion";
import DominoTileV2 from "./DominoTileV2";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DominoOpponentProps {
  id: string;
  tileCount: number;
  isTurn: boolean;
  isThinking?: boolean;
  timer?: number;           // ثواني متبقية (0-30)
  position?: "top" | "left" | "right";
  name?: string;
}

// ─── المكوّن ──────────────────────────────────────────────────────────────────
export default function DominoOpponent({
  id, tileCount, isTurn, isThinking, timer, position = "top", name,
}: DominoOpponentProps) {

  const displayName = name ?? (id === "ai" ? "الذكاء الاصطناعي" : id === "bot1" ? "بوت 1" : id === "bot2" ? "بوت 2" : id === "bot3" ? "بوت 3" : id);

  const maxShow = 5;
  const showCount = Math.min(tileCount, maxShow);
  const extra = tileCount - maxShow;

  const isVertical = position === "top";

  return (
    <motion.div
      className="flex flex-col items-center gap-1 select-none"
      animate={{ scale: isTurn ? 1.06 : 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      {/* Avatar + اسم + دور */}
      <div className="relative flex items-center gap-2">
        {/* نقطة الدور */}
        {isTurn && (
          <motion.span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-lg shadow">
          🤖
        </div>
        {/* الاسم */}
        <span className="text-white/70 text-xs font-medium">{displayName}</span>
      </div>

      {/* عدد القطع المقلوبة */}
      <div className="flex items-center gap-0.5 flex-wrap justify-center">
        {Array.from({ length: showCount }).map((_, i) => (
          <DominoTileV2
            key={i}
            a={0} b={0}
            orientation={isVertical ? "vertical" : "horizontal"}
            state="facedown"
            size="sm"
          />
        ))}
        {extra > 0 && (
          <span className="text-white/40 text-xs ml-1">+{extra}</span>
        )}
      </div>

      {/* Timer */}
      {isTurn && timer !== undefined && (
        <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
          <motion.div
            className="h-full bg-purple-400 rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: `${(timer / 30) * 100}%` }}
            transition={{ ease: "linear" }}
            style={{ background: timer < 10 ? "#ef4444" : "#a78bfa" }}
          />
        </div>
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <motion.span
          className="text-white/40 text-xs"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >
          يفكر…
        </motion.span>
      )}
    </motion.div>
  );
}
