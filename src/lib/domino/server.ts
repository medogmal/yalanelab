import { randomUUID } from "crypto";
import { DominoGame, type Tile, type Side } from "./game";
import {
  applyDominoEloResult, grantXp, grantCoins,
  loadUsers, recordDominoMatch, spendCoins, type User,
} from "../auth/store";

export type Player = { id: string; name: string; joinedAt: number; userId?: string };

export type MatchEvent =
  | { seq: number; type: "start";  payload: { a: string; b: string } }
  | { seq: number; type: "move";   payload: { by: "a" | "b"; side: Side; tile: Tile; turn: "a" | "b"; chainLen: number } }
  | { seq: number; type: "draw";   payload: { by: "a" | "b" } }
  | { seq: number; type: "pass";   payload: { by: "a" | "b" } }
  | { seq: number; type: "end";    payload: { winner?: "a" | "b"; reason: "win" | "blocked"; scoreA: number; scoreB: number } };

export type Match = {
  id:          string;
  a:           Player;
  b:           Player;
  game:        DominoGame;
  createdAt:   number;
  seq:         number;
  events:      MatchEvent[];
  lastTurnAt:  number | null;
  timeSec:     number;
  timeA:       number;
  timeB:       number;
  pot?:        number;
};

/* ══════════════════════════════════════════════════════════════
   IN-MEMORY STORE (survive Next.js hot reload)
══════════════════════════════════════════════════════════════ */
type Memory = {
  lobby:            Map<string, Player>;
  matches:          Map<string, Match>;
  highStakesQueue:  Player[];
};

declare global { var __DOMINO_MEM__: Memory | undefined; }

export function getMemory(): Memory {
  if (!global.__DOMINO_MEM__) {
    global.__DOMINO_MEM__ = {
      lobby:           new Map(),
      matches:         new Map(),
      highStakesQueue: [],
    };
  }
  return global.__DOMINO_MEM__;
}

/* ══════════════════════════════════════════════════════════════
   LOBBY
══════════════════════════════════════════════════════════════ */
export function joinLobby(name: string, userId?: string): Player {
  const mem = getMemory();
  const p: Player = {
    id:       randomUUID(),
    name:     name.trim() || "لاعب",
    joinedAt: Date.now(),
    userId,
  };
  mem.lobby.set(p.id, p);
  return p;
}

export function leaveLobby(id: string) {
  getMemory().lobby.delete(id);
}

/* ══════════════════════════════════════════════════════════════
   MATCHMAKING — بالـ ELO rating
══════════════════════════════════════════════════════════════ */
export function pairPlayers(): Match | null {
  const mem = getMemory();
  const players = Array.from(mem.lobby.values());
  if (players.length < 2) return null;

  const users = loadUsers();
  const ratingOf = (uid?: string) => {
    const u = uid ? users.find((x: User) => x.id === uid) : null;
    return u ? (u.ratings?.domino ?? 1200) : 1200;
  };

  let bestPair: [Player, Player] | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const diff = Math.abs(ratingOf(players[i].userId) - ratingOf(players[j].userId));
      if (diff < bestDiff) { bestDiff = diff; bestPair = [players[i], players[j]]; }
    }
  }
  if (!bestPair) return null;

  const [a, b] = bestPair;
  mem.lobby.delete(a.id);
  mem.lobby.delete(b.id);
  return _createMatch(a, b);
}

/* ══════════════════════════════════════════════════════════════
   CREATE MATCH
══════════════════════════════════════════════════════════════ */
function _createMatch(a: Player, b: Player, pot?: number): Match {
  const mem  = getMemory();
  // نستخدم "player_a" و "player_b" عوض "player" و "ai"
  const game = new DominoGame(2, "medium", "classic");
  // نعيد تعريف الـ players بأسماء صريحة
  game.players  = ["player_a", "player_b"];
  game.hands    = { player_a: [], player_b: [] };
  game.scores   = { player_a: 0,  player_b: 0  };
  game.deal(7);

  const match: Match = {
    id:         randomUUID(),
    a, b, game,
    createdAt:  Date.now(),
    seq:        0,
    events:     [],
    lastTurnAt: Date.now(),
    timeSec:    180,
    timeA:      180_000,
    timeB:      180_000,
    pot,
  };
  match.events.push({ seq: ++match.seq, type: "start", payload: { a: a.name, b: b.name } });
  mem.matches.set(match.id, match);
  return match;
}

export function startMatch(a: Player, b: Player): Match {
  return _createMatch(a, b);
}

/* ══════════════════════════════════════════════════════════════
   HIGH STAKES
══════════════════════════════════════════════════════════════ */
export function joinHighStakes(
  name: string,
  userId?: string,
): { player: Player; match?: Match } {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId };
  mem.highStakesQueue.push(p);

  if (mem.highStakesQueue.length >= 2) {
    const a = mem.highStakesQueue.shift()!;
    const b = mem.highStakesQueue.shift()!;
    // خصم الـ buy-in
    if (a.userId && !spendCoins(a.userId, 5000)) return { player: p };
    if (b.userId && !spendCoins(b.userId, 5000)) return { player: p };
    const m = _createMatch(a, b, 10_000);
    return { player: p, match: m };
  }
  return { player: p };
}

/* ══════════════════════════════════════════════════════════════
   GET MATCH / STATE
══════════════════════════════════════════════════════════════ */
export function getMatch(id: string): Match | null {
  return getMemory().matches.get(id) ?? null;
}

/**
 * يرجع الـ state من منظور لاعب معين
 * forPlayerId هو الـ player.id (UUID) مش player_a/player_b
 */
