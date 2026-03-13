"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  Settings, 
  ArrowLeft, Users, Crown, 
  Share2, Volume2, VolumeX
} from "lucide-react";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { getTheme } from "@/lib/platform/cultural-themes";
import { getSocket, onSocketReady } from "@/lib/platform/socket";
import { Color, TokenPos } from "@/lib/ludo/game";

// --- Assets ---
const MYTHICAL_ASSETS = {
  red: { 
    name: "Dragon", 
    icon: "🐉", 
    color: "from-red-600 to-orange-600",
    glow: "shadow-[0_0_20px_rgba(220,38,38,0.6)]",
    bg: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    image: "/assets/ludo/dragon_red.png"
  },
  yellow: { 
    name: "Phoenix", 
    icon: "🦅", 
    color: "from-amber-400 to-orange-500",
    glow: "shadow-[0_0_20px_rgba(251,191,36,0.6)]",
    bg: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    image: "/assets/ludo/phoenix_yellow.png"
  },
  green: { 
    name: "Unicorn", 
    icon: "🦄", 
    color: "from-emerald-400 to-teal-600",
    glow: "shadow-[0_0_20px_rgba(52,211,153,0.6)]",
    bg: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    image: "/assets/ludo/unicorn_green.png"
  },
  blue: { 
    name: "Griffin", 
    icon: "🦅", 
    color: "from-blue-500 to-indigo-600",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
    bg: "bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))]",
    image: "/assets/ludo/griffin_blue.png"
  }
};

type Phase = "splash" | "auth" | "home" | "lobby" | "create_room" | "join_room" | "game" | "game_over" | "ended";

// ... [TRACK_COORDS, HOME_COORDS, BASE_POSITIONS, SAFE_INDICES remain unchanged] ...
const TRACK_COORDS: {x: number, y: number}[] = [
  {x:1, y:6}, {x:2, y:6}, {x:3, y:6}, {x:4, y:6}, {x:5, y:6},
  {x:6, y:5}, {x:6, y:4}, {x:6, y:3}, {x:6, y:2}, {x:6, y:1}, {x:6, y:0},
  {x:7, y:0}, {x:8, y:0},
  {x:8, y:1}, {x:8, y:2}, {x:8, y:3}, {x:8, y:4}, {x:8, y:5},
  {x:9, y:6}, {x:10, y:6}, {x:11, y:6}, {x:12, y:6}, {x:13, y:6}, {x:14, y:6},
  {x:14, y:7}, {x:14, y:8},
  {x:13, y:8}, {x:12, y:8}, {x:11, y:8}, {x:10, y:8}, {x:9, y:8},
  {x:8, y:9}, {x:8, y:10}, {x:8, y:11}, {x:8, y:12}, {x:8, y:13}, {x:8, y:14},
  {x:7, y:14}, {x:6, y:14},
  {x:6, y:13}, {x:6, y:12}, {x:6, y:11}, {x:6, y:10}, {x:6, y:9},
  {x:5, y:8}, {x:4, y:8}, {x:3, y:8}, {x:2, y:8}, {x:1, y:8}, {x:0, y:8},
  {x:0, y:7}, {x:0, y:6}
];

const HOME_COORDS = {
  red:    [{x:1, y:7}, {x:2, y:7}, {x:3, y:7}, {x:4, y:7}, {x:5, y:7}, {x:6, y:7}], 
  yellow: [{x:7, y:1}, {x:7, y:2}, {x:7, y:3}, {x:7, y:4}, {x:7, y:5}, {x:7, y:6}], 
  blue:   [{x:13, y:7}, {x:12, y:7}, {x:11, y:7}, {x:10, y:7}, {x:9, y:7}, {x:8, y:7}], 
  green:  [{x:7, y:13}, {x:7, y:12}, {x:7, y:11}, {x:7, y:10}, {x:7, y:9}, {x:7, y:8}] 
};

