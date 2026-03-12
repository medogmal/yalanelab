import { getCurrentUser } from "@/lib/auth/session";
import { loadFinished } from "@/lib/chess/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ matches: [] }, { status: 401 });
  const url = new URL(req.url);
  const gameKey = String(url.searchParams.get("gameKey") || "chess");
  const limit = parseInt(String(url.searchParams.get("limit") || "50"), 10);
  if (gameKey !== "chess") return Response.json({ matches: [] });
  const finished = loadFinished();
  const mine = finished
    .filter((m) => m.wUserId === u.id || m.bUserId === u.id || m.wName === u.name || m.bName === u.name)
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, Math.max(1, Math.min(200, limit)));
  return Response.json({ matches: mine });
}
