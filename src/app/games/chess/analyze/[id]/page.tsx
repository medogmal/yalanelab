"use client";
import React, { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { getEval } from "@/lib/chess/stockfish";

type Row = { ply: number; san: string; fen: string; eval?: { type: "cp" | "mate"; value: number } };

function evalToText(e?: { type: "cp" | "mate"; value: number }) {
  if (!e) return "...";
  if (e.type === "mate") return `#${e.value}`;
  const v = (e.value / 100).toFixed(2);
  return (e.value >= 0 ? "+" : "") + v;
}

export default function AnalyzePage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<"free" | "pro" | "elite">("free");

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json());
      if (me?.user?.tier) setTier(me.user.tier);
      const res = await fetch(`/api/chess/match/${id}/pgn`, { cache: "no-store" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const pgn = await res.text();
      const chess = new Chess();
      chess.loadPgn(pgn);
      const v = chess.history({ verbose: true });
      const rowsLocal: Row[] = [];
      const probe = new Chess();
      for (let i = 0; i < v.length; i++) {
        const m = v[i];
        probe.move(m.san);
        rowsLocal.push({ ply: i + 1, san: m.san, fen: probe.fen() });
      }
      setRows(rowsLocal);
      setLoading(false);
      // analyze progressively
      const depth = tier === "elite" ? 20 : tier === "pro" ? 18 : 14;
      for (let i = 0; i < rowsLocal.length; i++) {
        const e = await getEval(rowsLocal[i].fen, { depth });
        setRows((r) => {
          const out = r.slice();
          out[i] = { ...out[i], eval: e };
          return out;
        });
      }
    })();
  }, [id, tier]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">تحليل المباراة</h2>
      {loading && <div className="text-zinc-400">جارٍ تجهيز التحليل...</div>}
      {!loading && (
        <div className="rounded border border-zinc-800 bg-zinc-900 p-4">
          <div className="grid grid-cols-6 gap-2 text-sm text-zinc-300">
            {rows.map((r) => (
              <div
                key={r.ply}
                className={`flex items-center justify-between px-2 py-1 rounded ${r.eval && Math.abs(r.eval.type === "cp" ? r.eval.value : 0) > 150 ? "bg-red-900/40" : "bg-zinc-800"}`}
              >
                <span className="text-zinc-400">{r.ply}.</span>
                <span className="text-white">{r.san}</span>
                <span className="text-emerald-400">{evalToText(r.eval)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <svg width="100%" height="120">
              {rows.map((r, i) => {
                const x = (i / Math.max(1, rows.length - 1)) * 800;
                const val = r.eval?.type === "cp" ? Math.max(-300, Math.min(300, r.eval.value)) : (r.eval?.value || 0) * 300;
                const y = 60 - (val / 300) * 50;
                const next = rows[i + 1];
                if (!next) return null;
                const x2 = ((i + 1) / Math.max(1, rows.length - 1)) * 800;
                const val2 = next.eval?.type === "cp" ? Math.max(-300, Math.min(300, next.eval.value)) : (next.eval?.value || 0) * 300;
                const y2 = 60 - (val2 / 300) * 50;
                return <line key={`l-${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke="#10b981" strokeWidth={2} />;
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
