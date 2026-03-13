"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow]     = useState(false);
  const [isIOS, setIsIOS]   = useState(false);
  const [done, setDone]     = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("pwa-dismissed")) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) { setTimeout(() => setShow(true), 5000); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShow(false); setDone(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  }

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setPrompt(null);
  }

  if (done) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          dir="rtl"
          style={{
            position: "fixed",
            bottom: "calc(80px + env(safe-area-inset-bottom))",
            left: 12, right: 12,
            zIndex: 200,
            borderRadius: 18,
            padding: "14px 16px",
            display: "flex", alignItems: "center", gap: 12,
            background: "rgba(19,19,23,0.97)",
            border: "1px solid rgba(124,58,237,0.25)",
            backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
          }}
        >
          {/* App icon */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, fontWeight: 900, color: "#fff",
          }}>ي</div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, color: "#f4f4f8", fontSize: 13 }}>
              ثبّت يالا نلعب 📲
            </div>
            {isIOS ? (
              <div style={{ fontSize: 11, color: "#7a7a8a", marginTop: 2, fontWeight: 600 }}>
                اضغط ⬆️ ثم <strong style={{ color: "#c0c0cc" }}>أضف للشاشة الرئيسية</strong>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#7a7a8a", marginTop: 2, fontWeight: 600 }}>
                تطبيق كامل — يعمل بدون إنترنت
              </div>
            )}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isIOS && prompt && (
              <button onClick={install} style={{
                padding: "7px 14px", borderRadius: 9, fontWeight: 900, fontSize: 12,
                color: "#fff", background: "#7c3aed",
                border: "none", cursor: "pointer", fontFamily: "inherit",
                transition: "filter .15s",
              }}>
                ثبّت
              </button>
            )}
            <button onClick={dismiss} style={{
              width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#7a7a8a", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "inherit",
            }}>✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
