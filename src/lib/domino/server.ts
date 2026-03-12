import { randomUUID } from "crypto";
import { DominoGame, Domino, Side } from "./game";
import { applyDominoEloResult, grantXp, grantCoins, loadUsers, recordDominoMatch, spendCoins, type User } from "../auth/store";

export type Player = { id: string; name: string; joinedAt: number; userId?: string };
export type MatchEvent =
  | { seq: number; type: "start"; payload: { a: string; b: string } }
  | { seq: number; type: "move"; payload: { by: "a" | "b"; side: Side; tile: Domino; turn: "a" | "b"; chainLen: number } }
  | { seq: number; type: "end"; payload: { winner?: "a" | "b"; reason: "win" | "blocked"; scoreA: number; scoreB: number } };

export type Match = {
  id: string;
  a: Player;
  b: Player;
  game: DominoGame;
  createdAt: number;
  seq: number;
  events: MatchEvent[];
  lastTurnAt: number | null;
  timeSec: number;
  timeA: number;
  timeB: number;
  pot?: number;
};

type Memory = {
  lobby: Map<string, Player>;
  matches: Map<string, Match>;
  highStakesQueue: Player[];
};

declare global {
  var __DOMINO_MEM__: Memory | undefined;
}

export function getMemory(): Memory {
  if (!global.__DOMINO_MEM__) {
    global.__DOMINO_MEM__ = { lobby: new Map(), matches: new Map(), highStakesQueue: [] };
  }
  return global.__DOMINO_MEM__;
}

export function joinLobby(name: string, userId?: string): Player {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId };
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
  // pair by closest domino rating
  const users = loadUsers();
  const ratingOf = (uid?: string) => {
    const u = uid ? users.find((x: User) => x.id === uid) : null;
    return u ? u.ratings.domino : 1200;
  };
  let bestPair: [Player, Player] | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const r1 = ratingOf(players[i].userId);
      const r2 = ratingOf(players[j].userId);
      const diff = Math.abs(r1 - r2);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestPair = [players[i], players[j]];
      }
    }
  }
  if (!bestPair) return null;
  const [a, b] = bestPair;
  mem.lobby.delete(a.id);
  mem.lobby.delete(b.id);
  const game = new DominoGame();
  const id = randomUUID();
  const match: Match = {
    id,
    a,
    b,
    game,
    createdAt: Date.now(),
    seq: 0,
    events: [],
    lastTurnAt: Date.now(),
    timeSec: 180,
    timeA: 180_000,
    timeB: 180_000,
    pot: undefined,
  };
  match.events.push({ seq: ++match.seq, type: "start", payload: { a: a.name, b: b.name } });
  mem.matches.set(id, match);
  return match;
}

export function startMatch(a: Player, b: Player): Match {
  const mem = getMemory();
  const game = new DominoGame();
  const id = randomUUID();
  const match: Match = {
    id,
    a,
    b,
    game,
    createdAt: Date.now(),
    seq: 0,
    events: [],
    lastTurnAt: Date.now(),
    timeSec: 180,
    timeA: 180_000,
    timeB: 180_000,
    pot: undefined,
  };
  match.events.push({ seq: ++match.seq, type: "start", payload: { a: a.name, b: b.name } });
  mem.matches.set(id, match);
  return match;
}

export function joinHighStakes(name: string, userId?: string): { player: Player; match?: Match } {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId };
  mem.highStakesQueue.push(p);
  if (mem.highStakesQueue.length >= 2) {
    const a = mem.highStakesQueue.shift()!;
    const b = mem.highStakesQueue.shift()!;
    if (a.userId) {
      const ok = spendCoins(a.userId, 5000);
      if (!ok) return { player: p };
    }
    if (b.userId) {
      const ok = spendCoins(b.userId, 5000);
      if (!ok) return { player: p };
    }
    const m = startMatch(a, b);
    m.pot = 10_000;
    mem.matches.set(m.id, m);
    return { player: p, match: m };
  }
  return { player: p };
}

export function getMatch(id: string): Match | null {
  return getMemory().matches.get(id) || null;
}

export function getState(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return null;
  const side = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : null;
  if (!side) return null;
  const game = match.game;
  let timeA = match.timeA;
  let timeB = match.timeB;
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (game.turn === "player") timeA = Math.max(0, match.timeA - elapsed);
    else timeB = Math.max(0, match.timeB - elapsed);
  }
  // timeout handling
  if ((game.turn === "player" && timeA <= 0) || (game.turn === "ai" && timeB <= 0)) {
    const winner = game.turn === "player" ? "b" : "a";
    match.events.push({ seq: ++match.seq, type: "end", payload: { winner, reason: "win", scoreA: 0, scoreB: 0 } });
    const wId = winner === "a" ? match.a.userId : match.b.userId;
    const lId = winner === "a" ? match.b.userId : match.a.userId;
    applyDominoEloResult(wId, lId, false);
    if (wId) grantXp(wId, 50);
    if (lId) grantXp(lId, 0);
    if (wId) grantCoins(wId, 200);
    if (lId) grantCoins(lId, 50);
    if (match.a.userId) recordDominoMatch(match.a.userId, winner === "a" ? "win" : "loss");
    if (match.b.userId) recordDominoMatch(match.b.userId, winner === "b" ? "win" : "loss");
  }
  const myHand = side === "a" ? game.hands.player : game.hands.ai;
  const oppCount = side === "a" ? game.hands.ai.length : game.hands.player.length;
  return {
    id: match.id,
    chain: game.chain,
    turn: game.turn === "player" ? "a" : "b",
    boneyard: game.boneyard.length,
    myHand,
    oppCount,
    timeSec: match.timeSec,
    timeA,
    timeB,
  };
}

