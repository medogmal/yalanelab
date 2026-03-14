"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Entry = {
  id: string; name: string; rating: number; rank: number;
  wins?: number; losses?: number; matches?: number; streak?: number; level?: number;
};

const GAMES = [
  { id: "domino", label: "دومينو", icon: "🁣", color: "#f59e0b", api: "/api/leaderboard/domino" },
  { id: "chess",  label: "شطرنج", icon: "♟",  color: "#8b5cf6", api: "/api/leaderboard/chess"  },
  { id: "baloot", label: "بلوت",  icon: "🃏", color: "#ec4899", api: "/api/leaderboard/baloot" },
  { id: "ludo",   label: "لودو",  icon: "🎲", color: "#06b6d4", api: "/api/leaderboard/ludo"   },
];

const TIME_FILTERS = [
  { id: "all",   label: "كل الوقت" },
  { id: "month", label: "هذا الشهر" },
  { id: "week",  label: "هذا الأسبوع" },
];

export default function LeaderboardsPage() {
  const [game, setGame]     = useState("domino");
  const [timeFilter, setTimeFilter] = useState("all");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const g = GAMES.find(g => g.id === game);
    if (!g) return;
    setLoading(true);
    fetch(`${g.api}?limit=20&period=${timeFilter}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => setEntries(d.items || d.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [game, timeFilter]);

  const active = GAMES.find(g => g.id === game)!;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">

      {/* ── Header ── */}
      <div style={{ background: "linear-gradient(160deg,#12062e 0%,#0c0c0e 100%)", padding: "clamp(28px,5vw,52px) clamp(16px,4vw,28px) 0" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:5, marginBottom:20, fontSize:12, color:"#7a7a8a", textDecoration:"none", fontWeight:700 }}>
            ← الرئيسية
          </Link>

          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <h1 style={{ fontWeight:900, fontSize:"clamp(24px,5vw,36px)", marginBottom:4 }}>🏆 لوحة الأبطال</h1>
              <p style={{ fontSize:13, color:"#7a7a8a" }}>المتصدرون في كل الألعاب</p>
            </div>
            <div style={{ fontSize:64, opacity:0.08, lineHeight:1 }}>♟</div>
          </div>

          {/* Game tabs */}
          <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:2 }}>
            {GAMES.map(g => (
              <button key={g.id} onClick={() => setGame(g.id)} style={{
                display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:11,
                border:`1px solid ${game===g.id ? "transparent" : "rgba(255,255,255,0.07)"}`,
                background: game===g.id ? g.color : "rgba(255,255,255,0.03)",
                color: game===g.id ? (g.color==="#f59e0b"||g.color==="#06b6d4" ? "#000" : "#fff") : "#7a7a8a",
                fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
                transition:"all .15s", flexShrink:0,
              }}>
                <span>{g.icon}</span> {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"20px clamp(16px,4vw,28px) 48px" }}>

        {/* Time filter */}
        <div style={{ display:"flex", gap:6, marginBottom:24 }}>
          {TIME_FILTERS.map(f => (
            <button key={f.id} onClick={() => setTimeFilter(f.id)} style={{
              padding:"5px 13px", borderRadius:99, cursor:"pointer", fontFamily:"inherit",
              border:`1px solid ${timeFilter===f.id ? "#7c3aed" : "rgba(255,255,255,0.06)"}`,
              background: timeFilter===f.id ? "rgba(124,58,237,0.15)" : "transparent",
              color: timeFilter===f.id ? "#a78bfa" : "#7a7a8a",
              fontWeight:700, fontSize:11, transition:"all .15s",
            }}>{f.label}</button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:"60px 0" }}>
            <div style={{ width:32, height:32, border:`3px solid ${active.color}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty */}
        {!loading && entries.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"#131317", borderRadius:20, border:"1px dashed rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
            <div style={{ fontWeight:800, fontSize:16, color:"#f4f4f8", marginBottom:6 }}>لا يوجد لاعبون بعد</div>
            <div style={{ fontSize:13, color:"#7a7a8a", marginBottom:20 }}>العب أول مباراة لتظهر هنا!</div>
            <Link href={`/games/${game}/online`} style={{ padding:"10px 22px", borderRadius:10, background:active.color, color:active.color==="#f59e0b"||active.color==="#06b6d4"?"#000":"#fff", fontWeight:800, fontSize:13, textDecoration:"none" }}>
              العب الآن
            </Link>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <>
            {/* Podium */}
            {top3.length === 3 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1.15fr 1fr", gap:10, marginBottom:20, alignItems:"flex-end" }}>
                {[top3[1], top3[0], top3[2]].map((e, i) => {
                  const medals = ["🥈","🥇","🥉"];
                  const heights = [90, 110, 80];
                  const isFirst = i === 1;
                  return (
                    <motion.div key={e.id} initial={{ y:20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:i*0.08 }}
                      style={{ background: isFirst ? `${active.color}10` : "#131317", border:`1px solid ${isFirst ? active.color+"30" : "rgba(255,255,255,0.06)"}`, borderRadius:16, padding:"14px 8px", textAlign:"center", paddingTop: isFirst ? 18 : 14 }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>{medals[i]}</div>
                      <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px", fontWeight:900, fontSize:18, color:"#f4f4f8", border:`2px solid ${isFirst ? active.color+"50" : "rgba(255,255,255,0.08)"}` }}>
                        {e.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div style={{ fontWeight:800, fontSize:11, color:"#f4f4f8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>{e.name}</div>
                      <div style={{ fontWeight:900, fontSize:16, color:active.color }}>{e.rating}</div>
                      {e.wins !== undefined && (
                        <div style={{ fontSize:9, color:"#7a7a8a", marginTop:2 }}>{e.wins}ف/{e.losses}خ</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <AnimatePresence>
                {entries.map((e, idx) => (
                  <motion.div key={e.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:idx*0.02 }}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background: e.rank<=3 ? `${active.color}06` : "#131317", border:`1px solid ${e.rank<=3 ? active.color+"18" : "rgba(255,255,255,0.04)"}`, borderRadius:12 }}>

                    {/* Rank badge */}
                    <div style={{ width:26, height:26, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:11, flexShrink:0, background: e.rank===1 ? active.color : e.rank===2 ? "#9ca3af" : e.rank===3 ? "#b45309" : "#1e1e25", color: e.rank<=3 && active.color==="#f59e0b" ? "#000" : "#fff" }}>
                      {e.rank <= 3 ? ["🥇","🥈","🥉"][e.rank-1] : e.rank}
                    </div>

                    {/* Avatar */}
                    <div style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, flexShrink:0, color:"#f4f4f8" }}>
                      {e.name?.[0]?.toUpperCase() ?? "?"}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:"#f4f4f8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.name}</div>
                      {e.matches !== undefined && (
                        <div style={{ fontSize:10, color:"#7a7a8a", marginTop:1 }}>
                          <span style={{ color:"#22c55e" }}>{e.wins ?? 0}ف</span>
                          <span style={{ color:"#404050", margin:"0 3px" }}>/</span>
                          <span style={{ color:"#ef4444" }}>{e.losses ?? 0}خ</span>
                          {e.matches > 0 && <span style={{ color:"#404050", marginRight:5 }}> · {e.matches} لعبة</span>}
                        </div>
                      )}
                    </div>

                    {/* Streak badge */}
                    {e.streak !== undefined && e.streak >= 3 && (
                      <div style={{ padding:"2px 7px", borderRadius:99, background:"rgba(249,115,22,0.12)", border:"1px solid rgba(249,115,22,0.2)", fontSize:10, fontWeight:800, color:"#f97316", flexShrink:0 }}>
                        🔥{e.streak}
                      </div>
                    )}

                    {/* Rating */}
                    <div style={{ fontWeight:900, fontSize:15, color:active.color, flexShrink:0 }}>{e.rating}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
