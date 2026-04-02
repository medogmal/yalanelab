import { randomUUID } from "crypto";
import { DominoGame, type Tile, type Side } from "./game";
import {
  applyDominoEloResult, grantXp, grantCoins,
  loadUsers, recordDominoMatch, spendCoins, type User,
} from "../auth/store";

export type Player = {
  id: string; name: string; joinedAt: number; userId?: string;
  lastSeenAt?: number; // D19: reconnect tracking
};

export type MatchEvent =
  | { seq: number; type: "start";  payload: { a: string; b: string } }
  | { seq: number; type: "move";   payload: { by: "a"|"b"|"c"|"d"; side: Side; tile: Tile; turn: string; chainLen: number } }
  | { seq: number; type: "draw";   payload: { by: "a"|"b"|"c"|"d" } }
  | { seq: number; type: "pass";   payload: { by: "a"|"b"|"c"|"d" } }
  | { seq: number; type: "end";    payload: { winner?: string; reason: "win"|"blocked"; scoreA: number; scoreB: number } };

// D16: support up to 4 players
export type Match = {
  id:          string;
  players:     Player[];          // ordered: [a, b] or [a, b, c, d]
  game:        DominoGame;
  createdAt:   number;
  seq:         number;
  events:      MatchEvent[];
  lastTurnAt:  number | null;
  timeSec:     number;
  timePerPlayer: Record<string, number>;
  pot?:        number;
  numPlayers:  2 | 4;
  // D17: spectators list
  spectators:  string[];
  // legacy 2-player fields (kept for backward compat)
  a:           Player;
  b:           Player;
  timeA:       number;
  timeB:       number;
};

/* ══════════════════════════════════════════════════════════════
   IN-MEMORY STORE
══════════════════════════════════════════════════════════════ */
type Memory = {
  lobby:            Map<string, Player & { mode?: "2p"|"4p" }>;
  matches:          Map<string, Match>;
  highStakesQueue:  Player[];
  // D17: spectator queues
  spectateRequests: Map<string, string[]>;  // matchId → playerIds
};

declare global { var __DOMINO_MEM__: Memory | undefined; }

export function getMemory(): Memory {
  if (!global.__DOMINO_MEM__) {
    global.__DOMINO_MEM__ = {
      lobby:            new Map(),
      matches:          new Map(),
      highStakesQueue:  [],
      spectateRequests: new Map(),
    };
  }
  return global.__DOMINO_MEM__;
}

/* ══════════════════════════════════════════════════════════════
   LOBBY
══════════════════════════════════════════════════════════════ */
export function joinLobby(name: string, userId?: string, mode: "2p"|"4p" = "2p"): Player {
  const mem = getMemory();
  const p = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId, mode };
  mem.lobby.set(p.id, p);
  return p;
}

export function leaveLobby(id: string) {
  getMemory().lobby.delete(id);
}

/* ══════════════════════════════════════════════════════════════
   MATCHMAKING
══════════════════════════════════════════════════════════════ */
export function pairPlayers(mode: "2p"|"4p" = "2p"): Match | null {
  const mem = getMemory();
  const needed = mode === "4p" ? 4 : 2;
  const pool = Array.from(mem.lobby.values()).filter(p => (p.mode ?? "2p") === mode);
  if (pool.length < needed) return null;

  const users = loadUsers();
  const ratingOf = (uid?: string) => {
    const u = uid ? users.find((x: User) => x.id === uid) : null;
    return u ? (u.ratings?.domino ?? 1200) : 1200;
  };

  if (mode === "2p") {
    // ELO-based pairing
    let bestPair: [Player, Player] | null = null;
    let bestDiff = Number.POSITIVE_INFINITY;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        const diff = Math.abs(ratingOf(pool[i].userId) - ratingOf(pool[j].userId));
        if (diff < bestDiff) { bestDiff = diff; bestPair = [pool[i], pool[j]]; }
      }
    }
    if (!bestPair) return null;
    bestPair.forEach(p => mem.lobby.delete(p.id));
    return _createMatch(bestPair, 2);
  } else {
    // 4-player: first 4 in queue
    const chosen = pool.slice(0, 4);
    chosen.forEach(p => mem.lobby.delete(p.id));
    return _createMatch(chosen, 4);
  }
}

