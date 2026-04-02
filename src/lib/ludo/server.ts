import { randomUUID } from "crypto";
import { LudoGame } from "./game";
import { grantCoins, grantXp, loadUsers, type User } from "../auth/store";
export type Player = { id: string; name: string; joinedAt: number; userId?: string };
export type MatchEvent =
  | { seq: number; type: "start"; payload: { a: string; b: string; c: string; d: string } }
  | { seq: number; type: "roll"; payload: { by: "a" | "b" | "c" | "d"; dice: number } }
  | { seq: number; type: "move"; payload: { by: "a" | "b" | "c" | "d"; idx: number; turn: "a" | "b" | "c" | "d" } }
  | { seq: number; type: "end"; payload: { winner?: "a" | "b" | "c" | "d" } };
export type Match = { id: string; a: Player; b: Player; c: Player; d: Player; game: LudoGame; createdAt: number; seq: number; events: MatchEvent[] };
type Memory = { lobby: Map<string, Player>; matches: Map<string, Match> };
declare global { var __LUDO_MEM__: Memory | undefined; }
export function getMemory(): Memory {
  if (!global.__LUDO_MEM__) global.__LUDO_MEM__ = { lobby: new Map(), matches: new Map() };
  return global.__LUDO_MEM__;
}
export function joinLobby(name: string, userId?: string): Player {
  const mem = getMemory();
  const p: Player = { id: randomUUID(), name: name.trim() || "لاعب", joinedAt: Date.now(), userId };
  mem.lobby.set(p.id, p);
  return p;
}
export function leaveLobby(id: string) { getMemory().lobby.delete(id); }
export function pairPlayers(): Match | null {
  const mem = getMemory();
  const players = Array.from(mem.lobby.values());
  if (players.length < 4) return null;
  const users = loadUsers();
  const ratingOf = (uid?: string) => { const u = uid ? users.find((x: User) => x.id === uid) : null; return u ? u.ratings.domino : 1200; };
  players.sort((p1, p2) => ratingOf(p1.userId) - ratingOf(p2.userId));
  const group = players.slice(0, 4);
  const [a, b, c, d] = group;
  mem.lobby.delete(a.id); mem.lobby.delete(b.id); mem.lobby.delete(c.id); mem.lobby.delete(d.id);
  const game = new LudoGame();
  const id = randomUUID();
  const m: Match = { id, a, b, c, d, game, createdAt: Date.now(), seq: 0, events: [] };
  m.events.push({ seq: ++m.seq, type: "start", payload: { a: a.name, b: b.name, c: c.name, d: d.name } });
  mem.matches.set(id, m);
  return m;
}
export function getMatch(id: string) { return getMemory().matches.get(id) || null; }
export function getState(id: string, forPlayerId: string) {
  const match = getMatch(id); if (!match) return null;
  const side = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : match.c.id === forPlayerId ? "c" : match.d.id === forPlayerId ? "d" : null; if (!side) return null;
  const g = match.game;
  const turn = g.turn === "player" ? "a" : g.turn === "ai1" ? "b" : g.turn === "ai2" ? "c" : "d";
  return {
    id: match.id,
    turn,
    dice: g.dice,
    tokensA: g.tokens.player,
    tokensB: g.tokens.ai1,
    tokensC: g.tokens.ai2,
    tokensD: g.tokens.ai3,
  };
}
export function roll(id: string, forPlayerId: string) {
  const match = getMatch(id); if (!match) return { ok: false, error: "match_not_found" as const };
  const pid = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : match.c.id === forPlayerId ? "c" : match.d.id === forPlayerId ? "d" : null; if (!pid) return { ok: false, error: "not_participant" as const };
  const g = match.game;
  const turn = g.turn === "player" ? "a" : g.turn === "ai1" ? "b" : g.turn === "ai2" ? "c" : "d"; if (pid !== turn) return { ok: false, error: "not_your_turn" as const };
  const d = g.roll();
  match.events.push({ seq: ++match.seq, type: "roll", payload: { by: pid, dice: d } });
  return { ok: true, dice: d };
}
export function move(id: string, forPlayerId: string, idx: number) {
  const match = getMatch(id); if (!match) return { ok: false, error: "match_not_found" as const };
  const pid = match.a.id === forPlayerId ? "a" : match.b.id === forPlayerId ? "b" : match.c.id === forPlayerId ? "c" : match.d.id === forPlayerId ? "d" : null; if (!pid) return { ok: false, error: "not_participant" as const };
  const g = match.game;
  const turn = g.turn === "player" ? "a" : g.turn === "ai1" ? "b" : g.turn === "ai2" ? "c" : "d"; if (pid !== turn) return { ok: false, error: "not_your_turn" as const };
  const mapSide = (s: "a" | "b" | "c" | "d") => (s === "a" ? "player" : s === "b" ? "ai1" : s === "c" ? "ai2" : "ai3") as "player" | "ai1" | "ai2" | "ai3";
  const ok = g.move(mapSide(pid), idx); if (!ok) return { ok: false, error: "illegal" as const };
  const nextTurn = g.turn === "player" ? "a" : g.turn === "ai1" ? "b" : g.turn === "ai2" ? "c" : "d";
  match.events.push({ seq: ++match.seq, type: "move", payload: { by: pid, idx, turn: nextTurn } });
  const st = g.status();
  if (st.ended) {
    const winner = st.winner === "player" ? "a" : st.winner === "ai1" ? "b" : st.winner === "ai2" ? "c" : st.winner === "ai3" ? "d" : undefined;
    match.events.push({ seq: ++match.seq, type: "end", payload: { winner } });
    const wId = winner === "a" ? match.a.userId : winner === "b" ? match.b.userId : winner === "c" ? match.c.userId : winner === "d" ? match.d.userId : undefined;
    const losers = [match.a.userId, match.b.userId, match.c.userId, match.d.userId].filter((id) => id && id !== wId) as string[];
    if (wId) {
      grantXp(wId, 40);
      grantCoins(wId, 180);
      for (const lId of losers) { grantXp(lId, 10); grantCoins(lId, 60); }
    } else {
      for (const id of [match.a.userId, match.b.userId, match.c.userId, match.d.userId]) {
        if (id) { grantXp(id, 20); grantCoins(id, 100); }
      }
    }
  }
  return { ok: true };
}
export function getEvents(id: string, sinceSeq: number) {
  const m = getMatch(id);
  if (!m) return { seq: sinceSeq, events: [] as MatchEvent[] };
  const events = m.events.filter((e) => e.seq > sinceSeq);
  return { seq: m.seq, events };
}
