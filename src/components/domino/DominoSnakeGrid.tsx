"use client";
/* ═══════════════════════════════════════════════════════════════
   DominoSnakeGrid.tsx  —  Professional Grid System
   • Snap-to-Grid  • Snake Path  • Centered Pivot
   • Collision Detection  • Debug Mode
═══════════════════════════════════════════════════════════════ */
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import type { Tile } from "@/lib/domino/game";

/* ── CONSTANTS ── */
const CELL_GAP = 4;              // فراغ بين الخلايا
const TILE_W  = 84;              // عرض القطعة الأفقية
const TILE_H  = 36;              // ارتفاع القطعة الرأسية — أصغر شوية
const CELL_W  = TILE_W + CELL_GAP;   // 88px — عرض الخلية = حجم القطعة بالظبط
const CELL_H  = TILE_H + CELL_GAP;   // 46px — ارتفاع الخلية = حجم القطعة بالظبط
const TILE_CROP_SCALE_VERTICAL = 1.2;
const TILE_CROP_SCALE_HORIZONTAL = 1.24;
const EDGE_MARGIN = 6;
const MOBILE_BOARD_WIDTH = 640;
const MOBILE_BASE_SCALE = 0.76;
const TURN_ROW_GAP_RATIO_DESKTOP = 0.2;
const TURN_ROW_GAP_RATIO_MOBILE = 0.26;
const TURN_ROW_GAP_MIN_DESKTOP = 10;
const TURN_ROW_GAP_MIN_MOBILE = 14;
const TURN_START_RATIO_DESKTOP = 0.46;
const TURN_START_RATIO_MOBILE = 0.36;
const TURN_START_MIN_DESKTOP = 34;
const TURN_START_MIN_MOBILE = 22;

/* ── TYPES ── */
export interface PlacedTile {
  tile:     Tile;
  col:      number;   // عمود الخلية
  row:      number;   // صف الخلية
  cx:       number;   // مركز X (pivot)
  cy:       number;   // مركز Y (pivot)
  w:        number;
  h:        number;
  vertical: boolean;
  angleDeg: number;
  isDouble: boolean;
}

export interface SnakeGridProps {
  tiles:       Tile[];
  skinFolder:  string;
  showGrid?:   boolean;
  boardWidth:  number;
  boardHeight: number;
}

/* ══════════════════════════════════════════════════════════════
   GRID MATH
   ─────────────────────────────────────────────────────────────
   calcCols  : عدد الأعمدة من عرض الطاولة
   cellCenter: مركز الخلية بالـ px بالضبط
   snapToGrid: تحويل أي إحداثي لأقرب مركز خلية
══════════════════════════════════════════════════════════════ */

/** عدد أعمدة الـ Grid من عرض الطاولة */
function calcCols(boardWidth: number): number {
  return Math.max(3, Math.floor(boardWidth / CELL_W));
}

/**
 * مركز الخلية (cx, cy) بالـ px
 * القطعة تُوضع بحيث مركزها = (cx, cy)
 * أفقي   : left = cx - TILE_W/2  |  top = cy - TILE_H/2
 * رأسي   : left = cx - TILE_H/2  |  top = cy - TILE_W/2
 */
function cellCenter(col: number, row: number): { cx: number; cy: number } {
  return {
    cx: col * CELL_W + CELL_W / 2,
    cy: row * CELL_H + CELL_H / 2,
  };
}

/** Snap: أقرب خلية لأي إحداثي */
export function snapToGrid(
  x: number, y: number, boardWidth: number,
): { col: number; row: number; cx: number; cy: number } {
  const cols = calcCols(boardWidth);
  const col  = Math.max(0, Math.min(cols - 1, Math.round((x - CELL_W / 2) / CELL_W)));
  const row  = Math.max(0, Math.round((y - CELL_H / 2) / CELL_H));
  return { col, row, ...cellCenter(col, row) };
}


