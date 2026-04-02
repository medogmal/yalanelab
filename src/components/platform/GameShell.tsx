 "use client";
import React from "react";
 import GameWrapper from "./GameWrapper";
 import { AnimatePresence, motion } from "framer-motion";
 
 type Screen = { id: string; label: string; element: React.ReactNode };
 
export default function GameShell({ title, screens, initialScreenId, autoStart = true }: { title: string; screens: Screen[]; initialScreenId?: string; autoStart?: boolean }) {
  const [started, setStarted] = React.useState<boolean>(autoStart);
  const [screenId, setScreenId] = React.useState<string | null>(initialScreenId || null);
  const [navOpen, setNavOpen] = React.useState(false);
  function start() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    setStarted(true);
  }
 const current = screens.find((s) => s.id === screenId) || null;
  return (
    <GameWrapper className="min-h-screen" showGrid={false}>
      <div className="mx-auto max-w-7xl px-4 py-8 relative">
        <AnimatePresence>
          {!started && !autoStart && (
            <motion.div
              className="absolute inset-0 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="fixed inset-0 backdrop-blur-md bg-black/40" />
              <motion.div
                className="rounded-xl p-6 bg-zinc-900 text-white shadow-xl flex flex-col items-center gap-4 card-glow"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
              >
                <div className="text-2xl font-bold">{title}</div>
                <button className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onClick={start}>تشغيل الآن</button>
              </motion.div>
            </motion.div>
          )}
          {started && !current && (
            <div className="absolute inset-0 z-30 flex items-start justify-center pt-12">
              <motion.div
                className="rounded-xl p-6 bg-zinc-900 text-white shadow-xl card-glow min-w-[320px]"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
              >
                <div className="text-lg font-semibold mb-4">القائمة الرئيسية</div>
                <div className="grid grid-cols-1 gap-3">
                  {screens.map((s) => (
                    <button key={s.id} className="px-3 py-2 rounded btn-neon" onClick={() => setScreenId(s.id)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {started && current && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-silver">{title}</div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded bg-zinc-800 text-white" onClick={() => setNavOpen(true)}>☰</button>
              <button
                className="px-3 py-2 rounded bg-zinc-800 text-white"
                onClick={() => {
                  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
                  else document.documentElement.requestFullscreen?.().catch(() => {});
                }}
              >
                وضع الشاشة
              </button>
            </div>
          </div>
        )}
        {started && current && <div>{current.element}</div>}
        <AnimatePresence>
          {started && navOpen && (
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-40 w-[320px]"
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
            >
              <div className="h-full rounded-l-xl p-4 bg-zinc-900 text-white shadow-xl card-glow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">القائمة</div>
                  <button className="px-2 py-1 rounded bg-zinc-800 text-white" onClick={() => setNavOpen(false)}>إغلاق</button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {screens.map((s) => (
                    <button
                      key={s.id}
                      className="px-3 py-2 rounded btn-neon"
                      onClick={() => {
                        setScreenId(s.id);
                        setNavOpen(false);
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameWrapper>
  );
}
