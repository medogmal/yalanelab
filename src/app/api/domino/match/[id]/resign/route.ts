import { NextRequest } from "next/server";
import { resign } from "@/lib/domino/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  if (!playerId) return Response.json({ error: "bad_input" }, { status: 400 });
  const res = resign(id, playerId);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true });
}
