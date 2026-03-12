import { NextRequest } from "next/server";
import { getMatch } from "@/lib/chess/server";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const match = getMatch(id);
  if (!match) return Response.json({ error: "not_found" }, { status: 404 });
  let timeW = match.timeW;
  let timeB = match.timeB;
  if (match.lastTurnAt) {
    const elapsed = Date.now() - match.lastTurnAt;
    if (match.chess.turn() === "w") timeW = Math.max(0, match.timeW - elapsed);
    else timeB = Math.max(0, match.timeB - elapsed);
  }
  return Response.json({
    id: match.id,
    fen: match.chess.fen(),
    turn: match.chess.turn(),
    w: match.w.name,
    b: match.b.name,
    seq: match.seq,
    time: match.time,
    timeW,
    timeB,
  });
}
