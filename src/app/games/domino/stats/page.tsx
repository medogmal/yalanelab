"use client";
import React, { useEffect, useState } from "react";

export default function DominoStatsPage() {
  type Stats = {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    longestWinStreak: number;
    avgDurationSec: number;
    rating: number;
    level: number;
    xp: number;
    error?: string;
  };
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/domino/stats/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-silver">إحصائياتك (دومينو)</h2>
      {!stats ? (
        <div className="text-silver">جارٍ التحميل...</div>
      ) : stats.error ? (
        <div className="text-rose-400">الرجاء تسجيل الدخول</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-4 bg-zinc-900 text-white">
            <div>المباريات: {stats.matches}</div>
            <div>الفوز: {stats.wins} — التعادل: {stats.draws} — الخسارة: {stats.losses}</div>
            <div>نسبة الفوز: {stats.winRate}%</div>
            <div>أطول سلسلة انتصارات: {stats.longestWinStreak}</div>
            <div>متوسط زمن المباراة: {stats.avgDurationSec} ثانية</div>
          </div>
          <div className="rounded-xl p-4 bg-zinc-900 text-white">
            <div>الرانك: {stats.rating}</div>
            <div>المستوى: {stats.level}</div>
            <div>إجمالي XP: {stats.xp}</div>
          </div>
        </div>
      )}
    </div>
  );
}
