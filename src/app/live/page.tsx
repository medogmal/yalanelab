"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ChatRoom from "@/components/ChatRoom";

type StreamConfig = { url: string | null; prerollSeconds: number; adUrl: string | null };

export default function LivePage() {
  const [cfg, setCfg] = useState<StreamConfig>({ url: null, prerollSeconds: 5, adUrl: null });
  const [showAd, setShowAd] = useState(true);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    fetch("/api/stream").then(r => r.json()).then(setCfg);
  }, []);

  useEffect(() => {
    if (!cfg.url) return;
    setLeft(cfg.prerollSeconds);
    setShowAd(true);
    const id = setInterval(() => {
      setLeft(x => {
        if (x <= 1) { clearInterval(id); setShowAd(false); return 0; }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cfg.url, cfg.prerollSeconds]);

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,28px) 48px" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 22, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(20px,4vw,28px)", color: "#f4f4f8" }}>البث المباشر</h1>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 10, fontWeight: 800, color: "#ef4444" }}>
            <span style={{ width: 5, height: 5, background: "#ef4444", borderRadius: "50%", animation: "blink 1.5s ease-in-out infinite", display: "inline-block" }}/>
            LIVE
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) minmax(280px,1fr)", gap: 16 }}>
          {/* Video */}
          <div style={{ borderRadius: 18, overflow: "hidden", background: "#0e0e12", border: "1px solid rgba(255,255,255,0.07)", position: "relative", aspectRatio: "16/9" }}>
            {cfg.url ? (
              <>
                {showAd && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#7a7a8a", marginBottom: 4 }}>إعلان ما قبل البث</div>
                    {cfg.adUrl
                      ? <video src={cfg.adUrl} autoPlay muted style={{ width: "70%", borderRadius: 12 }}/>
                      : <div style={{ padding: "16px 32px", borderRadius: 12, background: "#131317", border: "1px solid rgba(255,255,255,0.07)", color: "#7a7a8a", fontWeight: 700, fontSize: 13 }}>مساحة إعلان</div>
                    }
                    <div style={{ fontSize: 12, color: "#7a7a8a", fontWeight: 700 }}>يبدأ البث خلال <span style={{ color: "#f4f4f8", fontWeight: 900 }}>{left}</span> ثانية</div>
                  </div>
                )}
                <iframe src={cfg.url} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media"/>
              </>
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 44 }}>📺</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#f4f4f8" }}>لا يوجد بث الآن</div>
                <div style={{ fontSize: 13, color: "#7a7a8a" }}>تابعنا لاحقاً</div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div style={{ borderRadius: 18, overflow: "hidden", background: "#0e0e12", border: "1px solid rgba(255,255,255,0.07)", minHeight: 300 }}>
            <ChatRoom room="live"/>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