/* ══════════════════════════════════════════════════════════════
   CREATE MATCH
══════════════════════════════════════════════════════════════ */
function _createMatch(players: Player[], numPlayers: 2|4, pot?: number): Match {
  const mem = getMemory();
  const np  = numPlayers;

  const game = new DominoGame(np, "medium", "classic");
  const gamePlayerIds = np === 2
    ? ["player_a", "player_b"]
    : ["player_a", "player_b", "player_c", "player_d"];

  game.players = gamePlayerIds;
  game.hands   = Object.fromEntries(gamePlayerIds.map(id => [id, []]));
  game.scores  = Object.fromEntries(gamePlayerIds.map(id => [id, 0]));
  game.deal(7);

  const timePerPlayer = Object.fromEntries(players.map(p => [p.id, 180_000]));

  const match: Match = {
    id:         randomUUID(),
    players,
    game,
    createdAt:  Date.now(),
    seq:        0,
    events:     [],
    lastTurnAt: Date.now(),
    timeSec:    180,
    timePerPlayer,
    pot,
    numPlayers,
    spectators: [],
    // backward compat
    a:     players[0],
    b:     players[1],
    timeA: 180_000,
    timeB: 180_000,
  };

  const names = players.map(p => p.name).join(" vs ");
  match.events.push({ seq: ++match.seq, type: "start", payload: { a: players[0].name, b: players[1].name } });
  mem.matches.set(match.id, match);
  return match;
}

export function startMatch(a: Player, b: Player): Match {
  return _createMatch([a, b], 2);
}

