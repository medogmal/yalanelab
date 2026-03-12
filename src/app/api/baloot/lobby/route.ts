import { NextRequest } from "next/server";
import { joinLobby, pairPlayers } from "@/lib/baloot/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "لاعب");
  const player = joinLobby(name);
  const match = pairPlayers();
  return Response.json({ ok: true, player, match });
}
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const playerId = String(url.searchParams.get("playerId") || "");
  if (!playerId) return Response.json({ ok: false });
  const match = pairPlayers();
  return Response.json({ ok: true, match });
}
