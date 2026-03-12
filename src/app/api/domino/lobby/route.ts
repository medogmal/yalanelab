import { NextRequest } from "next/server";
import { getMemory, joinLobby, leaveLobby, pairPlayers } from "@/lib/domino/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mem = getMemory();
  const url = new URL(req.url);
  const forId = url.searchParams.get("playerId");
  if (forId) {
    const m = Array.from(mem.matches.values()).find((mt) => mt.a.id === forId || mt.b.id === forId);
    if (m) {
      return Response.json({
        match: {
          id: m.id,
          a: { id: m.a.id, name: m.a.name },
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
  const u = await getCurrentUser();
  const player = joinLobby(name, u?.id);
  const match = pairPlayers();
  return Response.json({
    player,
    match: match
      ? {
          id: match.id,
          a: { id: match.a.id, name: match.a.name },
          b: { id: match.b.id, name: match.b.name },
          createdAt: match.createdAt,
          seq: match.seq,
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
