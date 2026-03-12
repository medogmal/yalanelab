
"use client";
import React, { Suspense } from "react";
import DominoBoard from "@/components/domino/DominoBoardOnline2D";
import { ArrowRight, Settings, Users, Box, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function TrainingContent() {
  const searchParams = useSearchParams();
  
  const isCampaign = searchParams.get("campaign") === "true";
  const mapId = searchParams.get("map");
  const levelId = searchParams.get("level");
  
  // If campaign, use params. If not, use local state for setup
  const [setupComplete, setSetupComplete] = useState(isCampaign);
  
  const [players, setPlayers] = useState(searchParams.get("players") === "4" ? 4 : 2);
  const [gameType, setGameType] = useState<"classic" | "block" | "all_fives">("classic");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "expert">("medium");

  if (!setupComplete) {
      return (
          <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
             {/* Background */}
             <div className="absolute inset-0 bg-[url('/domino/tables/sultan.png')] bg-cover bg-center opacity-25 blur-sm" />
             <div className="absolute inset-0 bg-black/60" />
             
             {/* Back Button */}
             <div className="absolute top-4 right-4 z-50">
                <Link href="/games/domino/online" className="glass-dark border border-white/[0.08] text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
                    <ArrowRight size={18} />
                    رجوع للوبي
                </Link>
             </div>

             <div className="relative z-10 glass-dark border border-white/[0.08] rounded-3xl p-8 max-w-lg w-full shadow-2xl">
                 <h1 className="text-3xl font-black text-white text-center mb-8 flex items-center justify-center gap-3">
                     <Settings className="text-amber-400" />
                     <span className="gold-shimmer">إعدادات التدريب</span>
                 </h1>
                 
                 {/* Players */}
                 <div className="mb-8">
                     <label className="text-zinc-400 text-sm font-bold mb-3 block">عدد اللاعبين</label>
                     <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={() => setPlayers(2)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${players === 2 ? "bg-amber-500/20 border-amber-500 text-amber-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"}`}
                         >
                             <Users size={24} />
                             <span className="font-bold">2 لاعبين</span>
                         </button>
                         <button 
                            onClick={() => setPlayers(4)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${players === 4 ? "bg-amber-500/20 border-amber-500 text-amber-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"}`}
                         >
                             <Users size={24} />
                             <span className="font-bold">4 لاعبين</span>
                         </button>
                     </div>
                 </div>

                 {/* Game Type */}
                 <div className="mb-8">
                     <label className="text-zinc-400 text-sm font-bold mb-3 block">نوع اللعبة</label>
                     <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={() => setGameType("classic")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${gameType === "classic" ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"}`}
                         >
                             <Box size={24} />
                             <span className="font-bold">كلاسيك (سحب)</span>
                         </button>
                         <button 
                            onClick={() => setGameType("block")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${gameType === "block" ? "bg-red-500/20 border-red-500 text-red-500" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-750"}`}
                         >
                             <Zap size={24} />
                             <span className="font-bold">بلوك (بدون سحب)</span>
                         </button>
                     </div>
                 </div>

                 <button 
                    onClick={() => setSetupComplete(true)}
                    className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl font-black text-xl text-black hover:brightness-110 transition-all shadow-lg shadow-amber-500/30 hover:-translate-y-0.5"
                 >
                     🎮 بدء اللعب
                 </button>
             </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-transparent relative">
       <DominoBoard 
          playerId="local-player" 
          mode="training" 
          initialSide="a"
          numPlayers={players}
          gameType={isCampaign ? "classic" : gameType}
          difficulty={difficulty}
          campaignMapId={mapId || undefined}
          campaignLevelId={levelId || undefined}
       />
    </div>
  );
}

export default function DominoTrainingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <TrainingContent />
    </Suspense>
  );
}
