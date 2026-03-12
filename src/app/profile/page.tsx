"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gamepad2, Star, TrendingUp, ArrowRight, Crown, Flame, Shield } from "lucide-react";

type UserData = {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  ratings: { chess: number; domino: number };
  tier: string;
  matchesDomino: number;
  winsDomino: number;
  lossesDomino: number;
  longestWinStreakDomino: number;
  currentWinStreakDomino: number;
  streakDays: number;
  passLevel: number;
};

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: <Star size={15} /> },
  { id: "domino",   label: "الدومينو",   icon: <Gamepad2 size={15} /> },
  { id: "stats",    label: "إحصائيات",   icon: <TrendingUp size={15} /> },
];

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          // جلب البيانات الكاملة من store
          fetch("/api/profile/full", { cache: "no-store" })
            .then(r => r.json())
            .then(full => setUser({ ...data.user, ...full }))
            .catch(() => setUser(data.user));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const winRate = user && user.matchesDomino > 0
    ? Math.round((user.winsDomino / user.matchesDomino) * 100)
    : 0;

  const xpForLevel = (lv: number) => 100 + (lv - 1) * 50;
  const xpPct = user ? Math.min(100, (user.xp / xpForLevel(user.level)) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#07090f]">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07090f] gap-6">
      <div className="text-6xl">🔒</div>
      <h2 className="text-2xl font-black text-white">سجّل دخولك أولاً</h2>
      <Link href="/auth/login" className="px-8 py-3 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-colors">
        تسجيل الدخول
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07090f] text-white" dir="rtl">
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/domino/tables/sultan.png')] bg-cover bg-center opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07090f]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-16 pb-8">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-400/20 to-orange-600/20 border-2 border-amber-400/50 flex items-center justify-center text-5xl shadow-2xl shadow-amber-400/20">
                👑
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-amber-400 to-orange-500 text-black font-black text-sm px-3 py-1 rounded-full border-2 border-[#07090f]">
                Lv.{user.level}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-black">{user.name}</h1>
                <span className="bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full capitalize">
                  {user.tier || "free"}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mt-1">{user.email}</p>

              {/* XP Bar */}
              <div className="mt-4 max-w-xs">
                <div className="flex justify-between text-[11px] text-zinc-500 mb-1 font-bold">
                  <span>XP: {user.xp}</span>
                  <span>/{xpForLevel(user.level)}</span>
                </div>
                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="hidden sm:flex flex-col gap-2 pb-2">
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-amber-400/20">
                <span>🪙</span>
                <span className="font-black text-amber-400">{(user.coins || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-purple-400/20">
                <span>💎</span>
                <span className="font-black text-purple-400">{(user.gems || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/[0.06] bg-[#07090f]/80 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-2 transition-colors ${tab === t.id
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "تصنيف الدومينو", value: user.ratings?.domino ?? 1200, color: "text-emerald-400", icon: "🁫" },
                { label: "تصنيف الشطرنج", value: user.ratings?.chess ?? 1200, color: "text-blue-400", icon: "♟️" },
                { label: "سلسلة الأيام", value: user.streakDays || 0, color: "text-orange-400", icon: "🔥" },
                { label: "مستوى البطاقة", value: user.passLevel || 1, color: "text-purple-400", icon: "👑" },
              ].map(s => (
                <div key={s.label} className="glass-dark rounded-2xl p-5 border border-white/[0.06] text-center hover:border-amber-400/20 transition-colors">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[11px] text-zinc-500 font-bold mt-1">{s.label}</div>
                </div>
              ))}

              {/* Quick links */}
              <div className="col-span-2 sm:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {[
                  { label: "العب دومينو", href: "/games/domino/online", color: "from-emerald-600 to-teal-700", icon: "🁫" },
                  { label: "العب شطرنج", href: "/games/chess/online", color: "from-blue-600 to-indigo-700", icon: "♟️" },
                  { label: "المتجر", href: "/", color: "from-amber-600 to-orange-700", icon: "🛒" },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r ${l.color} hover:brightness-110 transition-all group`}>
                    <div className="flex items-center gap-3 font-bold">{l.icon} {l.label}</div>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "domino" && (
            <motion.div key="domino" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "مجموع المباريات", value: user.matchesDomino || 0, color: "text-white", icon: <Gamepad2 size={20}/> },
                  { label: "انتصارات",       value: user.winsDomino || 0,    color: "text-emerald-400", icon: <Trophy size={20}/> },
                  { label: "خسائر",          value: user.lossesDomino || 0,  color: "text-red-400",     icon: <Shield size={20}/> },
                  { label: "نسبة الفوز",     value: `${winRate}%`,           color: "text-amber-400",   icon: <Star size={20}/> },
                ].map(s => (
                  <div key={s.label} className="glass-dark rounded-2xl p-5 border border-white/[0.06]">
                    <div className="flex items-center gap-2 text-zinc-500 mb-3">{s.icon}<span className="text-[11px] font-bold">{s.label}</span></div>
                    <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Win Rate Bar */}
              {user.matchesDomino > 0 && (
                <div className="glass-dark rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="font-black text-sm text-zinc-400 mb-4 flex items-center gap-2">
                    <TrendingUp size={15} /> نسبة الأداء
                  </h3>
                  <div className="h-4 bg-black/50 rounded-full overflow-hidden border border-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winRate}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #34d399, #f5a623)" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold mt-2">
                    <span className="text-emerald-400">{user.winsDomino || 0} فوز</span>
                    <span className="text-amber-400">{winRate}%</span>
                    <span className="text-red-400">{user.lossesDomino || 0} خسارة</span>
                  </div>
                </div>
              )}

              {/* Streaks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-dark rounded-2xl p-5 border border-amber-400/15">
                  <div className="flex items-center gap-2 text-amber-400 font-black mb-2">
                    <Flame size={18} /> أفضل سلسلة
                  </div>
                  <div className="text-4xl font-black text-amber-400">{user.longestWinStreakDomino || 0}</div>
                  <div className="text-xs text-zinc-500 mt-1">انتصارات متتالية</div>
                </div>
                <div className="glass-dark rounded-2xl p-5 border border-emerald-400/15">
                  <div className="flex items-center gap-2 text-emerald-400 font-black mb-2">
                    <Crown size={18} /> السلسلة الحالية
                  </div>
                  <div className="text-4xl font-black text-emerald-400">{user.currentWinStreakDomino || 0}</div>
                  <div className="text-xs text-zinc-500 mt-1">انتصارات متتالية الآن</div>
                </div>
              </div>

              <Link href="/games/domino/online"
                className="flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base transition-all hover:brightness-110 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #34d399, #059669)", color: "#fff", boxShadow: "0 4px 20px rgba(52,211,153,0.3)" }}>
                🁫 العب الآن
              </Link>
            </motion.div>
          )}

          {tab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <div className="glass-dark rounded-2xl p-6 border border-white/[0.06]">
                <h3 className="font-black text-base mb-6 flex items-center gap-2">
                  <Trophy size={18} className="text-amber-400" /> التصنيفات
                </h3>
                <div className="space-y-4">
                  {[
                    { game: "الدومينو", rating: user.ratings?.domino ?? 1200, icon: "🁫", color: "#34d399" },
                    { game: "الشطرنج", rating: user.ratings?.chess ?? 1200, icon: "♟️", color: "#60a5fa" },
                  ].map(g => (
                    <div key={g.game} className="flex items-center gap-4">
                      <span className="text-2xl">{g.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm font-bold mb-1">
                          <span>{g.game}</span>
                          <span style={{ color: g.color }}>{g.rating}</span>
                        </div>
                        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, ((g.rating - 1000) / 1000) * 100)}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full"
                            style={{ background: g.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-dark rounded-2xl p-6 border border-white/[0.06]">
                <h3 className="font-black text-base mb-4">معلومات الحساب</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "الاسم", value: user.name },
                    { label: "البريد الإلكتروني", value: user.email },
                    { label: "المستوى", value: `${user.level}` },
                    { label: "الباقة", value: user.tier || "free" },
                    { label: "الكوينز", value: (user.coins || 0).toLocaleString() },
                    { label: "الجواهر", value: (user.gems || 0).toLocaleString() },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-zinc-500 font-bold">{row.label}</span>
                      <span className="text-white font-bold">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
