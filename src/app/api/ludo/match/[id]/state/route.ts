import { NextRequest } from "next/server";
import { getState } from "@/lib/ludo/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const url = new URL(req.url);
  const playerId = url.searchParams.get("playerId") || "";
  const { id } = await context.params;
  const st = getState(id, playerId);
  if (!st) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(st);
}
