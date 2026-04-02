import { NextRequest } from "next/server";
import { play } from "@/lib/baloot/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  const card = body?.card;
  const res = play(id, playerId, card);
  return Response.json(res);
}
