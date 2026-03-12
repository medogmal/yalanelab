"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Settings, User, ShoppingBag, Trophy, 
  Volume2, ArrowLeft, Play, 
  Search, Users, Crown, Coins, 
  Gamepad2, ChevronRight 
} from "lucide-react";
import { DominoGame, type Domino, type Side, type PlayerId } from "@/lib/domino/game";

// --- Types ---

type Phase = 
  | "splash" 
  | "auth" 
  | "menu" 
  | "matchmaking" 
  | "game" 
  | "round_end";

type GameMode = "classic" | "block" | "draw";

type UserProfile = {
  id: string;
  name: string;
  level: number;
  xp: number;
  coins: number;
  rank: string; // e.g., "Bronze III"
  avatar: string; // emoji or url
};

// // type FlyAnimation = {
//   tile: Domino;
//   from: { x: number; y: number; scale: number; rot: number };
//   to: { x: number; y: number; scale: number; rot: number };
//   onComplete: () => void;
// };

// --- Assets / Constants ---

// const RANKS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
// const AVATARS = ["🦁", "🐯", "🐻", "🐨", "🐼", "🐸"];

// --- Helper Components ---

function Tile({ 
  a, b, 
  // idx, 
  onClick, 
  selected, 
  disabled, 
  vertical, 
  small,
  className = "",
  layoutId
}: { 
  a: number; b: number; 
  // idx?: number; // for key
  onClick?: () => void; 
  selected?: boolean; 
  disabled?: boolean; 
  vertical?: boolean; 
  small?: boolean;
  className?: string;
  layoutId?: string;
}) {
  // Generate dots (pips) positions
  const getPips = (n: number) => {
    // SVG coordinate mapping (0-100% space)
    // Custom mapping for clean look
    const map = {
      0: [],
      1: [[50, 50]],
      2: [[20, 20], [80, 80]],
      3: [[20, 20], [50, 50], [80, 80]],
      4: [[20, 20], [80, 20], [20, 80], [80, 80]],
      5: [[20, 20], [80, 20], [50, 50], [20, 80], [80, 80]],
      6: [[20, 20], [50, 20], [80, 20], [20, 80], [50, 80], [80, 80]],
    }[n] || [];

    return map.map((p, i) => (
      <circle key={i} cx={`${p[0]}%`} cy={`${p[1]}%`} r="8%" fill={n === 0 ? "none" : (selected ? "#fff" : "#333")} />
    ));
  };

  return (
    <motion.div
      layoutId={layoutId}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative select-none transition-transform
        ${vertical ? "w-10 h-20" : "w-20 h-10"}
        ${small ? "scale-75" : ""}
        ${disabled ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:brightness-110 active:scale-95"}
        ${selected ? "ring-4 ring-yellow-400 z-10 scale-110" : ""}
        ${className}
      `}
      style={{
        filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.5))"
      }}
    >
      {/* SVG Tile Body */}
      <svg width="100%" height="100%" viewBox={vertical ? "0 0 50 100" : "0 0 100 50"} className="rounded-md overflow-visible">
        <defs>
          <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8f8f8" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </linearGradient>
          <filter id="inset-shadow">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>
        
        {/* Main Body */}
        <rect 
          x="0" y="0" 
          width={vertical ? 50 : 100} 
          height={vertical ? 100 : 50} 
          rx="6" 
          fill="url(#tileGrad)" 
          stroke="#ccc" 
          strokeWidth="1"
        />
        
        {/* Divider Line */}
        <line 
          x1={vertical ? 5 : 50} 
          y1={vertical ? 50 : 5} 
          x2={vertical ? 45 : 50} 
          y2={vertical ? 50 : 45} 
          stroke="#ccc" 
          strokeWidth="2" 
        />

        {/* Pips A */}
        <g transform={vertical ? "translate(0,0)" : "translate(0,0)"} style={{ width: vertical ? '100%' : '50%', height: vertical ? '50%' : '100%' }}>
            <svg x={vertical ? 0 : 0} y={vertical ? 0 : 0} width={vertical ? 50 : 50} height={vertical ? 50 : 50} viewBox="0 0 100 100">
                {getPips(a)}
            </svg>
        </g>

        {/* Pips B */}
        <g transform={vertical ? "translate(0,50)" : "translate(50,0)"}>
            <svg x={0} y={0} width={vertical ? 50 : 50} height={vertical ? 50 : 50} viewBox="0 0 100 100">
                {getPips(b)}
            </svg>
        </g>
      </svg>
    </motion.div>
  );
}

// --- Main Component ---

export default function DominoBoard2D() {
  // State
  const [phase, setPhase] = useState<Phase>("splash");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [game, setGame] = useState<DominoGame | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [activeModal, setActiveModal] = useState<"store" | "profile" | "settings" | null>(null);
  const [volume, setVolume] = useState(0.5);
  
  // Gameplay State
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [turn, setTurn] = useState<PlayerId>("player");
  const [lastWinner, setLastWinner] = useState<PlayerId | null>(null);
  // const [fly, setFly] = useState<FlyAnimation | null>(null);
  const [validMoves, setValidMoves] = useState<Side[]>([]); // Valid sides for selected tile
  
  // Refs for positions (for animation)
  const handRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  // const leftEndRef = useRef<HTMLDivElement>(null);
  // const rightEndRef = useRef<HTMLDivElement>(null);

  // Audio Context (Mock)
  const playSound = React.useCallback(() => { 
    if (volume === 0) return;
    // In a real app, use Audio objects. Here we just log or use simple beeps if possible.
    // For now, silent to avoid errors, but structure is ready.
  }, [volume]);

  // --- Logic ---


  const handleEndGame = React.useCallback((winner: PlayerId) => {
    setLastWinner(winner);
    // playSound(winner === "player" ? "win" : "lose");
    playSound();
    setPhase("round_end");
    // Update user stats (mock)
    if (user && winner === "player") {
      setUser(u => u ? ({
        ...u,
        xp: u.xp + 100,
        coins: u.coins + 50
      }) : null);
    }
  }, [user, playSound]);

  const checkValidMoves = React.useCallback((tile: Domino): Side[] => {
    if (!game) return [];
    if (game.chain.length === 0) return ["left"]; 
    
    const head = game.chain[0];
    const tail = game.chain[game.chain.length - 1];
    
    const valid: Side[] = [];
    if (!head) return ["left"]; 

    // Check Left (Head) - match against head.a
    if (tile.a === head.a || tile.b === head.a) valid.push("left");
    
    // Check Right (Tail) - match against tail.b
    if (tile.a === tail.b || tile.b === tail.b) valid.push("right");

    return valid;
  }, [game]);

  const makeAiMove = React.useCallback(() => {
    if (!game) return;
    
    // Simple AI: Find first valid move
    const hand = game.hands.ai;
    let move: { index: number, side: Side, tile: Domino } | null = null;
    
    for (let i = 0; i < hand.length; i++) {
        const t = hand[i];
        const moves = checkValidMoves(t);
        if (moves.length > 0) {
            move = { index: i, side: moves[0], tile: t };
            break;
        }
    }

    if (move) {
        // Apply move
        const newHand = [...game.hands.ai];
        newHand.splice(move.index, 1);
        
        let placedTile = { ...move.tile };
        if (game.chain.length > 0) {
            const head = game.chain[0];
            const tail = game.chain[game.chain.length - 1];
            if (move.side === "left") {
                if (placedTile.a === head.a) { placedTile = { a: placedTile.b, b: placedTile.a }; }
            } else {
                if (placedTile.b === tail.b) { placedTile = { a: placedTile.b, b: placedTile.a }; }
            }
        }
        
        const newChain = move.side === "left" ? [placedTile, ...game.chain] : [...game.chain, placedTile];
        setGame((g: DominoGame | null) => {
            if (!g) return null;
            const next = new DominoGame();
            Object.assign(next, g);
            next.hands = { ...g.hands, ai: newHand };
            next.chain = newChain;
            next.turn = "player";
            return next;
        });
        // playSound("place");
        playSound();
        setTurn("player");
    } else {
        // Draw or Pass
        if (gameMode !== "block" && game.boneyard.length > 0) {
            const draw = game.boneyard[0];
            const newBoneyard = game.boneyard.slice(1);
            setGame((g: any) => g ? ({
                ...g,
                boneyard: newBoneyard,
                hands: { ...g.hands, ai: [...g.hands.ai, draw] }
            }) : null);
        } else {
            // Pass (Block mode or empty boneyard)
            setTurn("player");
        }
    }
  }, [game, checkValidMoves, gameMode, playSound]);

  // --- Effects ---

  // Initial Splash Timer
  useEffect(() => {
    if (phase === "splash") {
      const timer = setTimeout(() => {
        setPhase("auth");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Game Loop / AI Turn
  useEffect(() => {
    if (phase !== "game" || !game) return;

    if (game.hands.player.length === 0) {
      setTimeout(() => handleEndGame("player"), 0);
      return;
    }
    if (game.hands.ai.length === 0) {
      setTimeout(() => handleEndGame("ai"), 0);
      return;
    }

    if (turn === "ai") {
      const timer = setTimeout(() => {
        makeAiMove();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, turn, game, makeAiMove, handleEndGame]);

  // --- Logic ---

  const handleGuestLogin = () => {
    setUser({
      id: "guest_" + Math.random().toString(36).substr(2, 9),
      name: "Guest Player",
      level: 1,
      xp: 0,
      coins: 1000,
      rank: "Bronze I",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36)}`
    });
    setPhase("menu");
  };

  const startMatchmaking = (mode: GameMode) => {
    setGameMode(mode);
    setPhase("matchmaking");
    // Simulate finding match
    setTimeout(() => {
      const newGame = new DominoGame();
      newGame.deal(2);
      // Ensure player goes first if they have higher double, else AI
      // For simplicity, let's just random start or player start
      newGame.turn = "player"; 
      setGame(newGame);
      setTurn("player");
      setPhase("game");
      playSound();
    }, 3000);
  };

  const handleTileClick = (index: number) => {
    if (turn !== "player" || !game) return;
    const tile = game.hands.player[index];
    
    if (selectedTileIndex === index) {
      setSelectedTileIndex(null);
      setValidMoves([]);
    } else {
      const moves = checkValidMoves(tile);
      if (moves.length > 0) {
        // If only one move, do it automatically? Maybe wait for second click?
        // Let's select it first.
        setSelectedTileIndex(index);
        setValidMoves(moves);
      } else {
        playSound(); // Error sound maybe?
      }
    }
  };

  const handlePlaceTile = (side: Side) => {
    if (selectedTileIndex === null || !game || !user) return;
    const tile = game.hands.player[selectedTileIndex];
    
    // Animate
    // 1. Get positions
    // 2. Set Fly state
    // 3. Wait, then update game state
    
    // For now, direct update to ensure stability first
    const newHand = [...game.hands.player];
    newHand.splice(selectedTileIndex, 1);
    
    // Rotate tile if needed for chain logic
    let placedTile = { ...tile };
    if (game.chain.length > 0) {
        const head = game.chain[0];
        const tail = game.chain[game.chain.length - 1];
        
        if (side === "left") {
            if (placedTile.a === head.a) { placedTile = { a: placedTile.b, b: placedTile.a }; } // Flip to match [b, a] - [a, x]
        } else {
            if (placedTile.b === tail.b) { placedTile = { a: placedTile.b, b: placedTile.a }; } // Flip to match [x, b] - [b, a]
        }
    }

    const newChain = side === "left" ? [placedTile, ...game.chain] : [...game.chain, placedTile];
    
    setGame((g: DominoGame | null) => {
        if (!g) return null;
        const next = new DominoGame();
        Object.assign(next, g);
        next.hands = { ...g.hands, player: newHand };
        next.chain = newChain;
        return next;
    });
    
    setSelectedTileIndex(null);
    setValidMoves([]);
    playSound();
    setTurn("ai");
  };

  const drawTile = () => {
    if (!game || turn !== "player") return;
    if (gameMode === "block") return; // No drawing in block mode
    if (game.boneyard.length === 0) return;

    const draw = game.boneyard[0];
    const newBoneyard = game.boneyard.slice(1);
    setGame((g: DominoGame | null) => {
        if (!g) return null;
        const next = new DominoGame();
        Object.assign(next, g);
        next.boneyard = newBoneyard;
        next.hands = { ...g.hands, player: [...g.hands.player, draw] };
        return next;
    });
  };

  const passTurn = () => {
    if (turn !== "player") return;
    setTurn("ai");
  };

  const canPlayerMove = () => {
    if (!game) return false;
    return game.hands.player.some(t => checkValidMoves(t).length > 0);
  };

  const getTileId = (d: Domino) => {
    const min = Math.min(d.a, d.b);
    const max = Math.max(d.a, d.b);
    return `tile-${min}-${max}`;
  };

  // --- Render Helpers ---

  // Render the chain visually
  const renderChain = () => {
    if (!game) return null;
    return (
      <div className="flex items-center justify-center gap-1 flex-wrap max-w-4xl mx-auto p-4 min-h-[200px]">
        {game.chain.map((tile) => (
          <Tile 
            key={getTileId(tile)} 
            layoutId={getTileId(tile)}
            a={tile.a} 
            b={tile.b} 
            vertical={tile.a === tile.b} // Doubles are vertical
            disabled 
          />
        ))}
      </div>
    );
  };

  // --- Views ---

  if (phase === "splash") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl shadow-2xl flex items-center justify-center mb-6 rotate-12">
            <span className="text-6xl">🁫</span>
          </div>
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            DOMINO MASTER
          </h1>
          <p className="text-zinc-400 mt-2 text-lg">The Classic Game Reimagined</p>
        </motion.div>
        
        {/* Background Particles */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
           {[...Array(10)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute text-4xl"
               initial={{ x: (i * 100) % 1000, y: (i * 200) % 1000, rotate: 0 }}
               animate={{ y: [0, -1000], rotate: 360 }}
               transition={{ duration: 20 + (i * 2), repeat: Infinity, ease: "linear" }}
             >
               🁢
             </motion.div>
           ))}
        </div>
      </div>
    );
  }

  if (phase === "auth") {
    return (
      <div className="fixed inset-0 bg-zinc-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-800 p-8 rounded-3xl shadow-2xl text-center border border-zinc-700">
          <div className="w-20 h-20 bg-zinc-700 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl overflow-hidden relative border-2 border-zinc-600">
             <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Auth" alt="User" fill className="object-cover" unoptimized />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">مرحباً بك!</h2>
          <p className="text-zinc-400 mb-8">سجل الدخول لبدء اللعب وحفظ تقدمك</p>
          
          <button 
            onClick={handleGuestLogin}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors mb-4 flex items-center justify-center gap-2"
          >
            <User size={20} />
            دخول كضيف
          </button>
          
          <div className="text-zinc-500 text-sm">
            أو سجل عبر <span className="text-emerald-400 cursor-pointer">البريد الإلكتروني</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "menu") {
    return (
      <div className="fixed inset-0 bg-zinc-950 text-white overflow-hidden flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-900/50 rounded-full flex items-center justify-center text-2xl border border-emerald-500/30 overflow-hidden relative">
              {user?.avatar?.startsWith("http") ? (
                 <Image src={user.avatar} alt={user.name} fill className="object-cover" unoptimized />
              ) : (
                 <span className="text-2xl">👤</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg">{user?.name}</h3>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Crown size={12} />
                <span>{user?.rank}</span>
                <span className="text-zinc-500">| Lvl {user?.level}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Coins size={16} />
                {user?.coins.toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500">Coins</div>
            </div>
            <button 
              onClick={() => setActiveModal("settings")}
              className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-700"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 flex flex-col gap-6 max-w-md mx-auto w-full">
          {/* Hero Play Button */}
          <button 
            onClick={() => startMatchmaking("classic")}
            className="group relative w-full aspect-video bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-center hover:scale-[1.02] transition-transform"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Play size={40} fill="white" />
              </div>
              <span className="text-3xl font-black tracking-wider">PLAY NOW</span>
              <span className="text-emerald-200 mt-1">Classic Match • 100 Coins</span>
            </div>
          </button>

          {/* Modes Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => startMatchmaking("block")}
              className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <Gamepad2 size={20} />
              </div>
              <div className="font-bold text-lg">Block Mode</div>
              <div className="text-xs text-zinc-500">Strategy focused</div>
            </button>
            <button 
              onClick={() => startMatchmaking("draw")}
              className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 transition-colors text-left group"
            >
              <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <div className="font-bold text-lg">Draw Mode</div>
              <div className="text-xs text-zinc-500">Classic rules</div>
            </button>
          </div>

          {/* Bottom Nav */}
          <div className="mt-auto grid grid-cols-3 gap-4">
            <button 
              onClick={() => setActiveModal("store")}
              className="flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"
            >
              <ShoppingBag className="mb-2 text-pink-400" />
              <span className="text-xs font-bold">Store</span>
            </button>
            <button 
               onClick={() => setActiveModal("profile")}
               className="flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800"
            >
              <User className="mb-2 text-cyan-400" />
              <span className="text-xs font-bold">Profile</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800">
              <Trophy className="mb-2 text-amber-400" />
              <span className="text-xs font-bold">Rank</span>
            </button>
          </div>
        </main>

        {/* Modals */}
        <AnimatePresence>
          {activeModal && (
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
            >
              <div className="p-4 flex items-center gap-4 border-b border-zinc-800">
                <button onClick={() => setActiveModal(null)} className="p-2 bg-zinc-900 rounded-full">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-bold capitalize">{activeModal === "store" ? "Domino Skins" : activeModal}</h2>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {activeModal === "store" && (
                   <div className="grid grid-cols-2 gap-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                          <div className="h-24 bg-zinc-800 rounded-lg mb-3 flex items-center justify-center text-4xl">🎨</div>
                          <div className="font-bold">Premium Skin {i}</div>
                          <div className="text-amber-400 text-sm font-bold mt-1">500 Coins</div>
                          <button className="w-full mt-3 py-2 bg-zinc-700 rounded-lg text-sm font-bold">Buy</button>
                        </div>
                      ))}
                   </div>
                )}
                {activeModal === "profile" && (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-zinc-800 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl border-4 border-emerald-500">
                      {user?.avatar}
                    </div>
                    <h2 className="text-2xl font-bold">{user?.name}</h2>
                    <p className="text-emerald-400 font-bold mb-8">{user?.rank}</p>
                    
                    <div className="bg-zinc-900 rounded-xl p-4 mb-4 flex justify-between items-center">
                      <span>Total Games</span>
                      <span className="font-bold">142</span>
                    </div>
                    <div className="bg-zinc-900 rounded-xl p-4 mb-4 flex justify-between items-center">
                      <span>Win Rate</span>
                      <span className="font-bold text-emerald-400">68%</span>
                    </div>
                  </div>
                )}
                {activeModal === "settings" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Volume2 />
                        <span>Sound Effects</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.1" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-32 accent-emerald-500"
                      />
                    </div>
                    <button className="w-full py-3 bg-red-900/30 text-red-400 rounded-xl font-bold border border-red-900/50">
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (phase === "matchmaking") {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-full border-4 border-emerald-500/30 border-t-emerald-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <Search size={32} className="text-emerald-500" />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-bold">Finding Opponent...</h2>
        <p className="text-zinc-500 mt-2">Searching for a worthy player</p>
        <button 
          onClick={() => setPhase("menu")}
          className="mt-12 px-8 py-3 bg-zinc-800 rounded-full text-zinc-400 hover:bg-zinc-700 font-bold"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (phase === "game" || phase === "round_end") {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col text-white overflow-hidden">
        {/* Top Bar (Opponent) */}
        <div className="h-20 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center border border-red-500/30">
              🤖
            </div>
            <div>
              <div className="font-bold text-sm">AI Opponent</div>
              <div className="text-xs text-zinc-500">{game?.hands.ai.length} Tiles left</div>
            </div>
          </div>
          <div className="px-3 py-1 bg-zinc-800 rounded-lg text-xs font-mono text-zinc-400">
             {gameMode.toUpperCase()}
          </div>
        </div>

        {/* Game Board */}
        <div 
            ref={boardRef}
            className="flex-1 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-wood.png')] bg-zinc-900/50 flex items-center justify-center"
        >
            {/* Valid Move Indicators (Overlay) */}
            {selectedTileIndex !== null && validMoves.length > 0 && (
                <>
                  {validMoves.includes("left") && (
                    <motion.button
                       initial={{ scale: 0 }} animate={{ scale: 1 }}
                       onClick={() => handlePlaceTile("left")}
                       className="absolute left-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center animate-pulse z-20 cursor-pointer"
                    >
                        <ChevronRight className="rotate-180" />
                    </motion.button>
                  )}
                  {validMoves.includes("right") && (
                    <motion.button
                       initial={{ scale: 0 }} animate={{ scale: 1 }}
                       onClick={() => handlePlaceTile("right")}
                       className="absolute right-10 top-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center animate-pulse z-20 cursor-pointer"
                    >
                        <ChevronRight />
                    </motion.button>
                  )}
                </>
            )}

            {/* The Chain */}
            <div className="scale-[0.6] md:scale-100 transition-transform duration-500 origin-center w-full flex justify-center">
               {renderChain()}
            </div>
        </div>

        {/* Player Controls / Hand */}
        <div className="bg-zinc-900 border-t border-zinc-800 p-4 pb-8 z-30">
           <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-emerald-900/50 rounded-full flex items-center justify-center text-sm border border-emerald-500/30">
                   {user?.avatar}
                 </div>
                 <span className="font-bold text-sm">{user?.name}</span>
              </div>
              
              {turn === "player" && (
                 <div className="text-emerald-400 font-bold text-sm animate-pulse">
                    YOUR TURN
                 </div>
              )}
              
              <div className="flex gap-2">
                 {turn === "player" && !canPlayerMove() && (
                    (gameMode === "block" || (game?.boneyard.length || 0) === 0) ? (
                        <button 
                            onClick={passTurn}
                            className="px-4 py-2 bg-red-900/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold hover:bg-red-900/70"
                        >
                            Pass
                        </button>
                    ) : (
                        <button 
                            onClick={drawTile}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-500 animate-pulse"
                        >
                            Draw ({game?.boneyard.length})
                        </button>
                    )
                 )}
                 {/* Show count always if not active or can move */}
                 {(!turn || (turn === "player" && canPlayerMove())) && (
                     <div className="px-4 py-2 bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500">
                        Boneyard: {game?.boneyard.length}
                     </div>
                 )}
              </div>
           </div>

           {/* Hand */}
           <div 
             ref={handRef}
             className="flex justify-center gap-2 overflow-x-auto py-2 min-h-[90px]"
           >
              {game?.hands.player.map((tile, i) => (
                <Tile 
                  key={getTileId(tile)}
                  layoutId={`tile-${tile.a}-${tile.b}-${i}`}
                  a={tile.a} 
                  b={tile.b}
                  vertical 
                  selected={selectedTileIndex === i}
                  disabled={turn !== "player"}
                  onClick={() => handleTileClick(i)}
                  className="hover:-translate-y-2 transition-transform"
                />
              ))}
           </div>
        </div>

        {/* End Round Modal */}
        <AnimatePresence>
            {phase === "round_end" && (
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <motion.div 
                       initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
                       className="bg-zinc-900 border border-zinc-700 p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl"
                    >
                        <div className="text-6xl mb-4">{lastWinner === "player" ? "🏆" : "💀"}</div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {lastWinner === "player" ? "VICTORY!" : "DEFEAT"}
                        </h2>
                        <p className="text-zinc-400 mb-8">
                            {lastWinner === "player" ? "+150 XP • +50 Coins" : "Better luck next time"}
                        </p>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setPhase("menu")} 
                                className="flex-1 py-3 bg-zinc-800 rounded-xl text-zinc-400 font-bold hover:bg-zinc-700"
                            >
                                Home
                            </button>
                            <button 
                                onClick={() => startMatchmaking(gameMode)} 
                                className="flex-1 py-3 bg-emerald-600 rounded-xl text-white font-bold hover:bg-emerald-500"
                            >
                                Play Again
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
