"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: "🎨", title: "سكنات حصرية", desc: "سكنات دومينو وشطرنج غير متاحة للمجانيين" },
  { icon: "📊", title: "تحليل متقدم", desc: "تحليل مباريات أعمق بمحرك Stockfish" },
  { icon: "👑", title: "شارة المميز", desc: "شارة خاصة بجانب اسمك في كل الألعاب" },
  { icon: "🎯", title: "أولوية المباريات", desc: "انتظار أقل وتوصيل أسرع للمباريات" },
  { icon: "🛡", title: "غرف خاصة", desc: "أنشئ غرف مخصصة مع أصدقائك" },
  { icon: "📈", title: "إحصائيات مفصلة", desc: "رؤية كاملة لأدائك عبر الزمن" },
];

export default function PlusPage() {
  const [tier, setTier]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(d => setTier(d.user?.tier || "free"));
  }, []);

  async function upgrade() {
    setLoading(true); setMsg(null);
    const res = await fetch("/api/subscriptions/upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier: "pro" }) });
    if (res.ok) { setTier("pro"); setMsg("تم الترقية بنجاح! 🎉"); }
    else setMsg("حدث خطأ، حاول مرة أخرى");
    setLoading(false); setTimeout(() => setMsg(null), 3000);
  }

  async function cancel() {
    setLoading(true);
    const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
    if (res.ok) { setTier("free"); setMsg("تم الإلغاء"); }
    setLoading(false); setTimeout(() => setMsg(null), 3000);
  }

  const isPro = tier === "pro";

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "clamp(32px,5vw,60px) clamp(16px,4vw,28px) 48px" }}>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 28, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 99, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em" }}>YALANELAB PLUS</span>
          </div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(28px,6vw,48px)", color: "#f4f4f8", marginBottom: 10 }}>
            ارفع مستواك
          </h1>
          <p style={{ fontSize: "clamp(13px,1.6vw,15px)", color: "#7a7a8a", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
            احصل على سكنات حصرية، تحليل متقدم، وامتيازات لا تُحصى في كل الألعاب.
          </p>
        </div>

        {/* Current status */}
        {tier && (
          <div style={{ padding: "14px 16px", borderRadius: 14, marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", background: isPro ? "rgba(124,58,237,0.08)" : "#131317", border: `1px solid ${isPro ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.07)"}` }}>
            <span style={{ fontSize: 13, color: "#7a7a8a", fontWeight: 600 }}>باقتك الحالية</span>
            <span style={{ padding: "3px 12px", borderRadius: 99, background: isPro ? "#7c3aed" : "#1e1e25", color: isPro ? "#fff" : "#7a7a8a", fontWeight: 800, fontSize: 12 }}>
              {isPro ? "👑 Plus" : "مجاني"}
            </span>
          </div>
        )}

        {/* Features grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 32 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ padding: "16px 14px", background: "#131317", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#f4f4f8", marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "#7a7a8a", lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Pricing card */}
        <div style={{ padding: "28px 24px", borderRadius: 20, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)", textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: "#a78bfa", marginBottom: 8, letterSpacing: "0.08em" }}>PLUS PLAN</div>
          <div style={{ fontWeight: 900, fontSize: 42, color: "#f4f4f8", marginBottom: 4 }}>
            9.99 <span style={{ fontSize: 16, color: "#7a7a8a", fontWeight: 600 }}>$/شهر</span>
          </div>
          <div style={{ fontSize: 12, color: "#7a7a8a", marginBottom: 24 }}>يمكن الإلغاء في أي وقت</div>

          {msg && <div style={{ padding: "8px 14px", borderRadius: 10, marginBottom: 16, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontWeight: 700, fontSize: 13 }}>{msg}</div>}

          {!isPro ? (
            <button onClick={upgrade} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading ? "rgba(124,58,237,0.4)" : "#7c3aed", color: "#fff", fontWeight: 900, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
              {loading ? "جاري..." : "ترقية الآن →"}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ padding: "12px", borderRadius: 11, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontWeight: 800, fontSize: 14 }}>
                ✅ أنت عضو Plus بالفعل
              </div>
              <button onClick={cancel} disabled={loading} style={{ width: "100%", padding: "11px", borderRadius: 11, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#7a7a8a", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                إلغاء الاشتراك
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
