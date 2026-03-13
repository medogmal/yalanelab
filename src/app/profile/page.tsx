"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type UserData = {
  id: string; name: string; email: string; level: number; xp: number;
  coins: number; gems: number; ratings: { chess: number; domino: number };
  tier: string; matchesDomino: number; winsDomino: number; lossesDomino: number;
  longestWinStreakDomino: number; currentWinStreakDomino: number; streakDays: number; passLevel: number;
};

type Tab = "overview" | "domino" | "stats";

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          fetch("/api/profile/full", { cache: "no-store" })
            .then(r => r.json())
            .then(full => setUser({ ...data.user, ...full }))
            .catch(() => setUser(data.user));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const winRate = user && user.matchesDomino > 0 ? Math.round((user.winsDomino / user.matchesDomino) * 100) : 0;
  const xpForLevel = (lv: number) => 100 + (lv - 1) * 50;
  const xpPct = user ? Math.min(100, (user.xp / xpForLevel(user.level)) * 100) : 0;

  if (loading) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0c0e" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0c0c0e", gap: 16, fontFamily: "var(--font-cairo),sans-serif" }}>
      <div style={{ fontSize: 52 }}>🔒</div>
      <h2 style={{ fontWeight: 900, fontSize: 22, color: "#f4f4f8" }}>سجّل دخولك أولاً</h2>
      <Link href="/auth/login" style={{ padding: "11px 28px", borderRadius: 11, background: "#7c3aed", color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none" }}>
        تسجيل الدخول
      </Link>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">

      {/* Hero */}
      <div style={{ background: "linear-gradient(160deg, #1a0a3e 0%, #0c0c0e 100%)", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,28px) 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.15), transparent 70%)", pointerEvents: "none" }}/>

        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 22, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, paddingBottom: 24, maxWidth: 680, margin: "0 auto" }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, border: "2px solid rgba(124,58,237,0.4)" }}>
              👑
            </div>
            <div style={{ position: "absolute", bottom: -8, right: -8, padding: "3px 8px", borderRadius: 99, background: "#f59e0b", color: "#000", fontWeight: 900, fontSize: 10, border: "2px solid #0c0c0e" }}>
              Lv.{user.level}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontWeight: 900, fontSize: "clamp(18px,4vw,28px)", color: "#f4f4f8" }}>{user.name}</h1>
              <span style={{ padding: "2px 9px", borderRadius: 99, background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)", fontSize: 10, fontWeight: 800, color: "#a78bfa" }}>
                {user.tier || "free"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#7a7a8a", marginBottom: 10 }}>{user.email}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)", fontSize: 11, fontWeight: 800, color: "#f59e0b" }}>🪙 {(user.coins ?? 0).toLocaleString()}</span>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)", fontSize: 11, fontWeight: 800, color: "#a78bfa" }}>💎 {user.gems ?? 0}</span>
            </div>
            {/* XP bar */}
            <div style={{ marginTop: 10, maxWidth: 240 }}>
              <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8 }}
                  style={{ height: "100%", borderRadius: 99, background: "#7c3aed" }}/>
              </div>
              <div style={{ fontSize: 9, color: "#404050", marginTop: 2 }}>{user.xp} / {xpForLevel(user.level)} XP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(12,12,14,0.95)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 clamp(16px,4vw,28px)", display: "flex", gap: 2 }}>
          {(["overview","domino","stats"] as Tab[]).map(t => {
            const labels: Record<Tab,string> = { overview: "نظرة عامة", domino: "دومينو", stats: "إحصائيات" };
            const on = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "13px 16px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 800, fontSize: 13,
                color: on ? "#a78bfa" : "#7a7a8a",
                borderBottom: `2px solid ${on ? "#7c3aed" : "transparent"}`,
                transition: "all .15s",
              }}>{labels[t]}</button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px clamp(16px,4vw,28px) 48px" }}>
        <AnimatePresence mode="wait">

          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "دومينو",       value: user.ratings?.domino ?? 1200, icon: "🁣", color: "#f59e0b" },
                  { label: "شطرنج",        value: user.ratings?.chess  ?? 1200, icon: "♟",  color: "#8b5cf6" },
                  { label: "سلسلة الأيام", value: user.streakDays || 0,         icon: "🔥", color: "#f97316" },
                  { label: "مستوى البطاقة",value: user.passLevel  || 1,         icon: "👑", color: "#a78bfa" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "16px 12px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: s.color, marginBottom: 3 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#7a7a8a", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "▶ العب دومينو", href: "/games/domino/online", color: "#f59e0b" },
                  { label: "▶ العب شطرنج",  href: "/games/chess/online",  color: "#8b5cf6" },
                  { label: "🛒 المتجر",      href: "/",                    color: "#7c3aed" },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 13, background: "#131317", border: "1px solid rgba(255,255,255,0.05)", fontWeight: 800, fontSize: 14, color: "#f4f4f8", textDecoration: "none", transition: "border-color .15s" }}>
                    <span>{l.label}</span>
                    <span style={{ color: "#404050" }}>‹</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "domino" && (
            <motion.div key="domino" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "مجموع المباريات", value: user.matchesDomino || 0, color: "#f4f4f8" },
                  { label: "انتصارات",         value: user.winsDomino    || 0, color: "#22c55e" },
                  { label: "خسائر",            value: user.lossesDomino  || 0, color: "#ef4444" },
                  { label: "نسبة الفوز",        value: `${winRate}%`,          color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label} style={{ padding: "16px 12px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, textAlign: "center" }}>
                    <div style={{ fontWeight: 900, fontSize: 24, color: s.color, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#7a7a8a", fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {user.matchesDomino > 0 && (
                <div style={{ padding: "16px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "#7a7a8a", fontWeight: 700, marginBottom: 10 }}>نسبة الأداء</div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${winRate}%` }} transition={{ duration: 1 }}
                      style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#22c55e,#f59e0b)" }}/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, marginTop: 5 }}>
                    <span style={{ color: "#22c55e" }}>{user.winsDomino || 0} فوز</span>
                    <span style={{ color: "#f59e0b" }}>{winRate}%</span>
                    <span style={{ color: "#ef4444" }}>{user.lossesDomino || 0} خسارة</span>
                  </div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ padding: "14px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 800, marginBottom: 4 }}>🔥 أفضل سلسلة</div>
                  <div style={{ fontWeight: 900, fontSize: 28, color: "#f59e0b" }}>{user.longestWinStreakDomino || 0}</div>
                  <div style={{ fontSize: 10, color: "#7a7a8a" }}>انتصارات متتالية</div>
                </div>
                <div style={{ padding: "14px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: 14 }}>
                  <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 800, marginBottom: 4 }}>👑 الحالية</div>
                  <div style={{ fontWeight: 900, fontSize: 28, color: "#22c55e" }}>{user.currentWinStreakDomino || 0}</div>
                  <div style={{ fontSize: 10, color: "#7a7a8a" }}>انتصارات الآن</div>
                </div>
              </div>

              <Link href="/games/domino/online" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 13, background: "#f59e0b", color: "#000", fontWeight: 900, fontSize: 14, textDecoration: "none" }}>
                🁣 العب الآن
              </Link>
            </motion.div>
          )}

          {tab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ padding: "16px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#f4f4f8", marginBottom: 16 }}>التصنيفات</div>
                {[
                  { game: "الدومينو", rating: user.ratings?.domino ?? 1200, icon: "🁣", color: "#f59e0b" },
                  { game: "الشطرنج", rating: user.ratings?.chess  ?? 1200, icon: "♟",  color: "#8b5cf6" },
                ].map(g => (
                  <div key={g.game} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ color: "#c0c0cc" }}>{g.icon} {g.game}</span>
                      <span style={{ color: g.color, fontWeight: 900 }}>{g.rating}</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((g.rating - 1000) / 1000) * 100)}%` }} transition={{ duration: 0.8 }}
                        style={{ height: "100%", borderRadius: 99, background: g.color }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#f4f4f8", marginBottom: 14 }}>معلومات الحساب</div>
                {[
                  ["الاسم",            user.name],
                  ["البريد",           user.email],
                  ["المستوى",          String(user.level)],
                  ["الباقة",           user.tier || "free"],
                  ["الكوينز",          (user.coins || 0).toLocaleString()],
                  ["الجواهر",          String(user.gems || 0)],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13 }}>
                    <span style={{ color: "#7a7a8a", fontWeight: 600 }}>{label}</span>
                    <span style={{ color: "#f4f4f8", fontWeight: 800 }}>{val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
