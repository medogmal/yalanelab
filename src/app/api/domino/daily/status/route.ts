import { getCurrentUser } from "@/lib/auth/session";
import { getDailyStatus } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = getDailyStatus(u.id);
  return Response.json(r);
}
