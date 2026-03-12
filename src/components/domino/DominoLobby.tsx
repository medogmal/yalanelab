"use client";
import React, { useState, useEffect } from "react";
import {
  Trophy, ShoppingBag, Users, Settings,
  ChevronRight, Map as MapIcon, Flame,
  Zap, Bot, Globe
} from "lucide-react";
import Link from "next/link";
import DominoStore from "./DominoStore";
import DominoSplash from "./DominoSplash";

type UserProfile = {
  id: string; name: string; coins: number; gems: number;
  level: number; xp: number; avatar?: string; elo?: number;
  wins?: number; losses?: number;
};

type LeaderEntry = { id: string; name: string; rating: number; rank: number };

const MODES = [
  {
    id: "campaign", href: "/games/domino/campaign", label: "رحلة الأساطير",
    sub: "5 عوالم · 50 مستوى · مكافآت حصرية",
    icon: <MapIcon size={22} />,
    bg: "linear-gradient(135deg,#7c2d12,#92400e,#78350f)",
    accent: "#f5a623", badge: { text: "مغامرة", color: "bg-amber-500" }, glyph: "🗺️",
  },
  {
    id: "online", href: "/games/domino/ranked?auto=1", label: "لعب أونلاين",
    sub: "تحدى لاعبين حقيقيين · ELO ranking",
    icon: <Globe size={22} />,
    bg: "linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)",
    accent: "#818cf8", badge: { text: "مباشر", color: "bg-indigo-500" }, glyph: "🌐", live: true,
  },
  {
    id: "training", href: "/games/domino/training", label: "تدريب ضد الكمبيوتر",
    sub: "4 مستويات صعوبة · بدون إنترنت",
    icon: <Bot size={22} />,
    bg: "linear-gradient(135deg,#0c4a6e,#075985,#0c4a6e)",
    accent: "#38bdf8", badge: { text: "تدريب", color: "bg-sky-500" }, glyph: "🤖",
  },
  {
    id: "multiplayer", href: "/games/domino/training?players=4", label: "طاولة 4 لاعبين",
    sub: "العب مع 3 أصدقاء أو ضد AI",
    icon: <Users size={22} />,
    bg: "linear-gradient(135deg,#064e3b,#065f46,#064e3b)",
    accent: "#34d399", badge: { text: "جماعي", color: "bg-emerald-500" }, glyph: "👥",
  },
  {
    id: "highstakes", href: "/games/domino/ranked?stakes=high&auto=1", label: "رهان عالي 💰",
    sub: "5,000 كوين · للمحترفين فقط",
    icon: <Flame size={22} />,
    bg: "linear-gradient(135deg,#450a0a,#7f1d1d,#450a0a)",
    accent: "#f87171", badge: { text: "VIP", color: "bg-red-600" }, glyph: "🔥",
  },
];

