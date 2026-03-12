import { loadUsers } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const users = loadUsers();
  const items = users
    .filter((u) => (u.matchesDomino || 0) > 0)
    .map((u) => ({
      id:      u.id,
      name:    u.name,
      rating:  u.ratings.chess,
      wins:    u.winsDomino    || 0,
      losses:  u.lossesDomino  || 0,
      matches: u.matchesDomino || 0,
      level:   u.level || 1,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 100)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  return Response.json({ items });
}
