import { getCurrentUser } from "@/lib/auth/session";
import { claimSeasonReward } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function POST() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = claimSeasonReward(u.id);
  return Response.json(r);
}
