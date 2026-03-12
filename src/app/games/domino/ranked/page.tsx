"use client";
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import DominoBoardOnline2D from "@/components/domino/DominoBoardOnline2D";

function Inner() {
  const params = useSearchParams();
  const [name, setName] = useState(() => (params.get("auto") === "1" ? "لاعب" : ""));
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(null);
  const [match, setMatch] = useState<{ id: string; a: string; b: string } | null>(null);
  const [side, setSide] = useState<"a" | "b">("a");

  const join = useCallback(async (overrideName?: string) => {
    const n = overrideName ?? name;
    const res = await fetch("/api/domino/lobby", { method: "POST", body: JSON.stringify({ name: n, mode: "ranked" }), headers: { "Content-Type": "application/json" } });
    const data = await res.json();
    setPlayer({ id: data.player.id, name: data.player.name });
    if (data.match) {
      const m = data.match;
      setMatch({ id: m.id, a: m.a.name, b: m.b.name });
      setSide(m.a.id === data.player.id ? "a" : "b");
    }
  }, [name]);

  useEffect(() => {
    const auto = params.get("auto");
    if (auto === "1" && !player) {
      (async () => {
        await join(name || "لاعب");
      })();
    }
  }, [params, player, join, name]);

  useEffect(() => {
    let timer: number | undefined;
    const playerId = player?.id;
    const matchId = match?.id;
    async function waitForPair() {
      if (!playerId || matchId) return;
      const res = await fetch(`/api/domino/lobby?playerId=${playerId}`, { cache: "no-store" });
      const data = await res.json();
      if (data.match) {
        const m = data.match;
        setMatch({ id: m.id, a: m.a.name, b: m.b.name });
        setSide(m.a.id === playerId ? "a" : "b");
      }
      timer = window.setTimeout(waitForPair, 1200);
    }
    waitForPair();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [player?.id, match?.id]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-silver">رانكد (دومينو)</h2>
      {!player && (
        <div className="flex items-center gap-3 mb-6">
          <input className="px-3 py-2 rounded bg-zinc-800 text-white" placeholder="اسمك" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="px-3 py-2 rounded btn-primary" onClick={() => { void join(); }}>
            انضم للرانكد
          </button>
        </div>
      )}
      {match ? (
        <>
          <div className="mb-3 text-sm text-silver">المباراة: {match.id} — اللاعب A: {match.a} — اللاعب B: {match.b}</div>
          {player && <DominoBoardOnline2D matchId={match.id} playerId={player.id} initialSide={side} />}
        </>
      ) : (
        <div className="text-silver">في انتظار مطابقة خصم رانكد...</div>
      )}
    </div>
  );
}

export default function DominoRankedPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 text-silver">جارٍ التحميل...</div>}>
      <Inner />
    </Suspense>
  );
}
