"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Settings, User, Trophy, ArrowLeft, Users, 
  Play, LogOut, RotateCcw,
  Volume2, VolumeX, History, 
  ChevronRight, Flag
} from "lucide-react";
import { ChessGame, PieceOnBoard, Move } from "@/lib/chess/game";
import { getBestMove } from "@/lib/chess/stockfish";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { useSocket } from "@/lib/platform/socket";
import GameWrapper from "@/components/platform/GameWrapper";
import { getTheme } from "@/lib/platform/cultural-themes";

// --- Types ---

type Phase = "splash" | "auth" | "home" | "lobby" | "game" | "analysis" | "profile" | "settings";
type GameMode = "pvp" | "ai" | "online";
type TimeControl = { name: string; time: number; increment: number; icon: string };

const TIME_CONTROLS: TimeControl[] = [
  { name: "Bullet", time: 1 * 60, increment: 0, icon: "🚀" },
  { name: "Blitz", time: 3 * 60, increment: 2, icon: "⚡" },
  { name: "Rapid", time: 10 * 60, increment: 5, icon: "⏱️" },
  { name: "Classical", time: 30 * 60, increment: 0, icon: "🐢" },
];

type Player = {
  id: string;
  name: string;
  rating: number;
  avatar: string;
  color: "w" | "b";
  time?: number; // seconds
};

// --- Theme Helpers ---

const THEMES = {
  classic: {
    light: "#ebecd0",
    dark: "#779556",
    highlight: "#baca44",
    pieceSet: "cburnett",
    bg: "bg-[#302e2b]",
    panel: "bg-[#262421]"
  },
  wood: {
    light: "#e3c16f",
    dark: "#b88b4a",
    highlight: "#d4a742",
    pieceSet: "merida",
    bg: "bg-[#2c1e12]",
    panel: "bg-[#3e2b1b]"
  },
  neon: {
    light: "#2a2a2a",
    dark: "#7c3aed", // Violet
    highlight: "#d946ef", // Fuschia
    pieceSet: "kosal", // Or 'pixel'
    bg: "bg-black",
    panel: "bg-zinc-900 border border-purple-500/30"
  },
  glass: {
    light: "#e2e8f0",
    dark: "#475569",
    highlight: "#94a3b8",
    pieceSet: "alpha",
    bg: "bg-[#0f172a]",
    panel: "bg-[#1e293b]"
  },
  "8bit": {
    light: "#9ca3af",
    dark: "#4b5563",
    highlight: "#fbbf24",
    pieceSet: "pixel",
    bg: "bg-gray-900",
    panel: "bg-gray-800 border-4 border-white font-mono"
  }
};

// --- Helper Functions ---

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" + s : s}`;
}

function getMaterialDifference(pieces: PieceOnBoard[]) {
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let w = 0, b = 0;
  pieces.forEach(p => {
    if (p.color === "w") w += values[p.type];
    else b += values[p.type];
  });
  return w - b;
}

// --- Main Component ---

