"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChessGame, PieceOnBoard, Move } from "@/lib/chess/game";
import { getBestMove } from "@/lib/chess/stockfish";

type Mode = "pvp" | "ai";
type PieceSet = "lichess" | "staunton" | "gold" | "neon";
type BoardTheme = "classic" | "wood" | "carbon" | "ocean";

function sqColor(fileIndex: number, rankIndex: number) {
  return (fileIndex + rankIndex) % 2 === 1;
}

function squareToPos(square: string, orientation: "w" | "b") {
  const f = "abcdefgh".indexOf(square[0]);
  const r = parseInt(square[1], 10);
  const x = orientation === "w" ? f : 7 - f;
  const y = orientation === "w" ? 8 - r : r - 1;
  return { x, y };
}

function posToSquare(x: number, y: number, orientation: "w" | "b") {
  const fIndex = orientation === "w" ? x : 7 - x;
  const rIndex = orientation === "w" ? 7 - y : y;
  const file = "abcdefgh"[fIndex];
  const rank = 1 + rIndex;
  return `${file}${rank}`;
}


export default function ChessBoard2D({ externalFen, onRemoteMove, premium = false, defaultPieceSet, defaultBoardTheme, onPieceSetChange, onBoardThemeChange, initialMode, initialPlayerSide, initialAiSkill, initialAiDepth, size: sizeProp, compactUI }: { externalFen?: string; onRemoteMove?: (from: string, to: string, promotion?: string) => Promise<boolean>; premium?: boolean; defaultPieceSet?: PieceSet; defaultBoardTheme?: BoardTheme; onPieceSetChange?: (p: PieceSet) => void; onBoardThemeChange?: (t: BoardTheme) => void; initialMode?: "pvp" | "ai"; initialPlayerSide?: "w" | "b"; initialAiSkill?: number; initialAiDepth?: number; size?: number; compactUI?: boolean }) {
  const [game] = useState(() => new ChessGame());
  const [selected, setSelected] = useState<string | null>(null);
  const [legal, setLegal] = useState<string[]>([]);
  const [lastFrom, setLastFrom] = useState<string | null>(null);
  const [lastTo, setLastTo] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"w" | "b">(initialPlayerSide || "w");
  const [mode, setMode] = useState<Mode>(initialMode || "ai");
  const [playerSide, setPlayerSide] = useState<"w" | "b">(initialPlayerSide || "w");
  const [aiSkill, setAiSkill] = useState<number>(initialAiSkill ?? 10);
  const [aiDepth, setAiDepth] = useState<number>(initialAiDepth ?? 12);
  const [pieceSet, setPieceSet] = useState<PieceSet>(defaultPieceSet || "lichess");
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(defaultBoardTheme || "classic");
  const [redoStack, setRedoStack] = useState<Array<{ from: string; to: string; promotion?: "q" | "r" | "b" | "n" }>>([]);
  const [evalScore, setEvalScore] = useState<{ type: "cp" | "mate"; value: number } | null>(null);
  const [autoEval, setAutoEval] = useState<boolean>(false);
  const [promotion, setPromotion] = useState<{ from: string; to: string; choices: Array<"q" | "r" | "b" | "n"> } | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [premove, setPremove] = useState<{ from: string; to: string; promotion?: "q" | "r" | "b" | "n" } | null>(null);
  const [analysis, setAnalysis] = useState<{ best: string; score: { type: "cp" | "mate"; value: number }; pvUci: string[]; pvSan: string[] } | null>(null);
  const [ended, setEnded] = useState<{ reason: string } | null>(null);
  const [aiBusy, setAiBusy] = useState<boolean>(false);
  const [postBusy, setPostBusy] = useState<boolean>(false);
  const [issues, setIssues] = useState<Array<{ idx: number; color: "w" | "b"; san: string; delta: number; best?: string }>>([]);
  const [showControls, setShowControls] = useState<boolean>(false);
  const audioRef = React.useRef<AudioContext | null>(null);
  React.useEffect(() => {
    if (defaultPieceSet) setPieceSet(defaultPieceSet);
    if (defaultBoardTheme) setBoardTheme(defaultBoardTheme);
  }, [defaultPieceSet, defaultBoardTheme]);
  React.useEffect(() => {
    if (typeof initialAiSkill === "number") setAiSkill(initialAiSkill);
  }, [initialAiSkill]);
  React.useEffect(() => {
    if (typeof initialAiDepth === "number") setAiDepth(initialAiDepth);
  }, [initialAiDepth]);

  const aiReply = React.useCallback(async () => {
    if (aiBusy || game.isGameOver()) return;
    setAiBusy(true);
    const fen = game.fen();
    const best = await getBestMove(fen, { skill: aiSkill, depth: aiDepth }).catch(() => "0000");
    if (!best || best.length < 4 || best === "0000") {
      const moves = game.moves({ verbose: true }) as unknown as Move[];
      if (moves.length === 0) {
        setAiBusy(false);
        return;
      }
      const pick = moves[Math.floor(Math.random() * moves.length)];
      const mv2 = game.move(pick.from, pick.to, pick.promotion);
      setLastFrom(mv2?.from || null);
      setLastTo(mv2?.to || null);
      if (game.isGameOver()) setEnded({ reason: "checkmate" });
      setAiBusy(false);
      return;
    }
    const from = best.slice(0, 2);
    const to = best.slice(2, 4);
    const promotion = best.length >= 5 ? best.slice(4, 5) : undefined;
    const mv2 = game.move(from, to, promotion);
    setLastFrom(mv2?.from || null);
    setLastTo(mv2?.to || null);
    if (game.isGameOver()) setEnded({ reason: "checkmate" });
    setAiBusy(false);
  }, [game, aiSkill, aiDepth, aiBusy]);

  const pieces = game.pieces();

  const playSound = React.useCallback((kind: "move" | "capture" | "check") => {
    if (!soundOn) return;
    let ctx = audioRef.current;
    if (!ctx) {
      try {
        const AC =
          (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        audioRef.current = ctx;
      } catch {
        return;
      }
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = kind === "move" ? 600 : kind === "capture" ? 300 : 800;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    }, 90);
  }, [soundOn]);

  function onClickSquare(square: string) {
    if (ended) return;
    if (selected) {
      const ok = legal.includes(square);
      if (ok) {
        if (onRemoteMove) {
          const isMyTurn = game.turn() === playerSide;
          const legals = game.legalMoves(selected).filter((m) => m.to === square);
          const promo = legals[0]?.promotion as ("q" | "r" | "b" | "n" | undefined);
          if (!isMyTurn) {
            setPremove({ from: selected, to: square, promotion: promo });
            setSelected(null);
            setLegal([]);
            return;
          } else {
            (async () => {
              const okRemote = await onRemoteMove(selected, square, promo);
              if (okRemote) {
                setSelected(null);
                setLegal([]);
                setLastFrom(selected);
                setLastTo(square);
                setRedoStack([]);
                playSound("move");
              }
            })();
          }
        } else {
          const legals = game.legalMoves(selected).filter((m) => m.to === square);
          if (legals.length > 1 && legals.some((m) => m.promotion)) {
            const choices: Array<"q" | "r" | "b" | "n"> = ["q", "r", "b", "n"];
            setPromotion({ from: selected, to: square, choices });
            return;
          }
          const promo = legals[0]?.promotion as ("q" | "r" | "b" | "n" | undefined);
          const mv = game.move(selected, square, promo);
          setSelected(null);
          setLegal([]);
          setLastFrom(mv?.from || null);
          setLastTo(mv?.to || null);
          setRedoStack([]);
          // Sound
          playSound(game.isCheck() ? "check" : mv?.flags.includes("c") ? "capture" : "move");
          if (game.isGameOver()) {
            setEnded({ reason: "checkmate" });
            return;
          }
          if (mode === "ai" && game.turn() !== playerSide) {
            setTimeout(async () => {
              await aiReply();
            }, 150);
          }
        }
      } else {
        setSelected(square);
        setLegal(game.legalMoves(square).map((m) => m.to));
      }
    } else {
      setSelected(square);
      setLegal(game.legalMoves(square).map((m) => m.to));
    }
  }

  const size = sizeProp ?? 512;
  const sq = size / 8;

  const lastFromPos = lastFrom ? squareToPos(lastFrom, orientation) : null;
  const lastToPos = lastTo ? squareToPos(lastTo, orientation) : null;
  React.useEffect(() => {
    if (externalFen) {
      try {
        game.load(externalFen);
      } catch {}
    }
  }, [externalFen, game]);

  React.useEffect(() => {
    if (mode === "ai" && game.turn() !== playerSide && !game.isGameOver() && !aiBusy) {
      setTimeout(async () => {
        await aiReply();
      }, 150);
    }
  }, [mode, playerSide, aiReply, game, aiBusy]);

  React.useEffect(() => {
    if (autoEval) {
      (async () => {
        const fen = game.fen();
        const { getAnalysis } = await import("@/lib/chess/stockfish");
        try {
          const a = await getAnalysis(fen, { depth: aiDepth });
          setEvalScore(a.score);
          setAnalysis(a);
        } catch {
          setEvalScore(null);
          setAnalysis(null);
        }
      })();
    }
  }, [autoEval, game, lastFrom, lastTo, aiDepth]);

  React.useEffect(() => {
    if (!onRemoteMove || !premove) return;
    if (game.turn() !== playerSide) return;
    const legals = game.legalMoves(premove.from).filter((m) => m.to === premove.to);
    const promo = premove.promotion || (legals[0]?.promotion as ("q" | "r" | "b" | "n" | undefined));
    (async () => {
      const okRemote = await onRemoteMove(premove.from, premove.to, promo);
      if (okRemote) {
        setSelected(null);
        setLegal([]);
        setLastFrom(premove.from);
        setLastTo(premove.to);
        setRedoStack([]);
        setPremove(null);
        playSound("move");
      }
    })();
  }, [externalFen, onRemoteMove, premove, playerSide, game, playSound]);

  let COLOR_LIGHT = "#f0d9b5";
  let COLOR_DARK = "#b58863";
  if (boardTheme === "wood") {
    COLOR_LIGHT = "#e6c59e";
    COLOR_DARK = "#8c5a2b";
  } else if (boardTheme === "carbon") {
    COLOR_LIGHT = "#1f2937";
    COLOR_DARK = "#0f172a";
  } else if (boardTheme === "ocean") {
    COLOR_LIGHT = "#bcd7ff";
    COLOR_DARK = "#5a7abf";
  }
  function iconFill(color: "w" | "b") {
    if (pieceSet === "gold") return color === "w" ? "#ffe27a" : "#c99700";
    if (pieceSet === "neon") return color === "w" ? "#00e5ff" : "#ff3fd8";
    return color === "w" ? "#ffffff" : "#000000";
  }
  function iconStroke(color: "w" | "b") {
    if (pieceSet === "gold") return "#7a4c00";
    if (pieceSet === "neon") return "#111111";
    return color === "w" ? "#000000" : "#ffffff";
  }
  function renderIcon(type: PieceOnBoard["type"], color: "w" | "b", cx: number, cy: number, cellSize: number) {
    const s = (cellSize * 0.75) / 100;
    const fill = iconFill(color);
    const stroke = iconStroke(color);
    const sw = Math.max(1.5, cellSize * 0.04);
    if (pieceSet === "lichess") {
      const base = "https://raw.githubusercontent.com/ornicar/lila/master/public/piece/cburnett";
      const map: Record<PieceOnBoard["type"], string> = { p: "P", r: "R", n: "N", b: "B", q: "Q", k: "K" };
      const href = `${base}/${color}${map[type]}.svg`;
      const w = cellSize * 0.9;
      const h = cellSize * 0.9;
      return <image href={href} x={cx - w / 2} y={cy - h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />;
    } else {
      if (type === "p") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <circle cx="0" cy="-24" r="14" />
            <path d="M-22,0 C-8,-6 8,-6 22,0 C20,18 10,32 0,36 C-10,32 -20,18 -22,0 Z" />
            <rect x="-24" y="36" width="48" height="10" rx="3" />
          </g>
        );
      }
      if (type === "r") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <rect x="-26" y="-20" width="52" height="20" rx="3" />
            <rect x="-22" y="-40" width="12" height="16" />
            <rect x="-6" y="-40" width="12" height="16" />
            <rect x="10" y="-40" width="12" height="16" />
            <rect x="-24" y="0" width="48" height="28" rx="4" />
            <rect x="-26" y="30" width="52" height="10" rx="3" />
          </g>
        );
      }
      if (type === "n") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <path d="M-8,-38 C-2,-34 10,-28 16,-18 C20,-10 22,-2 18,10 C14,22 8,30 -4,34 C-14,38 -26,34 -30,22 C-32,14 -28,6 -22,2 C-18,0 -16,-4 -18,-8 C-20,-14 -16,-20 -10,-24 C-10,-28 -9,-32 -8,-38 Z" />
            <circle cx="-2" cy="-18" r="3" />
            <rect x="-24" y="28" width="48" height="10" rx="3" />
          </g>
        );
      }
      if (type === "b") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <path d="M0,-34 C-12,-24 -10,-14 0,-6 C10,-14 12,-24 0,-34 Z" />
            <path d="M-18,0 C-10,-6 10,-6 18,0 C16,14 10,26 0,34 C-10,26 -16,14 -18,0 Z" />
            <line x1="-10" y1="-14" x2="10" y2="2" />
            <rect x="-22" y="36" width="44" height="10" rx="3" />
          </g>
        );
      }
      if (type === "q") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <circle cx="-18" cy="-30" r="7" />
            <circle cx="0" cy="-34" r="7" />
            <circle cx="18" cy="-30" r="7" />
            <path d="M-26,-12 C-14,-8 14,-8 26,-12 L20,18 C12,30 6,36 0,38 C-6,36 -12,30 -20,18 Z" />
            <rect x="-26" y="40" width="52" height="10" rx="3" />
          </g>
        );
      }
      if (type === "k") {
        return (
          <g transform={`translate(${cx},${cy}) scale(${s})`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
            <rect x="-6" y="-46" width="12" height="12" rx="2" />
            <rect x="-22" y="-26" width="44" height="22" rx="6" />
            <path d="M-20,0 C-10,-6 10,-6 20,0 L16,22 C10,30 6,36 0,38 C-6,36 -10,30 -16,22 Z" />
            <rect x="-26" y="42" width="52" height="10" rx="3" />
            <line x1="0" y1="-60" x2="0" y2="-46" />
            <line x1="-10" y1="-54" x2="10" y2="-54" />
          </g>
        );
      }
    }
    return null;
  }

  const FILES = orientation === "w" ? ["a","b","c","d","e","f","g","h"] : ["h","g","f","e","d","c","b","a"];
  const RANKS = orientation === "w" ? ["8","7","6","5","4","3","2","1"] : ["1","2","3","4","5","6","7","8"];

  return (
    <div className="relative flex flex-col gap-4">
      {!compactUI && (
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          onClick={() => {
            setOrientation((o) => (o === "w" ? "b" : "w"));
            setPlayerSide((s) => (s === "w" ? "b" : "w"));
          }}
        >
          تبديل الاتجاه
        </button>
        <button
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          onClick={() => {
            setSelected(null);
            setLegal([]);
            setLastFrom(null);
            setLastTo(null);
            game.reset();
            setRedoStack([]);
            setEnded(null);
          }}
        >
          إعادة ضبط
        </button>
        <button
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          onClick={() => {
            const hist = game.history({ verbose: true });
            const last = hist[hist.length - 1];
            const mv = game.undo();
            if (mv && last) {
              setRedoStack((st) => [...st, { from: last.from, to: last.to, promotion: last.promotion as any }]);
            }
            setSelected(null);
            setLegal([]);
            setLastFrom(null);
            setLastTo(null);
            // restore last move highlight
            const remaining = game.history({ verbose: true });
            if (remaining.length > 0) {
              const prev = remaining[remaining.length - 1];
              setLastFrom(prev.from);
              setLastTo(prev.to);
            }
          }}
        >
          تراجع خطوة
        </button>
        {mode === "ai" && (
          <button
            className="px-3 py-2 rounded bg-zinc-800 text-white"
            onClick={() => {
              const hist1 = game.history({ verbose: true });
              const last1 = hist1[hist1.length - 1];
              const mv1 = game.undo();
              if (mv1 && last1) {
                setRedoStack((st) => [...st, { from: last1.from, to: last1.to, promotion: last1.promotion as any }]);
              }
              const hist2 = game.history({ verbose: true });
              const last2 = hist2[hist2.length - 1];
              const mv2 = game.undo();
              if (mv2 && last2) {
                setRedoStack((st) => [...st, { from: last2.from, to: last2.to, promotion: last2.promotion as any }]);
              }
              setSelected(null);
              setLegal([]);
              setLastFrom(null);
              setLastTo(null);
            }}
          >
            تراجع دور كامل
          </button>
        )}
        <button
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          onClick={() => {
            const next = redoStack[redoStack.length - 1];
            if (!next) return;
            const mv = game.move(next.from, next.to, next.promotion);
            if (mv) {
              setRedoStack((st) => st.slice(0, st.length - 1));
              setLastFrom(mv?.from || null);
              setLastTo(mv?.to || null);
            }
          }}
        >
          إعادة خطوة
        </button>
        <button
          className="px-3 py-2 rounded btn-neon text-white"
          onClick={() => {
            const pgn = game.pgn();
            const blob = new Blob([pgn], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "game.pgn";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          حفظ PGN
        </button>
        <label className="flex items-center gap-2 text-zinc-300">
          <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
          تفعيل الصوت
        </label>
        <label className="flex items-center gap-2 text-zinc-300">
          <input type="checkbox" checked={autoEval} onChange={(e) => setAutoEval(e.target.checked)} />
          تحليل مستمر
        </label>
        <button
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          onClick={async () => {
            const { getAnalysis } = await import("@/lib/chess/stockfish");
            try {
              const a = await getAnalysis(game.fen(), { depth: aiDepth });
              setEvalScore(a.score);
              setAnalysis(a);
            } catch {
              setEvalScore(null);
              setAnalysis(null);
            }
          }}
        >
          تحليل الآن
        </button>
        <select
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          <option value="pvp">لاعب ضد لاعب</option>
          <option value="ai">ضد الذكاء الاصطناعي</option>
          </select>
        {mode === "ai" && (
          <select
            className="px-3 py-2 rounded bg-zinc-800 text-white"
            value={playerSide}
            onChange={(e) => {
              const s = e.target.value as "w" | "b";
              setPlayerSide(s);
              setOrientation(s);
              setSelected(null);
              setLegal([]);
              setLastFrom(null);
              setLastTo(null);
              game.reset();
            }}
          >
            <option value="w">ألعب أبيض</option>
            <option value="b">ألعب أسود</option>
          </select>
        )}
        <select
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          value={pieceSet}
          onChange={(e) => {
            const v = e.target.value as PieceSet;
            if (!premium && (v === "gold" || v === "neon")) return;
            setPieceSet(v);
            onPieceSetChange?.(v);
          }}
        >
          <option value="lichess">مجموعة Lichess</option>
          <option value="staunton">ستايل Staunton مسطح</option>
          <option value="gold" disabled={!premium}>ذهبي (مميز)</option>
          <option value="neon" disabled={!premium}>نيون (مميز)</option>
        </select>
        <select
          className="px-3 py-2 rounded bg-zinc-800 text-white"
          value={boardTheme}
          onChange={(e) => {
            const v = e.target.value as BoardTheme;
            if (!premium && (v === "wood" || v === "carbon" || v === "ocean")) return;
            setBoardTheme(v);
            onBoardThemeChange?.(v);
          }}
        >
          <option value="classic">لوحة كلاسيك</option>
          <option value="wood" disabled={!premium}>لوحة خشب (مميز)</option>
          <option value="carbon" disabled={!premium}>كاربون (مميز)</option>
          <option value="ocean" disabled={!premium}>أوشن (مميز)</option>
        </select>
        {mode === "ai" && (
          <>
            <label className="text-sm text-zinc-300">مهارة</label>
            <input
              type="range"
              min={0}
              max={18}
              value={aiSkill}
              onChange={(e) => setAiSkill(parseInt(e.target.value, 10))}
            />
            <label className="text-sm text-zinc-300">العمق</label>
            <input
              type="range"
              min={8}
              max={20}
              value={aiDepth}
              onChange={(e) => setAiDepth(parseInt(e.target.value, 10))}
            />
            <button
              className="px-3 py-2 rounded bg-indigo-600 text-white"
              onClick={async () => {
                if (postBusy) return;
                setPostBusy(true);
                setIssues([]);
                try {
                  const hist = game.history({ verbose: true });
                  const cg = new ChessGame();
                  cg.reset();
                  const out: Array<{ idx: number; color: "w" | "b"; san: string; delta: number; best?: string }> = [];
                  for (let i = 0; i < hist.length; i++) {
                    const mv = hist[i];
                    const fenBefore = cg.fen();
                    const { getEval, getAnalysis } = await import("@/lib/chess/stockfish");
                    const scBefore = await getEval(fenBefore, { depth: aiDepth });
                    const prev = scBefore.type === "cp" ? scBefore.value : scBefore.value > 0 ? 10000 : -10000;
                    const res = cg.moveSAN(mv.san);
                    if (!res) break;
                    const fenAfter = cg.fen();
                    const scAfter = await getEval(fenAfter, { depth: aiDepth });
                    const aftRaw = scAfter.type === "cp" ? scAfter.value : scAfter.value > 0 ? 10000 : -10000;
                    const aft = mv.color === "w" ? -aftRaw : aftRaw;
                    const bef = mv.color === "w" ? prev : -prev;
                    const delta = aft - bef;
                    if (delta < -150) {
                      let best: string | undefined;
                      try {
                        const a = await getAnalysis(fenBefore, { depth: aiDepth });
                        best = a.pvSan[0];
                      } catch {}
                      out.push({ idx: i, color: mv.color, san: mv.san, delta, best });
                    }
                  }
                  out.sort((a, b) => a.delta - b.delta);
                  setIssues(out.slice(0, 10));
                } catch {
                  setIssues([]);
                }
                setPostBusy(false);
              }}
            >
              تحليل المباراة كاملة
            </button>
          </>
        )}
      </div>
      )}
      {compactUI && (
        <div className="absolute top-0 right-0 z-30 p-2">
          <button className="px-3 py-2 rounded bg-zinc-800 text-white" onClick={() => setShowControls((v) => !v)}>⚙️</button>
        </div>
      )}
      <AnimatePresence>
        {compactUI && showControls && (
          <motion.div
            className="absolute top-0 right-0 z-20 mt-12 mr-2 rounded bg-zinc-900 text-white shadow-xl card-glow p-3"
            initial={{ x: 240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 240, opacity: 0 }}
          >
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded bg-zinc-800 text-white"
                onClick={() => {
                  setOrientation((o) => (o === "w" ? "b" : "w"));
                  setPlayerSide((s) => (s === "w" ? "b" : "w"));
                }}
              >
                تبديل الاتجاه
              </button>
              <button
                className="px-2 py-1 rounded bg-zinc-800 text-white"
                onClick={() => {
                  setSelected(null);
                  setLegal([]);
                  setLastFrom(null);
                  setLastTo(null);
                  game.reset();
                  setRedoStack([]);
                  setEnded(null);
                }}
              >
                إعادة ضبط
              </button>
              <button
                className="px-2 py-1 rounded bg-zinc-800 text-white"
                onClick={() => {
                  const hist = game.history({ verbose: true });
                  const last = hist[hist.length - 1];
                  const mv = game.undo();
                  if (mv && last) {
                    setRedoStack((st) => [...st, { from: last.from, to: last.to, promotion: last.promotion as any }]);
                  }
                  setSelected(null);
                  setLegal([]);
                  setLastFrom(null);
                  setLastTo(null);
                }}
              >
                تراجع
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-4 flex justify-center">
          <div className="relative inline-block">
            {/* Rank labels */}
            <div className="absolute -right-6 top-0" style={{width:22,height:size}}>
              {RANKS.map((r,i) => (
                <div key={r} style={{position:"absolute",top:i*sq,height:sq,width:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>{r}</span>
                </div>
              ))}
            </div>
            {/* File labels */}
            <div className="absolute -bottom-6 left-0" style={{width:size,height:20}}>
              {FILES.map((f,i) => (
                <div key={f} style={{position:"absolute",left:i*sq,width:sq,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",fontFamily:"monospace"}}>{f}</span>
                </div>
              ))}
            </div>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <rect x={0} y={0} width={size} height={size} fill="#0b0c10" />
            {Array.from({ length: 8 }).map((_, y) =>
              Array.from({ length: 8 }).map((_, x) => {
                const square = posToSquare(x, y, orientation);
                const isDark = sqColor(x, y);
                const base = isDark ? COLOR_DARK : COLOR_LIGHT;
                let fill = base;
                const isFrom =
                  lastFromPos && lastFromPos.x === x && lastFromPos.y === y;
                const isTo =
                  lastToPos && lastToPos.x === x && lastToPos.y === y;
                const pendingFromPos = premove ? squareToPos(premove.from, orientation) : null;
                const pendingToPos = premove ? squareToPos(premove.to, orientation) : null;
                const isPendingFrom = pendingFromPos && pendingFromPos.x === x && pendingFromPos.y === y;
                const isPendingTo = pendingToPos && pendingToPos.x === x && pendingToPos.y === y;
                if (isPendingFrom) fill = "#0ad1d8";
                else if (isPendingTo) fill = "#b60bcd";
                if (isFrom) fill = "#9acd32";
                else if (isTo) fill = "#ff6347";
                const isLegal = legal.includes(square);
                return (
                  <g key={`sq-${x}-${y}`} onClick={() => onClickSquare(square)} cursor="pointer">
                    <rect x={x * sq} y={y * sq} width={sq} height={sq} fill={fill} />
                    {isLegal && (
                      <circle
                        cx={x * sq + sq / 2}
                        cy={y * sq + sq / 2}
                        r={sq * 0.1}
                        fill="#000000"
                        opacity={0.35}
                      />
                    )}
                  </g>
                );
              })
            )}
            {analysis && analysis.best && analysis.best !== "0000" && (() => {
              const from = analysis.best.slice(0, 2);
              const to = analysis.best.slice(2, 4);
              const aFrom = squareToPos(from, orientation);
              const aTo = squareToPos(to, orientation);
              const fx = aFrom.x * sq + sq / 2;
              const fy = aFrom.y * sq + sq / 2;
              const tx = aTo.x * sq + sq / 2;
              const ty = aTo.y * sq + sq / 2;
              return (
                <g>
                  <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="#00e5ff" strokeWidth={6} opacity={0.35} />
                  <line x1={fx} y1={fy} x2={tx} y2={ty} stroke="#00e5ff" strokeWidth={2} />
                </g>
              );
            })()}
            {pieces.map((p, idx) => {
              const { x, y } = squareToPos(p.square, orientation);
              const cx = x * sq + sq / 2;
              const cy = y * sq + sq / 2;
              return (
                <g key={`p-${idx}`} onClick={() => onClickSquare(p.square)} cursor="pointer">
                  {renderIcon(p.type, p.color, cx, cy, sq)}
                </g>
              );
            })}
          </svg>
          {ended && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50">
              <div className="px-4 py-2 rounded bg-zinc-900 text-white text-lg">انتهت المباراة</div>
            </div>
          )}
          </div>
          {promotion && (
            <div className="mt-3 flex items-center gap-2">
              <div className="text-sm text-zinc-300">اختر قطعة الترويج:</div>
              {promotion.choices.map((c) => (
                <button
                  key={c}
                  className="px-2 py-1 rounded bg-zinc-800 text-white"
                  onClick={() => {
                    const mv = game.move(promotion.from, promotion.to, c);
                    setPromotion(null);
                    setSelected(null);
                    setLegal([]);
                    setLastFrom(mv?.from || null);
                    setLastTo(mv?.to || null);
                    setRedoStack([]);
                    if (mode === "ai" && game.turn() !== playerSide) {
                      setTimeout(async () => {
                        await aiReply();
                      }, 150);
                    }
                  }}
                >
                  {c.toUpperCase()}
                </button>
              ))}
              <button
                className="px-2 py-1 rounded bg-zinc-800 text-white"
                onClick={() => setPromotion(null)}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <div className="rounded p-3 bg-zinc-900 card-glow">
            <div className="text-sm text-zinc-300 mb-2">النقلات</div>
            <div className="text-xs text-zinc-200 max-h-64 overflow-auto">
                {(() => {
                  const hist = game.history({ verbose: true });
                const rows: Array<{ n: number; w?: string; b?: string }> = [];
                let n = 1;
                for (let i = 0; i < hist.length; i += 2) {
                  const w = hist[i]?.san;
                  const b = hist[i + 1]?.san;
                  rows.push({ n, w, b });
                  n++;
                }
                return rows.map((r) => (
                  <div key={`mv-${r.n}`} className="flex items-center justify-between py-0.5">
                    <span className="text-zinc-400">{r.n}.</span>
                    <span>{r.w || ""}</span>
                    <span>{r.b || ""}</span>
                  </div>
                ));
              })()}
            </div>
            <div className="mt-3 text-sm text-zinc-300">التقييم</div>
            <div className="mt-1 h-40 w-5 bg-zinc-800 rounded relative overflow-hidden">
              {evalScore && evalScore.type === "cp" && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-neon"
                  style={{ height: `${Math.max(0, Math.min(100, 50 + evalScore.value / 100))}%` }}
                />
              )}
              {evalScore && evalScore.type === "mate" && (
                <div className="absolute bottom-0 left-0 right-0 bg-neon" style={{ height: "100%" }} />
              )}
            </div>
            {evalScore && (
              <div className="mt-1 text-xs text-zinc-400">
                {evalScore.type === "cp" ? `${(evalScore.value / 100).toFixed(2)}` : `مات في ${evalScore.value}`}
              </div>
            )}
            {analysis && analysis.pvSan.length > 0 && (
              <div className="mt-3 text-sm text-zinc-300">سلسلة أفضل نقلات</div>
            )}
            {analysis && analysis.pvSan.length > 0 && (
              <div className="mt-1 text-xs text-zinc-200 max-h-32 overflow-auto">
                {analysis.pvSan.slice(0, 12).map((s, i) => (
                  <div key={`pv-${i}`} className="py-0.5">{i + 1}. {s}</div>
                ))}
              </div>
            )}
            {issues.length > 0 && (
              <>
                <div className="mt-3 text-sm text-zinc-300">أخطاء وتحسينات</div>
                <div className="mt-1 text-xs text-zinc-200 max-h-40 overflow-auto">
                  {issues.map((it) => (
                    <div key={`iss-${it.idx}`} className="py-0.5">
                      {Math.floor(it.idx / 2) + 1}.{it.color === "w" ? "" : ".."} {it.san} — Δ{(it.delta / 100).toFixed(2)} {it.best ? `→ ${it.best}` : ""}
                    </div>
                  ))}
                </div>
              </>
            )}
            {postBusy && (
              <div className="mt-2 text-xs text-zinc-400">جارٍ التحليل...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
