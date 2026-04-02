"use client";
// BalootSplash.tsx — شاشة البداية + اللوبي
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { AvatarFrame } from "./BalootAssets";
import type { BalootUIPhase, GameMode } from "./BalootTypes";
import { usePlatformStore } from "@/lib/platform/store";
import frameImg from "@/img/balootimg/frame/frame.png";

interface Props {
  uiPhase:    BalootUIPhase;
  onEnterLobby: () => void;
  onSelectMode: (m: GameMode, ai: boolean) => void;
  onShowStore:  () => void;
  onShowProfile?: () => void;
}

export default function BalootSplash({ uiPhase, onEnterLobby, onSelectMode, onShowStore }: Props) {
  const { user } = usePlatformStore();

  return (
    <AnimatePresence mode="wait">
      {uiPhase === "splash" && (
        <motion.div key="splash" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} className="text-8xl mb-6">♠</motion.div>
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-8 font-serif">
            BALOOT VIP
          </h1>
          <button onClick={onEnterLobby}
            className="px-12 py-4 bg-white text-black font-bold rounded-full text-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            العب الآن
          </button>
        </motion.div>
      )}

      {uiPhase === "lobby" && (
        <motion.div key="lobby" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
          className="fixed inset-0 z-50 flex flex-col text-white overflow-hidden"
          style={{ background:"linear-gradient(135deg,#0d0a0e,#1a0f0a,#0a0d14)" }}>

          <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-white/5"
            style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(20px)" }}>
            <div className="flex items-center gap-3">
              <AvatarFrame avatar={user?.avatar || frameImg} size="sm" frame={frameImg} />
              <div>
                <div className="font-black text-sm text-white">{user?.name || "ضيف"}</div>
                <div className="text-[10px] text-amber-400 font-bold">VIP</div>
              </div>
            </div>
            <div className="text-lg font-black tracking-widest" style={{ color:"#d4af37" }}>♠ بلوت VIP ♠</div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", color:"#d4af37" }}>
                🪙 {(user?.coins ?? 0).toLocaleString()}
              </div>
            </div>
          </header>

          <div className="relative z-10 flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <motion.div whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              onClick={() => onSelectMode("classic", true)}
              className="relative rounded-3xl overflow-hidden cursor-pointer"
              style={{ height:160, background:"linear-gradient(135deg,#1a0a05,#3e1f0a,#1a0a05)", border:"2px solid rgba(212,175,55,0.4)" }}>
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <h1 className="text-3xl font-black text-white mb-2">العب بلوت</h1>
                <p className="text-sm text-white/50 mb-4">تحدى أقوى اللاعبين</p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm w-fit"
                  style={{ background:"#d4af37", color:"#000" }}>
                  العب الآن ←
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale:1.02 }} onClick={() => onSelectMode("classic", true)}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer"
                style={{ background:"linear-gradient(135deg,rgba(52,211,153,0.15),rgba(16,185,129,0.08))", border:"1px solid rgba(52,211,153,0.3)" }}>
                <div className="text-3xl">🤖</div>
                <div>
                  <div className="font-black text-sm text-white">تدريب AI</div>
                  <div className="text-[11px] text-emerald-400">كلاسيك مجاني</div>
                </div>
              </motion.div>
              <motion.div whileHover={{ scale:1.02 }} onClick={() => onSelectMode("ranked", true)}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl cursor-pointer"
                style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.15),rgba(180,140,30,0.08))", border:"1px solid rgba(212,175,55,0.3)" }}>
                <div className="text-3xl">👑</div>
                <div>
                  <div className="font-black text-sm text-white">رانكد AI</div>
                  <div className="text-[11px]" style={{ color:"#d4af37" }}>مع شخصيات</div>
                </div>
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon:"🎭", label:"الشخصيات", color:"#a78bfa", action: () => {} },
                { icon:"🛒", label:"المتجر",    color:"#34d399", action: onShowStore },
                { icon:"🏆", label:"المتصدرون", color:"#f59e0b", action: () => {} },
              ].map(item => (
                <motion.div key={item.label} whileHover={{ y:-4 }} onClick={item.action}
                  className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl cursor-pointer"
                  style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${item.color}30` }}>
                  <div className="text-3xl">{item.icon}</div>
                  <div className="text-xs font-bold" style={{ color:item.color }}>{item.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
