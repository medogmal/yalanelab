"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoGame, type Tile, type Side, type PlayerId } from "@/lib/domino/game";
import { getBotThinkDelay, type DiffLevel } from "@/lib/platform/difficulty";
import DominoChain from "./DominoChain";
import DominoHand from "./DominoHand";
import DominoOpponent from "./DominoOpponent";
import DominoSplashV2 from "./DominoSplashV2";
import DominoEndDialogV2 from "./DominoEndDialogV2";

export interface DominoTableProps {
  matchId?: string;
  playerId: PlayerId;
  mode?: "training" | "online";
  gameType?: "classic" | "block" | "all_fives";
  difficulty?: DiffLevel;
  numPlayers?: 2 | 4;
  campaignMapId?: string;
  campaignLevelId?: string;
  onLeave?: () => void;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
function VictoryConfetti() {
  const colors = ["#f5a623", "#34d399", "#60a5fa", "#f87171", "#c084fc"];
  const pts = React.useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 1.5,
    dur: 2.5 + Math.random() * 2, color: colors[i % colors.length],
    w: 7 + Math.random() * 10, rot: Math.random() * 360,
  })), []);
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:10 }}>
      {pts.map(p => (
        <motion.div key={p.id}
          style={{ position:"absolute", left:`${p.x}%`, top:-16, width:p.w, height:p.w*0.5, background:p.color, borderRadius:2 }}
          animate={{ y:["0vh","115vh"], rotate:[p.rot,p.rot+540], opacity:[1,1,0] }}
          transition={{ duration:p.dur, delay:p.delay, ease:"easeIn" }}
        />
      ))}
    </div>
  );
}

// ─── Bot scheduler ────────────────────────────────────────────────────────────
function scheduleBot(
  g: DominoGame,
  humanId: PlayerId,
  difficulty: DiffLevel,
  redraw: () => void,
  setThinking: (v: boolean) => void,
) {
  if (g.phase !== "playing") return;
  const botId = g.players[g.turnIndex];
  if (botId === humanId) return;
  setThinking(true);
  const delay = getBotThinkDelay(difficulty);
  setTimeout(() => {
    if (g.phase !== "playing") { setThinking(false); return; }
    const moves = g.getValidMoves(botId);
    if (moves.length > 0) {
      const m = moves[Math.floor(Math.random() * moves.length)];
      g.play(botId, m.tile, m.side);
    } else {
      const ok = g.draw(botId);
      if (!ok) g.pass(botId);
    }
    setThinking(false);
    redraw();
    if (g.phase === "playing" && g.players[g.turnIndex] !== humanId) {
      scheduleBot(g, humanId, difficulty, redraw, setThinking);
    }
  }, delay);
}