export default function ChessGameOnline2D() {
  const { user, equipped, unlockItem, language, culturalMood } = usePlatformStore();
  const cTheme = getTheme(culturalMood);
  const { socket } = useSocket();
  const t = TRANSLATIONS[language];
  
  // --- State ---
  const [phase, setPhase] = useState<Phase>("splash");
  const [mode, setMode] = useState<GameMode>("ai");
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS[1]);
  const [game] = useState(() => new ChessGame());
  
  // AI Settings
  const [aiDifficulty, setAiDifficulty] = useState(10); // 0-20
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [aiColor, setAiColor] = useState<"w" | "b" | "random">("random");

  // Online State
  const [matchId, setMatchId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Game State
  const [fen, setFen] = useState(game.fen());
  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  
  // Players
  const [player, setPlayer] = useState<Player>({ 
      id: user?.id || "me", 
      name: user?.name || "Guest", 
      rating: 1200, 
      avatar: user?.avatar || "🦁", 
      color: "w", 
      time: timeControl.time 
  });
  const [opponent, setOpponent] = useState<Player>({ id: "op", name: "Stockfish", rating: 3000, avatar: "🤖", color: "b", time: 180 });
  
  // System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameResult, setGameResult] = useState<{winner: "w" | "b" | "draw", reason: string} | null>(null);
  const [showStore, setShowStore] = useState(false);

  // Audio Ref
  const audioCtx = useRef<AudioContext | null>(null);

  // Get Theme
  const themeKey = equipped.chess_skin.replace("skin_", "") as keyof typeof THEMES;
  const theme = THEMES[themeKey] || THEMES.classic;

  // --- Socket Integration ---
  useEffect(() => {
    if (!socket) return;

    function onMatchFound({ matchId, color }: { matchId: string; color: "w" | "b" }) {
        setMatchId(matchId);
        setIsSearching(false);
        
        // Setup Game
        game.reset();
        setFen(game.fen());
        setMoveHistory([]);
        setGameResult(null);
        setLastMove(null);
        
        // Setup Players
        setPlayer(p => ({ ...p, color: color, time: timeControl.time }));
        setOpponent(p => ({ ...p, color: color === "w" ? "b" : "w", name: "Opponent", rating: 1200, time: timeControl.time }));
        setOrientation(color);
        
        setPhase("game");
        playSound("start");
    }

    function onState({ fen, pgn }: { fen: string; pgn: string }) {
        game.load(fen);
        setFen(fen);
        setMoveHistory(game.history({ verbose: true }));
    }

    function onMoved({ from, to, promotion, fen }: { from: string; to: string; promotion?: string; fen: string }) {
        game.load(fen); // Authoritative update
        setFen(fen);
        setLastMove({ from, to });
        setMoveHistory(game.history({ verbose: true }));
        
        // Determine sound
        // We can check capture/check from game state after load
        const inCheck = game.isCheck();
        // Capture is harder to detect from just FEN, but we can assume 'move' for now
        // or check if piece count decreased.
        playSound(inCheck ? "check" : "move");
    }

    function onGameOver({ winner, reason }: { winner: "w" | "b" | "draw"; reason: string }) {
        handleGameOver(winner, reason);
    }

    socket.on("chess:match_found", onMatchFound);
    socket.on("chess:state", onState);
    socket.on("chess:moved", onMoved);
    socket.on("chess:game_over", onGameOver);

    return () => {
        socket.off("chess:match_found", onMatchFound);
        socket.off("chess:state", onState);
        socket.off("chess:moved", onMoved);
        socket.off("chess:game_over", onGameOver);
    };
  }, [socket, game, timeControl]); // Added dependencies

  // --- Actions ---

  const playSound = React.useCallback((type: "move" | "capture" | "check" | "start" | "end") => {
    if (!soundEnabled) return;
    if (!audioCtx.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) audioCtx.current = new AC();
    }
    const ctx = audioCtx.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (type === "move") {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    } else if (type === "capture") {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    } else if (type === "check") {
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    }
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }, [soundEnabled]);

  const handleGameOver = React.useCallback((winner: "w" | "b" | "draw", reason: string) => {
    setGameResult({ winner, reason });
    playSound("end");
    // أضف نقطة لبلد اللاعب لو فاز
    if (winner !== "draw" && winner === player.color && user?.country) {
      fetch("/api/country-war", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: user.country, delta: 1 }),
      }).catch(() => {});
    }
  }, [playSound, player.color, user]);

  const makeAiMove = React.useCallback(async () => {
    setIsAiThinking(true);
    try {
      // Simulate delay
      await new Promise(r => setTimeout(r, 1000));
      const fen = game.fen();
      const bestMove = await getBestMove(fen);
      
      if (bestMove) {
        game.moveUCI(bestMove);
        setFen(game.fen());
        setMoveHistory(game.history({ verbose: true }));
        playSound(game.isCheck() ? "check" : "move");
        
        if (game.isGameOver()) {
           const winner = game.isCheckmate() ? (game.turn() === "w" ? "b" : "w") : "draw";
           const reason = game.isCheckmate() ? "Checkmate" : "Stalemate/Draw";
           handleGameOver(winner, reason);
        }
      }
    } catch (e) {
      console.error("AI Error:", e);
    }
    setIsAiThinking(false);
  }, [game, playSound, handleGameOver, aiDifficulty]);

  // --- Effects ---

  // Splash Timer
  useEffect(() => {
    if (phase === "splash") {
      setTimeout(() => setPhase("auth"), 2000);
    }
  }, [phase]);

  // Update Player Info from Store
  useEffect(() => {
      if (user) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPlayer(p => ({ ...p, name: user.name, avatar: user.avatar }));
      }
  }, [user]);

  // Game Timer Logic
  useEffect(() => {
    if (phase !== "game" || gameResult) return;
    
    const timer = setInterval(() => {
      if (game.turn() === player.color) {
        setPlayer(p => {
            const newTime = Math.max(0, (p.time || 0) - 1);
            if (newTime === 0 && !gameResult) {
                // Defer state update to avoid render loop
                setTimeout(() => handleGameOver(opponent.color, "Timeout"), 0);
            }
            return { ...p, time: newTime };
        });
      } else {
        setOpponent(p => {
            const newTime = Math.max(0, (p.time || 0) - 1);
            if (newTime === 0 && !gameResult) {
                setTimeout(() => handleGameOver(player.color, "Timeout"), 0);
            }
            return { ...p, time: newTime };
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, gameResult, player.color, opponent.color, game, handleGameOver]);

  // AI Move
  useEffect(() => {
    if (phase === "game" && mode === "ai" && game.turn() !== player.color && !gameResult && !isAiThinking) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      makeAiMove();
    }
  }, [phase, fen, gameResult, isAiThinking, mode, player.color, game, makeAiMove]);

  const handleResign = () => {
    if (gameResult) return;
    handleGameOver(opponent.color, t.resign);
  };

  const toggleOrientation = () => {
    setOrientation(o => o === "w" ? "b" : "w");
  };

  const onSquareClick = (square: string) => {
    if (gameResult || (mode === "ai" && game.turn() !== player.color)) return;

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    if (selectedSquare && legalMoves.includes(square)) {
      if (mode === "online") {
          // Optimistic or wait?
          // For now, emit and wait for server
          if (socket && matchId) {
             socket.emit("chess:move", { matchId, from: selectedSquare, to: square, promotion: "q" }); // Always promote to Queen for now
             // Optimistic update to make UI snappy
             const move = game.move(selectedSquare, square, "q");
             if (move) {
                 setFen(game.fen());
                 setLastMove({ from: selectedSquare, to: square });
                 setSelectedSquare(null);
                 setLegalMoves([]);
                 playSound("move");
             }
          }
      } else {
          // Local / AI
          const move = game.move(selectedSquare, square);
          if (move) {
            setFen(game.fen());
            setLastMove({ from: selectedSquare, to: square });
            setMoveHistory(game.history({ verbose: true }));
            setSelectedSquare(null);
            setLegalMoves([]);
            playSound(move.flags.includes("c") ? "capture" : "move");
            
            if (game.isGameOver()) {
                 if (game.isCheck()) handleGameOver(player.color, t.checkmate);
                 else handleGameOver("draw", t.stalemate);
            }
          }
      }
      return;
    }

    const piece = game.pieces().find(p => p.square === square);
    if (piece && piece.color === game.turn() && (mode !== "ai" || piece.color === player.color)) {
      setSelectedSquare(square);
      const moves = game.legalMoves(square).map(m => m.to);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const startGame = (selectedMode: GameMode, tc: TimeControl, difficulty?: number, colorPreference?: "w" | "b" | "random") => {
    setMode(selectedMode);
    setTimeControl(tc);
    
    if (selectedMode === "online") {
        if (socket) {
            socket.emit("chess:find_match", { name: user?.name || "Guest" });
            setIsSearching(true);
        }
        return;
    }

    game.reset();
    setFen(game.fen());
    setMoveHistory([]);
    setGameResult(null);
    setLastMove(null);
    setPlayer(p => ({ ...p, time: tc.time }));
    setOpponent(p => ({ ...p, time: tc.time }));
    
    if (selectedMode === "ai" && difficulty !== undefined) {
        setAiDifficulty(difficulty);
        setOpponent(p => ({ ...p, name: `Stockfish Level ${difficulty}`, rating: 1000 + (difficulty * 100) }));
    }

    const myColor = colorPreference === "w" ? "w" : colorPreference === "b" ? "b" : Math.random() > 0.5 ? "w" : "b";
    setPlayer(p => ({ ...p, color: myColor as "w"|"b" }));
    setOpponent(p => ({ ...p, color: myColor === "w" ? "b" : "w" as "w"|"b" }));
    setOrientation(myColor as "w"|"b");

    setPhase("game");
    playSound("start");
  };

  // --- Render Components ---

  const renderMoveList = () => {
    return (
      <div className={`${theme.panel} rounded-xl overflow-hidden flex flex-col h-full max-h-[200px] mt-2`}>
        <div className="bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 flex justify-between items-center">
          <span>{t.moves || "MOVES"}</span>
          <History size={14} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 text-sm font-mono scrollbar-thin scrollbar-thumb-slate-700">
          <div className="grid grid-cols-[30px_1fr_1fr] gap-1">
            {moveHistory.reduce((acc: { n: number, w: string, b: string }[], move, i) => {
              if (i % 2 === 0) acc.push({ n: (i/2)+1, w: move.san, b: "" });
              else acc[acc.length-1].b = move.san;
              return acc;
            }, []).map((row, i) => (
              <React.Fragment key={i}>
                <div className="text-slate-500 text-center bg-white/5 rounded">{row.n}.</div>
                <div className="bg-white/10 rounded px-2">{row.w}</div>
                <div className="bg-white/10 rounded px-2">{row.b}</div>
              </React.Fragment>
            ))}
            <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
          </div>
        </div>
      </div>
    );
  };

  const renderSquare = (x: number, y: number) => {
    const file = "abcdefgh"[x];
    const rank = 8 - y;
    const square = `${file}${rank}`;
    const isLight = (x + y) % 2 === 0;
    const isSelected = selectedSquare === square;
    const isLastFrom = lastMove?.from === square;
    const isLastTo = lastMove?.to === square;
    const isLegal = legalMoves.includes(square);
    const piece = game.pieces().find(p => p.square === square);
    const inCheck = game.isCheck() && piece?.type === "k" && piece?.color === game.turn();

    return (
      <div 
        key={square}
        className={`
          w-[12.5%] h-[12.5%] relative flex items-center justify-center
          ${isSelected ? "" : (isLastFrom || isLastTo) ? "" : inCheck ? "bg-red-500" : ""}
        `}
        style={{
            backgroundColor: isSelected ? theme.highlight : (isLastFrom || isLastTo) ? theme.highlight : inCheck ? "#ef4444" : isLight ? theme.light : theme.dark
        }}
        onClick={() => onSquareClick(square)}
      >
        {/* Rank/File Labels */}
        {x === 0 && <span className="absolute top-0 left-1 text-[10px] font-bold opacity-50" style={{ color: isLight ? theme.dark : theme.light }}>{rank}</span>}
        {y === 7 && <span className="absolute bottom-0 right-1 text-[10px] font-bold opacity-50" style={{ color: isLight ? theme.dark : theme.light }}>{file}</span>}
        
        {/* Legal Move Marker */}
        {isLegal && (
          <div className={`
            rounded-full opacity-50
            ${piece ? "w-full h-full border-[6px] border-black/10" : "w-1/3 h-1/3 bg-black/10"}
          `} />
        )}

        {/* Piece */}
        {piece && (
           <Image 
             src={`https://raw.githubusercontent.com/ornicar/lila/master/public/piece/${theme.pieceSet}/${piece.color}${piece.type.toUpperCase()}.svg`}
             className="object-contain filter drop-shadow-md pointer-events-none"
             alt={piece.type}
             fill
             unoptimized
           />
        )}
      </div>
    );
  };

  // --- Views ---

  if (phase === "splash") {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center text-white">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ duration: 1 }} className="text-9xl mb-6">
          ♟️
        </motion.div>
        <h1 className="text-5xl font-black tracking-widest bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          {t.chess} PRO
        </h1>
        <div className="mt-8 flex gap-2">
           <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "0s" }}/>
           <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.2s" }}/>
           <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "0.4s" }}/>
        </div>
      </div>
    );
  }

  if (phase === "auth") {
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700">
           <div className="text-center mb-8">
             <div className="text-6xl mb-4">♔</div>
             <h2 className="text-2xl font-bold">{t.hub_welcome}, {user?.name || "Player"}</h2>
             <p className="text-slate-400">{t.hub_subtitle}</p>
           </div>
           
           <button 
             onClick={() => setPhase("home")}
             className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-lg mb-4 flex items-center justify-center gap-3 transition-colors"
           >
             <User /> {t.play}
           </button>
        </div>
      </div>
    );
  }

  if (phase === "home") {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md mx-auto p-6 min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-2xl border-2 border-indigo-400">
                 {player.avatar}
               </div>
               <div>
                 <h3 className="font-bold">{player.name}</h3>
                 <div className="text-xs text-yellow-400 font-mono">ELO {player.rating}</div>
               </div>
             </div>
             <button onClick={() => setShowStore(true)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><Settings size={20} /></button>
          </header>

          {/* Main Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8">
             <button 
               onClick={() => setPhase("lobby")} 
               className="col-span-2 h-32 bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl flex flex-col items-center justify-center shadow-lg hover:scale-[1.02] transition-transform"
             >
               <Play size={48} className="mb-2" />
               <span className="text-2xl font-black italic">{t.play_online || "PLAY ONLINE"}</span>
             </button>

             <button 
               onClick={() => setShowAiSetup(true)} 
               className="h-24 bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-700 hover:border-emerald-500"
             >
               <div className="text-3xl mb-1">🤖</div>
               <span className="font-bold">{t.vs_computer || "Vs Computer"}</span>
             </button>

             <button className="h-24 bg-slate-800 rounded-2xl flex flex-col items-center justify-center border border-slate-700 hover:border-blue-500">
               <Users size={32} className="mb-1 text-blue-400" />
               <span className="font-bold">{t.pass_play || "Pass & Play"}</span>
             </button>
          </div>

          {/* Secondary Features */}
          <div className="space-y-3">
            <button className="w-full p-4 bg-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-400" />
                <div className="text-left">
                  <div className="font-bold">{t.tournaments || "Tournaments"}</div>
                  <div className="text-xs text-slate-400">Join daily arenas</div>
                </div>
              </div>
              <ChevronRight className="text-slate-500" />
            </button>
          </div>

          {/* AI Setup Overlay */}
          {showAiSetup && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
              <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-800 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between">
                  <h2 className="text-2xl font-bold">{t.vs_computer || "Vs Computer"}</h2>
                  <button onClick={() => setShowAiSetup(false)}>✕</button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Time Control */}
                  <div>
                    <h3 className="text-slate-400 mb-2 text-sm font-bold uppercase">{t.time_control || "Time Control"}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_CONTROLS.map(tc => (
                        <button
                          key={tc.name}
                          onClick={() => setTimeControl(tc)}
                          className={`p-2 rounded-lg border text-center transition-all ${timeControl.name === tc.name ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-700 bg-zinc-800"}`}
                        >
                          <div className="text-xl">{tc.icon}</div>
                          <div className="text-xs font-bold">{tc.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <h3 className="text-slate-400 mb-2 text-sm font-bold uppercase">{t.difficulty || "Difficulty"} (Level {aiDifficulty})</h3>
                    <input 
                      type="range" 
                      min="1" 
                      max="18" 
                      value={aiDifficulty} 
                      onChange={(e) => setAiDifficulty(parseInt(e.target.value))}
                      className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{t.easy || "Easy"}</span>
                      <span>{t.medium || "Medium"}</span>
                      <span>{t.hard || "Hard"}</span>
                      <span>{t.expert || "Expert"}</span>
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <h3 className="text-slate-400 mb-2 text-sm font-bold uppercase">{t.side || "Side"}</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAiColor("w")} 
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${aiColor === "w" ? "border-white bg-white text-black" : "border-zinc-700 bg-zinc-800"}`}
                      >
                        ♔ {t.white || "White"}
                      </button>
                      <button 
                        onClick={() => setAiColor("random")} 
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${aiColor === "random" ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-700 bg-zinc-800"}`}
                      >
                        ❓ {t.random || "Random"}
                      </button>
                      <button 
                        onClick={() => setAiColor("b")} 
                        className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${aiColor === "b" ? "border-black bg-black text-white" : "border-zinc-700 bg-zinc-800"}`}
                      >
                        ♚ {t.black || "Black"}
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                        setShowAiSetup(false);
                        startGame("ai", timeControl, aiDifficulty, aiColor);
                    }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20"
                  >
                    Start Game
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Store Overlay */}
        {showStore && (
             <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                 <div className="bg-zinc-900 w-full max-w-md rounded-3xl border border-zinc-800 flex flex-col overflow-hidden">
                     <div className="p-6 border-b border-zinc-800 flex justify-between">
                         <h2 className="text-2xl font-bold">{t.themes || "Themes"}</h2>
                         <button onClick={() => setShowStore(false)}>✕</button>
                     </div>
                     <div className="p-6 overflow-y-auto grid grid-cols-2 gap-3">
                         {["classic", "wood", "glass", "neon", "8bit"].map(sk => (
                             <button 
                                key={sk}
                                onClick={() => unlockItem({ id: `skin_${sk}`, type: "chess_skin", name: sk, asset: sk })}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${equipped.chess_skin === `skin_${sk}` ? "border-green-500 bg-green-500/10" : "border-zinc-700 hover:border-zinc-500"}`}
                             >
                                 <div className="w-12 h-12 relative">
                                    <Image src={`/assets/chess/${sk}_preview.png`} alt={sk} fill className="object-contain" unoptimized onError={(e) => {
                                        // Fallback if image missing
                                        e.currentTarget.style.display = "none";
                                    }}/>
                                    <div className="w-full h-full flex items-center justify-center text-2xl absolute inset-0">♟️</div>
                                 </div>
                                 <span className="text-xs font-bold uppercase">{sk}</span>
                             </button>
                         ))}
                     </div>
                 </div>
             </div>
        )}
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <div className="fixed inset-0 bg-slate-900 text-white flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="p-4 flex items-center gap-4 border-b border-slate-800">
          <button onClick={() => setPhase("home")}><ArrowLeft /></button>
          <h2 className="text-xl font-bold">{t.new_game || "New Game"}</h2>
        </div>
        
        <div className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col gap-6">
           {isSearching ? (
               <div className="flex flex-col items-center justify-center h-full">
                   <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"/>
                   <h3 className="text-xl font-bold">Searching for opponent...</h3>
                   <button onClick={() => setIsSearching(false)} className="mt-4 text-slate-400 underline">Cancel</button>
               </div>
           ) : (
           <>
           <div>
             <h3 className="text-slate-400 mb-3 uppercase text-xs font-bold tracking-wider">{t.time_control || "Select Time Control"}</h3>
             <div className="grid grid-cols-2 gap-3">
               {TIME_CONTROLS.map(tc => (
                 <button
                   key={tc.name}
                   onClick={() => setTimeControl(tc)}
                   className={`
                     p-4 rounded-xl border-2 flex flex-col items-center transition-all
                     ${timeControl.name === tc.name ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-800 hover:border-slate-600"}
                   `}
                 >
                   <div className="text-3xl mb-2">{tc.icon}</div>
                   <div className="font-bold">{tc.name}</div>
                   <div className="text-xs text-slate-400">{tc.time/60} + {tc.increment}</div>
                 </button>
               ))}
             </div>
           </div>

           <button 
             onClick={() => startGame("online", timeControl)}
             className="mt-auto w-full py-5 bg-orange-500 hover:bg-orange-600 rounded-2xl font-black text-xl shadow-lg shadow-orange-500/20"
           >
             {t.find_opponent || "FIND OPPONENT"}
           </button>
           </>
           )}
        </div>
      </div>
    );
  }

  if (phase === "game") {
    const isPlayerTurn = game.turn() === player.color;
    
    return (
      <GameWrapper className={`min-h-screen ${theme.bg}`} style={
        cTheme.table.backgroundImage
          ? { backgroundImage: `url(${cTheme.table.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {}
      }>
        
        {/* Top Bar (Opponent) */}
        <div className={`p-4 flex items-center justify-between ${theme.panel}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl border border-white/10 overflow-hidden relative">
               <Image src={`https://api.dicebear.com/7.x/bottts/svg?seed=${opponent.name}`} alt={opponent.name} fill className="object-cover" unoptimized />
             </div>
             <div>
               <div className="font-bold flex items-center gap-2">
                 {opponent.name} <span className="text-xs bg-white/10 px-1 rounded">{opponent.rating}</span>
               </div>
               <div className="flex gap-1">
                 {getMaterialDifference(game.pieces()) < 0 && (
                   <span className="text-xs text-slate-400">+{Math.abs(getMaterialDifference(game.pieces()))}</span>
                 )}
               </div>
             </div>
          </div>
          <div className={`
            px-4 py-2 rounded-lg font-mono text-xl font-bold transition-colors
            ${!isPlayerTurn ? "bg-white text-black" : "bg-white/10 text-slate-400"}
          `}>
            {formatTime(opponent.time || 0)}
          </div>
        </div>

        {/* Board Area */}
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="relative w-[min(90vw,60vh)] aspect-square shadow-2xl rounded-sm overflow-hidden border-4 border-black/20">
             <div className="w-full h-full flex flex-wrap" dir="ltr"> {/* Keep board LTR always */}
               {Array.from({ length: 64 }).map((_, i) => {
                 const x = i % 8; 
                 const y = Math.floor(i / 8); 
                 let effectiveX = x;
                 let effectiveY = y;
                 
                 if (orientation === "b") {
                   effectiveX = 7 - x;
                   effectiveY = 7 - y;
                 }
                 
                 return renderSquare(effectiveX, effectiveY);
               })}
             </div>

             {/* Game Over Overlay */}
             {gameResult && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-50">
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${theme.panel} p-8 rounded-2xl text-center shadow-2xl border border-white/10`}>
                    <div className="text-4xl mb-2">
                      {gameResult.winner === player.color ? "🏆" : gameResult.winner === "draw" ? "🤝" : "💀"}
                    </div>
                    <h2 className="text-3xl font-black mb-2">
                      {gameResult.winner === player.color ? t.winner : gameResult.winner === "draw" ? t.stalemate : t.loser}
                    </h2>
                    <p className="text-slate-400 mb-6">{gameResult.reason}</p>
                    <div className="flex gap-3">
                      <button onClick={() => startGame(mode, timeControl, mode === "ai" ? aiDifficulty : undefined, mode === "ai" ? aiColor : undefined)} className="flex-1 py-3 bg-emerald-600 rounded-xl font-bold">{t.rematch || "Rematch"}</button>
                      <button onClick={() => setPhase("home")} className="flex-1 py-3 bg-slate-700 rounded-xl font-bold">{t.home}</button>
                    </div>
                 </motion.div>
               </div>
             )}
          </div>
        </div>

        {/* Bottom Bar (Player) */}
        <div className={`p-4 ${theme.panel}`}>
          <div className="flex justify-between items-center mb-4">
             <div className={`
                px-4 py-2 rounded-lg font-mono text-xl font-bold transition-colors
                ${isPlayerTurn ? "bg-white text-black" : "bg-white/10 text-slate-400"}
             `}>
               {formatTime(player.time || 0)}
             </div>
             <div className="flex items-center gap-3">
               <div className="text-right">
                 <div className="font-bold flex items-center gap-2 justify-end">
                   {player.name} <span className="text-xs bg-white/10 px-1 rounded">{player.rating}</span>
                 </div>
                 <div className="flex gap-1 justify-end">
                   {getMaterialDifference(game.pieces()) > 0 && (
                     <span className="text-xs text-slate-400">+{Math.abs(getMaterialDifference(game.pieces()))}</span>
                   )}
                 </div>
               </div>
               <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-xl border border-indigo-400 overflow-hidden relative">
                 <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} alt={player.name} fill className="object-cover" unoptimized />
               </div>
             </div>
          </div>
          
          {moveHistory.length > 0 && renderMoveList()}

          {/* Controls */}
          <div className="flex gap-2 justify-center mt-4">
             <button onClick={() => setPhase("home")} className="p-4 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
               <LogOut size={20} />
             </button>
             <button onClick={handleResign} className="p-4 bg-white/5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-white/10">
               <Flag size={20} />
             </button>
             <button onClick={toggleOrientation} className="p-4 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10">
               <RotateCcw size={20} />
             </button>
             <button onClick={() => setSoundEnabled(!soundEnabled)} className="flex-1 bg-white/5 rounded-xl font-bold text-slate-300 hover:bg-white/10 flex items-center justify-center gap-2">
               {soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>} {t.options || "OPTIONS"}
             </button>
          </div>
        </div>
      </GameWrapper>
    );
  }

  return null;
}
