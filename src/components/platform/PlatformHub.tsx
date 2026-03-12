"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlatformStore } from "@/lib/platform/store";
import { TRANSLATIONS } from "@/lib/platform/translations";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, ShoppingBag, MessageCircle, User, Bell,
  Trophy, Crown, Globe, Video, Play, Zap, ChevronRight,
  Flame, Search, Star, Swords
} from "lucide-react";
import UnifiedStore from "@/components/platform/UnifiedStore";
import CommunityChat from "@/components/platform/CommunityChat";
import ProfileView from "@/components/profile/ProfileView";
import MoodSwitcher from "@/components/platform/MoodSwitcher";
import { getTheme } from "@/lib/platform/cultural-themes";

/* ─── GAMES CONFIG ──────────────────────────────────────────── */
const GAMES = [
  {
    id: "domino",
    title: "الدومينو",
    href: "/games/domino/online",
    bg: "/domino/tables/sultan.png",
    color: "#00ff87",
    shadow: "rgba(0,255,135,0.35)",
    players: "12,400",
    hot: true,
    tag: "الأكثر لعباً",
  },
  {
    id: "baloot",
    title: "البلوت",
    href: "/games/baloot/online",
    bg: "/domino/tables/egyptian.png",
    color: "#f87171",
    shadow: "rgba(248,113,113,0.35)",
    players: "8,200",
    hot: true,
    tag: "🔥 تريند",
  },
  {
    id: "chess",
    title: "الشطرنج",
    href: "/games/chess/online",
    bg: "/domino/tables/turkish.png",
    color: "#a78bfa",
    shadow: "rgba(167,139,250,0.35)",
    players: "4,100",
    tag: "كلاسيك",
  },
  {
    id: "ludo",
    title: "اللودو",
    href: "/games/ludo/online",
    bg: "/domino/tables/desert.png",
    color: "#60a5fa",
    shadow: "rgba(96,165,250,0.35)",
    players: "3,700",
    tag: "عائلي",
  },
];

const EMOJIS: Record<string, string> = {
  domino: "🁣", baloot: "🃏", chess: "♟️", ludo: "🎲",
};

type Tab = "games" | "store" | "chat" | "profile" | "live";

