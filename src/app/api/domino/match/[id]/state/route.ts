import { NextRequest } from "next/server";
import { getState } from "@/lib/domino/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const playerId = String(url.searchParams.get("playerId") || "");
  const st = getState(id, playerId);
  if (!st) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(st);
}
