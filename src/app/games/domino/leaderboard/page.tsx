"use client";
import React, { useEffect, useState } from "react";
import { Trophy, Star, Swords, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type LeaderEntry = {
  id: string; name: string; rating: number; rank: number;
  wins: number; losses: number; matches: number; level: number; streak?: number;
};

const MEDAL = ["🥇", "🥈", "🥉"];

export default function DominoLeaderboardPage() {
  const [items, setItems] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/leaderboard/domino?limit=50", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen text-white pb-20"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d2e1c 0%, #07090f 60%)" }}>

      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ background: "rgba(7,9,15,0.85)" }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/games/domino/online"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            رجوع
          </Link>
          <div className="flex items-center gap-2 font-black text-lg">
            <Trophy size={20} className="text-amber-400" />
            <span className="gold-shimmer">المتصدرون</span>
          </div>
          <button onClick={load} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-zinc-400">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Top 3 podium */}
        {items.length >= 3 && (
          <div className="flex items-end justify-center gap-3 mb-8">
            {[items[1], items[0], items[2]].map((p, i) => {
              const height = i === 1 ? "h-28" : "h-20";
              const order = i === 1 ? "order-2" : i === 0 ? "order-1" : "order-3";
              const medal = i === 1 ? "🥇" : i === 0 ? "🥈" : "🥉";
              return (
                <motion.div key={p.id}
                  initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className={`flex-1 max-w-[120px] flex flex-col items-center gap-2 ${order}`}>
                  <div className="text-3xl">{medal}</div>
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl border border-white/10">
                    🎮
                  </div>
                  <div className="text-center">
                    <div className="font-black text-sm truncate max-w-[100px]">{p.name}</div>
                    <div className="text-amber-400 font-black text-base">{p.rating}</div>
                  </div>
                  <div className={`w-full rounded-t-xl ${height} flex items-center justify-center`}
                    style={{ background: i === 1 ? "linear-gradient(to top, #f5c842, #f5a623)" : i === 0 ? "rgba(192,192,192,0.2)" : "rgba(180,110,30,0.2)",
                      border: `1px solid ${i === 1 ? "#f5c842" : i === 0 ? "rgba(192,192,192,0.3)" : "rgba(180,110,30,0.3)"}` }}>
                    <span className="font-black text-lg" style={{ color: i === 1 ? "#1a0d00" : "white" }}>
                      #{p.rank}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-amber-400 font-bold text-sm">جاري التحميل...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Swords size={48} className="mx-auto mb-4 text-zinc-700" />
            <p className="text-zinc-500 font-bold">لا يوجد لاعبون بعد</p>
            <p className="text-zinc-600 text-sm mt-1">العب أول مباراة لتظهر هنا!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(3).map((p, i) => (
              <motion.div key={p.id}
                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.06] hover:border-white/[0.12] transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="w-8 text-center font-black text-sm text-zinc-500">#{p.rank}</span>
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg">🎮</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 font-bold">
                    <span className="text-green-400">{p.wins}ف</span> · <span className="text-red-400">{p.losses}خ</span> · {p.matches} مباراة
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-black">{p.rating}</div>
                  <div className="text-[10px] text-zinc-600">ELO</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