export function getState(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return null;

  const side = match.a.id === forPlayerId ? "a"
             : match.b.id === forPlayerId ? "b"
             : null;
  if (!side) return null;

  const game = match.game;
  const gameSide = side === "a" ? "player_a" : "player_b";
  const oppSide  = side === "a" ? "player_b" : "player_a";

  // حساب الوقت المتبقي
  let timeA = match.timeA;
  let timeB = match.timeB;
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (game.turn === "player_a") timeA = Math.max(0, match.timeA - elapsed);
    else                           timeB = Math.max(0, match.timeB - elapsed);
  }

  // Timeout detection
  if (
    (game.turn === "player_a" && timeA <= 0) ||
    (game.turn === "player_b" && timeB <= 0)
  ) {
    _handleTimeout(match);
  }

  return {
    id:       match.id,
    chain:    game.chain,
    turn:     game.turn === "player_a" ? "a" : "b",
    boneyard: game.boneyard.length,
    myHand:   game.hands[gameSide] ?? [],
    oppCount: game.hands[oppSide]?.length ?? 0,
    timeSec:  match.timeSec,
    timeA,
    timeB,
    phase:    game.phase,
    winner:   game.winner === "player_a" ? "a" : game.winner === "player_b" ? "b" : null,
  };
}

function _handleTimeout(match: Match) {
  const game   = match.game;
  const winner = game.turn === "player_a" ? "b" : "a";
  match.events.push({
    seq: ++match.seq, type: "end",
    payload: { winner, reason: "win", scoreA: 0, scoreB: 0 },
  });
  _applyMatchRewards(match, winner);
}

/* ══════════════════════════════════════════════════════════════
   PUSH MOVE
══════════════════════════════════════════════════════════════ */
export function pushMove(
  id:          string,
  forPlayerId: string,
  tile:        Tile,
  side:        Side,
) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };

  const pid = match.a.id === forPlayerId ? "a"
            : match.b.id === forPlayerId ? "b"
            : null;
  if (!pid) return { ok: false, error: "not_participant" as const };

  const game     = match.game;
  const gameSide = pid === "a" ? "player_a" : "player_b";
  const turnSide = game.turn === "player_a" ? "a" : "b";
  if (pid !== turnSide) return { ok: false, error: "not_your_turn" as const };

  // حدّث الساعة
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (pid === "a") match.timeA = Math.max(0, match.timeA - elapsed);
    else             match.timeB = Math.max(0, match.timeB - elapsed);
  }

  // إيجاد الـ tile في يد اللاعب
  const hand = game.hands[gameSide];
  const tileInHand = hand.find(t =>
    (t.a === tile.a && t.b === tile.b) || (t.a === tile.b && t.b === tile.a)
  );
  if (!tileInHand) return { ok: false, error: "tile_not_in_hand" as const };

  const ok = game.play(gameSide, tileInHand, side);
  if (!ok) return { ok: false, error: "illegal_move" as const };

  match.lastTurnAt = Date.now();
  match.events.push({
    seq: ++match.seq, type: "move",
    payload: {
      by:       pid,
      side,
      tile:     tileInHand,
      turn:     game.turn === "player_a" ? "a" : "b",
      chainLen: game.chain.length,
    },
  });

  // نهاية اللعبة
  if (game.phase === "ended") {
    const winner = game.winner === "player_a" ? "a"
                 : game.winner === "player_b" ? "b"
                 : undefined;
    const st = game.status();
    match.events.push({
      seq: ++match.seq, type: "end",
      payload: {
        winner,
        reason:  st.reason ?? "win",
        scoreA:  st.pipCounts["player_a"] ?? 0,
        scoreB:  st.pipCounts["player_b"] ?? 0,
      },
    });
    _applyMatchRewards(match, winner);
  }

  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════
   DRAW IF NEEDED
══════════════════════════════════════════════════════════════ */
export function drawIfNeeded(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };

  const pid = match.a.id === forPlayerId ? "a"
            : match.b.id === forPlayerId ? "b"
            : null;
  if (!pid) return { ok: false, error: "not_participant" as const };

  const gameSide = pid === "a" ? "player_a" : "player_b";
  const count = match.game.drawToFit(gameSide);

  return {
    ok:        true,
    drew:      count,
    handCount: match.game.hands[gameSide].length,
    hasMoves:  match.game.hasValidMove(gameSide),
  };
}

/* ══════════════════════════════════════════════════════════════
   EVENTS POLLING
══════════════════════════════════════════════════════════════ */
export function getEvents(id: string, sinceSeq: number) {
  const match = getMatch(id);
  if (!match) return { seq: sinceSeq, events: [] as MatchEvent[] };
  return {
    seq:    match.seq,
    events: match.events.filter(e => e.seq > sinceSeq),
  };
}

/* ══════════════════════════════════════════════════════════════
   RESIGN
══════════════════════════════════════════════════════════════ */
export function resign(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };

  const winner = match.a.id === forPlayerId ? "b"
               : match.b.id === forPlayerId ? "a"
               : null;
  if (!winner) return { ok: false, error: "not_participant" as const };

  match.events.push({
    seq: ++match.seq, type: "end",
    payload: { winner, reason: "win", scoreA: 0, scoreB: 0 },
  });
  _applyMatchRewards(match, winner);
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════
   REWARDS HELPER
══════════════════════════════════════════════════════════════ */
function _applyMatchRewards(match: Match, winner?: "a" | "b") {
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
    if (match.a.userId) { grantXp(match.a.userId, 20); grantCoins(match.a.userId, 100); }
    if (match.b.userId) { grantXp(match.b.userId, 20); grantCoins(match.b.userId, 100); }
  }

  if (match.a.userId) recordDominoMatch(match.a.userId, winner === "a" ? "win" : winner ? "loss" : "draw");
  if (match.b.userId) recordDominoMatch(match.b.userId, winner === "b" ? "win" : winner ? "loss" : "draw");
}
