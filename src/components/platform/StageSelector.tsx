"use client";
/* ═══════════════════════════════════════════════════════════════
   StageSelector.tsx — اختيار المرحلة ومستوى الصعوبة
   يظهر في صفحة Training لكل الألعاب
═══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DIFFICULTY_CONFIG, getCurrentStage,
  type DiffLevel, type Stage,
} from "@/lib/platform/difficulty";

interface StageSelectorProps {
  stages:         Stage[];
  storageKey:     string;       // مفتاح localStorage للحفاظ على التقدم
  onSelect:       (diff: DiffLevel, stage: Stage) => void;
  onBack:         () => void;
  gameName:       string;
}

export default function StageSelector({
  stages, storageKey, onSelect, onBack, gameName,
}: StageSelectorProps) {
  const [wins, setWins]           = useState(0);
  const [selected, setSelected]   = useState<Stage | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setWins(JSON.parse(saved).wins ?? 0);
    } catch {}
  }, [storageKey]);

  const currentStage = getCurrentStage(wins, stages);

  // الـ stages المفتوحة = كل stage <= currentStage
  const isUnlocked = (s: Stage) => s.id <= currentStage.id;

  return (
    <div style={{
      minHeight: "100dvh", background: "#07090f",
      fontFamily: "var(--font-cairo), sans-serif",
      color: "#fff", padding: "0 0 40px", direction: "rtl",
    }}>
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px clamp(14px,4vw,28px)",
        background: "rgba(7,9,15,0.9)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={{
          padding: "7px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
        }}>← رجوع</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#f4f4f8" }}>
            تدريب {gameName}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            اختر مستوى الصعوبة
          </div>
        </div>
        <div style={{
          padding: "5px 12px", borderRadius: 10,
          background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)",
          fontSize: 11, fontWeight: 900, color: "#f5a623",
        }}>
          {wins} فوز 🏆
        </div>
      </header>

      {/* المرحلة الحالية */}
      <div style={{ padding: "20px clamp(14px,4vw,28px) 8px" }}>
        <div style={{
          padding: "16px 20px", borderRadius: 16,
          background: `${DIFFICULTY_CONFIG[currentStage.difficulty].color}15`,
          border: `1px solid ${DIFFICULTY_CONFIG[currentStage.difficulty].color}40`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 28 }}>
            {DIFFICULTY_CONFIG[currentStage.difficulty].emoji}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
              مرحلتك الحالية
            </div>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#f4f4f8" }}>
              {currentStage.title}
            </div>
            <div style={{ fontSize: 11, color: DIFFICULTY_CONFIG[currentStage.difficulty].color, marginTop: 2 }}>
              {DIFFICULTY_CONFIG[currentStage.difficulty].label} —
              البوت يفكر {(DIFFICULTY_CONFIG[currentStage.difficulty].thinkMs / 1000).toFixed(1)}ث
            </div>
          </div>
        </div>
      </div>

      {/* قائمة المراحل */}
      <div style={{ padding: "8px clamp(14px,4vw,28px)", display: "flex", flexDirection: "column", gap: 10 }}>
        {stages.map((stage, i) => {
          const unlocked = isUnlocked(stage);
          const cfg      = DIFFICULTY_CONFIG[stage.difficulty];
          const isCurrent = stage.id === currentStage.id;

          return (
            <motion.button
              key={stage.id}
              onClick={() => unlocked && setSelected(stage)}
              whileHover={unlocked ? { scale: 1.01 } : {}}
              whileTap={unlocked ? { scale: 0.98 } : {}}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", borderRadius: 16, cursor: unlocked ? "pointer" : "not-allowed",
                background: selected?.id === stage.id
                  ? `${cfg.color}20`
                  : isCurrent ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: selected?.id === stage.id
                  ? `2px solid ${cfg.color}`
                  : isCurrent ? `1px solid ${cfg.color}50` : "1px solid rgba(255,255,255,0.07)",
                filter: unlocked ? "none" : "grayscale(0.8) brightness(0.5)",
                fontFamily: "inherit", textAlign: "right", width: "100%",
                transition: "all .2s",
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>
                {unlocked ? cfg.emoji : "🔒"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 14, color: unlocked ? "#f4f4f8" : "rgba(255,255,255,0.3)" }}>
                  المرحلة {stage.id} — {stage.title}
                </div>
                <div style={{ fontSize: 11, color: unlocked ? cfg.color : "rgba(255,255,255,0.2)", marginTop: 2 }}>
                  {cfg.label} · يفكر {(cfg.thinkMs/1000).toFixed(1)}ث · {stage.winsNeeded} فوز للتقدم
                </div>
              </div>
              <div style={{ textAlign: "left", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#f5a623" }}>🪙 {stage.reward.coins}</div>
                <div style={{ fontSize: 10, color: "#a78bfa" }}>⭐ {stage.reward.xp} XP</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* زرار ابدأ */}
      {selected && (
        <div style={{ padding: "16px clamp(14px,4vw,28px) 0" }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(selected.difficulty, selected)}
            style={{
              width: "100%", padding: "16px",
              borderRadius: 16, fontWeight: 900, fontSize: 16,
              background: `linear-gradient(135deg, ${DIFFICULTY_CONFIG[selected.difficulty].color}, ${DIFFICULTY_CONFIG[selected.difficulty].color}99)`,
              color: "#fff", border: "none", cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: `0 8px 24px ${DIFFICULTY_CONFIG[selected.difficulty].color}40`,
            }}
          >
            ابدأ التحدي — {selected.title} {DIFFICULTY_CONFIG[selected.difficulty].emoji}
          </motion.button>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            البوت سيفكر {(DIFFICULTY_CONFIG[selected.difficulty].thinkMs / 1000).toFixed(1)} ثانية قبل كل حركة
          </div>
        </div>
      )}
    </div>
  );
}
