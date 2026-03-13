"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Entry = {
  id: string; name: string; rating: number; rank: number;
  wins?: number; losses?: number; matches?: number; streak?: number; level?: number;
};

const GAMES = [
  { id: "domino", label: "دومينو", icon: "🁣", color: "#f59e0b", api: "/api/leaderboard/domino?limit=20" },
  { id: "chess",  label: "شطرنج", icon: "♟",  color: "#8b5cf6", api: "/api/leaderboard/chess?limit=20"  },
];

export default function LeaderboardsPage() {
  const [game, setGame] = useState("domino");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const g = GAMES.find(g => g.id === game);
    if (!g) return;
    setLoading(true);
    fetch(g.api, { cache: "no-store" })
      .then(r => r.json())
      .then(d => setEntries(d.items || d.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [game]);

  const active = GAMES.find(g => g.id === game)!;

  return (
    <div style={{ minHeight: "100dvh", background: "#0c0c0e", color: "#f4f4f8", fontFamily: "var(--font-cairo),sans-serif" }} dir="rtl">

      {/* Header */}
      <div style={{ padding: "clamp(32px,5vw,56px) clamp(16px,4vw,28px) 0", maxWidth: 680, margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, fontSize: 12, color: "#7a7a8a", textDecoration: "none", fontWeight: 700 }}>
          ← الرئيسية
        </Link>
        <h1 style={{ fontWeight: 900, fontSize: "clamp(24px,5vw,36px)", color: "#f4f4f8", marginBottom: 6 }}>
          🏆 لوحة الأبطال
        </h1>
        <p style={{ fontSize: 13, color: "#7a7a8a", marginBottom: 28 }}>المتصدرون في كل الألعاب</p>

        {/* Game tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => setGame(g.id)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 18px", borderRadius: 11, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: game === g.id ? g.color : "#131317",
              border: `1px solid ${game === g.id ? "transparent" : "rgba(255,255,255,0.07)"}`,
              color: game === g.id ? (g.color === "#f59e0b" ? "#000" : "#fff") : "#7a7a8a",
              fontWeight: 800, fontSize: 13, transition: "all .15s",
            }}>
              <span style={{ fontSize: 16 }}>{g.icon}</span> {g.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 clamp(16px,4vw,28px) 48px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${active.color}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#131317", borderRadius: 20, border: "1px dashed rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#f4f4f8", marginBottom: 6 }}>لا يوجد لاعبون بعد</div>
            <div style={{ fontSize: 13, color: "#7a7a8a", marginBottom: 20 }}>العب أول مباراة لتظهر هنا!</div>
            <Link href={`/games/${game}/online`} style={{ padding: "10px 22px", borderRadius: 10, background: active.color, color: active.color === "#f59e0b" ? "#000" : "#fff", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
              العب الآن
            </Link>
          </div>
        ) : (
          <>
            {/* Podium top 3 */}
            {entries.length >= 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: 10, marginBottom: 24 }}>
                {[entries[1], entries[0], entries[2]].map((e, i) => {
                  if (!e) return null;
                  const medals = ["🥈", "🥇", "🥉"];
                  const isFirst = i === 1;
                  return (
                    <motion.div key={e.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                      style={{ background: isFirst ? "rgba(245,158,11,0.06)" : "#131317", border: `1px solid ${isFirst ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: "16px 10px", textAlign: "center" }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{medals[i]}</div>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1e1e25", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontWeight: 900, fontSize: 16, color: "#f4f4f8" }}>
                        {e.name?.[0] ?? "?"}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: "#f4f4f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                      <div style={{ fontWeight: 900, fontSize: 14, color: active.color, marginTop: 3 }}>{e.rating}</div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <AnimatePresence>
                {entries.map((e, idx) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.025 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#131317", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 13 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12, flexShrink: 0, background: e.rank <= 3 ? active.color : "#1e1e25", color: e.rank <= 3 && active.color === "#f59e0b" ? "#000" : "#fff" }}>
                      {e.rank}
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "#1e1e25", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                      {e.name?.[0] ?? "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: "#f4f4f8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</div>
                      {e.matches !== undefined && (
                        <div style={{ fontSize: 10, color: "#7a7a8a", marginTop: 1 }}>
                          <span style={{ color: "#22c55e" }}>{e.wins ?? 0}ف</span>
                          <span style={{ color: "#404050", margin: "0 3px" }}>/</span>
                          <span style={{ color: "#ef4444" }}>{e.losses ?? 0}خ</span>
                          <span style={{ color: "#404050", margin: "0 3px" }}>·</span>
                          {e.matches} مباراة
                        </div>
                      )}
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: active.color, flexShrink: 0 }}>{e.rating}</div>
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
