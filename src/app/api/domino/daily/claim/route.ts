import { getCurrentUser } from "@/lib/auth/session";
import { claimDailyReward } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const preserve = !!body?.preserveWithGems;
  const r = claimDailyReward(u.id, { preserveWithGems: preserve });
  return Response.json(r);
}
