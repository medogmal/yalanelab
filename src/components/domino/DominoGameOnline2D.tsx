"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DominoGame, Tile, PlayerId } from "@/lib/domino/game";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { getTheme } from "@/lib/platform/cultural-themes";
import { ArrowRight, Settings, ShoppingBag, RotateCcw, ChevronDown } from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────────
   DOT POSITIONS  (3×3 grid indices 0-8)
───────────────────────────────────────────────────────────── */
const DOT_POS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

/* ─────────────────────────────────────────────────────────────
   SKIN CONFIGS
───────────────────────────────────────────────────────────── */
type SkinKey = "skin_ivory" | "skin_dark" | "skin_gold" | "skin_neon" | string;

const SKINS: Record<string, { tile: string; dot: string; divider: string; shadow: string }> = {
  skin_ivory: {
    tile:    "bg-[#f5f0e8] border-[#c8bfa8]",
    dot:     "bg-[#1a1a1a]",
    divider: "border-[#c8bfa8]",
    shadow:  "shadow-[0_4px_20px_rgba(0,0,0,0.4)]",
  },
  skin_dark: {
    tile:    "bg-[#1a1a2e] border-[#4a4a6a]",
    dot:     "bg-white",
    divider: "border-[#4a4a6a]",
    shadow:  "shadow-[0_4px_20px_rgba(0,0,0,0.6)]",
  },
  skin_gold: {
    tile:    "bg-gradient-to-br from-[#fffbe6] to-[#fde68a] border-[#b8860b]",
    dot:     "bg-[#92400e]",
    divider: "border-[#b8860b]",
    shadow:  "shadow-[0_4px_20px_rgba(180,130,0,0.5)]",
  },
  skin_neon: {
    tile:    "bg-[#050510] border-[#7c3aed]",
    dot:     "bg-[#00d4ff] shadow-[0_0_6px_#00d4ff]",
    divider: "border-[#7c3aed]",
    shadow:  "shadow-[0_4px_20px_rgba(124,58,237,0.6)]",
  },
};

function getSkin(key: string) {
  return SKINS[key] ?? SKINS.skin_ivory;
}

