import { NextRequest } from "next/server";
import { pushMove } from "@/lib/chess/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const side = String(body?.side || "");
  const from = String(body?.from || "");
  const to = String(body?.to || "");
  const promotion = body?.promotion ? String(body.promotion) : undefined;
  if (side !== "w" && side !== "b") return Response.json({ error: "bad_side" }, { status: 400 });
  const res = pushMove(id, side as "w" | "b", from, to, promotion);
  if (!res.ok) return Response.json({ error: res.error }, { status: 400 });
  return Response.json({ ok: true, fen: res.fen });
}
