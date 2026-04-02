import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const full = getUserById(u.id);
  if (!full) return Response.json({ error: "no_user" }, { status: 404 });
  return Response.json({ coins: full.coins || 0, gems: full.gems || 0, xp: full.xp || 0, level: full.level || 1 });
}