/* ─────────────────────────────────────────────────────────────
   HALF — one side of a domino tile
───────────────────────────────────────────────────────────── */
function Half({ n, dotClass }: { n: number; dotClass: string }) {
  return (
    <div className="flex-1 relative">
      {DOT_POS[n]?.map((p, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${dotClass}`}
          style={{
            width: "22%",
            height: "22%",
            top:  `${Math.floor(p / 3) * 33 + 7}%`,
            left: `${(p % 3) * 33 + 7}%`,
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DOMINO TILE
───────────────────────────────────────────────────────────── */
function DominoTile({
  a, b,
  vertical = false,
  size = 56,
  skin = "skin_ivory",
  highlight = false,
  faceDown = false,
  onClick,
  animate: doAnimate = false,
}: {
  a: number; b: number;
  vertical?: boolean;
  size?: number;
  skin?: string;
  highlight?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  animate?: boolean;
}) {
  const sk = getSkin(skin);
  const w = size;
  const h = size * 2;

  const tileStyle: React.CSSProperties = vertical
    ? { width: w, height: h }
    : { width: h, height: w };

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative border-2 rounded-xl flex overflow-hidden select-none
        ${vertical ? "flex-col" : "flex-row"}
        ${sk.tile} ${sk.shadow}
        ${highlight ? "ring-[3px] ring-[#00ff87] ring-offset-1 ring-offset-transparent" : ""}
        ${onClick ? "cursor-pointer" : "cursor-default"}
        transition-shadow duration-200
      `}
      style={tileStyle}
      whileHover={onClick ? { scale: 1.08, y: vertical ? -10 : 0 } : {}}
      whileTap={onClick ? { scale: 0.96 } : {}}
      initial={doAnimate ? { opacity: 0, y: 40 } : undefined}
      animate={doAnimate ? { opacity: 1, y: 0 } : undefined}
      layout
    >
      {faceDown ? (
        /* Back face */
        <div className="flex-1 flex items-center justify-center opacity-20">
          <div className="grid grid-cols-3 gap-1 p-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${sk.dot}`} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <Half n={a} dotClass={sk.dot} />
          {/* Divider */}
          <div className={`flex-shrink-0 border-[1.5px] ${sk.divider} ${vertical ? "mx-2" : "my-2"}`} />
          <Half n={b} dotClass={sk.dot} />
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FELT BACKGROUND — ثقافي حسب المود
───────────────────────────────────────────────────────────── */
function Felt({ skin, culturalMood }: { skin: string; culturalMood?: string }) {
  const iNeon = skin === "skin_neon";
  const isDark = skin === "skin_dark";

  // لو مش neon أو dark، نستخدم صورة الطاولة الثقافية
  const theme = culturalMood ? getTheme(culturalMood as any) : null;
  const tableImage = theme?.table?.background ?? null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {iNeon ? (
        <>
          <div className="absolute inset-0 bg-[#020208]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0d0d2e_0%,#020208_70%)]" />
          <div className="absolute inset-0 opacity-[0.04]"
               style={{ backgroundImage: "linear-gradient(#7c3aed 1px,transparent 1px),linear-gradient(90deg,#7c3aed 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        </>
      ) : isDark ? (
        <>
          <div className="absolute inset-0 bg-[#0d1117]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#161b22_0%,#0d1117_70%)]" />
        </>
      ) : tableImage ? (
        <>
          {/* صورة الطاولة الثقافية */}
          <div className="absolute inset-0" style={{ backgroundImage:`url(${tableImage})`, backgroundSize:"cover", backgroundPosition:"center" }} />
          {/* overlay داكن خفيف عشان تتوضح الـ tiles */}
          <div className="absolute inset-0 bg-black/40" />
          {/* إطار ذهبي داخلي */}
          <div className="absolute inset-0" style={{ boxShadow: theme?.table?.frameShadow ?? "inset 0 0 80px rgba(0,0,0,0.5)" }} />
          {/* pattern ثقافي خفيف */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: theme?.visual?.pattern, backgroundSize:"56px 56px", opacity: (theme?.table?.watermarkOpacity ?? 0.12) }} />
        </>
      ) : (
        <>
          {/* Classic green felt fallback */}
          <div className="absolute inset-0 bg-[#1a4c35]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#1f5c40_0%,#0f3020_80%)]" />
          <div className="absolute inset-0 opacity-[0.06]"
               style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }} />
          <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.5)]" />
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TIMER RING
───────────────────────────────────────────────────────────── */
function TimerRing({ seconds, max = 30, active }: { seconds: number; max?: number; active: boolean }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const pct = seconds / max;
  const color = pct > 0.5 ? "#00ff87" : pct > 0.25 ? "#f5a623" : "#ef4444";
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle
          cx="24" cy="24" r={r} fill="none"
          stroke={active ? color : "rgba(255,255,255,0.15)"}
          strokeWidth="3"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <span className={`text-sm font-black tabular-nums z-10 ${active ? "" : "opacity-40"}`}
            style={{ color: active ? color : "white" }}>
        {seconds}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN GAME COMPONENT
───────────────────────────────────────────────────────────── */
export default function DominoGameOnline2D() {
  const { user, equipped, unlockItem, culturalMood } = usePlatformStore();
  const skin = equipped?.domino_skin ?? "skin_ivory";

  const [game]        = useState(() => new DominoGame());
  const [phase, setPhase]           = useState<"lobby" | "playing" | "ended">("lobby");
  const [turn, setTurn]             = useState<PlayerId>("player");
  const [tick, setTick]             = useState(0);
  const [myHand, setMyHand]         = useState<Tile[]>([]);
  const [validMoves, setValidMoves] = useState<{ tile: Tile; side: "left" | "right" }[]>([]);
  const [timer, setTimer]           = useState(30);
  const [showStore, setShowStore]   = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<Tile | null>(null);
  const [drawCount, setDrawCount]   = useState<Record<string, number>>({ player: 0, ai1: 0, ai2: 0, ai3: 0 });

  const sync = useCallback(() => {
    setPhase(game.phase);
    setTurn(game.turn);
    setTick(t => t + 1);
    setMyHand([...game.hands.player]);
    setValidMoves(game.getValidMoves("player"));
  }, [game]);

  // Timer
  useEffect(() => {
    if (phase !== "playing") return;
    setTimer(30);
    const iv = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(iv);
  }, [turn, phase]);

  // Auto-draw on timeout
  useEffect(() => {
    if (timer === 0 && phase === "playing" && turn === "player") {
      const moves = game.getValidMoves("player");
      if (moves.length === 0) game.nextTurn();
      else {
        const m = moves[0];
        game.playMove("player", m.tile, m.side);
        setLastPlayed(m.tile);
      }
      sync();
    }
  }, [timer, phase, turn, game, sync]);

  // Bot moves
  useEffect(() => {
    if (phase !== "playing") return;
    if (turn === "player") return;
    const delay = setTimeout(() => {
      const moves = game.getValidMoves(game.turn);
      if (moves.length > 0) {
        const m = moves[Math.floor(Math.random() * moves.length)];
        game.playMove(game.turn, m.tile, m.side);
        setLastPlayed(m.tile);
      } else {
        game.nextTurn();
      }
      sync();
      if (game.phase === "ended") setTimeout(() => setShowResult(true), 600);
    }, 900 + Math.random() * 600);
    return () => clearTimeout(delay);
  }, [turn, phase, game, sync]);

  const startGame = () => {
    game.reset();
    game.deal(4);
    setShowResult(false);
    setLastPlayed(null);
    setDrawCount({ player: 0, ai1: 0, ai2: 0, ai3: 0 });
    sync();
  };

  const handlePlay = (tile: Tile) => {
    if (turn !== "player") return;
    const moves = validMoves.filter(m => m.tile.a === tile.a && m.tile.b === tile.b);
    if (!moves.length) return;
    game.playMove("player", tile, moves[0].side);
    setLastPlayed(tile);
    sync();
    if (game.phase === "ended") {
      setTimeout(() => setShowResult(true), 600);
      // أضف نقطة لبلد اللاعب لو فاز
      if (game.winner === "player" && user?.country) {
        fetch("/api/country-war", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: user.country, delta: 1 }),
        }).catch(() => {});
      }
    }
  };

  const handleDraw = () => {
    if (turn !== "player") return;
    const moved = game.draw("player");
    if (moved) {
      setDrawCount(d => ({ ...d, player: d.player + 1 }));
      sync();
    }
  };

  const chain = game.board ?? [];
  const isMyTurn = phase === "playing" && turn === "player";

  /* ── AI hand counts ── */
  const aiHandCounts: Record<string, number> = {
    ai1: game.hands?.ai1?.length ?? 0,
    ai2: game.hands?.ai2?.length ?? 0,
    ai3: game.hands?.ai3?.length ?? 0,
  };

  const iNeon = skin === "skin_neon";

  return (
    <div className="relative w-full min-h-dvh overflow-hidden text-white" dir="rtl">

      {/* ── FELT ── */}
      <Felt skin={skin} culturalMood={culturalMood} />

      {/* ══════════════════════════════════════════════
          LOBBY OVERLAY
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {phase === "lobby" && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
          >
            <Felt skin={skin} culturalMood={culturalMood} />
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            <motion.div
              className="relative z-10 flex flex-col items-center gap-8 px-6"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            >
              {/* Logo tiles */}
              <div className="flex items-end gap-3 mb-2">
                {[[6,6],[5,4],[3,2],[1,0]].map(([a,b], i) => (
                  <motion.div key={i}
                    initial={{ y: -80, rotate: (i - 1.5) * 15, opacity: 0 }}
                    animate={{ y: 0, rotate: (i - 1.5) * 8, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: "spring", bounce: 0.4 }}>
                    <DominoTile a={a} b={b} vertical size={44} skin={skin} />
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none gold-shimmer mb-2">
                  DOMINO
                </h1>
                <p className="text-slate-400 font-bold tracking-[0.3em] text-sm uppercase">
                  يالا نلعب
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 w-64">
                <motion.button
                  onClick={startGame}
                  className="w-full py-4 rounded-2xl font-black text-lg text-black
                             bg-gradient-to-r from-amber-400 to-orange-500
                             shadow-xl shadow-amber-500/30 hover:brightness-110 transition-all
                             hover:-translate-y-0.5 active:scale-95"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                >
                  🎮 العب الآن
                </motion.button>

                <button
                  onClick={() => setShowStore(true)}
                  className="w-full py-3 rounded-2xl font-bold text-sm border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} /> الأسكنات
                </button>

                <Link href="/games/domino/online"
                  className="w-full py-3 rounded-2xl font-bold text-sm border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2 text-center">
                  <ArrowRight size={16} /> العودة للوبي
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          GAME UI
      ══════════════════════════════════════════════ */}
      {phase !== "lobby" && (
        <>
          {/* ── TOP BAR ── */}
          <div className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-4 pt-2 sm:pt-3 pb-2 flex items-center gap-2 sm:gap-3"
               style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
            {/* Back */}
            <Link href="/games/domino/online"
              className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors flex-shrink-0">
              <ArrowRight size={18} />
            </Link>

            {/* Turn indicator */}
            <div className="flex-1 flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all
                ${isMyTurn
                  ? "bg-[#00ff87]/15 border-[#00ff87]/30 text-[#00ff87]"
                  : "bg-white/[0.06] border-white/[0.08] text-slate-400"}`}>
                {isMyTurn ? "⭐ دورك!" : `⏳ دور ${turn === "ai1" ? "خصم 1" : turn === "ai2" ? "خصم 2" : "خصم 3"}`}
              </div>
              <div className="text-xs text-slate-500 font-bold">
                {chain.length} قطعة
              </div>
            </div>

            {/* Timer */}
            <TimerRing seconds={timer} active={isMyTurn} />

            {/* Settings */}
            <button onClick={() => setShowStore(true)}
              className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/60 transition-colors">
              <Settings size={16} className="text-slate-400" />
            </button>
          </div>

          {/* ── AI OPPONENTS (top area) ── */}
          <div className="absolute top-14 sm:top-16 left-0 right-0 z-20 flex justify-between px-2 sm:px-4">
            {/* ai1 — top left */}
            <PlayerBadge id="ai1" name="خصم 1" count={aiHandCounts.ai1} active={turn === "ai1"} side="right" small />
            {/* ai2 — top center */}
            <PlayerBadge id="ai2" name="خصم 2" count={aiHandCounts.ai2} active={turn === "ai2"} side="center" small />
            {/* ai3 — top right */}
            <PlayerBadge id="ai3" name="خصم 3" count={aiHandCounts.ai3} active={turn === "ai3"} side="left" small />
          </div>

          {/* ── BOARD ── */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2 sm:px-4 pt-28 sm:pt-32 pb-36 sm:pb-44">
            <div className="relative w-full max-w-3xl" style={{ minHeight: 160 }}>
              {chain.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl px-12 py-8 text-slate-600 text-sm font-bold text-center">
                    ابدأ باختيار قطعة من يدك
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {chain.map((tile, i) => (
                    <motion.div key={i}
                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", bounce: 0.3 }}>
                      <DominoTile
                        a={tile.a} b={tile.b}
                        vertical={tile.a === tile.b}
                        size={window?.innerWidth < 400 ? 28 : 34}
                        skin={skin}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── PLAYER HAND (bottom) ── */}
          <div className="absolute bottom-0 left-0 right-0 z-30"
               style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 70%, transparent)" }}>
            {/* Me info */}
            <div className="flex items-center justify-between px-3 sm:px-4 pt-2 sm:pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-black">
                  {(user?.name?.[0] ?? "أ")}
                </div>
                <div>
                  <div className="text-sm font-black leading-none">{user?.name ?? "أنت"}</div>
                  <div className="text-[10px] text-slate-500 font-bold">{myHand.length} قطع</div>
                </div>
              </div>

              {/* Draw button */}
              {isMyTurn && validMoves.length === 0 && (
                <motion.button
                  onClick={handleDraw}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm text-black
                             bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30
                             hover:brightness-110 transition-all animate-pulse"
                >
                  <ChevronDown size={14} /> اسحب
                </motion.button>
              )}
            </div>

            {/* Tiles row */}
            <div className="flex items-end justify-center gap-1.5 px-2 sm:px-4 pb-safe pb-4 sm:pb-6 overflow-x-auto min-h-[90px] sm:min-h-[110px]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
              {myHand.map((t, i) => {
                const canPlay = validMoves.some(m => m.tile.a === t.a && m.tile.b === t.b);
                return (
                  <motion.div key={`${t.a}-${t.b}-${i}`}
                    animate={{ y: isMyTurn && canPlay ? [0, -6, 0] : 0 }}
                    transition={{ repeat: isMyTurn && canPlay ? Infinity : 0, duration: 1.5, delay: i * 0.15 }}>
                    <DominoTile
                      a={t.a} b={t.b} vertical
                      size={40}
                      skin={skin}
                      highlight={canPlay && isMyTurn}
                      onClick={() => isMyTurn && handlePlay(t)}
                      animate
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════
          RESULT OVERLAY
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showResult && (() => {
          const cTheme = getTheme(culturalMood as any);
          const won = game.winner === "player";
          return (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div
                className="rounded-3xl p-8 text-center max-w-xs w-full mx-4 border"
                style={{
                  background: cTheme.colors.secondary,
                  borderColor: won ? cTheme.colors.gold + "60" : "rgba(255,255,255,0.08)",
                }}
                initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.4 }}>

                <div className="text-6xl mb-4">{won ? "🏆" : "💀"}</div>
                <h2 className="text-3xl font-black mb-2" style={{ color: won ? cTheme.colors.gold : "white" }}>
                  {won ? cTheme.ui.winMessage : cTheme.ui.loseMessage}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  {won
                    ? "أداء رائع! استمر هكذا"
                    : `فاز ${game.winner === "ai1" ? "خصم 1" : game.winner === "ai2" ? "خصم 2" : "خصم 3"}`}
                </p>

                <div className="flex flex-col gap-3">
                  <button onClick={startGame}
                    className="w-full py-3 rounded-2xl font-black text-black hover:brightness-110 transition-all shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${cTheme.colors.gold}, ${cTheme.colors.accent})` }}>
                    🎮 جولة جديدة
                  </button>
                  <Link href="/games/domino/online"
                    className="w-full py-3 rounded-2xl font-bold text-sm border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] transition-all text-center">
                    الخروج
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          SKIN STORE
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStore && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowStore(false)}>
            <motion.div
              className="glass-dark border border-white/[0.08] rounded-3xl w-full max-w-sm overflow-hidden"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", bounce: 0.3 }}>

              <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                <h2 className="text-lg font-black">أسكنات الدومينو</h2>
                <button onClick={() => setShowStore(false)}
                  className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-colors text-slate-400">
                  ✕
                </button>
              </div>

              <div className="p-5 grid grid-cols-2 gap-3">
                {(["skin_ivory", "skin_dark", "skin_gold", "skin_neon"] as const).map(s => {
                  const active = (equipped?.domino_skin ?? "skin_ivory") === s;
                  const names: Record<string, string> = {
                    skin_ivory: "عاج كلاسيك", skin_dark: "ليلي", skin_gold: "ذهبي", skin_neon: "نيون"
                  };
                  return (
                    <button key={s}
                      onClick={() => unlockItem({ id: s, type: "domino_skin", name: names[s], asset: s.replace("skin_", "") })}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all
                        ${active
                          ? "border-amber-400/60 bg-amber-400/10 shadow-lg shadow-amber-400/10"
                          : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07]"}`}>
                      <DominoTile a={5} b={3} vertical size={32} skin={s} />
                      <span className="text-xs font-black">{names[s]}</span>
                      {active && <span className="text-[9px] text-amber-400 font-black">✓ مفعّل</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PLAYER BADGE (for AI opponents)
───────────────────────────────────────────────────────────── */
function PlayerBadge({ id, name, count, active, side, small = false }: {
  id: string; name: string; count: number; active: boolean; side: "left" | "center" | "right"; small?: boolean;
}) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ repeat: active ? Infinity : 0, duration: 1 }}
      className={`flex flex-col items-center gap-1 ${side === "center" ? "" : ""}`}>
      <div className={`relative ${small ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl flex items-center justify-center font-black text-sm
                      border-2 transition-all
                      ${active
                        ? "bg-amber-400/20 border-amber-400 text-amber-400 shadow-lg shadow-amber-400/20"
                        : "bg-black/40 border-white/[0.08] text-slate-500"}`}>
        🤖
        {active && (
          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-[#07090f] animate-pulse" />
        )}
      </div>
      <div className="text-center">
        <div className={`${small ? 'text-[9px]' : 'text-[10px]'} font-black text-slate-300`}>{name}</div>
        <div className="text-[9px] text-slate-600 font-bold">{count} قطع</div>
      </div>
      {/* Face-down tiles hint */}
      <div className="flex gap-0.5">
        {[...Array(Math.min(count, small ? 3 : 5))].map((_, i) => (
          <div key={i} className={`${small ? 'w-2 h-3.5' : 'w-3 h-5'} rounded-sm bg-white/[0.07] border border-white/[0.05]`} />
        ))}
        {count > (small ? 3 : 5) && <span className="text-[8px] text-slate-600 font-bold self-end">+{count-(small ? 3 : 5)}</span>}
      </div>
    </motion.div>
  );
}
