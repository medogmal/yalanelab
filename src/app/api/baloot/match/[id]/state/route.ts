import { getState } from "@/lib/baloot/server";
export const dynamic = "force-dynamic";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(_.url);
  const playerId = String(url.searchParams.get("playerId") || "");
  const st = playerId ? getState(id, playerId) : null;
  return Response.json(st || { ok: false });
}
