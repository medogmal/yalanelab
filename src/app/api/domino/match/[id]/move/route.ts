import { NextRequest } from "next/server";
import { pushMove, drawIfNeeded, getMatch } from "@/lib/domino/server";
import type { Domino, Side } from "@/lib/domino/game";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  if (!playerId) return Response.json({ error: "bad_input" }, { status: 400 });

  // Draw action
  if (body?.action === "draw") {
    const result = drawIfNeeded(id, playerId);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ ok: true, drew: result.drew, hasMoves: result.hasMoves });
  }

  // Regular move
  const tile = body?.tile as Domino | undefined;
  const side = String(body?.side || "") as Side;
  if (!tile || (side !== "left" && side !== "right")) return Response.json({ error: "bad_input" }, { status: 400 });
  const res = pushMove(id, playerId, tile, side);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}
