"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; w: string; b: string; turn: "w" | "b"; time: { baseMin: number; incSec: number }; timeW: number; timeB: number; createdAt: number };

function msToClock(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BrowseMatchesPage() {
  const [matches, setMatches] = useState<Item[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/chess/matches", { cache: "no-store" });
      const data = await res.json();
      setMatches(data.matches || []);
    })();
  }, []);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">مباريات جارية</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((m) => (
          <div key={m.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
            <div className="font-semibold text-white mb-2">{m.w} ضد {m.b}</div>
            <div className="text-zinc-400 text-sm mb-2">الوقت: {m.time.baseMin}+{m.time.incSec}</div>
            <div className="text-zinc-300 text-sm">أبيض: {msToClock(m.timeW)} — أسود: {msToClock(m.timeB)}</div>
            <div className="mt-3">
              <Link href={`/games/chess/watch/${m.id}`} className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white">مشاهدة</Link>
            </div>
          </div>
        ))}
        {matches.length === 0 && <div className="text-zinc-400">لا توجد مباريات حاليًا.</div>}
      </div>
    </div>
  );
}
