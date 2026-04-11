"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import DominoTileV2 from "./DominoTileV2";

interface DominoSplashV2Props {
  onComplete: () => void;
}

export default function DominoSplashV2({ onComplete }: DominoSplashV2Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2800);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#07090f" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* قطعتان بتتساقطان وتتقابلان */}
      <div className="relative flex items-center justify-center mb-6" style={{ height: 100 }}>
        <motion.div
          initial={{ x: -80, y: -60, opacity: 0, rotate: -20 }}
          animate={{ x: -22, y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
        >
          <DominoTileV2 a={6} b={6} orientation="vertical" state="normal" size="lg" />
        </motion.div>
        <motion.div
          initial={{ x: 80, y: -60, opacity: 0, rotate: 20 }}
          animate={{ x: 22, y: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.2 }}
        >
          <DominoTileV2 a={6} b={6} orientation="vertical" state="normal" size="lg" />
        </motion.div>
      </div>

      {/* اسم اللعبة */}
      <motion.h1
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18, delay: 0.55 }}
        className="text-4xl font-black tracking-widest"
        style={{ color: "#e8e0ff", textShadow: "0 0 40px rgba(139,92,246,0.6)" }}
      >
        DOMINO
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="text-white/30 text-sm mt-2 tracking-widest"
      >
        يالا نلعب
      </motion.p>

      {/* Flash أبيض قبل الانتهاء */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 0.4, delay: 2.4, times: [0, 0.7, 0.85, 1] }}
      />
    </motion.div>
  );
}
