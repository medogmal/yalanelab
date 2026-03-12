"use client";
import React, { useEffect, useState } from "react";

type Item = { id: string; name: string; kind: "daily" | "weekly"; startAt: number; registered: number; maxPlayers: number };

export default function DominoTournamentsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState<number>(0);
  useEffect(() => {
    fetch("/api/domino/tournament/schedule", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.schedule || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  async function register(id: string) {
    const res = await fetch("/api/domino/tournament/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tournamentId: id }) }).then((r) => r.json()).catch(() => null);
    if (res && res.ok) {
      setMsg("تم التسجيل");
    } else {
      setMsg("خطأ في التسجيل أو غير مسموح");
    }
    setTimeout(() => setMsg(null), 2000);
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-silver">بطولات الدومينو</h2>
      {msg && <div className="mb-3 text-indigo-300">{msg}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl p-4 bg-zinc-900 text-white">
            <div className="text-lg mb-1">{it.name}</div>
            <div className="text-sm text-silver mb-2">{it.kind === "daily" ? "يومية" : "أسبوعية"} — يبدأ بعد {Math.max(0, Math.floor((it.startAt - now) / 1000))} ثانية</div>
            <div className="text-sm text-silver mb-2">المتسجلون: {it.registered} / {it.maxPlayers}</div>
            <button className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500" onClick={() => register(it.id)}>تسجيل</button>
          </div>
        ))}
      </div>
    </div>
  );
}
