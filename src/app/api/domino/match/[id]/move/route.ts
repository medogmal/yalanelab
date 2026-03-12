import { NextRequest } from "next/server";
import { pushMove } from "@/lib/domino/server";
import type { Domino, Side } from "@/lib/domino/game";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  const tile = body?.tile as Domino | undefined;
  const side = String(body?.side || "") as Side;
  if (!playerId || !tile || (side !== "left" && side !== "right")) return Response.json({ error: "bad_input" }, { status: 400 });
  const res = pushMove(id, playerId, tile, side);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}