/* ══════════════════════════════════════════════════════════════
   SNAKE PATH BUILDER
   ─────────────────────────────────────────────────────────────
   يبني مسار ثعباني:
     صف 0 → يسار لـ يمين
     صف 1 → يمين لـ يسار
     صف 2 → يسار لـ يمين  ...إلخ
   كل قطعة تأخذ خليتها الخاصة بمركز ثابت.
   Collision detection: خلية مشغولة = skip.
══════════════════════════════════════════════════════════════ */
export function buildSnakePath(tiles: Tile[], boardWidth: number, boardHeight: number): PlacedTile[] {
  const cols      = calcCols(boardWidth);
  const isMobileBoard = boardWidth <= MOBILE_BOARD_WIDTH;
  const baseScale = isMobileBoard ? MOBILE_BASE_SCALE : 1;
  const baseW = Math.floor((boardWidth / cols) * baseScale);
  const baseH = Math.round(baseW / 2);
  const turnStartRatio = isMobileBoard ? TURN_START_RATIO_MOBILE : TURN_START_RATIO_DESKTOP;
  const turnStartMin = isMobileBoard ? TURN_START_MIN_MOBILE : TURN_START_MIN_DESKTOP;
  const turnStartOffset = Math.max(turnStartMin, Math.round(baseW * turnStartRatio));
  const rightTurnLimit = boardWidth - EDGE_MARGIN - turnStartOffset;
  const leftTurnLimit = EDGE_MARGIN + turnStartOffset;
  const result: PlacedTile[] = [];

  let col        = Math.max(0, Math.min(cols - 1, Math.floor(cols / 2)));
  let row        = 0;
  let goingRight = true;

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const isDouble = tile.a === tile.b;
    const progressiveScale = Math.max(0.88, 1 - i * 0.004);
    let vertical = isDouble;
    let angleDeg = 0;
    let w = (isDouble ? baseH : baseW) * progressiveScale;
    let h = (isDouble ? baseW : baseH) * progressiveScale;

    if (i === 0) {
      const cx = boardWidth / 2;
      const cy = Math.max(h / 2 + EDGE_MARGIN, boardHeight / 2);
      if (!isDouble) {
        const aIsMin = tile.a <= tile.b;
        angleDeg = aIsMin ? -90 : 90;
      }
      result.push({ tile, col, row, cx, cy, w, h, vertical, angleDeg, isDouble });
      continue;
    }

    const prev = result[i - 1];
    const dir = goingRight ? 1 : -1;
    let cx = prev.cx + dir * (prev.w / 2 + w / 2);
    let cy = prev.cy;

    const hitRight = cx + w / 2 > rightTurnLimit;
    const hitLeft = cx - w / 2 < leftTurnLimit;
    if (hitRight || hitLeft) {
      goingRight = !goingRight;
      row += 1;
      const turnRowGapRatio = isMobileBoard ? TURN_ROW_GAP_RATIO_MOBILE : TURN_ROW_GAP_RATIO_DESKTOP;
      const turnRowGapMin = isMobileBoard ? TURN_ROW_GAP_MIN_MOBILE : TURN_ROW_GAP_MIN_DESKTOP;
      const turnRowGap = Math.max(turnRowGapMin, Math.round(Math.min(prev.h, h) * turnRowGapRatio));
      cy = prev.cy + (prev.h / 2 + h / 2 + turnRowGap);
      cx = prev.cx;
      col = Math.round(cx / baseW);
    } else {
      col += goingRight ? 1 : -1;
    }
    const dx = cx - prev.cx;
    const dy = cy - prev.cy;
    vertical = Math.abs(dy) > Math.abs(dx);
    if (!isDouble) {
      const aIsMin = tile.a <= tile.b;
      if (!vertical) {
        const aOnLeft = dx > 0;
        angleDeg = aOnLeft ? (aIsMin ? -90 : 90) : (aIsMin ? 90 : -90);
      } else {
        const aOnTop = dy > 0;
        angleDeg = aOnTop ? (aIsMin ? 0 : 180) : (aIsMin ? 180 : 0);
      }
      w = (vertical ? baseH : baseW) * progressiveScale;
      h = (vertical ? baseW : baseH) * progressiveScale;
    } else {
      w = baseH * progressiveScale;
      h = baseW * progressiveScale;
      angleDeg = 0;
    }

    result.push({ tile, col, row, cx, cy, w, h, vertical, angleDeg, isDouble });
  }

  return result;
}


/* ══════════════════════════════════════════════════════════════
   DEBUG GRID  —  خطوط إرشادية (debug فقط)
══════════════════════════════════════════════════════════════ */
function DebugGrid({
  cols, rows, boardWidth, boardHeight, cellW, cellH,
}: { cols: number; rows: number; boardWidth: number; boardHeight: number; cellW: number; cellH: number }) {
  return (
    <svg style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 1, overflow: "visible",
    }}>
      {Array.from({ length: cols + 1 }, (_, c) => (
        <line key={`v${c}`}
          x1={c * cellW} y1={0} x2={c * cellW} y2={boardHeight}
          stroke="rgba(245,166,35,0.3)" strokeWidth={1} strokeDasharray="3 3" />
      ))}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <line key={`h${r}`}
          x1={0} y1={r * cellH} x2={boardWidth} y2={r * cellH}
          stroke="rgba(245,166,35,0.3)" strokeWidth={1} strokeDasharray="3 3" />
      ))}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const cx = c * cellW + cellW / 2;
          const cy = r * cellH + cellH / 2;
          return (
            <g key={`c${r}-${c}`}>
              <circle cx={cx} cy={cy} r={2} fill="rgba(245,166,35,0.4)" />
              <text x={cx - 10} y={cy - 4}
                fill="rgba(245,166,35,0.45)" fontSize={8} fontWeight="bold">
                {r},{c}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   SNAKE PATH LINE  —  خط يربط مراكز القطع (debug)
══════════════════════════════════════════════════════════════ */
function SnakePathLine({ placed }: { placed: PlacedTile[] }) {
  if (placed.length < 2) return null;
  const points = placed.map(p => `${p.cx},${p.cy}`).join(" ");
  return (
    <svg style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 3,
    }}>
      <polyline points={points} fill="none"
        stroke="rgba(52,211,153,0.5)" strokeWidth={2} strokeDasharray="5 3" />
      {placed.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={3}
          fill={i === placed.length - 1 ? "#f5a623" : "rgba(52,211,153,0.7)"} />
      ))}
    </svg>
  );
}