export default function DominoLobby() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStore, setShowStore] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [dailyReady, setDailyReady] = useState(false);
  const [dailyClaiming, setDailyClaiming] = useState(false);

  useEffect(() => {
    const hasShown = sessionStorage.getItem("domino_splash_shown");
    if (hasShown) setShowSplash(false);
    else sessionStorage.setItem("domino_splash_shown", "true");

    // Fetch profile + leaderboard in parallel
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/leaderboard/domino?limit=5", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/economy/daily", { cache: "no-store" }).then(r => r.json()),
    ]).then(([meData, lbData, dailyData]) => {
      if (meData.user) {
        setProfile({
          id:     meData.user.id,
          name:   meData.user.name,
          coins:  meData.user.coins  || 0,
          gems:   meData.user.gems   || 0,
          level:  meData.user.level  || 1,
          xp:     meData.user.xp     || 0,
          avatar: meData.user.cosmetics?.avatar,
          elo:    meData.user.ratings?.domino ?? 1200,
          wins:   meData.user.winsDomino   ?? 0,
          losses: meData.user.lossesDomino ?? 0,
        });
      }
      if (lbData.items) setLeaders(lbData.items.slice(0, 5));
      if (dailyData.claimable) setDailyReady(true);
    }).finally(() => setLoading(false));
  }, []);

  async function claimDaily() {
    if (!dailyReady || dailyClaiming) return;
    setDailyClaiming(true);
    const res = await fetch("/api/economy/daily", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      setDailyReady(false);
      setProfile(p => p ? { ...p, coins: p.coins + (data.coins || 0) } : p);
    }
    setDailyClaiming(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--domino-felt)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-amber-400 font-bold">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  const xpPct = profile ? Math.min(100, ((profile.xp % 1000) / 1000) * 100) : 0;

  return (
    <>
      {showSplash && <DominoSplash onComplete={() => setShowSplash(false)} />}
      <div className="min-h-dvh relative overflow-hidden text-white" style={{ background: "var(--domino-felt)" }}>

        {/* Background */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/wood-pattern.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-400/5 blur-[120px] rounded-full pointer-events-none" />

        {/* TOP BAR */}
        <div className="relative z-20 flex justify-between items-center gap-2 p-3 md:px-8 md:pt-6 glass-dark border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl border-2 border-amber-400/60 overflow-hidden bg-black/40 shadow-lg shadow-amber-400/20">
                {profile?.avatar
                  ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-black text-black border-2 border-[var(--domino-felt)] shadow-md">
                {profile?.level ?? 1}
              </div>
            </div>
            <div>
              <div className="font-black text-sm sm:text-lg leading-tight truncate max-w-[120px] sm:max-w-none">{profile?.name ?? "ضيف"}</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full border border-amber-400/20">
                  <span className="text-xs">🪙</span>
                  <span className="text-amber-400 font-black text-xs">{profile?.coins?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full border border-purple-400/20">
                  <span className="text-xs">💎</span>
                  <span className="text-purple-400 font-black text-xs">{profile?.gems?.toLocaleString() ?? 0}</span>
                </div>
              </div>
              <div className="mt-2 w-24 sm:w-40 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-center bg-black/30 border border-amber-400/20 px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ELO</span>
              <span className="text-amber-400 font-black text-lg leading-tight">{profile?.elo ?? 1200}</span>
            </div>
            <div className="hidden md:flex flex-col items-center bg-black/30 border border-white/[0.06] px-4 py-2 rounded-2xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">W/L</span>
              <span className="font-black text-sm">
                <span className="text-green-400">{profile?.wins ?? 0}</span>
                <span className="text-slate-600 mx-1">/</span>
                <span className="text-red-400">{profile?.losses ?? 0}</span>
              </span>
            </div>
            <button onClick={() => setShowStore(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-400/15 border border-amber-400/25 text-amber-400 hover:bg-amber-400/25 transition-colors">
              <ShoppingBag size={15} /> <span className="hidden xs:inline">المتجر</span>
            </button>
            <button className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] text-slate-400 hover:text-white transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 sm:gap-8">

          {/* Left: Title + Modes */}
          <div className="flex-1 space-y-5">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-tight leading-none gold-shimmer mb-2">DOMINO</h1>
              <p className="text-slate-400 text-sm font-medium">اختر وضع اللعب المناسب</p>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {MODES.map((mode) => (
                <Link key={mode.id} href={mode.href}
                  className="group flex items-center gap-3 sm:gap-4 relative overflow-hidden rounded-2xl p-3.5 sm:p-4 md:p-5 border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ background: mode.bg }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 0% 50%, ${mode.accent}18 0%, transparent 60%)` }} />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 select-none">{mode.glyph}</div>
                  <div className="relative z-10 w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${mode.accent}22`, color: mode.accent, border: `1px solid ${mode.accent}44` }}>
                    {mode.icon}
                  </div>
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-black text-base text-white">{mode.label}</span>
                      <span className={`${mode.badge.color} text-white text-[9px] font-black px-2 py-0.5 rounded-full`}>{mode.badge.text}</span>
                      {(mode as any).live && <span className="badge-live text-[9px]">LIVE</span>}
                    </div>
                    <p className="text-[12px] font-medium" style={{ color: `${mode.accent}bb` }}>{mode.sub}</p>
                  </div>
                  <ChevronRight size={18} className="relative z-10 text-white/30 group-hover:text-white/70 translate-x-0 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Leaderboard + Daily */}
          <div className="w-full lg:w-80 space-y-3 sm:space-y-4">

            {/* Daily reward */}
            <button onClick={claimDaily} disabled={!dailyReady || dailyClaiming}
              className={`w-full card-gold p-4 flex items-center gap-4 hover:shadow-lg hover:shadow-amber-400/15 transition-all group ${!dailyReady ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}>
              <div className="w-12 h-12 bg-amber-400/15 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🎁</div>
              <div className="flex-1 text-right">
                <div className="font-black text-sm text-amber-400">مكافأة يومية</div>
                <div className="text-[11px] text-slate-400">
                  {dailyReady ? "اضغط للمطالبة!" : dailyClaiming ? "جاري..." : "تم المطالبة اليوم ✓"}
                </div>
              </div>
              <Zap size={18} className={`text-amber-400 ${dailyReady ? "animate-pulse" : ""}`} />
            </button>

            {/* Leaderboard */}
            <div className="glass-dark rounded-2xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-sm flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" /> المتصدرون
                </h3>
                <Link href="/games/domino/leaderboard" className="text-[11px] text-slate-500 hover:text-amber-400 transition-colors font-bold">الكل</Link>
              </div>
              <div className="space-y-3">
                {leaders.length > 0 ? leaders.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black flex-shrink-0 ${idx === 0 ? "bg-amber-400 text-black" : idx === 1 ? "bg-zinc-400 text-black" : idx === 2 ? "bg-orange-700 text-white" : "bg-white/[0.06] text-slate-400"}`}>
                      {p.rank}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-sm">🎮</div>
                    <span className="flex-1 text-sm font-bold truncate">{p.name}</span>
                    <span className="text-amber-400 font-black text-sm">{p.rating}</span>
                  </div>
                )) : (
                  <p className="text-center text-zinc-600 text-xs py-2">العب أول مباراة لتظهر هنا!</p>
                )}
              </div>
            </div>

            {/* Quick stats */}
            <div className="glass-dark rounded-2xl border border-white/[0.06] p-4">
              <h3 className="font-black text-sm mb-3 text-slate-400">إحصائياتك</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "انتصارات", value: profile?.wins   ?? 0,    color: "text-green-400"  },
                  { label: "هزائم",    value: profile?.losses ?? 0,    color: "text-red-400"    },
                  { label: "ELO",      value: profile?.elo    ?? 1200, color: "text-amber-400"  },
                  { label: "المستوى", value: profile?.level  ?? 1,    color: "text-purple-400" },
                ].map((s) => (
                  <div key={s.label} className="bg-black/20 rounded-xl p-3 text-center">
                    <div className={`font-black text-xl ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showStore && <DominoStore onClose={() => setShowStore(false)} />}
    </>
  );
}
