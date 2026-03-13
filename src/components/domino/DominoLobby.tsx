"use client";
import React, { useState, useEffect } from "react";
import {
  Trophy, ShoppingBag, Users, Settings,
  ChevronRight, Map as MapIcon, Flame, Zap, Bot, Globe
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DominoStore from "./DominoStore";
import DominoSplash from "./DominoSplash";

type UserProfile = {
  id:string; name:string; coins:number; gems:number;
  level:number; xp:number; avatar?:string; elo?:number;
  wins?:number; losses?:number;
};
type LeaderEntry = { id:string; name:string; rating:number; rank:number };

const MODES = [
  {
    id:"campaign", href:"/games/domino/campaign", label:"رحلة الأساطير",
    sub:"5 عوالم · 50 مستوى · مكافآت حصرية",
    icon:<MapIcon size={20}/>, glyph:"🗺️",
    gradient:"linear-gradient(135deg,#7c2d12,#92400e,#78350f)",
    accent:"#f5a623", badge:"مغامرة", badgeBg:"#f59e0b",
  },
  {
    id:"online", href:"/games/domino/ranked?auto=1", label:"لعب أونلاين",
    sub:"تحدى لاعبين حقيقيين · ELO ranking",
    icon:<Globe size={20}/>, glyph:"🌐",
    gradient:"linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b)",
    accent:"#818cf8", badge:"مباشر", badgeBg:"#6366f1", live:true,
  },
  {
    id:"training", href:"/games/domino/training", label:"تدريب ضد الكمبيوتر",
    sub:"4 مستويات صعوبة · بدون إنترنت",
    icon:<Bot size={20}/>, glyph:"🤖",
    gradient:"linear-gradient(135deg,#0c4a6e,#075985,#0c4a6e)",
    accent:"#38bdf8", badge:"تدريب", badgeBg:"#0ea5e9",
  },
  {
    id:"multiplayer", href:"/games/domino/training?players=4", label:"طاولة ٤ لاعبين",
    sub:"العب مع ٣ أصدقاء أو ضد AI",
    icon:<Users size={20}/>, glyph:"👥",
    gradient:"linear-gradient(135deg,#064e3b,#065f46,#064e3b)",
    accent:"#34d399", badge:"جماعي", badgeBg:"#10b981",
  },
  {
    id:"highstakes", href:"/games/domino/ranked?stakes=high&auto=1", label:"رهان عالي 💰",
    sub:"5,000 كوين · للمحترفين فقط",
    icon:<Flame size={20}/>, glyph:"🔥",
    gradient:"linear-gradient(135deg,#450a0a,#7f1d1d,#450a0a)",
    accent:"#f87171", badge:"VIP", badgeBg:"#dc2626",
  },
];

/* ─────────────────────────────────────────────────────────
   LIVE PULSE BADGE
───────────────────────────────────────────────────────── */
function LiveBadge() {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block"/>
      LIVE
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   MODE CARD
───────────────────────────────────────────────────────── */
function ModeCard({ mode, index }: { mode:typeof MODES[0]; index:number }) {
  return (
    <motion.div
      initial={{opacity:0,x:20}}
      animate={{opacity:1,x:0}}
      transition={{delay:index*.07,duration:.4}}
    >
      <Link href={mode.href}
        className="group relative flex items-center gap-4 rounded-2xl p-4 overflow-hidden transition-all duration-300 active:scale-[.98] hover:-translate-y-0.5"
        style={{background:mode.gradient,border:`1px solid ${mode.accent}20`}}>

        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{background:`radial-gradient(circle at 0% 50%, ${mode.accent}1a 0%, transparent 60%)`}}/>

        {/* Corner light */}
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-60"
          style={{background:`radial-gradient(circle at 100% 0%, ${mode.accent}18 0%, transparent 70%)`}}/>

        {/* Big bg glyph */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-[.08] group-hover:opacity-[.15] transition-opacity duration-500 select-none pointer-events-none">
          {mode.glyph}
        </div>

        {/* Icon */}
        <div className="relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
          style={{background:`${mode.accent}18`,color:mode.accent,border:`1px solid ${mode.accent}30`,boxShadow:`0 4px 16px ${mode.accent}20`}}>
          {mode.icon}
        </div>

        {/* Text */}
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-black text-sm text-white">{mode.label}</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black text-white" style={{background:mode.badgeBg}}>
              {mode.badge}
            </span>
            {(mode as any).live && <LiveBadge/>}
          </div>
          <p className="text-[11px] font-medium truncate" style={{color:`${mode.accent}aa`}}>{mode.sub}</p>
        </div>

        {/* Arrow */}
        <div className="relative z-10 flex-shrink-0 transition-all duration-200 group-hover:translate-x-[-4px] opacity-30 group-hover:opacity-70" style={{color:"white"}}>
          <ChevronRight size={16}/>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   DOMINO LOBBY
───────────────────────────────────────────────────────── */
export default function DominoLobby() {
  const [profile,      setProfile]      = useState<UserProfile|null>(null);
  const [leaders,      setLeaders]      = useState<LeaderEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showStore,    setShowStore]    = useState(false);
  const [showSplash,   setShowSplash]   = useState(true);
  const [dailyReady,   setDailyReady]   = useState(false);
  const [dailyClaiming,setDailyClaiming]= useState(false);

  useEffect(()=>{
    const shown=sessionStorage.getItem("domino_splash_shown");
    if(shown) setShowSplash(false);
    else sessionStorage.setItem("domino_splash_shown","true");

    Promise.all([
      fetch("/api/auth/me").then(r=>r.json()),
      fetch("/api/leaderboard/domino?limit=5",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/economy/daily",{cache:"no-store"}).then(r=>r.json()),
    ]).then(([me,lb,daily])=>{
      if(me.user) setProfile({
        id:me.user.id, name:me.user.name,
        coins:me.user.coins||0, gems:me.user.gems||0,
        level:me.user.level||1, xp:me.user.xp||0,
        avatar:me.user.cosmetics?.avatar,
        elo:me.user.ratings?.domino??1200,
        wins:me.user.winsDomino??0, losses:me.user.lossesDomino??0,
      });
      if(lb.items) setLeaders(lb.items.slice(0,5));
      if(daily.claimable) setDailyReady(true);
    }).finally(()=>setLoading(false));
  },[]);

  async function claimDaily() {
    if(!dailyReady||dailyClaiming) return;
    setDailyClaiming(true);
    const res=await fetch("/api/economy/daily",{method:"POST"});
    const data=await res.json();
    if(data.ok){setDailyReady(false);setProfile(p=>p?{...p,coins:p.coins+(data.coins||0)}:p);}
    setDailyClaiming(false);
  }

  const gold = "#f5a623";
  const xpPct = profile ? Math.min(100,((profile.xp%1000)/1000)*100) : 0;

  if(loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"#07090f"}}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/20"/>
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-400 border-r-amber-400/40 border-b-transparent border-l-transparent animate-spin"/>
        </div>
        <span className="text-amber-400 font-black text-sm tracking-widest">DOMINO</span>
      </div>
    </div>
  );

  return (
    <>
      {showSplash&&<DominoSplash onComplete={()=>setShowSplash(false)}/>}

      <div className="min-h-dvh relative overflow-hidden text-white" style={{background:"#07090f"}} dir="rtl">

        {/* Layered backgrounds */}
        <div className="absolute inset-0" style={{background:"radial-gradient(ellipse 100% 60% at 50% 0%, #1a0e0030 0%, transparent 70%)"}}/>
        <div className="absolute inset-0 opacity-[.03] pointer-events-none"
          style={{backgroundImage:"url('https://www.transparenttextures.com/patterns/wood-pattern.png')"}}/>
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full pointer-events-none"
          style={{background:`radial-gradient(ellipse,${gold}12 0%,transparent 70%)`,filter:"blur(60px)"}}/>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{background:"linear-gradient(to top,rgba(0,0,0,.5),transparent)"}}/>

        {/* ── TOP BAR ── */}
        <header className="relative z-20 flex items-center justify-between gap-2 px-4 py-3 md:px-8 md:pt-6"
          style={{borderBottom:"1px solid rgba(255,255,255,.05)",background:"rgba(7,9,15,.6)",backdropFilter:"blur(20px)"}}>

          {/* Player info */}
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center text-2xl"
                style={{background:`${gold}18`,border:`2px solid ${gold}45`,boxShadow:`0 4px 20px ${gold}25`}}>
                {profile?.avatar
                  ?<img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover"/>
                  :"🎮"}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                style={{background:`linear-gradient(135deg,${gold},#ea580c)`,color:"#000",border:"2px solid #07090f",boxShadow:`0 2px 8px ${gold}50`}}>
                {profile?.level??1}
              </div>
            </div>

            {/* Name + currencies + xp */}
            <div>
              <div className="font-black text-sm leading-tight truncate max-w-[130px] sm:max-w-none">{profile?.name??"ضيف"}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
                  style={{background:`${gold}15`,border:`1px solid ${gold}28`,color:gold}}>🪙 {(profile?.coins??0).toLocaleString()}</div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-purple-400"
                  style={{background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.25)"}}>💎 {profile?.gems??0}</div>
              </div>
              {/* XP bar */}
              <div className="mt-1.5 w-28 sm:w-40 h-1.5 rounded-full overflow-hidden" style={{background:"rgba(255,255,255,.07)"}}>
                <motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:1,ease:"easeOut",delay:.5}}
                  className="h-full rounded-full" style={{background:`linear-gradient(90deg,${gold}88,${gold})`}}/>
              </div>
            </div>
          </div>

          {/* Right stats + buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-col items-center px-3 py-1.5 rounded-xl"
              style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)"}}>
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">ELO</span>
              <span className="font-black text-base leading-tight" style={{color:gold}}>{profile?.elo??1200}</span>
            </div>
            <div className="hidden md:flex flex-col items-center px-3 py-1.5 rounded-xl"
              style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)"}}>
              <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">W/L</span>
              <span className="font-black text-sm leading-tight">
                <span className="text-green-400">{profile?.wins??0}</span>
                <span className="text-slate-700 mx-1">/</span>
                <span className="text-red-400">{profile?.losses??0}</span>
              </span>
            </div>
            <button onClick={()=>setShowStore(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs transition-all active:scale-95 hover:brightness-110"
              style={{background:`${gold}15`,border:`1px solid ${gold}28`,color:gold}}>
              <ShoppingBag size={14}/><span className="hidden xs:inline">المتجر</span>
            </button>
            <button className="p-2 rounded-xl transition-all active:scale-95 hover:brightness-110"
              style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"rgba(255,255,255,.4)"}}>
              <Settings size={16}/>
            </button>
          </div>
        </header>

        {/* ── MAIN ── */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 flex flex-col lg:flex-row gap-6 lg:gap-10">

          {/* LEFT — title + modes */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* Title block */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}>
              <div className="text-[56px] sm:text-[72px] font-black italic tracking-tight leading-none mb-1"
                style={{color:gold,textShadow:`0 0 80px ${gold}60,0 0 160px ${gold}20`}}>
                DOMINO
              </div>
              <div className="text-slate-500 text-sm font-bold tracking-wide">اختر وضع اللعب</div>
            </motion.div>

            {/* Mode cards */}
            <div className="flex flex-col gap-2.5">
              {MODES.map((mode,i)=><ModeCard key={mode.id} mode={mode} index={i}/>)}
            </div>
          </div>

          {/* RIGHT — sidebar */}
          <div className="w-full lg:w-72 flex flex-col gap-4">

            {/* Daily reward */}
            <motion.button
              initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.35}}
              onClick={claimDaily}
              disabled={!dailyReady||dailyClaiming}
              className={`relative w-full rounded-2xl p-4 flex items-center gap-4 overflow-hidden transition-all ${dailyReady?"active:scale-[.98] hover:brightness-110 cursor-pointer":"opacity-60 cursor-not-allowed"}`}
              style={{background:`linear-gradient(135deg,${gold}10,${gold}05)`,border:`1px solid ${gold}${dailyReady?"35":"18"}`}}>
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full pointer-events-none" style={{background:`radial-gradient(circle,${gold}14,transparent 70%)`,filter:"blur(16px)"}}/>
              <div className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{background:`${gold}18`,border:`1px solid ${gold}30`,boxShadow:dailyReady?`0 6px 20px ${gold}30`:"none"}}>🎁</div>
              <div className="relative z-10 flex-1 text-right">
                <div className="font-black text-sm" style={{color:gold}}>مكافأة يومية</div>
                <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                  {dailyReady?"اضغط للمطالبة! ✨":dailyClaiming?"جاري...":"تم المطالبة اليوم ✓"}
                </div>
              </div>
              {dailyReady&&<Zap size={16} className="relative z-10 flex-shrink-0 animate-pulse" style={{color:gold}}/>}
            </motion.button>

            {/* Leaderboard */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.42}}
              className="rounded-2xl p-4" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy size={14} style={{color:gold}}/>
                  <h3 className="font-black text-sm text-white">المتصدرون</h3>
                </div>
                <Link href="/games/domino/leaderboard" className="text-[10px] font-black transition-all hover:brightness-150" style={{color:"rgba(255,255,255,.25)"}}>الكل →</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {leaders.length>0 ? leaders.map((p,i)=>(
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${i===0?"text-black":i===1?"text-black":i===2?"text-white":"text-slate-600"}`}
                      style={{background:i===0?gold:i===1?"#9ca3af":i===2?"#b45309":"rgba(255,255,255,.06)"}}>
                      {p.rank}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-white/[.05] flex items-center justify-center text-sm flex-shrink-0">🎮</div>
                    <span className="flex-1 text-sm font-bold truncate text-white">{p.name}</span>
                    <span className="font-black text-sm flex-shrink-0" style={{color:gold}}>{p.rating}</span>
                  </div>
                )) : (
                  <p className="text-center text-slate-700 text-xs py-3 font-bold">العب أول مباراة لتظهر هنا!</p>
                )}
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.48}}
              className="rounded-2xl p-4" style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)"}}>
              <h3 className="font-black text-sm text-slate-600 mb-3 uppercase tracking-wider text-[10px]">إحصائياتك</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label:"انتصارات", value:profile?.wins??0,    color:"#34d399"},
                  {label:"هزائم",    value:profile?.losses??0,  color:"#f87171"},
                  {label:"ELO",      value:profile?.elo??1200,  color:gold},
                  {label:"المستوى", value:profile?.level??1,   color:"#a78bfa"},
                ].map(s=>(
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{background:"rgba(255,255,255,.025)"}}>
                    <div className="font-black text-2xl" style={{color:s.color}}>{s.value}</div>
                    <div className="text-[9px] text-slate-600 font-black mt-0.5 uppercase tracking-wide">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tournament banner */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.54}}
              className="relative rounded-2xl p-4 overflow-hidden"
              style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"1px solid rgba(129,140,248,.25)"}}>
              <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full pointer-events-none" style={{background:"radial-gradient(circle,rgba(129,140,248,.2),transparent 70%)",filter:"blur(20px)"}}/>
              <div className="relative z-10 flex items-center gap-3">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="font-black text-sm text-white">بطولة الأسبوع</div>
                  <div className="text-[10px] text-indigo-300 font-bold mt-0.5">جائزة 50,000 كوين</div>
                </div>
              </div>
              <Link href="/tournaments"
                className="relative z-10 mt-3 w-full flex items-center justify-center py-2 rounded-xl font-black text-xs text-white transition-all active:scale-95 hover:brightness-110"
                style={{background:"rgba(129,140,248,.25)",border:"1px solid rgba(129,140,248,.35)"}}>
                سجل الآن →
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Store modal */}
      {showStore&&<DominoStore onClose={()=>setShowStore(false)}/>}
    </>
  );
}
