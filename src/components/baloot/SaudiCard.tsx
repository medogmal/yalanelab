 "use client";
 import React from "react";
 import type { Suit } from "@/lib/baloot/game";
 
 export type SaudiCardProps = {
   suit: Suit;
   rank: "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
   width?: number;
   height?: number;
   showCorners?: boolean;
   premium?: boolean;
   trump?: Suit | null;
 };
 
 function suitColor(s: Suit) {
   if (s === "H") return "#ef4444";
   if (s === "D") return "#f59e0b";
   if (s === "S") return "#22d3ee";
   return "#22c55e";
 }
 
 function suitIcon(s: Suit, w: number, h: number) {
   const c = suitColor(s);
   if (s === "H")
     return <path d={`M ${w/2} ${h*0.70} C ${w*0.88} ${h*0.42}, ${w*0.96} ${h*0.18}, ${w*0.72} ${h*0.12} C ${w*0.58} ${h*0.08}, ${w*0.50} ${h*0.14}, ${w/2} ${h*0.24} C ${w*0.50} ${h*0.14}, ${w*0.42} ${h*0.08}, ${w*0.28} ${h*0.12} C ${w*0.04} ${h*0.18}, ${w*0.12} ${h*0.42}, ${w/2} ${h*0.70} Z`} fill={c} />;
   if (s === "D")
     return <path d={`M ${w/2} ${h*0.10} L ${w*0.90} ${h*0.50} L ${w/2} ${h*0.90} L ${w*0.10} ${h*0.50} Z`} fill={c} />;
   if (s === "S")
     return <path d={`M ${w/2} ${h*0.12} C ${w*0.88} ${h*0.42}, ${w*0.96} ${h*0.66}, ${w*0.72} ${h*0.72} C ${w*0.58} ${h*0.76}, ${w*0.50} ${h*0.70}, ${w/2} ${h*0.60} C ${w*0.50} ${h*0.70}, ${w*0.42} ${h*0.76}, ${w*0.28} ${h*0.72} C ${w*0.04} ${h*0.66}, ${w*0.12} ${h*0.42}, ${w/2} ${h*0.12} Z`} fill={c} />;
   return <path d={`M ${w/2} ${h*0.86} C ${w*0.86} ${h*0.86}, ${w*0.92} ${h*0.56}, ${w/2} ${h*0.28} C ${w*0.08} ${h*0.56}, ${w*0.14} ${h*0.86}, ${w/2} ${h*0.86} Z`} fill={c} />;
 }
 
 export default function SaudiCardSVG({ suit, rank, width = 256, height = 384, showCorners = true, premium = true, trump = null }: SaudiCardProps) {
   const w = width;
   const h = height;
   const cornerW = Math.round(w * 0.16);
   const cornerH = Math.round(h * 0.16);
   return (
     <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`${rank}${suit}`}>
       <defs>
         <linearGradient id="cardBaseGrad" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stopColor={premium ? "#ffffff" : "#f3f4f6"} />
           <stop offset="1" stopColor={premium ? "#ececec" : "#e5e7eb"} />
         </linearGradient>
         <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
           <stop offset="0" stopColor="#f6d365" />
           <stop offset="1" stopColor="#fda085" />
         </linearGradient>
          <linearGradient id="highlightGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
         <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
           <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="rgba(0,0,0,0.45)" />
         </filter>
       </defs>
       <rect x={0} y={0} width={w} height={h} rx={Math.max(12, Math.round(w*0.05))} fill="url(#cardBaseGrad)" filter="url(#softShadow)" />
       <rect x={16} y={16} width={w-32} height={h-32} rx={Math.max(10, Math.round(w*0.04))} fill="none" stroke="#006C35" strokeWidth={Math.max(4, Math.round(w*0.01))} />
       <rect x={Math.max(28, Math.round(w*0.06))} y={Math.max(28, Math.round(w*0.06))} width={w - Math.max(56, Math.round(w*0.12))} height={h - Math.max(56, Math.round(w*0.12))} rx={Math.max(8, Math.round(w*0.035))} fill="none" stroke={premium && trump && suit === trump ? "url(#goldGrad)" : "#cda85a"} strokeWidth={Math.max(2, Math.round(w*0.006))} />
       <g transform={`translate(${w/2},${h/2})`}>
         {suitIcon(suit, w*0.55, h*0.55)}
       </g>
       <text x={16} y={28} fontSize={Math.max(18, Math.round(w*0.08))} fill={suitColor(suit)} fontWeight={700}>{rank}</text>
       <text x={w-16} y={h-16} fontSize={Math.max(18, Math.round(w*0.08))} fill={suitColor(suit)} fontWeight={700} textAnchor="end">{rank}</text>
        <path d={`M ${w*0.05} ${h*0.25} L ${w*0.65} ${h*0.02} L ${w*0.95} ${h*0.40} L ${w*0.35} ${h*0.63} Z`} fill="url(#highlightGrad)" opacity="0.25" />
       {showCorners && (
         <>
           <g transform={`translate(${Math.round(w*0.07)},${Math.round(h*0.07)})`}>
             {suitIcon(suit, cornerW, cornerH)}
           </g>
           <g transform={`translate(${w - Math.round(w*0.07) - cornerW},${h - Math.round(h*0.07) - cornerH}) rotate(180 ${cornerW/2} ${cornerH/2})`}>
             {suitIcon(suit, cornerW, cornerH)}
           </g>
         </>
       )}
     </svg>
   );
 }
