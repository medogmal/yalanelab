"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePlatformStore } from "@/lib/platform/store";
import { ALL_MOODS, type CulturalMood } from "@/lib/platform/cultural-themes";

export default function MoodSwitcher() {
  const { culturalMood, setCulturalMood } = usePlatformStore();
  const [open, setOpen] = useState(false);
  const current = ALL_MOODS.find(m => m.id === culturalMood) ?? ALL_MOODS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2 lg:px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all text-sm group"
        dir="rtl"
      >
        <span className="text-xl flex-shrink-0">{current.flag}</span>
        <span className="hidden lg:block flex-1 text-right text-slate-400 font-bold group-hover:text-white transition-colors truncate">
          {current.nameAr}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="hidden lg:block text-slate-600 text-xs">▼</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden z-50"
            style={{
              background: "rgba(10,14,24,0.97)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="p-2">
              <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-2 py-1.5 mb-1">
                اختر أجواء بلدك
              </div>
              {ALL_MOODS.map((mood) => {
                const isActive = mood.id === culturalMood;
                return (
                  <button
                    key={mood.id}
                    onClick={() => { setCulturalMood(mood.id as CulturalMood); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-right hover:bg-white/[0.05]"
                    style={{
                      background: isActive ? `${mood.colors.felt}99` : "transparent",
                      border: isActive ? `1px solid ${mood.colors.border}` : "1px solid transparent",
                    }}
                  >
                    <span className="text-xl">{mood.flag}</span>
                    <div className="flex-1 text-right">
                      <div className={`font-black text-sm ${isActive ? "text-white" : "text-slate-400"}`}>{mood.nameAr}</div>
                      <div className="text-[10px] text-slate-600">{mood.visual.ornamentName}</div>
                    </div>
                    {isActive && <span className="text-amber-400 text-xs font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
