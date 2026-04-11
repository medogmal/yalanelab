"use client";
/**
 * DominoChain — CSS flexbox rows, no absolute positioning
 * الـ snake pattern بيتعمل بـ flex-direction row / row-reverse متناوبين
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import DominoTileV2 from "./DominoTileV2";
import type { Tile } from "@/lib/domino/game";

interface Props { chain: Tile[] }

const GAP = 3;
const PER_ROW = 5; // قطع لكل صف

export default function DominoChain({ chain }: Props) {

  // ── chain فارغة ────────────────────────────────────────────────────────────
  if (!chain.length) return (
    <div style={{ width:"100%", minHeight:80, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <motion.p
        style={{ color:"rgba(255,255,255,.25)", fontSize:13, userSelect:"none" }}
        animate={{ opacity:[.3,.7,.3] }} transition={{ duration:2, repeat:Infinity }}
      >
        ابدأ بأي قطعة…
      </motion.p>
    </div>
  );

  // ── قطعة واحدة ─────────────────────────────────────────────────────────────
  if (chain.length === 1) return (
    <div style={{ width:"100%", display:"flex", justifyContent:"center", padding:"12px 0" }}>
      <motion.div
        initial={{ opacity:0, scale:.5 }}
        animate={{ opacity:1, scale:1, filter:"drop-shadow(0 0 10px rgba(139,92,246,.8))" }}
        transition={{ type:"spring", stiffness:260, damping:20 }}
      >
        <DominoTileV2 a={chain[0].a} b={chain[0].b} orientation="vertical" state="normal" size="sm" />
      </motion.div>
    </div>
  );

  // ── نقسم الـ chain لـ rows ──────────────────────────────────────────────────
  // ونحفظ الـ global index لكل قطعة
  const rows: Array<Array<{ tile: Tile; gi: number }>> = [];
  for (let i = 0; i < chain.length; i += PER_ROW) {
    rows.push(
      chain.slice(i, i + PER_ROW).map((tile, j) => ({ tile, gi: i + j }))
    );
  }

  const last = chain.length - 1;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: GAP,
        padding: "6px 2px",
        boxSizing: "border-box",
      }}
      dir="ltr"
    >
      <AnimatePresence mode="popLayout">
        {rows.map((row, rowIdx) => {
          // الصف الأول RTL (row-reverse)، التاني LTR، وهكذا
          const dir: "row-reverse" | "row" = rowIdx % 2 === 0 ? "row-reverse" : "row";
          const numRows = rows.length;

          return (
            <div
              key={`row-${rowIdx}`}
              style={{
                display: "flex",
                flexDirection: dir,
                alignItems: "center",
                gap: GAP,
                width: "100%",
              }}
            >
              {row.map(({ tile, gi }) => {
                const isFirst  = gi === 0;
                const isLast   = gi === last;
                const isDouble = tile.a === tile.b;

                // آخر قطعة في الصف (مش الصف الأخير) = corner = vertical
                const isCorner = gi % PER_ROW === PER_ROW - 1 && rowIdx < numRows - 1;

                const ori: "vertical" | "horizontal" =
                  isFirst || isDouble || isCorner ? "vertical" : "horizontal";

                return (
                  <motion.div
                    key={`t-${gi}`}
                    layout
                    initial={{ opacity:0, scale:.3 }}
                    animate={{
                      opacity: 1, scale: 1,
                      filter: (isFirst || isLast)
                        ? "drop-shadow(0 0 8px rgba(139,92,246,0.75))"
                        : "none",
                    }}
                    exit={{ opacity:0, scale:.2, transition:{ duration:.1 } }}
                    transition={{ delay: gi * 0.015, type:"spring", stiffness:320, damping:26 }}
                    style={{ flexShrink: 0 }}
                  >
                    <DominoTileV2
                      a={tile.a} b={tile.b}
                      orientation={ori}
                      state="normal"
                      size="sm"
                    />
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
