"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePlatformStore } from "@/lib/platform/store";
import { CULTURAL_THEMES, type CulturalMood } from "@/lib/platform/cultural-themes";

const MOODS: { id: CulturalMood; flag: string; nameAr: string; color: string }[] = [
  { id: "saudi",   flag: "🇸🇦", nameAr: "السلطان", color: "#0a3d25" },
  { id: "egyptian",flag: "🇪🇬", nameAr: "النيل",   color: "#0d3348" },
  { id: "yemeni",  flag: "🇾🇪", nameAr: "عدن",     color: "#1a0e05" },
  { id: "classic", flag: "🎮", nameAr: "كلاسيك",  color: "#07090f" },
];

interface MoodSwitcherProps {
  collapsed?: boolean; // في الـ sidebar الصغير
}

export default function MoodSwitcher({ collapsed = false }: MoodSwitcherProps) {
  const { culturalMood, setCulturalMood } = usePlatformStore();
  const [open, setOpen] = useState(false);
  const current = MOODS.find(m => m.id === culturalMood) || MOODS[0];

  return (
    <div className="relative">
      {/* الزرار الرئيسي */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-2 lg:px-3 py-2.5 rounded-xl
                   hover:bg-white/[0.06] transition-all text-sm group"
        style={{ direction: "rtl" }}
      >
        <span className="text-xl flex-shrink-0">{current.flag}</span>
        {!collapsed && (
          <span className="hidden lg:block flex-1 text-right text-slate-400 font-bold group-hover:text-white transition-colors truncate">
            {current.nameAr}
          </span>
        )}
        {!collapsed && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            className="hidden lg:block text-slate-600 text-xs"
          >▼</motion.span>
        )}
      </button>

      {/* القائمة المنسدلة */}
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
                اختر الأجواء
              </div>
              {MOODS.map((mood) => {
                const isActive = mood.id === culturalMood;
                return (
                  <button
                    key={mood.id}
                    onClick={() => { setCulturalMood(mood.id); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right"
                    style={{
                      background: isActive ? `${mood.color}aa` : "transparent",
                      border: isActive ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
                    }}
                  >
                    <span className="text-xl">{mood.flag}</span>
                    <div className="flex-1 text-right">
                      <div className={`font-black text-sm ${isActive ? "text-white" : "text-slate-400"}`}>
                        {mood.nameAr}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-amber-400 text-xs font-black">✓</span>
                    )}
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