/* ═══════════════════════════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function PlatformHub() {
  const { user, language, setLanguage, culturalMood } = usePlatformStore();
  const [activeTab, setActiveTab] = useState<Tab>("games");
  const [mounted, setMounted] = useState(false);
  const t = TRANSLATIONS[language];
  const theme = getTheme(culturalMood);

  useEffect(() => {
    setMounted(true);
    const tab = new URLSearchParams(window.location.search).get("tab") as Tab;
    if (tab) setActiveTab(tab);
  }, []);

  return (
    <div className="min-h-dvh text-white flex flex-col md:flex-row" dir="rtl"
      style={{ background: theme.colors.primary, transition: "background 0.6s ease" }}>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-dark border-t border-white/[0.07] flex items-end justify-around px-1 pt-2" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        {([ 
          { tab: "games",   icon: <Gamepad2   size={22}/>, label: "الألعاب"  },
          { tab: "live",    icon: <Video      size={22}/>, label: "مباشر"    },
          { tab: "store",   icon: <ShoppingBag size={22}/>, label: "المتجر"  },
          { tab: "profile", icon: <User       size={22}/>, label: "حسابي"   },
        ] as const).map(({ tab, icon, label }) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all
              ${activeTab === tab ? "text-amber-400" : "text-slate-500"}`}>
            <span className={`transition-transform ${activeTab === tab ? "scale-110" : ""}`}>{icon}</span>
            <span className="text-[10px] font-black">{label}</span>
          </button>
        ))}
      </nav>

      {/* ══ DESKTOP SIDEBAR ══ */}
      <aside className="hidden md:flex w-16 lg:w-60 flex-col glass-dark border-l border-white/[0.06] p-3 sticky top-0 h-dvh overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-2 py-3 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
            <Gamepad2 size={20} className="text-black" />
          </div>
          <div className="hidden lg:block">
            <div className="font-black text-base gold-shimmer leading-none">يالا نلعب</div>
            <div className="text-[10px] text-slate-600 font-bold tracking-widest uppercase mt-0.5">Gaming Platform</div>
          </div>
        </Link>

        {/* Nav */}
        <div className="space-y-1 flex-1">
          {([
            { tab: "games",   icon: <Gamepad2    size={18}/>, label: "الألعاب",  badge: null },
            { tab: "live",    icon: <Video       size={18}/>, label: "مباشر",    badge: "LIVE" },
            { tab: "store",   icon: <ShoppingBag size={18}/>, label: "المتجر",   badge: null },
            { tab: "chat",    icon: <MessageCircle size={18}/>, label: "الدردشة", badge: "9+" },
            { tab: "profile", icon: <User        size={18}/>, label: "حسابي",    badge: null },
          ] as const).map(({ tab, icon, label, badge }) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-xl transition-all text-sm group relative
                ${activeTab === tab
                  ? "bg-amber-400/15 text-amber-400 font-black border border-amber-400/20"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-white font-medium"}`}>
              <span className={`flex-shrink-0 transition-transform ${activeTab === tab ? "scale-110" : "group-hover:scale-110"}`}>
                {icon}
              </span>
              <span className="hidden lg:block flex-1 text-right truncate">{label}</span>
              {badge && (
                <span className={`hidden lg:block text-[9px] font-black px-1.5 py-0.5 rounded-md
                  ${tab === "live" ? "bg-red-500 text-white" : "bg-indigo-500 text-white"}`}>
                  {badge}
                </span>
              )}
              {/* Active left bar */}
              {activeTab === tab && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-amber-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom */}
        <div className="space-y-3 pt-3 border-t border-white/[0.06]">
          {/* اختيار المود الثقافي */}
          <MoodSwitcher />
          <button onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all text-sm">
            <Globe size={17} className="flex-shrink-0" />
            <span className="hidden lg:block">{language === "ar" ? "English" : "العربية"}</span>
          </button>

          {/* XP bar */}
          {mounted && (
            <div className="hidden lg:block px-1">
              <div className="flex justify-between text-[10px] mb-1.5">
                <span className="text-slate-600 font-bold">المستوى {user?.level ?? 1}</span>
                <span className="text-amber-400 font-black">+320 XP</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ══ MAIN AREA ══ */}
      <main className="flex-1 flex flex-col min-h-dvh overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 glass-dark border-b border-white/[0.06] flex items-center justify-between px-3 md:px-6 flex-shrink-0 sticky top-0 z-30">
          {/* Search */}
          <div className="relative hidden md:block w-64 lg:w-80">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
            <input placeholder="ابحث..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-amber-400/30 text-slate-300 placeholder:text-slate-600 transition-all" />
          </div>

          <div className="flex items-center gap-2 mr-auto">
            {/* Wallet */}
            {mounted && (
              <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-xl text-sm font-black hidden sm:flex">
                <span className="text-amber-400 flex items-center gap-1">🪙 <span suppressHydrationWarning>{user?.coins?.toLocaleString() ?? 0}</span></span>
                <div className="w-px h-3.5 bg-white/[0.08]" />
                <span className="text-purple-400 flex items-center gap-1">💎 <span suppressHydrationWarning>{user?.gems?.toLocaleString() ?? 0}</span></span>
              </div>
            )}
            {/* Bell */}
            <button className="relative p-2 rounded-xl hover:bg-white/[0.06] transition-colors">
              <Bell size={17} className="text-slate-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#07090f] animate-pulse" />
            </button>
            {/* Avatar */}
            {mounted && (
              <div className="flex items-center gap-2">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-black leading-none">{user?.name ?? "لاعب"}</div>
                  <div className="text-[10px] text-amber-400 font-black mt-0.5">LVL {user?.level ?? 1}</div>
                </div>
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-amber-400/30 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-lg flex-shrink-0">
                  {user?.avatar?.startsWith("http")
                    ? <Image src={user.avatar} alt="" fill className="object-cover" unoptimized />
                    : (user?.avatar ?? "🎮")}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#07090f]" />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          <AnimatePresence mode="wait">

            {/* ══ GAMES TAB ══ */}
            {activeTab === "games" && (
              <motion.div key="games"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}>

                {/* ── HERO ── */}
                <div className="relative overflow-hidden min-h-[220px] sm:min-h-[300px] md:min-h-[380px] flex items-end">
                  {/* Background image — يتغير مع المود */}
                  <div className="absolute inset-0">
                    <Image src={theme.table.background} alt="" fill className="object-cover opacity-30" unoptimized style={{ transition: "opacity 0.6s" }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090f] via-[#07090f]/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#07090f] via-transparent to-transparent" />
                  </div>

                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div key={i}
                        className="absolute text-2xl opacity-20 select-none"
                        style={{ right: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
                        animate={{ y: [0, -20, 0], rotate: [0, 10, 0], opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}>
                        {["🁣", "🃏", "♟️", "🎲", "🏆", "⚔️"][i]}
                      </motion.div>
                    ))}
                  </div>

                  {/* Hero text */}
                  <div className="relative z-10 p-4 sm:p-6 md:p-10 pb-6 sm:pb-8 md:pb-12 w-full">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="badge-live text-xs px-2.5 py-1">LIVE</span>
                        <span className="bg-white/[0.08] border border-white/[0.12] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                          <Zap size={11} className="text-amber-400 fill-current" /> بطولة جارية
                        </span>
                      </div>

                      <h1 className="text-3xl sm:text-4xl md:text-6xl font-black leading-none mb-3">
                        <span className="gold-shimmer">يالا</span>
                        <span className="text-white"> نلعب</span>
                      </h1>
                      <p className="text-slate-400 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-md">
                        انضم لـ <span className="text-amber-400 font-black">28,000</span> لاعب الآن — بطولات، تحديات، ومنافسة حقيقية
                      </p>

                      <div className="flex gap-3 flex-wrap">
                        <Link href="/games/domino/online"
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 shadow-lg shadow-amber-500/30 transition-all hover:-translate-y-0.5 hover:shadow-amber-500/50">
                          <Play size={16} fill="currentColor" /> العب الآن
                        </Link>
                        <Link href="/leaderboards"
                          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm bg-white/[0.07] border border-white/[0.12] hover:bg-white/[0.12] transition-all hover:-translate-y-0.5">
                          <Trophy size={16} className="text-amber-400" /> المتصدرون
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* ── GAMES GRID ── */}
                <div className="px-3 sm:px-4 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">

                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black flex items-center gap-2">
                      <Flame size={18} className="text-amber-400" /> الألعاب الساخنة
                    </h2>
                    <span className="text-xs text-slate-600 font-bold">
                      🟢 28,400 أونلاين
                    </span>
                  </div>

                  {/* 2-col mobile, 4-col desktop */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    {GAMES.map((g, i) => (
                      <motion.div key={g.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}>
                        <Link href={g.href} className="group block">
                          {/* Outer frame — gradient border per game color */}
                          <div className="relative p-[2px] rounded-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
                               style={{ background: `linear-gradient(145deg, rgba(245,166,35,0.6) 0%, rgba(255,255,255,0.06) 40%, ${g.color}70 100%)`, boxShadow: `0 6px 28px rgba(0,0,0,0.55)` }}
                               onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 20px 60px ${g.shadow}, 0 0 0 1px ${g.color}60`; }}
                               onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 6px 28px rgba(0,0,0,0.55)`; }}>
                          {/* Inner card */}
                          <div className="relative rounded-[13px] overflow-hidden aspect-[3/4] bg-black">

                            {/* BG image */}
                            <Image src={g.bg} alt={g.title} fill className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" unoptimized />

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                            {/* Hot badge */}
                            {g.hot && (
                              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                                <Flame size={8} fill="white" /> HOT
                              </div>
                            )}

                            {/* Emoji */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-5xl group-hover:scale-110 transition-transform duration-400 drop-shadow-xl select-none">
                              {EMOJIS[g.id]}
                            </div>

                            {/* Bottom info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3.5">
                              <div className="text-white font-black text-base leading-tight mb-1">{g.title}</div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: g.color }}>
                                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: g.color }} />
                                  {g.players}
                                </div>
                                <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                  {g.tag}
                                </span>
                              </div>
                            </div>

                            {/* Play overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur border border-white/20"
                                   style={{ background: `${g.color}33` }}>
                                <Play size={20} style={{ color: g.color }} fill="currentColor" />
                              </div>
                            </div>
                          </div>
                          </div>{/* end outer frame */}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  {/* ── COUNTRY BATTLE BANNER ── */}
                  <div className="rounded-2xl overflow-hidden relative"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                      border: `1px solid ${theme.colors.border}` }}>
                    <div className="p-4 sm:p-5 flex items-center justify-between gap-4" dir="rtl">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">⚔️</span>
                          <span className="font-black text-sm" style={{ color: theme.colors.gold }}>معركة الدول — الأسبوع ده</span>
                        </div>
                        <p className="text-xs text-slate-500">العب وأضف نقاط لبلدك — الدولة اللي توصل أول ١٠٠٠ نقطة تفوز</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {[ { flag:"🇸🇦", pts:"847", color:"#0a3d25" }, { flag:"🇪🇬", pts:"721", color:"#0d3348" }, { flag:"🇾🇪", pts:"534", color:"#1a0e05" } ].map((c,i) => (
                          <div key={i} className="text-center">
                            <div className="text-2xl">{c.flag}</div>
                            <div className="font-black text-xs" style={{ color: theme.colors.gold }}>{c.pts}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, #0a3d25 ${847/10}%, #0d3348 ${(847+721)/20}%, #1a0e05 100%)` }}/>
                  </div>

                  {/* ── BOTTOM ROW: Leaderboard + Daily ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                    {/* Leaderboard */}
                    <div className="card-gold p-5 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black flex items-center gap-2 text-sm">
                          <Trophy size={16} className="text-amber-400" /> المتصدرون الأسبوع
                        </h3>
                        <Link href="/leaderboards" className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
                          الكل <ChevronRight size={12} />
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {[
                          { n: "أبو فهد",  s: "2,480", e: "🥇" },
                          { n: "عاصفة",    s: "2,310", e: "🥈" },
                          { n: "الأسد",    s: "2,200", e: "🥉" },
                        ].map((p, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xl">{p.e}</span>
                            <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-sm flex-shrink-0">🎮</div>
                            <span className="flex-1 font-bold text-sm">{p.n}</span>
                            <span className="font-black text-sm text-amber-400">{p.s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Daily quest */}
                    <div className="card p-5 rounded-2xl space-y-3">
                      <h3 className="font-black text-sm flex items-center gap-2">
                        <Star size={16} className="text-amber-400 fill-current" /> مهام اليوم
                      </h3>
                      {[
                        { label: "العب 3 مباريات دومينو", reward: "200 🪙", pct: 66 },
                        { label: "فز بمباراة شطرنج",       reward: "1 💎",   pct: 0  },
                        { label: "سجّل دخولك اليومي",       reward: "100 🪙", pct: 100 },
                      ].map((q, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className={`font-bold ${q.pct === 100 ? "text-green-400 line-through opacity-60" : "text-slate-300"}`}>{q.label}</span>
                            <span className="font-black text-amber-400">{q.reward}</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${q.pct}%` }}
                              transition={{ duration: 1, delay: i * 0.2 }}
                              className={`h-full rounded-full ${q.pct === 100 ? "bg-green-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ STORE ══ */}
            {activeTab === "store" && (
              <motion.div key="store" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 md:p-8">
                <UnifiedStore />
              </motion.div>
            )}

            {/* ══ CHAT ══ */}
            {activeTab === "chat" && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 md:p-8 max-w-5xl mx-auto">
                <CommunityChat />
              </motion.div>
            )}

            {/* ══ LIVE ══ */}
            {activeTab === "live" && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black flex items-center gap-2"><Video className="text-red-500" /> بث مباشر</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="card rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all">
                      <div className="relative aspect-video bg-black">
                        <Image src={`https://picsum.photos/seed/${i+20}/400/225`} alt="" fill className="object-cover opacity-50 group-hover:opacity-70 transition-opacity" unoptimized />
                        <div className="absolute top-2 left-2 badge-live">LIVE</div>
                        <div className="absolute bottom-2 left-2 text-[11px] bg-black/70 backdrop-blur text-white px-2 py-0.5 rounded-lg font-bold">
                          {((i*1.7)%4+1).toFixed(1)}k 👁
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-sm group-hover:text-amber-400 transition-colors">نهائي بطولة #{i}</div>
                        <div className="text-xs text-slate-600 mt-0.5">بلوت · Pro League</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ══ PROFILE ══ */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 md:p-8">
                <ProfileView />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
