import { getCurrentUser } from "@/lib/auth/session";
import { grantCoins, getDailyStatus, claimDailyReward } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const status = getDailyStatus(u.id);
  return Response.json(status);
}

export async function POST() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const result = claimDailyReward(u.id);
  return Response.json(result);
}
