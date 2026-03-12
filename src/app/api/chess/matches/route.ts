import { getMemory } from "@/lib/chess/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const mem = getMemory();
  const items = Array.from(mem.matches.values()).map((m) => ({
    id: m.id,
    w: m.w.name,
    b: m.b.name,
    turn: m.chess.turn(),
    time: m.time,
    timeW: m.timeW,
    timeB: m.timeB,
    createdAt: m.createdAt,
    seq: m.seq,
  }));
  return Response.json({ matches: items });
}
