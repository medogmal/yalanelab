"use client";
import React from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
export type DominoOrientation = "vertical" | "horizontal";
export type DominoState = "normal" | "selected" | "playable" | "disabled" | "facedown";
export type DominoSize = "sm" | "md" | "lg";

export interface DominoTileV2Props {
  a: number;                      // قيمة الجانب الأول  (0-6)
  b: number;                      // قيمة الجانب التاني (0-6)
  orientation?: DominoOrientation;
  state?: DominoState;
  size?: DominoSize;
  onClick?: () => void;
}

// ─── الأحجام ──────────────────────────────────────────────────────────────────
const SIZES: Record<DominoSize, { w: number; h: number }> = {
  sm: { w: 28, h: 56 },
  md: { w: 38, h: 76 },
  lg: { w: 48, h: 96 },
};

// ─── مواضع النقاط لكل عدد (داخل مربع 1×1) ────────────────────────────────────
const DOT_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [[0.5, 0.22], [0.5, 0.78]],
  3: [[0.25, 0.22], [0.5, 0.5], [0.75, 0.78]],
  4: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.78], [0.75, 0.78]],
  5: [[0.25, 0.22], [0.75, 0.22], [0.5, 0.5], [0.25, 0.78], [0.75, 0.78]],
  6: [[0.25, 0.15], [0.75, 0.15], [0.25, 0.5], [0.75, 0.5], [0.25, 0.85], [0.75, 0.85]],
};

// ─── ألوان الـ states ─────────────────────────────────────────────────────────
const STATE_STYLES = {
  normal:   { bg: "#1e1b2e", border: "#3d3654", dotFill: "#e8e0ff" },
  selected: { bg: "#2a2040", border: "#f5c518", dotFill: "#ffffff" },
  playable: { bg: "#1a2a1a", border: "#22c55e", dotFill: "#bbf7d0" },
  disabled: { bg: "#12101e", border: "#2a2540", dotFill: "#5e5a70" },
  facedown: { bg: "#16132a", border: "#3d3654", dotFill: "#e8e0ff" },
};

// ─── رسم النقاط SVG ──────────────────────────────────────────────────────────
function renderDots(
  value: number,
  x: number, y: number,      // موضع أعلى يسار المنطقة
  areaW: number, areaH: number,
  dotColor: string,
  dotR: number
) {
  const positions = DOT_POSITIONS[value] ?? [];
  return positions.map(([px, py], i) => (
    <circle
      key={i}
      cx={x + px * areaW}
      cy={y + py * areaH}
      r={dotR}
      fill={dotColor}
    />
  ));
}

// ─── الوجه الخلفي (facedown) ─────────────────────────────────────────────────
function FacedownPattern({ x, y, w, h, color }: { x:number;y:number;w:number;h:number;color:string }) {
  const lines = [];
  const step = 6;
  for (let i = -h; i < w + h; i += step) {
    lines.push(<line key={`d1-${i}`} x1={x+i} y1={y} x2={x+i+h} y2={y+h} stroke={color} strokeWidth={1} strokeOpacity={0.3}/>);
    lines.push(<line key={`d2-${i}`} x1={x+i+h} y1={y} x2={x+i} y2={y+h} stroke={color} strokeWidth={1} strokeOpacity={0.3}/>);
  }
  return <>{lines}</>;
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function DominoTileV2({
  a, b,
  orientation = "vertical",
  state = "normal",
  size = "md",
  onClick,
}: DominoTileV2Props) {
  const isHorizontal = orientation === "horizontal";
  const baseW = SIZES[size].w;
  const baseH = SIZES[size].h;

  // لو أفقي: نعكس الأبعاد
  const svgW = isHorizontal ? baseH : baseW;
  const svgH = isHorizontal ? baseW : baseH;

  const styles = STATE_STYLES[state];
  const isDisabled = state === "disabled";
  const isFacedown = state === "facedown";

  const pad = 3;                      // padding داخلي
  const dotR = Math.max(2, baseW * 0.07);  // نسبة حجم النقطة
  const rx = 4;                       // تدوير الزوايا

  // منطقة كل جانب
  const halfH = (svgH - pad * 2) / 2;
  const areaW = svgW - pad * 2;

  // Framer-motion variants
  const tileVariants = {
    normal:   { y: 0, scale: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" },
    selected: { y: -14, scale: 1.05, filter: "drop-shadow(0 6px 18px rgba(245,197,24,0.7))" },
    playable: { y: 0, scale: 1, filter: "drop-shadow(0 0 8px rgba(34,197,94,0.5))" },
    disabled: { y: 0, scale: 1, filter: "none" },
    facedown: { y: 0, scale: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" },
  };

  // CSS animation للـ playable state (border نابض)
  const playableAnimation = state === "playable" ? {
    animate: { opacity: [1, 0.4, 1] },
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  } : {};

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled || !onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: isDisabled || !onClick ? "default" : "pointer",
        opacity: isDisabled ? 0.35 : 1,
        display: "inline-block",
        lineHeight: 0,
      }}
      variants={tileVariants}
      animate={state}
      initial="normal"
      whileHover={!isDisabled && onClick ? { y: state === "selected" ? -14 : -6, scale: 1.05 } : {}}
      whileTap={!isDisabled && onClick ? { scale: 0.94 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
    >
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        {/* الخلفية */}
        <rect x={0} y={0} width={svgW} height={svgH} rx={rx} ry={rx}
          fill={styles.bg} />

        {/* Border مع neon نابض للـ playable */}
        <motion.rect
          x={0.5} y={0.5} width={svgW - 1} height={svgH - 1} rx={rx - 0.5} ry={rx - 0.5}
          fill="none" stroke={styles.border} strokeWidth={state === "selected" ? 1.5 : 1}
          {...playableAnimation}
        />

        {/* الخط الفاصل في المنتصف */}
        {!isFacedown && (
          <line
            x1={isHorizontal ? svgW / 2 : pad}
            y1={isHorizontal ? pad : svgH / 2}
            x2={isHorizontal ? svgW / 2 : svgW - pad}
            y2={isHorizontal ? svgH - pad : svgH / 2}
            stroke={styles.border} strokeWidth={1}
          />
        )}

        {/* محتوى القطعة */}
        {isFacedown ? (
          <>
            <clipPath id={`clip-fd-${a}-${b}`}>
              <rect x={1} y={1} width={svgW-2} height={svgH-2} rx={rx-1} />
            </clipPath>
            <g clipPath={`url(#clip-fd-${a}-${b})`}>
              <FacedownPattern x={0} y={0} w={svgW} h={svgH} color={styles.dotFill} />
            </g>
          </>
        ) : (
          <>
            {/* جانب A (فوق / يسار) */}
            {renderDots(a, pad, pad, areaW, halfH, styles.dotFill, dotR)}
            {/* جانب B (تحت / يمين) */}
            {renderDots(b, pad, pad + halfH, areaW, halfH, styles.dotFill, dotR)}
          </>
        )}
      </svg>
    </motion.button>
  );
}