export function pushMove(id: string, forPlayerId: string, tile: Domino, side: Side) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const pid = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : null;
  if (!pid) return { ok: false, error: "not_participant" as const };
  const game = match.game;
  const turn = game.turn === "player" ? "a" : "b";
  if (pid !== turn) return { ok: false, error: "not_your_turn" as const };
  // update clock for side that just moved
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (pid === "a") {
      match.timeA = Math.max(0, match.timeA - elapsed);
    } else {
      match.timeB = Math.max(0, match.timeB - elapsed);
    }
  }
  const original = pid === "a" ? game.hands.player.find((t) => t.a === tile.a && t.b === tile.b || t.a === tile.b && t.b === tile.a) : game.hands.ai.find((t) => t.a === tile.a && t.b === tile.b || t.a === tile.b && t.b === tile.a);
  if (!original) return { ok: false, error: "tile_not_in_hand" as const };
  const ok = game.play(pid === "a" ? "player" : "ai", original, side);
  if (!ok) return { ok: false, error: "illegal_move" as const };
  match.lastTurnAt = Date.now();
  match.events.push({ seq: ++match.seq, type: "move", payload: { by: pid, side, tile: original, turn: game.turn === "player" ? "a" : "b", chainLen: game.chain.length } });
  // end detection and persistence
  const st = game.status();
  if (st.ended) {
    const winner = st.winner === "player" ? "a" : st.winner === "ai" ? "b" : undefined;
    match.events.push({
      seq: ++match.seq,
      type: "end",
      payload: { winner, reason: (st.reason || "blocked") as "win" | "blocked", scoreA: st.scorePlayer || 0, scoreB: st.scoreAi || 0 },
    });
    // rating + xp
    const wId = winner === "a" ? match.a.userId : winner === "b" ? match.b.userId : undefined;
    const lId = winner === "a" ? match.b.userId : winner === "b" ? match.a.userId : undefined;
    if (winner) {
      applyDominoEloResult(wId, lId, false);
      if (wId) grantXp(wId, 50);
      if (lId) grantXp(lId, 10);
      if (match.pot && match.pot > 0) {
        if (wId) grantCoins(wId, match.pot);
      } else {
        if (wId) grantCoins(wId, 200);
        if (lId) grantCoins(lId, 50);
      }
    } else {
      applyDominoEloResult(match.a.userId, match.b.userId, true);
      if (match.a.userId) grantXp(match.a.userId, 20);
      if (match.b.userId) grantXp(match.b.userId, 20);
      if (!match.pot || match.pot <= 0) {
        if (match.a.userId) grantCoins(match.a.userId, 100);
        if (match.b.userId) grantCoins(match.b.userId, 100);
      }
    }
    if (match.a.userId) recordDominoMatch(match.a.userId, winner === "a" ? "win" : winner ? "loss" : "draw");
    if (match.b.userId) recordDominoMatch(match.b.userId, winner === "b" ? "win" : winner ? "loss" : "draw");
  }
  return { ok: true };
}

export function drawIfNeeded(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const pid = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : null;
  if (!pid) return { ok: false, error: "not_participant" as const };
  const game = match.game;
  const side = pid === "a" ? "player" : "ai";
  const moved = game.drawToFit(side);
  return { ok: true, moved, handCount: side === "player" ? game.hands.player.length : game.hands.ai.length };
}

export function getEvents(id: string, sinceSeq: number) {
  const match = getMatch(id);
  if (!match) return { seq: sinceSeq, events: [] as MatchEvent[] };
  const events = match.events.filter((e) => e.seq > sinceSeq);
  return { seq: match.seq, events };
}

export function resign(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const winner = match.a.id === forPlayerId ? "b" : match.b.id === forPlayerId ? "a" : null;
  if (!winner) return { ok: false, error: "not_participant" as const };
  match.events.push({ seq: ++match.seq, type: "end", payload: { winner, reason: "win", scoreA: 0, scoreB: 0 } });
  const wId = winner === "a" ? match.a.userId : match.b.userId;
  const lId = winner === "a" ? match.b.userId : match.a.userId;
  applyDominoEloResult(wId, lId, false);
  if (wId) grantXp(wId, 50);
  if (lId) grantXp(lId, 0);
  if (match.a.userId) recordDominoMatch(match.a.userId, winner === "a" ? "win" : "loss");
  if (match.b.userId) recordDominoMatch(match.b.userId, winner === "b" ? "win" : "loss");
  return { ok: true };
}
