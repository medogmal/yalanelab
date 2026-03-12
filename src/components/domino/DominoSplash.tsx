
"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function DominoSplash({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1000); // Show Logo
    const timer2 = setTimeout(() => setStep(2), 2500); // Show "Legendary"
    const timer3 = setTimeout(() => {
        onComplete();
    }, 4000); // Finish

    return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black animate-pulse" />
        
        {/* Step 1: Domino Tiles Falling */}
        {step >= 0 && (
            <motion.div 
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                className="relative z-10 flex gap-2 mb-8"
            >
                <div className="w-12 h-24 bg-white rounded border-2 border-black flex flex-col items-center justify-center shadow-[0_0_20px_white]">
                    <div className="w-3 h-3 bg-black rounded-full mb-2" />
                    <div className="w-full h-0.5 bg-black" />
                    <div className="w-3 h-3 bg-black rounded-full mt-2" />
                </div>
                <div className="w-12 h-24 bg-amber-500 rounded border-2 border-black flex flex-col items-center justify-center shadow-[0_0_20px_orange] rotate-12 mt-4">
                    <div className="w-3 h-3 bg-black rounded-full mb-2" />
                    <div className="w-3 h-3 bg-black rounded-full mb-2" />
                    <div className="w-full h-0.5 bg-black" />
                    <div className="w-3 h-3 bg-black rounded-full mt-2" />
                </div>
            </motion.div>
        )}

        {/* Step 2: Text Reveal */}
        {step >= 1 && (
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 text-center"
            >
                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
                    DOMINO
                </h1>
                <h2 className="text-2xl md:text-4xl font-bold text-white tracking-[0.5em] mt-2">
                    LEGENDS
                </h2>
            </motion.div>
        )}

        {/* Step 3: Flash */}
        {step >= 2 && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
        )}
    </div>
  );
}
