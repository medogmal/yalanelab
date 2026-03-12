import { NextRequest } from "next/server";
import { getMemory, joinLobby, leaveLobby, pairPlayers } from "@/lib/chess/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mem = getMemory();
  const url = new URL(req.url);
  const forId = url.searchParams.get("playerId");
  if (forId) {
    const m = Array.from(mem.matches.values()).find((mt) => mt.w.id === forId || mt.b.id === forId);
    if (m) {
      return Response.json({
        match: {
          id: m.id,
          w: { id: m.w.id, name: m.w.name },
          b: { id: m.b.id, name: m.b.name },
          createdAt: m.createdAt,
          seq: m.seq,
        },
      });
    }
    return Response.json({ match: null });
  }
  const players = Array.from(mem.lobby.values()).map((p) => ({ id: p.id, name: p.name, joinedAt: p.joinedAt }));
  return Response.json({ players, count: players.length });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "لاعب");
  const baseMin = Number(body?.baseMin ?? 5);
  const incSec = Number(body?.incSec ?? 2);
  const u = await getCurrentUser();
  const player = joinLobby(name, { baseMin, incSec }, u?.id);
  const match = pairPlayers();
  return Response.json({
    player,
    match: match
      ? {
          id: match.id,
          w: { id: match.w.id, name: match.w.name },
          b: { id: match.b.id, name: match.b.name },
          createdAt: match.createdAt,
          seq: match.seq,
          time: match.time,
        }
      : null,
  });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id || "");
  if (id) leaveLobby(id);
  return Response.json({ ok: true });
}
