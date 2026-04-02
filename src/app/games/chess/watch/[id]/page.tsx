"use client";
import React, { useEffect, useRef, useState } from "react";
import ChessBoard2D from "@/components/chess/ChessBoard2D";
import { getEval } from "@/lib/chess/stockfish";

type MatchState = { id: string; fen: string; turn: "w" | "b"; w: string; b: string; seq: number };

export default function WatchMatchPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [state, setState] = useState<MatchState | null>(null);
  const seqRef = useRef(0);
  const [tier, setTier] = useState<"free" | "pro" | "elite">("free");
  const [liveEval, setLiveEval] = useState<{ type: "cp" | "mate"; value: number } | null>(null);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      if (me?.user?.tier) setTier(me.user.tier);
      const res = await fetch(`/api/chess/match/${id}/state`, { cache: "no-store" });
      if (res.ok) {
        const s = await res.json();
        setState({ id, fen: s.fen, turn: s.turn, w: s.w, b: s.b, seq: s.seq });
        seqRef.current = s.seq;
      }
    })();
  }, [id]);

  useEffect(() => {
    let timer: number | undefined;
    async function poll() {
      const res = await fetch(`/api/chess/match/${id}/events?since=${seqRef.current}`, { cache: "no-store" });
      const data = await res.json();
      seqRef.current = data.seq;
      for (const ev of data.events) {
        if (ev.type === "move") {
          setState((s) => (s ? { ...s, fen: ev.payload.fen, turn: ev.payload.turn } : s));
          if (tier !== "free") {
            try {
              const e = await getEval(ev.payload.fen, { depth: tier === "elite" ? 18 : 16 });
              setLiveEval(e);
            } catch {}
          }
        }
      }
      timer = window.setTimeout(poll, 1000);
    }
    poll();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [id, tier]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">مشاهدة مباراة</h2>
      {state ? (
        <>
          <div className="mb-3 text-sm text-zinc-300">الأبيض: {state.w} — الأسود: {state.b}</div>
          {tier !== "free" && (
            <div className="mb-3 text-sm">
              <div className="h-3 w-full bg-zinc-800 rounded overflow-hidden">
                <div
                  className="h-3 bg-emerald-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, 50 + ((liveEval?.type === "cp" ? liveEval.value : (liveEval?.value || 0) * 300) / 600) * 100))}%`,
                  }}
                />
              </div>
              <div className="text-zinc-400 mt-1">تقييم لحظي: {liveEval ? (liveEval.type === "mate" ? `#${liveEval.value}` : (liveEval.value >= 0 ? "+" : "") + (liveEval.value / 100).toFixed(2)) : "..."}</div>
            </div>
          )}
          <ChessBoard2D externalFen={state.fen} />
        </>
      ) : (
        <div className="text-zinc-400">جارٍ تحميل المباراة...</div>
      )}
    </div>
  );
}
