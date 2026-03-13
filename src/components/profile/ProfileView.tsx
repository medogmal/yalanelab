"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* ════════════════════════════════════════
   PROFILE VIEW — Star Wars Arabic UI
════════════════════════════════════════ */
export default function ProfileView() {
  const [profile, setProfile]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [newName, setNewName]   = useState("");
  const [saving,  setSaving]    = useState(false);
  const [msg,     setMsg]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.json())
      .then(d => { if (d.user) { setProfile(d.user); setNewName(d.user.name ?? ""); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveName() {
    if (!newName.trim()) return;
    setSaving(true); setMsg(null);
    const res  = await fetch("/api/user/me", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setProfile((p: any) => ({...p, name: newName.trim()})); setEditing(false); setMsg("✓ تم الحفظ"); }
    else         { setMsg(data.error ?? "خطأ"); }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd   = new FormData(); fd.append("avatar", file);
    const res  = await fetch("/api/user/avatar", { method:"POST", body:fd });
    const data = await res.json();
    if (res.ok && data.url) setProfile((p: any) => ({...p, avatar: data.url}));
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}>
      <div style={{
        width:40,height:40,borderRadius:10,
        background:"rgba(0,212,255,0.1)",border:"1.5px solid rgba(0,212,255,0.28)",
        animation:"spin 1s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  if (!profile) return (
    <div style={{textAlign:"center",padding:80}}>
      <div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.3)",marginBottom:16}}>
        غير مسجل الدخول
      </div>
      <Link href="/auth/login" style={{
        padding:"12px 28px",borderRadius:14,fontWeight:900,fontSize:14,
        color:"#000",textDecoration:"none",
        background:"linear-gradient(135deg,#f5a623,#ffd060)",
      }}>سجّل الدخول</Link>
    </div>
  );

  const xp    = profile.xp    ?? 0;
  const maxXp = profile.max_xp ?? 1000;
  const xpPct = Math.min(100, (xp / maxXp) * 100);
  const level = profile.level ?? 1;

  const STATS = [
    { label:"إجمالي الألعاب",  value: profile.stats?.total_games    ?? 0, icon:"🎮", color:"#00d4ff" },
    { label:"الانتصارات",      value: profile.stats?.wins            ?? 0, icon:"🏆", color:"#f5a623" },
    { label:"الهزائم",         value: profile.stats?.losses          ?? 0, icon:"💀", color:"#ff2d55" },
    { label:"نسبة الفوز",      value:`${profile.stats?.win_rate ?? 0}%`,   icon:"📊", color:"#9b5fe0" },
    { label:"ELO الدومينو",    value: profile.domino_elo            ?? 1000, icon:"🁣", color:"#f5a623" },
    { label:"ELO الشطرنج",     value: profile.chess_elo             ?? 1000, icon:"♟", color:"#9b5fe0" },
  ];

  return (
    <div style={{
      maxWidth:600,margin:"0 auto",
      padding:"clamp(16px,4vw,32px)",
      fontFamily:"var(--font-cairo),sans-serif",
    }} dir="rtl">

      {/* ── Header Card ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
        style={{
          borderRadius:22,padding:"24px 20px",marginBottom:16,
          position:"relative",overflow:"hidden",
          background:"rgba(0,212,255,0.04)",
          border:"1px solid rgba(0,212,255,0.15)",
        }}
      >
        <div style={{position:"absolute",top:0,left:"5%",right:"5%",height:1,background:"linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)"}}/>

        <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
          {/* Avatar */}
          <div style={{position:"relative",flexShrink:0}}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width:80,height:80,borderRadius:20,cursor:"pointer",
                background:"rgba(0,212,255,0.08)",
                border:"1.5px solid rgba(0,212,255,0.28)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:profile.avatar?.startsWith("http") ? undefined : 36,
                overflow:"hidden",position:"relative",
              }}
            >
              {profile.avatar?.startsWith("http")
                ? <img src={profile.avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>
                : "🎮"
              }
              <div style={{
                position:"absolute",inset:0,
                background:"rgba(0,0,0,0.4)",
                display:"flex",alignItems:"center",justifyContent:"center",
                opacity:0,transition:"opacity .2s",fontSize:20,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.opacity="1"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.opacity="0"}
              >📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={uploadAvatar}/>
            {/* Level badge */}
            <div style={{
              position:"absolute",bottom:-6,right:-6,
              width:24,height:24,borderRadius:8,
              background:"linear-gradient(135deg,#f5a623,#ffd060)",
              color:"#000",fontSize:10,fontWeight:900,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{level}</div>
          </div>

          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            {!editing ? (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                <h2 style={{fontWeight:900,fontSize:"clamp(16px,3vw,22px)",color:"#fff",margin:0}}>
                  {profile.name}
                </h2>
                <button onClick={() => setEditing(true)} style={{
                  padding:"3px 10px",borderRadius:8,fontWeight:800,fontSize:11,
                  background:"rgba(0,212,255,0.08)",color:"#00d4ff",
                  border:"1px solid rgba(0,212,255,0.2)",cursor:"pointer",fontFamily:"inherit",
                }}>✎ تعديل</button>
              </div>
            ) : (
              <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  style={{
                    flex:1,minWidth:120,padding:"8px 12px",borderRadius:10,
                    background:"rgba(0,212,255,0.06)",
                    border:"1px solid rgba(0,212,255,0.3)",
                    color:"#fff",fontWeight:700,fontSize:14,fontFamily:"inherit",outline:"none",
                  }}
                />
                <button onClick={saveName} disabled={saving} style={{
                  padding:"8px 16px",borderRadius:10,fontWeight:900,fontSize:12,
                  background:"linear-gradient(135deg,#f5a623,#ffd060)",color:"#000",
                  border:"none",cursor:"pointer",fontFamily:"inherit",
                }}>حفظ</button>
                <button onClick={() => setEditing(false)} style={{
                  padding:"8px 12px",borderRadius:10,fontWeight:800,fontSize:12,
                  background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)",
                  border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",fontFamily:"inherit",
                }}>✕</button>
              </div>
            )}

            {msg && <div style={{fontSize:12,color:"#22c55e",marginBottom:6,fontWeight:700}}>{msg}</div>}

            {/* Currencies */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:900,padding:"3px 10px",borderRadius:99,background:"rgba(245,166,35,0.12)",color:"#f5a623"}}>
                🪙 {(profile.coins??0).toLocaleString()}
              </span>
              <span style={{fontSize:12,fontWeight:900,padding:"3px 10px",borderRadius:99,background:"rgba(155,95,224,0.12)",color:"#9b5fe0"}}>
                💎 {profile.gems??0}
              </span>
            </div>

            {/* XP bar */}
            <div style={{marginBottom:4}}>
              <div style={{height:5,borderRadius:99,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                <motion.div
                  initial={{width:0}} animate={{width:`${xpPct}%`}}
                  transition={{duration:1,ease:"easeOut",delay:0.3}}
                  style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,#f5a623,#ffd060)",boxShadow:"0 0 6px rgba(245,166,35,0.6)"}}
                />
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.28)",fontWeight:700,marginTop:3}}>
                {xp.toLocaleString()} / {maxXp.toLocaleString()} XP — المستوى {level}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.12}}
        style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}
      >
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding:"14px 10px",borderRadius:16,textAlign:"center",
            background:`${s.color}06`,border:`1px solid ${s.color}18`,
          }}>
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontWeight:900,fontSize:"clamp(14px,2.5vw,18px)",color:"#fff",marginBottom:2}}>
              {s.value.toLocaleString()}
            </div>
            <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)"}}>
              {s.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Quick Links ── */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        style={{display:"flex",flexDirection:"column",gap:10}}
      >
        {[
          { label:"🏆 لوائح الشرف",     href:"/leaderboards"  },
          { label:"🎯 البطولات",         href:"/tournaments"   },
          { label:"🎮 تاريخ المباريات",  href:"/profile/matches"},
        ].map(item => (
          <Link key={item.href} href={item.href} style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"14px 16px",borderRadius:16,fontWeight:700,fontSize:14,
            color:"rgba(255,255,255,0.65)",textDecoration:"none",
            background:"rgba(255,255,255,0.03)",
            border:"1px solid rgba(0,212,255,0.08)",
            transition:"all .2s",
          }}>
            {item.label}
            <span style={{color:"rgba(0,212,255,0.35)",fontSize:14}}>‹</span>
          </Link>
        ))}

        <Link href="/auth/logout" style={{
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
          padding:"12px",borderRadius:16,fontWeight:800,fontSize:13,
          color:"rgba(255,45,85,0.7)",textDecoration:"none",
          background:"rgba(255,45,85,0.05)",
          border:"1px solid rgba(255,45,85,0.12)",
          marginTop:4,
        }}>
          تسجيل الخروج
        </Link>
      </motion.div>
    </div>
  );
}
