import { NextRequest } from "next/server";
import { roll } from "@/lib/ludo/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  const { id } = await context.params;
  const r = roll(id, playerId);
  return Response.json(r);
}
