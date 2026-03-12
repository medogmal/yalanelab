import React from "react";
// import { motion } from "framer-motion";

export type Suit = "H" | "D" | "S" | "C";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface ProfessionalCardProps {
  suit: Suit;
  rank: Rank;
  flipped?: boolean;
  width?: number | string;
  height?: number | string;
  skin?: "classic" | "royal" | "geometric" | "neon";
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

// const SUIT_COLORS = {};
// const SUIT_GRADIENTS = {};

// SVG Paths
// const SUITS = { ... };

// Improved SVG Paths for better visuals
const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
    // const color = suit === "H" || suit === "D" ? "text-red-600" : "text-black";
    
    // Using standard Lucide-like paths but custom for cards
    if (suit === "H") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    );
    if (suit === "D") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2L2 12l10 10 10-10L12 2z"/>
        </svg>
    );
    if (suit === "S") return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
             <path d="M12,2C8,2,5,4.5,5,7c0,1.5,1,2.5,2,3c0,0-2,1-3.5,3.5C2,15.5,3.5,19,6.5,19h11c3,0,4.5-3.5,3-5.5C19,11,17,10,17,10c1-0.5,2-1.5,2-3 C19,4.5,16,2,12,2z M11,19v3h2v-3H11z" />
        </svg>
    );
    return ( // Clubs
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
             <path d="M12,2C10,2,8.5,3.5,8.5,5c0,0.5,0.2,1,0.5,1.4c-2.5,0.5-4,3-4,5.1c0,2.5,2,4.5,4.5,4.5h0.5v3h4v-3h0.5c2.5,0,4.5-2,4.5-4.5 c0-2.1-1.5-4.6-4-5.1c0.3-0.4,0.5-0.9,0.5-1.4C15.5,3.5,14,2,12,2z" />
        </svg>
    );
};

export default function ProfessionalCard({
  suit,
  rank,
  // flipped = false,
  width = 140,
  height = 200,
  skin = "classic",
  // className = "",
  onClick,
  // selected = false,
  disabled = false,
}: ProfessionalCardProps) {
  
  const isRed = suit === "H" || suit === "D";
  const colorClass = isRed ? "text-red-600" : "text-black";
  
  // Patterns for backs
  const getBackPattern = () => {
    if (skin === "royal") return (
        <div className="w-full h-full bg-zinc-900 rounded-lg border-2 border-[#d4af37] flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#d4af37_1px,transparent_1px)] bg-[length:10px_10px]" />
            <div className="w-20 h-20 rounded-full border-2 border-[#d4af37] flex items-center justify-center">
                <span className="text-4xl text-[#d4af37]">⚜️</span>
            </div>
        </div>
    );
    if (skin === "geometric") return (
        <div className="w-full h-full bg-indigo-600 rounded-lg flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
            <div className="text-4xl text-white opacity-80">♦</div>
        </div>
    );
    if (skin === "neon") return (
        <div className="w-full h-full bg-black rounded-lg border border-purple-500 shadow-[0_0_10px_#a855f7] flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50" />
             <div className="relative z-10 text-4xl animate-pulse">👾</div>
        </div>
    );
    // Classic
    return (
        <div className="w-full h-full bg-blue-700 rounded-lg border-4 border-white flex items-center justify-center overflow-hidden relative">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]" />
             <div className="w-full h-full border-2 border-blue-800 m-1 rounded" />
             <span className="text-2xl text-white opacity-50">♠</span>
        </div>
    );
  };
  
  const bgClass = skin === "neon" ? "bg-black" : "bg-white";
  const borderClass = skin === "neon" ? "border-2 border-purple-500" : "border border-zinc-200";

  const getFront = () => {
    // Face Card Art (Simplified)
    const isFace = ["J", "Q", "K"].includes(rank);
    const isAce = rank === "A";

    return (
      <div className={`w-full h-full bg-white rounded-lg flex flex-col relative overflow-hidden select-none ${skin === "neon" ? "bg-zinc-900 text-white border border-purple-500/50" : "bg-white"}`}>
        {/* Top Left Corner */}
        <div className="absolute top-2 left-2 flex flex-col items-center leading-none">
          <span className={`text-xl font-bold font-mono tracking-tighter ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`}>{rank}</span>
          <SuitIcon suit={suit} className={`w-4 h-4 drop-shadow-sm ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`} />
        </div>

        {/* Center Art */}
        <div className="flex-1 flex items-center justify-center p-6">
           {isFace ? (
             <div className={`w-full h-full border-2 rounded opacity-80 flex items-center justify-center relative ${skin === "neon" && isRed ? "border-pink-500/30 bg-pink-500/10" : skin === "neon" ? "border-cyan-400/30 bg-cyan-400/10" : isRed ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                {/* Stylized Face Representation */}
                <div className="text-6xl opacity-50 font-serif">
                    {rank === "K" ? "♔" : rank === "Q" ? "♕" : "Jw"}
                </div>
                <SuitIcon suit={suit} className={`absolute w-12 h-12 opacity-20 ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`} />
             </div>
           ) : isAce ? (
             <SuitIcon suit={suit} className={`w-24 h-24 ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`} />
           ) : (
             // Pips Grid - Simplified for now, just show suit count or big suit
             <div className="grid grid-cols-2 gap-1 w-full h-full content-center justify-items-center opacity-80">
                {Array.from({ length: Math.min(10, parseInt(rank) || 0) }).map((_, i) => (
                    <SuitIcon key={i} suit={suit} className={`w-5 h-5 ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`} />
                ))}
             </div>
           )}
        </div>

        {/* Bottom Right Corner (Rotated) */}
        <div className="absolute bottom-2 right-2 flex flex-col items-center leading-none rotate-180">
          <span className={`text-xl font-bold font-mono tracking-tighter ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`}>{rank}</span>
          <SuitIcon suit={suit} className={`w-4 h-4 drop-shadow-sm ${skin === "neon" && isRed ? "text-pink-500" : skin === "neon" ? "text-cyan-400" : colorClass}`} />
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`
        relative rounded-xl select-none transition-all duration-200 transform-gpu
        ${width ? "" : "w-24"} ${height ? "" : "h-36"}
        ${bgClass}
        ${borderClass}
        ${disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer hover:-translate-y-4 hover:rotate-1 hover:shadow-2xl shadow-lg"}
      `}
      style={{ 
        width, 
        height,
        boxShadow: disabled ? 'none' : skin === "neon" ? "0 0 15px rgba(139, 92, 246, 0.3)" : "0 10px 20px -5px rgba(0,0,0,0.4), 0 4px 6px -2px rgba(0,0,0,0.2)"
      }}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Texture Overlay */}
      {skin === "royal" && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-10 rounded-lg" />}
      {skin === "classic" && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-30 rounded-lg" />}
      
      {/* Content Container */}
      <div 
        className="w-full h-full relative preserve-3d transition-transform duration-500"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-xl overflow-hidden bg-white shadow-xl">
           {getFront()}
           {/* Gloss/Shine */}
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Back */}
        <div 
            className="absolute inset-0 backface-hidden rounded-xl overflow-hidden shadow-xl"
            style={{ transform: "rotateY(180deg)" }}
        >
            {getBackPattern()}
        </div>
      </div>
    </div>
  );
}
