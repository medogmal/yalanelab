import { loadUsers } from "@/lib/auth/store";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url    = new URL(req.url);
  const limit  = Math.min(100, parseInt(url.searchParams.get("limit")  || "50"));
  const offset = Math.max(0,   parseInt(url.searchParams.get("offset") || "0"));

  const users = loadUsers();
  const items = users
    .filter(u => (u.matchesLudo || 0) > 0)
    .map(u => ({
      id:      u.id,
      name:    u.name,
      rating:  u.ratings?.ludo ?? 1200,
      wins:    u.winsLudo    || 0,
      losses:  u.lossesLudo  || 0,
      matches: u.matchesLudo || 0,
      level:   u.level || 1,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(offset, offset + limit)
    .map((u, i) => ({ ...u, rank: offset + i + 1 }));

  return Response.json({ items, total: users.length });
}
