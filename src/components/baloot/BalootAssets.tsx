// BalootAssets.tsx — Assets مشتركة (AvatarFrame, suitIcon, suitColor)
import React from "react";
import Image from "next/image";
import type { Suit } from "@/lib/baloot/game";

export function suitColor(s: Suit) {
  return s === "H" || s === "D" ? "#ef4444" : "#1f2937";
}

export function suitIcon(s: Suit, w: number, h: number) {
  const c = suitColor(s);
  if (s === "H") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
  if (s === "D") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2L2 12l10 10 10-10L12 2z"/></svg>;
  if (s === "S") return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2C9 2 7 4 7 6c0 1.5 1 2.5 2 3 .5.25.5.5.5.5s-.5.5-.5.5c-2.5 1-4.5 3-4.5 5.5 0 2.5 2 4.5 4.5 4.5h6c2.5 0 4.5-2 4.5-4.5 0-2.5-2-4.5-4.5-5.5 0 0-.5-.5-.5-.5s0-.25.5-.5c1-.5 2-1.5 2-3 0-2-2-4-5-4z M12 20v3"/></svg>;
  return <svg viewBox="0 0 24 24" width={w} height={h} fill={c}><path d="M12 2c-1.5 0-3 1-3 2.5 0 .5.2 1 .5 1.5-.5 0-1 .2-1.5.5-1.5 1-2.5 2.5-2.5 4 0 2.5 2 4.5 4.5 4.5h4c2.5 0 4.5-2 4.5-4.5 0-1.5-1-3-2.5-4-.5-.3-1-.5-1.5-.5.3-.5.5-1 .5-1.5C15 3 13.5 2 12 2z M12 15v5"/></svg>;
}

interface AvatarFrameProps {
  avatar:    any;
  frame?:    any;
  size?:     "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showShine?: boolean;
}

export function AvatarFrame({ avatar, frame, size = "md", className = "", showShine = false }: AvatarFrameProps) {
  const sizeClass = { sm:"w-12 h-12", md:"w-20 h-20", lg:"w-32 h-32", xl:"w-40 h-40", "2xl":"w-56 h-56" }[size];
  return (
    <div className={`relative flex items-center justify-center ${sizeClass} ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="relative w-[68%] h-[68%] rounded-full overflow-hidden bg-black/50">
          <Image src={avatar} alt="Avatar" fill className="object-cover" unoptimized />
        </div>
      </div>
      {frame && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Image src={frame} alt="Frame" fill className="object-contain scale-110" unoptimized />
        </div>
      )}
      {showShine && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      )}
    </div>
  );
}