/* ══════════════════════════════════════════════════════════════
   SINGLE TILE  —  قطعة واحدة مع Centered Pivot
   ─────────────────────────────────────────────────────────────
   الـ pivot في المنتصف دايماً:
     أفقي : left = cx - TILE_W/2  |  top = cy - TILE_H/2
     رأسي : left = cx - TILE_H/2  |  top = cy - TILE_W/2
══════════════════════════════════════════════════════════════ */
function getTileSrc(folder: string, a: number, b: number): string {
  const [mn, mx] = a <= b ? [a, b] : [b, a];
  return `/skins/domino/${folder}/${mn}-${mx}.png`;
}

function tileStableKey(tile: Tile): string {
  const [mn, mx] = tile.a <= tile.b ? [tile.a, tile.b] : [tile.b, tile.a];
  return `${mn}-${mx}`;
}

function isTwoSix(tile: Tile): boolean {
  const [mn, mx] = tile.a <= tile.b ? [tile.a, tile.b] : [tile.b, tile.a];
  return mn === 2 && mx === 6;
}

function GridTile({
  placed, skinFolder, isLast,
}: { placed: PlacedTile; skinFolder: string; isLast: boolean }) {

  const { cx, cy, tile, w, h, vertical, angleDeg } = placed;
  const fixRotation = isTwoSix(tile) ? 180 : 0;
  const tileCropScale = vertical ? TILE_CROP_SCALE_VERTICAL : TILE_CROP_SCALE_HORIZONTAL;

  // موضع بحيث المركز = (cx, cy)
  const left = cx - w / 2;
  const top  = cy - h / 2;

  const src = getTileSrc(skinFolder, tile.a, tile.b);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={{
        position:  "absolute",
        left,
        top,
        width:     w,
        height:    h,
        borderRadius: 6,
        overflow:  "hidden",
        zIndex:    isLast ? 4 : 2,
        boxShadow: isLast
          ? "0 0 16px rgba(245,166,35,0.7), inset 0 0 0 2px #f5a623"
          : "0 2px 8px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <img
          src={src} alt={`${tile.a}-${tile.b}`} draggable={false}
          style={{
            width: vertical ? "100%" : h,
            height: vertical ? "100%" : w,
            objectFit: "fill",
            display: "block",
            flexShrink: 0,
            transform: `rotate(${angleDeg + fixRotation}deg) scale(${tileCropScale})`,
            transformOrigin: "center",
          }}
        />
      </div>
    </motion.div>
  );
}


/* ══════════════════════════════════════════════════════════════
   DominoSnakeGrid  —  الـ Component الرئيسي
══════════════════════════════════════════════════════════════ */
export default function DominoSnakeGrid({
  tiles,
  skinFolder,
  showGrid  = true,
  boardWidth,
  boardHeight,
}: SnakeGridProps) {

  const placed = useMemo(
    () => buildSnakePath(tiles, boardWidth, boardHeight),
    [tiles, boardWidth, boardHeight],
  );

  const cols     = calcCols(boardWidth);

  // حجم الخلية الفعلي — يملي العرض الكامل
  const realCellW = Math.floor(boardWidth / cols);
  const realCellH = Math.round(realCellW / 2);   // نسبة 2:1 دايماً

  const usedH = placed.length
    ? Math.max(boardHeight, ...placed.map(p => p.cy + p.h / 2 + EDGE_MARGIN))
    : boardHeight;

  return (
    <div style={{
      position: "relative",
      width:    boardWidth,
      minHeight: Math.max(usedH, boardHeight),
    }}>
      {/* ── Debug Grid ── */}
      {showGrid && (
        <DebugGrid
          cols={cols}
          rows={Math.ceil(Math.max(usedH, boardHeight) / realCellH)}
          boardWidth={boardWidth}
          boardHeight={Math.max(usedH, boardHeight)}
          cellW={realCellW}
          cellH={realCellH}
        />
      )}

      {/* ── Snake Path Line ── */}
      {showGrid && placed.length > 1 && (
        <SnakePathLine placed={placed} />
      )}

      {/* ── القطع ── */}
      {placed.map((p, i) => (
        <GridTile
          key={tileStableKey(p.tile)}
          placed={p}
          skinFolder={skinFolder}
          isLast={i === placed.length - 1}
        />
      ))}
    </div>
  );
}