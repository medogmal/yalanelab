import { Chess } from "chess.js";

type SFEngine = {
  postMessage: (msg: string) => void;
  onmessage: (line: string) => void;
};
let engineInitMove: Promise<void> | null = null;
let engineInitEval: Promise<void> | null = null;
let engineMove: SFEngine | null = null;
let engineEval: SFEngine | null = null;

async function createEngine(): Promise<SFEngine | null> {
  if (typeof window === "undefined") return null;
  const w = new Worker("/stockfish/stockfish-worker.js", { type: "classic" });
  const wrapper: SFEngine = {
    postMessage: (msg: string) => w.postMessage(msg),
    onmessage: () => {},
  };
  w.onmessage = (e: MessageEvent) => {
    const data = typeof e.data === "string" ? e.data : String(e.data);
    wrapper.onmessage(data);
  };
  return wrapper;
}

export type StockfishOpts = {
  skill?: number; // 0-20
  depth?: number; // search depth
};

function ensureMoveEngine() {
  return (async () => {
    if (!engineMove) {
      engineMove = await createEngine();
      if (!engineMove) throw new Error("stockfish_unavailable");
      engineInitMove = new Promise<void>((resolve) => {
        if (!engineMove) return resolve();
        engineMove.onmessage = (line: string) => {
          if (line.includes("uciok")) resolve();
        };
        engineMove.postMessage("uci");
      });
      await engineInitMove;
    }
  })();
}

function ensureEvalEngine() {
  return (async () => {
    if (!engineEval) {
      engineEval = await createEngine();
      if (!engineEval) throw new Error("stockfish_unavailable");
      engineInitEval = new Promise<void>((resolve) => {
        if (!engineEval) return resolve();
        engineEval.onmessage = (line: string) => {
          if (line.includes("uciok")) resolve();
        };
        engineEval.postMessage("uci");
      });
      await engineInitEval;
    }
  })();
}

export async function getBestMove(fen: string, opts: StockfishOpts = {}) {
  await ensureMoveEngine();
  const skill = Math.max(0, Math.min(18, opts.skill ?? 10));
  const depth = Math.max(8, Math.min(20, opts.depth ?? 12));
  engineMove!.postMessage(`setoption name Skill Level value ${skill}`);
  engineMove!.postMessage(`position fen ${fen}`);
  return new Promise<string>((resolve) => {
    if (!engineMove) return resolve("0000");
    engineMove.onmessage = (line: string) => {
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        resolve(parts[1]);
      }
    };
    engineMove!.postMessage(`go depth ${depth}`);
  });
}

export async function getEval(fen: string, opts: StockfishOpts = {}) {
  await ensureEvalEngine();
  const depth = Math.max(8, Math.min(20, opts.depth ?? 12));
  return new Promise<{ type: "cp" | "mate"; value: number }>((resolve) => {
    if (!engineEval) return resolve({ type: "cp", value: 0 });
    let lastScore: { type: "cp" | "mate"; value: number } = { type: "cp", value: 0 };
    engineEval.onmessage = (line: string) => {
      if (line.startsWith("info") && line.includes("score")) {
        const mMate = line.match(/score\s+mate\s+(-?\d+)/);
        if (mMate) lastScore = { type: "mate", value: parseInt(mMate[1], 10) };
        const mCp = line.match(/score\s+cp\s+(-?\d+)/);
        if (mCp) lastScore = { type: "cp", value: parseInt(mCp[1], 10) };
      }
      if (line.startsWith("bestmove")) {
        resolve(lastScore);
      }
    };
    engineEval.postMessage(`position fen ${fen}`);
    engineEval.postMessage(`go depth ${depth}`);
  });
}

function uciToSan(fen: string, pv: string[]) {
  const ch = new Chess(fen);
  const out: string[] = [];
  for (const u of pv) {
    const from = u.slice(0, 2);
    const to = u.slice(2, 4);
    const promotion = u.length >= 5 ? u.slice(4, 5) : undefined;
    const res = ch.move({ from, to, promotion });
    if (!res) break;
    out.push(res.san);
  }
  return out;
}

export async function getAnalysis(fen: string, opts: StockfishOpts = {}) {
  await ensureEvalEngine();
  const depth = Math.max(8, Math.min(20, opts.depth ?? 12));
  return new Promise<{ best: string; score: { type: "cp" | "mate"; value: number }; pvUci: string[]; pvSan: string[] }>((resolve) => {
    if (!engineEval) return resolve({ best: "0000", score: { type: "cp", value: 0 }, pvUci: [], pvSan: [] });
    let lastScore: { type: "cp" | "mate"; value: number } = { type: "cp", value: 0 };
    let lastPv: string[] = [];
    engineEval.onmessage = (line: string) => {
      if (line.startsWith("info")) {
        const mMate = line.match(/score\s+mate\s+(-?\d+)/);
        if (mMate) lastScore = { type: "mate", value: parseInt(mMate[1], 10) };
        const mCp = line.match(/score\s+cp\s+(-?\d+)/);
        if (mCp) lastScore = { type: "cp", value: parseInt(mCp[1], 10) };
        const mPv = line.match(/\spv\s+([a-h][1-8][a-h][1-8][qrbn]?(?:\s+[a-h][1-8][a-h][1-8][qrbn]?)*?)\s*$/);
        if (mPv) {
          lastPv = mPv[1].trim().split(/\s+/);
        }
      }
      if (line.startsWith("bestmove")) {
        const parts = line.split(" ");
        const best = parts[1] || "0000";
        const pvSan = lastPv.length ? uciToSan(fen, lastPv) : [];
        resolve({ best, score: lastScore, pvUci: lastPv, pvSan });
      }
    };
    engineEval.postMessage(`position fen ${fen}`);
    engineEval.postMessage(`go depth ${depth}`);
  });
}