/* ══════════════════════════════════════════════════════════════
   HIGH STAKES
══════════════════════════════════════════════════════════════ */
export function joinHighStakes(name: string, userId?: string): { player: Player; match?: Match } {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId };
  mem.highStakesQueue.push(p);

  if (mem.highStakesQueue.length >= 2) {
    const a = mem.highStakesQueue.shift()!;
    const b = mem.highStakesQueue.shift()!;
    if (a.userId && !spendCoins(a.userId, 5000)) return { player: p };
    if (b.userId && !spendCoins(b.userId, 5000)) return { player: p };
    const m = _createMatch([a, b], 2, 10_000);
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

/** يرجع الـ state من منظور لاعب معين (أو spectator) */
export function getState(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return null;

  const playerIdx = match.players.findIndex(p => p.id === forPlayerId);
  const isSpectator = playerIdx === -1 && match.spectators.includes(forPlayerId);

  if (playerIdx === -1 && !isSpectator) return null;

  const game      = match.game;
  const sides     = ["a","b","c","d"] as const;
  const gameSides = ["player_a","player_b","player_c","player_d"];

  // D19: update lastSeenAt
  if (playerIdx >= 0) {
    match.players[playerIdx].lastSeenAt = Date.now();
  }

  // calc remaining time
  const timeNow    = Date.now();
  const timePerPlayer = { ...match.timePerPlayer };
  if (match.lastTurnAt) {
    const elapsed   = timeNow - match.lastTurnAt;
    const turnIdx   = gameSides.indexOf(game.turn);
    const pid       = match.players[turnIdx]?.id;
    if (pid) timePerPlayer[pid] = Math.max(0, (timePerPlayer[pid] ?? 180_000) - elapsed);
  }

  // timeout check
  const currentTurnIdx  = gameSides.indexOf(game.turn);
  const currentPlayerPid = match.players[currentTurnIdx]?.id;
  if (currentPlayerPid && (timePerPlayer[currentPlayerPid] ?? 180_000) <= 0) {
    _handleTimeout(match);
  }

  // Build opponent info (hide hands)
  const opponents = match.players
    .filter((_, i) => i !== playerIdx)
    .map((p, i) => ({
      id:    p.id,
      name:  p.name,
      count: game.hands[gameSides[match.players.indexOf(p)]]?.length ?? 0,
      side:  sides[match.players.indexOf(p)],
    }));

  const mySide = playerIdx >= 0 ? gameSides[playerIdx] : null;

  return {
    id:        match.id,
    chain:     game.chain,
    turn:      sides[gameSides.indexOf(game.turn)] ?? "a",
    turnName:  match.players[gameSides.indexOf(game.turn)]?.name ?? "",
    boneyard:  game.boneyard.length,
    myHand:    mySide ? (game.hands[mySide] ?? []) : [],
    opponents,
    // legacy 2p compat
    oppCount:  opponents[0]?.count ?? 0,
    timeSec:   match.timeSec,
    timeA:     timePerPlayer[match.a.id] ?? 180_000,
    timeB:     timePerPlayer[match.b.id] ?? 180_000,
    timePerPlayer,
    phase:     game.phase,
    winner:    game.winner ? (sides[gameSides.indexOf(game.winner)] ?? null) : null,
    numPlayers: match.numPlayers,
    isSpectator,
  };
}

function _handleTimeout(match: Match) {
  const game     = match.game;
  const sides    = ["a","b","c","d"];
  const gameSides = ["player_a","player_b","player_c","player_d"];
  const loserIdx  = gameSides.indexOf(game.turn);
  const winnerIdx = (loserIdx + 1) % match.players.length;
  const winnerSide = sides[winnerIdx] as "a"|"b";

  if (game.phase === "playing") {
    game.phase  = "ended";
    game.winner = gameSides[winnerIdx];
    match.events.push({
      seq: ++match.seq, type: "end",
      payload: { winner: winnerSide, reason: "win", scoreA: 0, scoreB: 0 },
    });
    _applyMatchRewards(match, winnerSide);
  }
}

/* ══════════════════════════════════════════════════════════════
   PUSH MOVE
══════════════════════════════════════════════════════════════ */
export function pushMove(id: string, forPlayerId: string, tile: Tile, side: Side) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };

  const pIdx = match.players.findIndex(p => p.id === forPlayerId);
  if (pIdx === -1) return { ok: false, error: "not_participant" as const };

  const gameSides = ["player_a","player_b","player_c","player_d"];
  const gameSide  = gameSides[pIdx];
  if (match.game.turn !== gameSide) return { ok: false, error: "not_your_turn" as const };

  // update timer
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    match.timePerPlayer[forPlayerId] = Math.max(0, (match.timePerPlayer[forPlayerId] ?? 180_000) - elapsed);
    // backward compat
    if (pIdx === 0) match.timeA = match.timePerPlayer[forPlayerId];
    if (pIdx === 1) match.timeB = match.timePerPlayer[forPlayerId];
  }

  const hand = match.game.hands[gameSide];
  const tileInHand = hand.find(t => (t.a===tile.a&&t.b===tile.b)||(t.a===tile.b&&t.b===tile.a));
  if (!tileInHand) return { ok: false, error: "tile_not_in_hand" as const };

  const ok = match.game.play(gameSide, tileInHand, side);
  if (!ok) return { ok: false, error: "illegal_move" as const };

  match.lastTurnAt = Date.now();
  const sides = ["a","b","c","d"] as const;
  match.events.push({
    seq: ++match.seq, type: "move",
    payload: { by: sides[pIdx], side, tile: tileInHand,
      turn: sides[gameSides.indexOf(match.game.turn)] ?? "a",
      chainLen: match.game.chain.length },
  });

  if (match.game.phase === "ended") {
    const winnerGS  = match.game.winner;
    const winnerIdx = winnerGS ? gameSides.indexOf(winnerGS) : -1;
    const winnerSide = winnerIdx >= 0 ? (sides[winnerIdx] as "a"|"b") : undefined;
    const st = match.game.status();
    match.events.push({
      seq: ++match.seq, type: "end",
      payload: { winner: winnerSide, reason: st.reason ?? "win",
        scoreA: st.pipCounts["player_a"]??0, scoreB: st.pipCounts["player_b"]??0 },
    });
    _applyMatchRewards(match, winnerSide);
  }
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════
   DRAW / RESIGN / EVENTS
══════════════════════════════════════════════════════════════ */
export function drawIfNeeded(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const pIdx = match.players.findIndex(p => p.id === forPlayerId);
  if (pIdx === -1) return { ok: false, error: "not_participant" as const };
  const gameSide = ["player_a","player_b","player_c","player_d"][pIdx];
  const count = match.game.drawToFit(gameSide);
  return { ok: true, drew: count, handCount: match.game.hands[gameSide].length,
    hasMoves: match.game.hasValidMove(gameSide) };
}

