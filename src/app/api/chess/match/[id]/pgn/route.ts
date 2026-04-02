import { getMatch } from "@/lib/chess/server";
import { loadFinished } from "@/lib/chess/store";

export const dynamic = "force-dynamic";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const m = getMatch(id);
  if (m) return new Response(m.chess.pgn(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const fin = loadFinished().find((x) => x.id === id);
  if (fin) return new Response(fin.pgn, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response("not_found", { status: 404 });
}
