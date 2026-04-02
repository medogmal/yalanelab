import { getCurrentUser } from "@/lib/auth/session";
import { getRoyalPass, upgradeRoyalPass } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = getRoyalPass(u.id);
  return Response.json(r);
}
export async function POST() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = upgradeRoyalPass(u.id);
  return Response.json(r);
}