export function getEvents(id: string, sinceSeq: number) {
  const match = getMatch(id);
  if (!match) return { seq: sinceSeq, events: [] as MatchEvent[] };
  return { seq: match.seq, events: match.events.filter(e => e.seq > sinceSeq) };
}

export function resign(id: string, forPlayerId: string) {
  const match = getMatch(id);
  if (!match) return { ok: false, error: "match_not_found" as const };
  const pIdx = match.players.findIndex(p => p.id === forPlayerId);
  if (pIdx === -1) return { ok: false, error: "not_participant" as const };

  const sides = ["a","b","c","d"] as const;
  // winner is first non-resigned player
  const winnerIdx = pIdx === 0 ? 1 : 0;
  const winnerSide = sides[winnerIdx] as "a"|"b";
  match.events.push({ seq: ++match.seq, type: "end",
    payload: { winner: winnerSide, reason: "win", scoreA: 0, scoreB: 0 } });
  _applyMatchRewards(match, winnerSide);
  return { ok: true };
}

/* ══════════════════════════════════════════════════════════════
   D17: SPECTATOR
══════════════════════════════════════════════════════════════ */
export function joinSpectator(matchId: string, spectatorId: string) {
  const match = getMatch(matchId);
  if (!match) return { ok: false, error: "not_found" as const };
  if (!match.spectators.includes(spectatorId)) {
    match.spectators.push(spectatorId);
  }
  return { ok: true };
}

export function leaveSpectator(matchId: string, spectatorId: string) {
  const match = getMatch(matchId);
  if (!match) return;
  match.spectators = match.spectators.filter(id => id !== spectatorId);
}

/* ══════════════════════════════════════════════════════════════
   D19: RECONNECT — يرجع اللاعب لمباراة كانت جارية
══════════════════════════════════════════════════════════════ */
export function reconnectPlayer(playerId: string) {
  const mem = getMemory();
  // ابحث عن match فيها اللاعب دا ولسه جارية
  for (const [, match] of mem.matches) {
    if (match.game.phase !== "playing") continue;
    const pIdx = match.players.findIndex(p => p.id === playerId);
    if (pIdx === -1) continue;
    // اللاعب موجود — رجّعه الـ state
    match.players[pIdx].lastSeenAt = Date.now();
    return { ok: true, matchId: match.id, side: ["a","b","c","d"][pIdx] };
  }
  return { ok: false };
}

/* ══════════════════════════════════════════════════════════════
   REWARDS
══════════════════════════════════════════════════════════════ */
function _applyMatchRewards(match: Match, winner?: "a"|"b"|string) {
  if (match.numPlayers === 2) {
    const wId = winner === "a" ? match.a.userId : winner === "b" ? match.b.userId : undefined;
    const lId = winner === "a" ? match.b.userId : winner === "b" ? match.a.userId : undefined;
    if (winner) {
      applyDominoEloResult(wId, lId, false);
      if (wId) { grantXp(wId, 50); grantCoins(wId, match.pot ?? 200); }
      if (lId) { grantXp(lId, 10); grantCoins(lId, 50); }
    } else {
      applyDominoEloResult(match.a.userId, match.b.userId, true);
      match.players.forEach(p => { if (p.userId) { grantXp(p.userId, 20); grantCoins(p.userId, 100); } });
    }
  } else {
    // 4-player: winner gets full pot, others get consolation
    const sides     = ["a","b","c","d"];
    const winnerIdx = sides.indexOf(winner ?? "");
    match.players.forEach((p, i) => {
      if (!p.userId) return;
      if (i === winnerIdx) { grantXp(p.userId, 80); grantCoins(p.userId, 400); }
      else                 { grantXp(p.userId, 10); grantCoins(p.userId, 30); }
    });
  }

  match.players.forEach((p, i) => {
    if (!p.userId) return;
    const sides = ["a","b","c","d"];
    const isWinner = sides.indexOf(winner ?? "") === i;
    recordDominoMatch(p.userId, isWinner ? "win" : winner ? "loss" : "draw");
  });
}