const BASE_POSITIONS = {
  red: { x: 0, y: 0 },    
  yellow: { x: 9, y: 0 }, 
  blue: { x: 9, y: 9 },   
  green: { x: 0, y: 9 }   
};

const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export default function LudoBoardOnline2D({ 
  initialMatchId 
}: { 
  initialMatchId?: string 
}) {
  // --- Global Store ---
  const { user, language, soundEnabled, toggleSound, equipped, inventory, equipItem, setLanguage, culturalMood } = usePlatformStore();
  const t = TRANSLATIONS[language];
  const skin = equipped.ludo_skin;

  // --- State ---
  const [phase, setPhase] = useState<Phase>("splash");
  const [matchId, setMatchId] = useState<string | null>(initialMatchId || null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  
  // Game State from Server
  const [gameState, setGameState] = useState<{
    tokens: Record<string, { id: number, pos: TokenPos }[]>;
    turn: string;
    dice: number | null;
  } | null>(null);
  const [mySide, setMySide] = useState<string | null>(null);

  // --- Actions ---

  const findMatch = React.useCallback(() => {
    setPhase("lobby");
    onSocketReady((socket) => {
      socket.emit("ludo:find_match", { name: user?.name || "Guest" });
      
      socket.on("ludo:match_found", ({ matchId, side }) => {
        setMatchId(matchId);
        setMySide(side);
        setPhase("game");
      });

      socket.on("ludo:state", (state) => {
        setGameState(state);
        setDiceValue(state.dice);
      });

      socket.on("ludo:game_over", ({ winner }: { winner: string }) => {
        setPhase("ended" as Phase);
        if (winner === mySide && user?.country) {
          fetch("/api/country-war", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: user.country, delta: 1 }),
          }).catch(() => {});
        }
      });

      socket.on("ludo:rolled", ({ side, dice }) => {
        setDiceValue(dice);
        setIsRolling(false);
      });
    });
  }, [user]);

  // --- Effects ---

  // Init
  useEffect(() => {
    if (initialMatchId) {
      findMatch(); // Re-join logic if needed
    } else {
      setTimeout(() => setPhase("auth"), 1500);
    }
  }, [initialMatchId, findMatch]);

  const handleRoll = () => {
    if (!matchId || isRolling) return;
    setIsRolling(true);
    
    // Optimistic roll animation
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 8) {
        clearInterval(interval);
        // Send to server
        const socket = getSocket();
        socket?.emit("ludo:roll", { matchId });
      }
    }, 50);
  };

  const handleMove = (idx: number) => {
    if (!matchId || !mySide) return;
    if (gameState?.turn !== mySide) return;
    
    const socket = getSocket();
    socket?.emit("ludo:move", { matchId, tokenIndex: idx });
  };

  // --- Visuals based on Skin ---
  const getSkinColors = (color: string) => {
    if (skin === "skin_neon") {
       switch(color) {
           case "red": return "bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.8)] border-red-400 ring-2 ring-red-300";
           case "yellow": return "bg-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.8)] border-yellow-300 ring-2 ring-yellow-200";
           case "green": return "bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-emerald-400 ring-2 ring-emerald-300";
           case "blue": return "bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.8)] border-blue-400 ring-2 ring-blue-300";
       }
    }
    // Classic / Default (3D Glossy Look)
    switch(color) {
        case "red": return "bg-gradient-to-br from-red-400 via-red-600 to-red-800 ring-1 ring-red-900 shadow-lg";
        case "yellow": return "bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 ring-1 ring-amber-900 shadow-lg";
        case "green": return "bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 ring-1 ring-emerald-900 shadow-lg";
        case "blue": return "bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 ring-1 ring-blue-900 shadow-lg";
    }
  };

  const renderTokenVisual = (color: string) => {
      const asset = MYTHICAL_ASSETS[color as keyof typeof MYTHICAL_ASSETS] || MYTHICAL_ASSETS.red;
      return (
        <div className={`w-full h-full rounded-full bg-gradient-to-br ${asset.color} p-0.5 shadow-md relative overflow-hidden`}>
            {/* Inner Bevel */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-black/20" />
            
            {/* Creature Image or Icon */}
            <div className="absolute inset-1 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-[1px]">
               <div className="relative w-full h-full">
                  <Image 
                    src={asset.image} 
                    alt={asset.name}
                    fill
                    className="object-contain drop-shadow-md hover:scale-110 transition-transform duration-300"
                    unoptimized
                    onError={(e) => {
                        e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center -z-10 text-xl filter drop-shadow-sm">
                      {asset.icon}
                  </div>
               </div>
            </div>
            
            {/* Shine */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/3 bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[1px]" />
        </div>
      );
  };

  const getAbsolutePos = (color: string, pos: TokenPos, tokenIndex: number) => {
    let x = 0, y = 0;
    
    if (pos.kind === "yard") {
      // Inside Base
      const base = BASE_POSITIONS[color as keyof typeof BASE_POSITIONS];
      // 2x2 grid inside base (offset 1.5, 1.5 from base corner)
      // indices 0-3: TL, TR, BL, BR
      const dx = (tokenIndex % 2) * 2 + 1.5;
      const dy = Math.floor(tokenIndex / 2) * 2 + 1.5;
      x = base.x + dx;
      y = base.y + dy;
    } else if (pos.kind === "track") {
      const p = TRACK_COORDS[pos.index];
      x = p.x;
      y = p.y;
    } else if (pos.kind === "home") {
      if (pos.count > 0 && pos.count <= 6) {
        const p = HOME_COORDS[color as keyof typeof HOME_COORDS][pos.count - 1];
        x = p.x;
        y = p.y;
      } else {
        x = 7; y = 7; // Center
      }
    }
    
    // Convert to percentage
    return { left: `${(x / 15) * 100}%`, top: `${(y / 15) * 100}%` };
  };

  // --- Renders ---

  const renderDice = () => {
     // 3D Realistic Dice Logic (Same as before)
     const dots = {
         1: [<div key="c" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-inner" />],
         2: [<div key="tl" className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />, 
             <div key="br" className="absolute bottom-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />],
         3: [<div key="tl" className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="c" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="br" className="absolute bottom-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />],
         4: [<div key="tl" className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="tr" className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="bl" className="absolute bottom-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="br" className="absolute bottom-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />],
         5: [<div key="tl" className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="tr" className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="c" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="bl" className="absolute bottom-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="br" className="absolute bottom-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />],
         6: [<div key="tl" className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="ml" className="absolute top-1/2 left-2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="bl" className="absolute bottom-2 left-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="tr" className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="mr" className="absolute top-1/2 right-2 -translate-y-1/2 w-4 h-4 bg-black rounded-full shadow-inner" />,
             <div key="br" className="absolute bottom-2 right-2 w-4 h-4 bg-black rounded-full shadow-inner" />]
     };

     const val = diceValue || 1;

     return (
        <motion.div 
          key={val}
          initial={isRolling ? { rotate: 0 } : { rotate: 180, scale: 0.5 }}
          animate={isRolling ? { rotate: 360, scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
          className="w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-2xl border-2 border-gray-300 shadow-[0_10px_20px_rgba(0,0,0,0.3),inset_0_-5px_10px_rgba(0,0,0,0.1)] flex items-center justify-center relative transform-gpu hover:scale-105 transition-transform"
        >
            <div className="relative w-full h-full">
                {dots[val as keyof typeof dots]}
            </div>
        </motion.div>
     );
  };

  // --- Screens ---

  if (phase === "splash") {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white z-50">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center">
          <div className="text-9xl mb-4">🎲</div>
          <h1 className="text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
            LUDO MASTER
          </h1>
        </motion.div>
      </div>
    );
  }

  if (phase === "auth" || phase === "home" || phase === "lobby" || phase === "create_room" || phase === "join_room") {
    // Shared Background for Menu Screens
    return (
      <div className="fixed inset-0 bg-[#0f172a] text-white overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-white/20">
                 {user?.avatar || "🦁"}
               </div>
               <div>
                 <h2 className="font-bold text-lg">{user?.name || t.guest}</h2>
                 <div className="text-xs text-slate-400 flex items-center gap-1">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> {t.online || "Online"}
                 </div>
               </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setLanguage(language === "ar" ? "en" : "ar")} className="p-2 bg-slate-800 rounded-xl border border-slate-700 text-xs font-bold">
                 {language === "ar" ? "EN" : "عربي"}
               </button>
              <button className="p-2 bg-slate-800 rounded-xl border border-slate-700"><Settings size={20} /></button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Promo Banner */}
            <div className="h-40 bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-6 relative overflow-hidden shadow-2xl group">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"/>
               <h3 className="text-3xl font-black italic relative z-10">{t.quick_match || "QUICK MATCH"}</h3>
               <p className="text-white/80 relative z-10">{t.play} & Win!</p>
               <button onClick={() => findMatch()} className="mt-4 px-6 py-2 bg-white text-rose-600 font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                 {t.play}
               </button>
            </div>

            {/* Skins Selection */}
            <div className="mt-2">
                <h3 className="text-slate-400 text-xs font-bold mb-2 uppercase">{t.store || "Your Skins"}</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {inventory.filter(i => i.type === "ludo_skin").map(item => (
                        <button 
                            key={item.id}
                            onClick={() => equipItem("ludo_skin", item.id)}
                            className={`
                                min-w-[80px] p-2 rounded-xl border-2 flex flex-col items-center gap-1
                                ${equipped.ludo_skin === item.id ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-800"}
                            `}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                            <span className="text-xs font-bold">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <button onClick={() => findMatch()} className="aspect-[4/3] bg-[#1e293b] rounded-3xl flex flex-col items-center justify-center border border-slate-700 hover:border-indigo-500 transition-colors gap-2">
                <Users className="text-indigo-400" size={32} />
                <span className="font-bold">{t.create_room || "Create Room"}</span>
              </button>
              <button onClick={() => setPhase("join_room")} className="aspect-[4/3] bg-[#1e293b] rounded-3xl flex flex-col items-center justify-center border border-slate-700 hover:border-emerald-500 transition-colors gap-2">
                <Share2 className="text-emerald-400" size={32} />
                <span className="font-bold">{t.join_room || "Join Room"}</span>
              </button>
              <button onClick={() => findMatch()} className="aspect-[4/3] bg-[#1e293b] rounded-3xl flex flex-col items-center justify-center border border-slate-700 hover:border-amber-500 transition-colors gap-2 col-span-2">
                <div className="flex gap-2 text-4xl">🤖</div>
                <span className="font-bold text-lg">{t.vs_computer}</span>
                <span className="text-xs text-slate-400">{t.offline || "Offline"} Mode</span>
              </button>
            </div>

            {/* Back Button for Sub-menus */}
            {phase !== "home" && phase !== "auth" && (
               <button onClick={() => setPhase("home")} className="mt-auto py-4 flex items-center justify-center gap-2 text-slate-400 hover:text-white">
                 <ArrowLeft size={20} /> {t.back || "Back to Home"}
               </button>
            )}

            {/* Placeholder for Lobby/Room inputs */}
            {(phase === "create_room" || phase === "join_room" || phase === "lobby") && (
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl p-6 border border-slate-700 text-center">
                  <h3 className="text-xl font-bold mb-4">{phase === "lobby" ? "Searching..." : t.join_room}</h3>
                  <div className="bg-slate-900 p-4 rounded-xl mb-6 font-mono text-2xl tracking-widest text-center border border-slate-700 animate-pulse">
                    {phase === "lobby" ? "⏳ MATCHMAKING" : "ENTER CODE"}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPhase("home")} className="flex-1 py-3 rounded-xl font-bold bg-slate-700">{t.back || "Cancel"}</button>
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // --- GAME PHASE ---

  if (!gameState) return <div className="text-white">Loading Game State...</div>;

  return (
    <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center overflow-hidden select-none" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Top Bar */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20">
        <button onClick={() => setPhase("home")} className="p-2 bg-slate-800/80 rounded-full text-white backdrop-blur">
          <ArrowLeft size={20} />
        </button>
        <div className="bg-slate-800/80 px-4 py-1 rounded-full text-white backdrop-blur font-mono text-sm border border-slate-600">
          Room: {matchId?.slice(-4)}
        </div>
        <button onClick={toggleSound} className="p-2 bg-slate-800/80 rounded-full text-white backdrop-blur">
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      {/* Board Container */}
      <div className="relative w-[min(95vw,65vh)] aspect-square max-w-[600px] bg-[#fff5e6] rounded-xl shadow-2xl border-4 border-[#cbd5e1] overflow-hidden" dir="ltr"> {/* Keep board LTR */}
        
        {/* --- 15x15 Grid Layout --- */}
        <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
          
          {/* Bases */}
          <div className="col-span-6 row-span-6 bg-red-500 border-r-2 border-b-2 border-black/10 p-4">
             <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                   <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Red" alt="Red" fill className="object-cover grayscale" unoptimized />
                </div>
             </div>
          </div>
          <div className="col-start-10 col-span-6 row-span-6 bg-amber-400 border-l-2 border-b-2 border-black/10 p-4">
             <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Yellow" alt="Yellow" fill className="object-cover grayscale" unoptimized />
               </div>
             </div>
          </div>
          <div className="col-start-1 row-start-10 col-span-6 row-span-6 bg-emerald-500 border-r-2 border-t-2 border-black/10 p-4">
             <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Green" alt="Green" fill className="object-cover grayscale" unoptimized />
               </div>
             </div>
          </div>
          <div className="col-start-10 row-start-10 col-span-6 row-span-6 bg-blue-500 border-l-2 border-t-2 border-black/10 p-4">
             <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center opacity-10">
                 <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=Blue" alt="Blue" fill className="object-cover grayscale" unoptimized />
               </div>
             </div>
          </div>

          {/* Center Home Triangle */}
          <div className="col-start-7 col-span-3 row-start-7 row-span-3 bg-white relative">
             <div className="absolute inset-0 bg-red-500" style={{clipPath: "polygon(0 0, 0 100%, 50% 50%)"}} />
             <div className="absolute inset-0 bg-amber-400" style={{clipPath: "polygon(0 0, 100% 0, 50% 50%)"}} />
             <div className="absolute inset-0 bg-blue-500" style={{clipPath: "polygon(100% 0, 100% 100%, 50% 50%)"}} />
             <div className="absolute inset-0 bg-emerald-500" style={{clipPath: "polygon(0 100%, 100% 100%, 50% 50%)"}} />
          </div>

        </div>

        {/* --- Cells & Tracks Overlay --- */}
        {[...Array(52)].map((_, i) => {
           const p = TRACK_COORDS[i];
           const isSafe = SAFE_INDICES.includes(i);
           let colorClass = "bg-white";
           if (i === 0) colorClass = "bg-red-500"; 
           if (i === 13) colorClass = "bg-amber-400";
           if (i === 26) colorClass = "bg-blue-500";
           if (i === 39) colorClass = "bg-emerald-500";
           
           return (
             <div 
               key={`track-${i}`}
               className={`absolute w-[6.66%] h-[6.66%] border-[0.5px] border-slate-300 ${colorClass} flex items-center justify-center`}
               style={{ left: `${p.x * 6.66}%`, top: `${p.y * 6.66}%` }}
             >
               {isSafe && <div className="opacity-20 text-black">⭐</div>}
               {i === 0 && <ArrowLeft className="text-white rotate-180" size={14} />}
               {i === 13 && <ArrowLeft className="text-white rotate-90" size={14} />}
               {i === 26 && <ArrowLeft className="text-white" size={14} />}
               {i === 39 && <ArrowLeft className="text-white -rotate-90" size={14} />}
             </div>
           );
        })}

        {/* Home Runs */}
        {HOME_COORDS.red.map((p, i) => (
           <div key={`hr-${i}`} className="absolute w-[6.66%] h-[6.66%] bg-red-500 border-[0.5px] border-red-600/50" style={{ left: `${p.x * 6.66}%`, top: `${p.y * 6.66}%` }} />
        ))}
        {HOME_COORDS.yellow.map((p, i) => (
           <div key={`hy-${i}`} className="absolute w-[6.66%] h-[6.66%] bg-amber-400 border-[0.5px] border-amber-500/50" style={{ left: `${p.x * 6.66}%`, top: `${p.y * 6.66}%` }} />
        ))}
        {HOME_COORDS.blue.map((p, i) => (
           <div key={`hb-${i}`} className="absolute w-[6.66%] h-[6.66%] bg-blue-500 border-[0.5px] border-blue-600/50" style={{ left: `${p.x * 6.66}%`, top: `${p.y * 6.66}%` }} />
        ))}
        {HOME_COORDS.green.map((p, i) => (
           <div key={`hg-${i}`} className="absolute w-[6.66%] h-[6.66%] bg-emerald-500 border-[0.5px] border-emerald-600/50" style={{ left: `${p.x * 6.66}%`, top: `${p.y * 6.66}%` }} />
        ))}

        {/* --- TOKENS (From Server State) --- */}
        {Object.entries(gameState.tokens).map(([pid, tokens]) => {
           const color = pid === "player" ? "red" : pid === "ai1" ? "yellow" : pid === "ai2" ? "green" : "blue";
           
           return tokens.map((t, idx) => {
             const pos = getAbsolutePos(color, t.pos, idx);
             const isTurn = gameState.turn === pid;
             const isMe = pid === mySide; 
             const canMove = isTurn && isMe && diceValue !== null; // Simplified client check, server validates

             return (
               <motion.div
                 key={`${pid}-${idx}`}
                 layout
                 initial={false}
                 transition={{ type: "spring", stiffness: 300, damping: 25 }}
                 className="absolute w-[6.66%] h-[6.66%] flex items-center justify-center z-10"
                 style={{ left: pos.left, top: pos.top }}
                 onClick={() => canMove && handleMove(idx)}
               >
                  <div className={`
                     w-[75%] h-[75%] rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.3)]
                     ${getSkinColors(color)}
                     border-2 border-white/40 ring-1
                     ${canMove ? "cursor-pointer animate-bounce brightness-110 ring-2 ring-white" : "opacity-90"}
                  `}>
                    {renderTokenVisual(color)}
                  </div>
               </motion.div>
             );
           });
        })}

      </div>

      {/* --- Controls --- */}
      <div className="absolute bottom-10 w-full flex flex-col items-center">
         
         {/* Message */}
         <div className="mb-6 h-8 text-white font-bold tracking-wider text-shadow flex items-center gap-2">
            {gameState.turn === mySide ? (
                <span className="text-green-400 animate-pulse">{t.your_turn || "YOUR TURN"}</span>
            ) : (
                `${gameState.turn.toUpperCase()} IS PLAYING...`
            )}
         </div>

         {/* Dice Area */}
         <div className="relative">
            <button 
               onClick={handleRoll}
               disabled={gameState.turn !== mySide || isRolling || diceValue !== null}
               className={`
                  transition-all duration-200 active:scale-95
                  ${gameState.turn !== mySide ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:scale-105"}
               `}
            >
               {renderDice()}
            </button>
         </div>
      </div>

    </div>
  );
}