// ─── useGameState ─────────────────────────────────────────────────────────────
function useGameState(props: DominoTableProps) {
  const { playerId, gameType = "classic", difficulty = "medium", numPlayers = 2 } = props;
  const gameRef = useRef<DominoGame | null>(null);
  const [tick, setTick]               = useState(0);
  const [thinking, setThinking]       = useState(false);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const redraw = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    const g = new DominoGame(numPlayers, difficulty, gameType);
    g.deal();
    gameRef.current = g;
    redraw();
    if (g.players[g.turnIndex] !== playerId) {
      scheduleBot(g, playerId, difficulty, redraw, setThinking);
    }
  }, []);

  const g = gameRef.current;
  if (!g) return null;

  const myHand     = g.hands[playerId] ?? [];
  const chain      = g.chain;
  const bots       = g.players.filter(p => p !== playerId);
  const isMyTurn   = g.turn === playerId && g.phase === "playing";
  const validMoves = isMyTurn ? g.getValidMoves(playerId) : [];

  function afterMove() {
    redraw();
    if (g.phase !== "playing") return;
    if (g.players[g.turnIndex] !== playerId) {
      scheduleBot(g, playerId, difficulty, redraw, setThinking);
    }
  }

  function handleSideSelect(tile: Tile, side: Side) {
    if (!g || !isMyTurn) return;
    g.play(playerId, tile, side);
    setSelectedTile(null);
    afterMove();
  }

  function handleDraw() {
    if (!g || !isMyTurn) return;
    if (!g.draw(playerId)) g.pass(playerId);
    afterMove();
  }

  function handlePass() {
    if (!g || !isMyTurn) return;
    g.pass(playerId);
    afterMove();
  }

  return {
    g, myHand, chain, bots, isMyTurn, validMoves,
    thinking, selectedTile, setSelectedTile,
    handleSideSelect, handleDraw, handlePass,
    phase: g.phase, winner: g.winner,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DominoTable(props: DominoTableProps) {
  const { onLeave, playerId } = props;
  const [showSplash, setShowSplash] = useState(true);
  const [gameKey, setGameKey]       = useState(0);

  const state = useGameState(props);

  if (!state) {
    return (
      <div className="flex items-center justify-center"
        style={{ height:"100dvh", background:"#07090f", color:"#a78bfa", fontSize:14 }}>
        جاري التحميل…
      </div>
    );
  }

  const { g, myHand, chain, bots, isMyTurn, validMoves, thinking,
          selectedTile, setSelectedTile, phase, winner,
          handleSideSelect, handleDraw, handlePass } = state;

  const canDraw = isMyTurn && validMoves.length === 0 && g.boneyard.length > 0;
  const canPass = isMyTurn && validMoves.length === 0 && g.boneyard.length === 0;
  const numPlayers = g.players.length;
  const gameTypeLabel: Record<string, string> = { classic:"كلاسيك", block:"بلوك", all_fives:"أخماس" };

  return (
    <div key={gameKey} className="relative flex flex-col select-none"
      style={{ height:"100dvh", overflow:"hidden",
        background:"radial-gradient(ellipse at 50% 40%, #1a1030 0%, #07090f 100%)" }}>

      <AnimatePresence>
        {showSplash && <DominoSplashV2 onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "ended" && (
          <DominoEndDialogV2
            winner={winner} myId={playerId}
            onReplay={() => { setShowSplash(true); setGameKey(k => k + 1); }}
            onHome={() => onLeave?.()}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => onLeave?.()}
          className="text-white/40 hover:text-white transition-colors text-sm font-medium">
          ← رجوع
        </button>
        <span className="text-white/60 text-xs font-bold tracking-wide">
          🁣 {gameTypeLabel[g.gameType] ?? "دومينو"}
        </span>
        <span className="text-white/25 text-xs">مستودع: {g.boneyard.length}</span>
      </div>

      {/* Opponents */}
      <div className="flex items-start justify-center gap-6 px-4 py-2 shrink-0">
        {bots.map((botId, i) => (
          <DominoOpponent key={botId} id={botId}
            tileCount={g.hands[botId]?.length ?? 0}
            isTurn={g.turn === botId}
            isThinking={thinking && g.turn === botId}
            position={numPlayers === 4 ? (i===0?"left":i===1?"top":"right") : "top"}
          />
        ))}
      </div>

      {/* Chain */}
      <div className="flex-1 overflow-hidden relative mx-2 mb-1">
        <div className="absolute inset-0 rounded-2xl"
          style={{ background:"rgba(255,255,255,0.018)", border:"1px solid rgba(139,92,246,0.12)" }}/>
        <div className="relative z-10 h-full overflow-auto p-2">
          <DominoChain chain={chain} />
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 flex items-center justify-between shrink-0">
        <motion.div className="text-xs font-bold px-3 py-1.5 rounded-full"
          style={{
            background: isMyTurn ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.04)",
            color: isMyTurn ? "#c4b5fd" : "rgba(255,255,255,0.25)",
            border: `1px solid ${isMyTurn ? "rgba(139,92,246,0.4)" : "transparent"}`,
          }}
          animate={isMyTurn ? { scale:[1,1.04,1] } : {}}
          transition={{ duration:1.5, repeat:Infinity }}>
          {isMyTurn ? "✦ دورك!" : thinking ? "يفكر…" : "انتظر…"}
        </motion.div>
        <div className="flex gap-2">
          <AnimatePresence>
            {canDraw && (
              <motion.button key="draw"
                initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
                onClick={handleDraw}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background:"linear-gradient(135deg,#6d28d9,#4c1d95)" }}>
                🁣 سحب
              </motion.button>
            )}
            {canPass && (
              <motion.button key="pass"
                initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
                onClick={handlePass}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white/50"
                style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)" }}>
                تمرير
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hand */}
      <div className="px-2 pb-3 pt-1 shrink-0"
        style={{ borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <DominoHand
          tiles={myHand}
          validMoves={validMoves}
          selectedTile={selectedTile}
          onTileClick={(tile) => setSelectedTile(prev =>
            prev && prev.a === tile.a && prev.b === tile.b ? null : tile
          )}
          onSideSelect={handleSideSelect}
          disabled={!isMyTurn || phase !== "playing"}
          isMyTurn={isMyTurn}
        />
      </div>
    </div>
  );
}
