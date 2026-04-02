"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [newName,  setNewName]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.json())
      .then(d => { if (d.user) { setProfile(d.user); setNewName(d.user.name ?? ""); } })
      .finally(() => setLoading(false));
  }, []);

  async function saveName() {
    if (!newName.trim()) return;
    setSaving(true); setMsg(null);
    const res  = await fetch("/api/user/me", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: newName.trim() }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setProfile((p: any) => ({...p, name: newName.trim()})); setEditing(false); setMsg("✓ تم الحفظ"); }
    else { setMsg(data.error ?? "خطأ"); }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd   = new FormData(); fd.append("avatar", file);
    const res  = await fetch("/api/user/avatar", { method:"POST", body:fd });
    const data = await res.json();
    if (res.ok && data.url) setProfile((p: any) => ({...p, avatar: data.url}));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 rounded-full border-2 border-t-violet-500 border-violet-500/20 animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="text-center py-20 px-6">
      <div className="text-4xl mb-4">🎮</div>
      <div className="font-bold text-white/40 mb-6 text-sm">غير مسجل الدخول</div>
      <Link href="/auth/login" className="px-6 py-3 rounded-2xl font-black text-sm text-black"
        style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>سجّل الدخول</Link>
    </div>
  );

  const xp    = profile.xp    ?? 0;
  const level = profile.level ?? 1;
  const xpForLevel = 100 + (level - 1) * 50;
  const xpPct = Math.min(100, (xp / xpForLevel) * 100);

  const GAMES = [
    { label:"دومينو", elo: profile.ratings?.domino ?? 1200, icon:"🁣", color:"#f59e0b" },
    { label:"شطرنج",  elo: profile.ratings?.chess  ?? 1200, icon:"♟",  color:"#8b5cf6" },
    { label:"بلوت",   elo: profile.ratings?.baloot ?? 1200, icon:"🃏", color:"#ec4899" },
    { label:"لودو",   elo: profile.ratings?.ludo   ?? 1200, icon:"🎲", color:"#06b6d4" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4" dir="rtl">

      {/* ── Hero Card ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
        className="relative rounded-3xl overflow-hidden p-6"
        style={{background:"linear-gradient(145deg,rgba(124,58,237,0.12),rgba(13,13,23,0.95))",border:"1px solid rgba(124,58,237,0.2)"}}>
        
        {/* top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-full blur-3xl pointer-events-none"
          style={{background:"rgba(124,58,237,0.15)"}}/>

        <div className="relative flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl"
              style={{background:"rgba(124,58,237,0.15)",border:"2px solid rgba(124,58,237,0.35)"}}>
              {profile.avatar?.startsWith("http")
                ? <img src={profile.avatar} className="w-full h-full object-cover" alt=""/>
                : "🎮"}
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-black text-white"
              style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"2px solid #0c0c0e"}}>
              {level}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar}/>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {!editing ? (
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h2 className="font-black text-xl text-white truncate">{profile.name}</h2>
                <button onClick={() => setEditing(true)}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold transition-all hover:brightness-125"
                  style={{background:"rgba(124,58,237,0.15)",color:"#a78bfa",border:"1px solid rgba(124,58,237,0.25)"}}>
                  ✎ تعديل
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-2 flex-wrap">
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  className="flex-1 min-w-28 px-3 py-2 rounded-xl text-sm font-bold text-white outline-none"
                  style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.35)"}}/>
                <button onClick={saveName} disabled={saving}
                  className="px-3 py-2 rounded-xl font-black text-xs text-white"
                  style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>حفظ</button>
                <button onClick={() => setEditing(false)}
                  className="px-3 py-2 rounded-xl font-bold text-xs text-white/40"
                  style={{background:"rgba(255,255,255,0.05)"}}>✕</button>
              </div>
            )}
            {msg && <p className="text-xs text-emerald-400 font-bold mb-2">{msg}</p>}

            {/* Currencies */}
            <div className="flex gap-2 flex-wrap mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black"
                style={{background:"rgba(245,158,11,0.12)",color:"#f59e0b",border:"1px solid rgba(245,158,11,0.2)"}}>
                🪙 {(profile.coins??0).toLocaleString()}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-black"
                style={{background:"rgba(124,58,237,0.12)",color:"#a78bfa",border:"1px solid rgba(124,58,237,0.2)"}}>
                💎 {profile.gems??0}
              </span>
              {profile.tier && profile.tier !== "free" && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black text-black"
                  style={{background:"linear-gradient(135deg,#f59e0b,#f97316)"}}>
                  ✦ {profile.tier.toUpperCase()}
                </span>
              )}
            </div>

            {/* XP bar */}
            <div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{background:"rgba(255,255,255,0.06)"}}>
                <motion.div initial={{width:0}} animate={{width:`${xpPct}%`}} transition={{duration:1,ease:"easeOut",delay:.3}}
                  className="h-full rounded-full" style={{background:"linear-gradient(90deg,#7c3aed,#a855f7)"}}/>
              </div>
              <div className="text-[10px] font-bold" style={{color:"rgba(255,255,255,0.25)"}}>
                {xp.toLocaleString()} / {xpForLevel.toLocaleString()} XP — المستوى {level}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Game Ratings ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
        className="grid grid-cols-2 gap-3">
        {GAMES.map((g, i) => (
          <div key={i} className="rounded-2xl p-3 flex items-center gap-3"
            style={{background:`${g.color}08`,border:`1px solid ${g.color}18`}}>
            <span className="text-2xl">{g.icon}</span>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider" style={{color:`${g.color}aa`}}>{g.label}</div>
              <div className="font-black text-lg text-white leading-tight">{g.elo}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Match Stats ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.18}}
        className="rounded-2xl p-4" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
        <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-3">إحصائيات الدومينو</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            {label:"ألعاب",   value: profile.matchesDomino??0,    color:"#c0c0cc"},
            {label:"انتصار",  value: profile.winsDomino??0,       color:"#34d399"},
            {label:"خسارة",   value: profile.lossesDomino??0,     color:"#f87171"},
          ].map(s => (
            <div key={s.label} className="rounded-xl py-3" style={{background:"rgba(255,255,255,0.025)"}}>
              <div className="font-black text-xl" style={{color:s.color}}>{s.value}</div>
              <div className="text-[9px] font-bold mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick Links ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.24}}
        className="flex flex-col gap-2">
        {[
          { label:"🏆 لوائح الشرف",     href:"/leaderboards"   },
          { label:"🎯 البطولات",         href:"/tournaments"    },
          { label:"💎 البلاس",           href:"/plus"           },
          { label:"🎮 تاريخ المباريات",  href:"/profile/matches"},
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all hover:brightness-125"
            style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(124,58,237,0.1)",color:"rgba(255,255,255,0.6)"}}>
            {item.label}
            <span style={{color:"rgba(124,58,237,0.5)"}}>‹</span>
          </Link>
        ))}

        <Link href="/auth/logout"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all hover:brightness-125 mt-1"
          style={{background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.12)",color:"rgba(239,68,68,0.7)"}}>
          تسجيل الخروج
        </Link>
      </motion.div>
    </div>
  );
}
