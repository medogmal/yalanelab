import { Chess } from "chess.js";
import { randomUUID } from "crypto";
import { appendFinished } from "./store";
import { applyEloResult, loadUsers } from "../auth/store";
import type { User } from "../auth/store";

export type TimeControl = { baseMin: number; incSec: number };
export type Player = { id: string; name: string; joinedAt: number; preferTc?: TimeControl; userId?: string };
export type MatchEvent =
  | { seq: number; type: "start"; payload: { w: string; b: string } }
  | { seq: number; type: "move"; payload: { from: string; to: string; fen: string; turn: "w" | "b" } }
  | { seq: number; type: "end"; payload: { result: "1-0" | "0-1" | "1/2-1/2"; reason: string } };

export type Match = {
  id: string;
  w: Player;
  b: Player;
  chess: Chess;
  createdAt: number;
  seq: number;
  events: MatchEvent[];
  time: TimeControl;
  timeW: number;
  timeB: number;
  lastTurnAt: number | null;
};

type Memory = {
  lobby: Map<string, Player>;
  matches: Map<string, Match>;
};

declare global {
  var __CHESS_MEM__: Memory | undefined;
}

export function getMemory(): Memory {
  if (!global.__CHESS_MEM__) {
    global.__CHESS_MEM__ = { lobby: new Map(), matches: new Map() };
  }
  return global.__CHESS_MEM__;
}

export function joinLobby(name: string, tc?: TimeControl, userId?: string): Player {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), preferTc: tc, userId };
  mem.lobby.set(p.id, p);
  return p;
}

export function leaveLobby(id: string) {
  const mem = getMemory();
  mem.lobby.delete(id);
}

export function pairPlayers(): Match | null {
  const mem = getMemory();
  const players = Array.from(mem.lobby.values());
  if (players.length < 2) return null;
  const byTc: Map<string, Player[]> = new Map();
  for (const p of players) {
    const key = `${p.preferTc?.baseMin ?? 5}+${p.preferTc?.incSec ?? 2}`;
    const existing = byTc.get(key);
    if (existing) {
      existing.push(p);
    } else {
      byTc.set(key, [p]);
    }
  }
  let picked: [Player, Player] | null = null;
  for (const [, arr] of byTc.entries()) {
    if (arr.length < 2) continue;
    const users = loadUsers();
    const ratingOf = (uid?: string) => {
      const u = uid ? users.find((x: User) => x.id === uid) : null;
      return u ? u.ratings.chess : 1200;
    };
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const r1 = ratingOf(arr[i].userId);
        const r2 = ratingOf(arr[j].userId);
        const diff = Math.abs(r1 - r2);
        if (diff < bestDiff) {
          bestDiff = diff;
          picked = [arr[i], arr[j]];
        }
      }
    }
    if (picked) break;
  }
  if (!picked) return null;
  const [a, b] = picked as [Player, Player];
  mem.lobby.delete(a.id);
  mem.lobby.delete(b.id);
  const chess = new Chess();
  const id = randomUUID();
  const tc: TimeControl = a.preferTc || b.preferTc || { baseMin: 5, incSec: 2 };
  const match: Match = {
    id,
    w: a,
    b: b,
    chess,
    createdAt: Date.now(),
    seq: 0,
    events: [],
    time: tc,
    timeW: tc.baseMin * 60_000,
    timeB: tc.baseMin * 60_000,
    lastTurnAt: Date.now(),
  };
  match.events.push({ seq: ++match.seq, type: "start", payload: { w: a.name, b: b.name } });
  mem.matches.set(id, match);
  return match;
}

export function getMatch(id: string): Match | null {
  return getMemory().matches.get(id) || null;
}

export function pushMove(id: string, side: "w" | "b", from: string, to: string, promotion?: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const turn = match.chess.turn();
  if (turn !== side) return { ok: false, error: "not_your_turn" as const };
  // update clock for the side that just moved
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (side === "w") {
      match.timeW = Math.max(0, match.timeW - elapsed + match.time.incSec * 1000);
    } else {
      match.timeB = Math.max(0, match.timeB - elapsed + match.time.incSec * 1000);
    }
  }
  const mv = match.chess.move({ from, to, promotion });
  if (!mv) return { ok: false, error: "illegal_move" as const };
  const fen = match.chess.fen();
  match.lastTurnAt = Date.now();
  match.events.push({ seq: ++match.seq, type: "move", payload: { from, to, fen, turn: match.chess.turn() as "w" | "b" } });
  // end detection and persistence
  if (match.chess.isGameOver()) {
    let result: "1-0" | "0-1" | "1/2-1/2" = "1/2-1/2";
    let reason = "draw";
    if (match.chess.isCheckmate()) {
      reason = "checkmate";
      result = match.chess.turn() === "b" ? "1-0" : "0-1";
    } else if (match.chess.isDraw()) {
      reason = "draw";
    } 
    match.events.push({ seq: ++match.seq, type: "end", payload: { result, reason } });
    // persist finished
    appendFinished({
      id: match.id,
      wName: match.w.name,
      bName: match.b.name,
      wUserId: match.w.userId,
      bUserId: match.b.userId,
      result,
      reason,
      pgn: match.chess.pgn(),
      createdAt: match.createdAt,
      finishedAt: Date.now(),
      time: match.time,
    });
    // ratings update
    if (result === "1-0") applyEloResult(match.w.userId, match.b.userId, false);
    else if (result === "0-1") applyEloResult(match.b.userId, match.w.userId, false);
    else applyEloResult(match.w.userId, match.b.userId, true);
  }
  return { ok: true, fen };
}

export function getEvents(id: string, sinceSeq: number) {
  const match = getMatch(id);
  if (!match) return { seq: sinceSeq, events: [] as MatchEvent[] };
  const events = match.events.filter((e) => e.seq > sinceSeq);
  return { seq: match.seq, events };
}
