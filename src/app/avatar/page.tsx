"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ══════════════════════════════════════════════════════════════
   YALA WORLD — Avaturn Integration
   كل لاعب يعمل avatar واقعي 3D + تغيير ملابس وشعر وكل حاجة
   يتحفظ في الـ DB ويتزامن مع Unity
══════════════════════════════════════════════════════════════ */

export default function AvatarPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playerName, setPlayerName] = useState("لاعب");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // جلب الـ avatar المحفوظ
  useEffect(() => {
    fetch("/api/avatar")
      .then(r => r.json())
      .then(d => {
        if (d.avatarUrl)  setAvatarUrl(d.avatarUrl);
        if (d.playerName) setPlayerName(d.playerName);
      })
      .catch(() => {});
  }, []);

  // فتح Avaturn editor
  async function openEditor() {
    setLoading(true);
    try {
      const res = await fetch("/api/avatar/session", { method: "POST" });
      const data = await res.json();
      if (data.url) setSessionUrl(data.url);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // استقبال الـ avatar من Avaturn iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        // Avaturn بيبعت الـ GLB URL بعد الحفظ
        if (msg.eventName === "v1.avatar.exported" || msg.source === "avaturn") {
          const url = msg.data?.url || msg.avatarUrl;
          if (url) {
            handleAvatarExported(url);
          }
        }
      } catch {}
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playerName]);

  async function handleAvatarExported(url: string) {
    setAvatarUrl(url);
    setSessionUrl(null);
    // حفظ في الـ DB
    await fetch("/api/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: url, playerName }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#07090f",
      color: "#fff",
      fontFamily: "var(--font-cairo), sans-serif",
      direction: "rtl",
    }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px clamp(14px,4vw,28px)",
        background: "rgba(7,9,15,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(99,102,241,0.2)",
      }}>
        <Link href="/profile" style={{
          padding: "7px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.6)", textDecoration: "none",
        }}>← رجوع</Link>

        <div style={{ fontWeight: 900, fontSize: 16, background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🎭 شخصيتك في عالم يالا
        </div>

        {saved && (
          <div style={{ padding: "7px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
            ✓ تم الحفظ!
          </div>
        )}
      </header>

      {/* Avaturn iframe — يفتح لما اللاعب يضغط "إنشاء أو تعديل" */}
      <AnimatePresence>
        {sessionUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "#000",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* زرار إغلاق */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 20px",
              background: "rgba(7,9,15,0.98)",
              borderBottom: "1px solid rgba(99,102,241,0.2)",
            }}>
              <div style={{ fontWeight: 900, fontSize: 14, color: "#a78bfa" }}>
                🎭 صمّم شخصيتك — غيّر الملابس، الشعر، الجسم، كل حاجة!
              </div>
              <button
                onClick={() => setSessionUrl(null)}
                style={{
                  padding: "6px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800,
                  background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#f87171", cursor: "pointer", fontFamily: "inherit",
                }}
              >✕ إغلاق</button>
            </div>

            {/* Avaturn iframe */}
            <iframe
              ref={iframeRef}
              src={sessionUrl}
              allow="camera *; microphone *"
              style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
              title="Avaturn Avatar Creator"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px clamp(14px,4vw,24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
      }}>
        {/* Preview الأفاتار */}
        <div style={{
          width: "100%", maxWidth: 400,
          borderRadius: 24,
          background: "radial-gradient(ellipse at 50% 30%, #1a1035, #070916)",
          border: "1px solid rgba(99,102,241,0.25)",
          overflow: "hidden",
          aspectRatio: "3/4",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          {avatarUrl ? (
            /* عرض الأفاتار كـ 3D render من Avaturn */
            <img
              src={`https://models.avaturn.me/${avatarUrl.split("/").pop()?.replace(".glb","")}.png?scene=fullbody-portrait-v1-transparent`}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                // لو الصورة ما حملتش، نعرض placeholder
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 80, marginBottom: 16 }}>🧑‍🦱</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                مفيش شخصية لسه
              </div>
            </div>
          )}

          {/* Badge */}
          {avatarUrl && (
            <div style={{
              position: "absolute", bottom: 16, right: 16,
              background: "rgba(34,197,94,0.9)", borderRadius: 99,
              padding: "4px 12px", fontSize: 11, fontWeight: 800, color: "#fff",
            }}>✓ جاهز</div>
          )}
        </div>

        {/* اسم اللاعب */}
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(99,102,241,0.8)", marginBottom: 8 }}>
            اسمك في اللعبة
          </div>
          <input
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder="ادخل اسمك..."
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(99,102,241,0.3)",
              color: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* زرار إنشاء/تعديل */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={openEditor}
          disabled={loading}
          style={{
            width: "100%", maxWidth: 400,
            padding: "16px", borderRadius: 16, fontSize: 16, fontWeight: 900,
            background: loading
              ? "rgba(99,102,241,0.3)"
              : "linear-gradient(135deg,#6366f1,#a855f7)",
            color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: loading ? "none" : "0 8px 32px rgba(99,102,241,0.4)",
          }}
        >
          {loading ? "⏳ جاري التحميل..." : avatarUrl ? "✏️ تعديل شخصيتك" : "🚀 إنشاء شخصيتك الآن"}
        </motion.button>

        {/* معلومات */}
        <div style={{
          width: "100%", maxWidth: 400,
          background: "rgba(99,102,241,0.08)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 16, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10, color: "#a78bfa" }}>
            ✨ إيه اللي تقدر تخصصه؟
          </div>
          {[
            "🧑 شكل الوجه والبشرة",
            "💇 الشعر والأستايل",
            "👕 الملابس الكاملة",
            "👟 الأحذية والإكسسوارات",
            "💪 شكل الجسم",
            "🕶️ النظارات والإضافات",
          ].map(item => (
            <div key={item} style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
              {item}
            </div>
          ))}
        </div>

        {/* لو في avatar محفوظ — زرار حفظ الاسم */}
        {avatarUrl && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={async () => {
              await fetch("/api/avatar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl, playerName }),
              });
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }}
            style={{
              width: "100%", maxWidth: 400,
              padding: "12px", borderRadius: 14, fontSize: 13, fontWeight: 900,
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            💾 حفظ الاسم
          </motion.button>
        )}
      </main>
    </div>
  );
}
