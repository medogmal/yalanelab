import { getCurrentUser } from "@/lib/auth/session";
import { loadUsers } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const me = loadUsers().find((x) => x.id === u.id)!;
  const avg = (me.totalDurationDomino || 0) / Math.max(1, me.matchesDomino || 0);
  return Response.json({
    matches: me.matchesDomino || 0,
    wins: me.winsDomino || 0,
    draws: me.drawsDomino || 0,
    losses: me.lossesDomino || 0,
    winRate: Math.round(100 * (me.winsDomino || 0) / Math.max(1, me.matchesDomino || 0)),
    longestWinStreak: me.longestWinStreakDomino || 0,
    avgDurationSec: Math.round(avg),
    xp: me.xp || 0,
    level: me.level || 1,
    rating: me.ratings.domino,
    coins: me.coins || 0,
    gems: me.gems || 0,
  });
}
