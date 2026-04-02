import { NextRequest } from "next/server";
import { move } from "@/lib/ludo/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  const idx = Number(body?.idx || -1);
  const { id } = await context.params;
  const r = move(id, playerId, idx);
  return Response.json(r);
}
