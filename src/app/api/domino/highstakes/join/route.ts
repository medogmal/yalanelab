import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { joinHighStakes } from "@/lib/domino/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const u = await getCurrentUser();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "لاعب");
  const r = joinHighStakes(name, u?.id);
  return Response.json({ ok: true, player: { id: r.player.id, name: r.player.name }, match: r.match ? { id: r.match.id } : null });
}
