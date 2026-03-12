"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingUp, Gamepad2, ChevronRight } from "lucide-react";

type Entry = {
  id: string;
  name: string;
  rating: number;
  rank: number;
  wins?: number;
  losses?: number;
  matches?: number;
  streak?: number;
  level?: number;
};

const GAMES = [
  { id: "domino", label: "الدومينو", icon: "🁫", color: "#34d399", api: "/api/leaderboard/domino?limit=20" },
  { id: "chess",  label: "الشطرنج", icon: "♟️", color: "#60a5fa", api: "/api/leaderboard/chess?limit=20"  },
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
      .then(data => setEntries(data.items || data.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [game]);

  const active = GAMES.find(g => g.id === game)!;

  return (
    <div className="min-h-screen bg-[#07090f] text-white" dir="rtl">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-[url('/domino/tables/sultan.png')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07090f]" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-2 gold-shimmer">لوحة الأبطال</h1>
          <p className="text-zinc-400">المتصدرون في كل الألعاب</p>
        </div>
      </div>

      {/* Game Tabs */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="flex gap-3">
          {GAMES.map(g => (
            <button key={g.id} onClick={() => setGame(g.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all ${game === g.id
                ? "text-black scale-105"
                : "glass-dark border border-white/[0.06] text-zinc-400 hover:text-white"}`}
              style={game === g.id ? { background: g.color, boxShadow: `0 4px 20px ${g.color}44` } : {}}>
              <span className="text-xl">{g.icon}</span> {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-6xl mb-4">🏆</div>
            <p className="font-bold">لا يوجد لاعبون بعد</p>
            <p className="text-sm mt-2">العب أول مباراة لتظهر هنا!</p>
            <Link href={`/games/${game}/online`} className="inline-block mt-6 px-8 py-3 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-colors">
              العب الآن
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 Podium */}
            {entries.length >= 3 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[entries[1], entries[0], entries[2]].map((e, i) => {
                  if (!e) return null;
                  const isFirst = i === 1;
                  const medal = ["🥈", "🥇", "🥉"][i];
                  return (
                    <motion.div key={e.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`glass-dark rounded-3xl p-4 text-center border transition-all ${isFirst ? "border-amber-400/40 scale-105" : "border-white/[0.06]"}`}
                      style={isFirst ? { boxShadow: "0 0 30px rgba(245,166,35,0.15)" } : {}}>
                      <div className="text-3xl mb-1">{medal}</div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xl mx-auto mb-2">
                        {e.name?.charAt(0) || "?"}
                      </div>
                      <div className="font-black text-sm truncate">{e.name}</div>
                      <div className="font-mono font-black mt-1" style={{ color: active.color }}>{e.rating}</div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Full List */}
            <AnimatePresence>
              {entries.map((e, idx) => (
                <motion.div key={e.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="glass-dark rounded-2xl p-4 border border-white/[0.06] flex items-center gap-4 hover:border-white/[0.12] transition-colors group">
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0
                    ${e.rank === 1 ? "bg-amber-400 text-black" : e.rank === 2 ? "bg-zinc-300 text-black" : e.rank === 3 ? "bg-orange-700 text-white" : "bg-white/[0.06] text-zinc-400"}`}>
                    {e.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center font-black text-base flex-shrink-0">
                    {e.name?.charAt(0) || "?"}
                  </div>

                  {/* Name + Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm truncate">{e.name}</div>
                    {e.matches !== undefined && (
                      <div className="text-[11px] text-zinc-500 font-bold mt-0.5">
                        <span className="text-emerald-400">{e.wins || 0}ف</span>
                        <span className="mx-1 text-zinc-700">/</span>
                        <span className="text-red-400">{e.losses || 0}خ</span>
                        <span className="mx-1 text-zinc-700">·</span>
                        {e.matches} مباراة
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="font-mono font-black text-lg flex-shrink-0" style={{ color: active.color }}>
                    {e.rating}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
