"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DominoTileV2 from "./DominoTileV2";
import type { Tile, Side } from "@/lib/domino/game";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ValidMove { tile: Tile; side: Side }

interface DominoHandProps {
  tiles: Tile[];
  validMoves: ValidMove[];
  selectedTile: Tile | null;
  onTileClick: (tile: Tile) => void;
  onSideSelect: (tile: Tile, side: Side) => void;
  disabled: boolean;
  isMyTurn: boolean;
}

// ─── مساعد: هل تتطابق قطعتان ─────────────────────────────────────────────────
function tilesEqual(a: Tile, b: Tile) {
  return a.a === b.a && a.b === b.b;
}

// ─── مساعد: الحركات المتاحة لقطعة بعينها ─────────────────────────────────────
function movesForTile(tile: Tile, validMoves: ValidMove[]) {
  return validMoves.filter((m) => tilesEqual(m.tile, tile));
}

// ─── المكوّن الرئيسي ──────────────────────────────────────────────────────────
export default function DominoHand({
  tiles, validMoves, selectedTile,
  onTileClick, onSideSelect, disabled, isMyTurn,
}: DominoHandProps) {

  function handleTileClick(tile: Tile) {
    if (!isMyTurn || disabled) return;
    const moves = movesForTile(tile, validMoves);
    if (moves.length === 0) return;

    // حركة واحدة فقط → نلعبها فوراً
    if (moves.length === 1) {
      onSideSelect(tile, moves[0].side);
      return;
    }
    // حركتين (يمين ويسار) → اختيار
    onTileClick(tile);
  }

  function tileState(tile: Tile) {
    if (selectedTile && tilesEqual(tile, selectedTile)) return "selected";
    const moves = movesForTile(tile, validMoves);
    if (!isMyTurn || disabled) return "disabled";
    if (moves.length > 0) return "playable";
    return "disabled";
  }

  const showSideButtons = selectedTile !== null;

  return (
    <div className="flex flex-col items-center gap-2 w-full">

      {/* زرا الجانبين */}
      <AnimatePresence>
        {showSideButtons && selectedTile && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <button
              onClick={() => onSideSelect(selectedTile, "right")}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors"
            >
              يمين →
            </button>
            <button
              onClick={() => onTileClick(selectedTile)}
              className="px-3 py-1.5 rounded-full text-xs text-white/50 hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => onSideSelect(selectedTile, "left")}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition-colors"
            >
              ← يسار
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* القطع في صف أفقي scrollable */}
      <div
        className="flex gap-2 overflow-x-auto w-full py-2 px-2"
        style={{ scrollbarWidth: "none", direction: "ltr" }}
      >
        <AnimatePresence>
          {tiles.map((tile, i) => (
            <motion.div
              key={`hand-${tile.a}-${tile.b}-${i}`}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, scale: 0.6 }}
              transition={{ delay: i * 0.02, type: "spring", stiffness: 260, damping: 20 }}
              style={{ flexShrink: 0 }}
            >
              <DominoTileV2
                a={tile.a}
                b={tile.b}
                orientation="vertical"
                state={tileState(tile)}
                size="md"
                onClick={() => handleTileClick(tile)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
