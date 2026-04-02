import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { type Player, startMatch } from "@/lib/domino/server";
export const dynamic = "force-dynamic";
declare global {
  var __ROOMS__: Map<string, { id: string; players: Player[]; matchId?: string }>;
}
function rooms() {
  if (!global.__ROOMS__) global.__ROOMS__ = new Map();
  return global.__ROOMS__;
}
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const roomId = String(body?.roomId || "");
  const name = String(body?.name || "لاعب");
  if (!roomId) return Response.json({ error: "missing_room" }, { status: 400 });
  const u = await getCurrentUser();
  const r = rooms().get(roomId);
  if (!r) return Response.json({ error: "room_not_found" }, { status: 404 });
  const p: Player = { id: crypto.randomUUID(), name, joinedAt: Date.now(), userId: u?.id };
  r.players.push(p);
  let match: { id: string } | null = null;
  if (r.players.length === 2 && !r.matchId) {
    const m = startMatch(r.players[0], r.players[1]);
    r.matchId = m.id;
    match = { id: m.id };
  } else if (r.matchId) {
    match = { id: r.matchId };
  }
  return Response.json({ ok: true, player: { id: p.id, name: p.name }, match });
}
