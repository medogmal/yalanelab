import { randomUUID } from "crypto";
import { BalootGame, Card, Mode, PlayerId, Suit } from "./game";
export type Player = { id: string; name: string; joinedAt: number; userId?: string };
export type MatchEvent =
  | { seq: number; type: "start"; payload: { N: string; E: string; S: string; W: string } }
  | { seq: number; type: "bid"; payload: { by: PlayerId; mode: Mode; trump?: Suit } }
  | { seq: number; type: "start_play"; payload: { mode: Mode; trump: Suit | null } }
  | { seq: number; type: "play"; payload: { by: PlayerId; card: Card; next: PlayerId } }
  | { seq: number; type: "end"; payload: { NS: number; EW: number } };
export type Match = { id: string; N: Player; E: Player; S: Player; W: Player; game: BalootGame; createdAt: number; seq: number; events: MatchEvent[] };
type Memory = { lobby: Map<string, Player>; matches: Map<string, Match> };
declare global { var __BALOOT_MEM__: Memory | undefined; }
export function getMemory(): Memory {
  if (!global.__BALOOT_MEM__) global.__BALOOT_MEM__ = { lobby: new Map(), matches: new Map() };
  return global.__BALOOT_MEM__;
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
  const group = players.slice(0, 4);
  const [N, E, S, W] = group;
  mem.lobby.delete(N.id); mem.lobby.delete(E.id); mem.lobby.delete(S.id); mem.lobby.delete(W.id);
  const game = new BalootGame();
  game.dealer = "N";
  game.startRound();
  const id = randomUUID();
  const m: Match = { id, N, E, S, W, game, createdAt: Date.now(), seq: 0, events: [] };
  m.events.push({ seq: ++m.seq, type: "start", payload: { N: N.name, E: E.name, S: S.name, W: W.name } });
  getMemory().matches.set(id, m);
  return m;
}
export function getMatch(id: string) { return getMemory().matches.get(id) || null; }
export function getState(id: string, forPlayerId: string) {
  const m = getMatch(id); if (!m) return null;
  const side: PlayerId | null = m.N.id === forPlayerId ? "N" : m.E.id === forPlayerId ? "E" : m.S.id === forPlayerId ? "S" : m.W.id === forPlayerId ? "W" : null; if (!side) return null;
  const g = m.game;
  const hands = {
    N: side === "N" ? g.hands.N : g.hands.N.length,
    E: side === "E" ? g.hands.E : g.hands.E.length,
    S: side === "S" ? g.hands.S : g.hands.S.length,
    W: side === "W" ? g.hands.W : g.hands.W.length,
  };
  return { id: m.id, turn: g.next, trick: g.trick, mode: g.mode, trump: g.trump, phase: g.phase, hands, score: g.scoreRound, announcements: g.announcementsRound };
}
export function play(id: string, forPlayerId: string, card: Card) {
  const m = getMatch(id); if (!m) return { ok: false, error: "match_not_found" as const };
  const side: PlayerId | null = m.N.id === forPlayerId ? "N" : m.E.id === forPlayerId ? "E" : m.S.id === forPlayerId ? "S" : m.W.id === forPlayerId ? "W" : null; if (!side) return { ok: false, error: "not_participant" as const };
  const g = m.game;
  if (g.next !== side) return { ok: false, error: "not_your_turn" as const };
  const ok = g.play(side, card); if (!ok) return { ok: false, error: "illegal" as const };
  m.events.push({ seq: ++m.seq, type: "play", payload: { by: side, card, next: g.next } });
  if (g.ended) {
    m.events.push({ seq: ++m.seq, type: "end", payload: { NS: g.scoreRound.NS, EW: g.scoreRound.EW } });
  }
  return { ok: true };
}
export function bid(id: string, forPlayerId: string, mode: Mode | "pass", trump?: Suit) {
  const m = getMatch(id); if (!m) return { ok: false, error: "match_not_found" as const };
  const side: PlayerId | null = m.N.id === forPlayerId ? "N" : m.E.id === forPlayerId ? "E" : m.S.id === forPlayerId ? "S" : m.W.id === forPlayerId ? "W" : null; if (!side) return { ok: false, error: "not_participant" as const };
  const g = m.game;
  if (g.phase !== "bidding") return { ok: false, error: "not_bidding" as const };
  if (mode === "sun" || mode === "hokom") {
    g.proposeBid(side, { mode, trump });
    m.events.push({ seq: ++m.seq, type: "bid", payload: { by: side, mode, trump } });
  } else {
    g.passBid(side);
    m.events.push({ seq: ++m.seq, type: "bid", payload: { by: side, mode: "pass" as Mode, trump } });
  }
  if (m.game.phase === "playing" && m.game.mode !== null) {
    m.events.push({ seq: ++m.seq, type: "start_play", payload: { mode: m.game.mode!, trump: m.game.trump } });
  }
  return { ok: true };
}
export function getEvents(id: string, sinceSeq: number) {
  const m = getMatch(id);
  if (!m) return { seq: sinceSeq, events: [] as MatchEvent[] };
  const events = m.events.filter((e) => e.seq > sinceSeq);
  return { seq: m.seq, events };
}
