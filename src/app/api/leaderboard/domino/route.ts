import { loadUsers } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

// GET /api/leaderboard/domino?limit=50&offset=0
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit")  || "50"));
  const offset = Math.max(0,   parseInt(url.searchParams.get("offset") || "0"));

  const users = loadUsers();
  const items = users
    .filter((u) => (u.matchesDomino || 0) > 0)          // only players who played
    .map((u, _i) => ({
      id:       u.id,
      name:     u.name,
      rating:   u.ratings.domino,
      wins:     u.winsDomino    || 0,
      losses:   u.lossesDomino  || 0,
      matches:  u.matchesDomino || 0,
      streak:   u.longestWinStreakDomino || 0,
      level:    u.level || 1,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(offset, offset + limit)
    .map((u, i) => ({ ...u, rank: offset + i + 1 }));

  return Response.json({ items, total: users.length });
}
