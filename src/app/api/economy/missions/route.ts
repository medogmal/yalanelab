import { getCurrentUser } from "@/lib/auth/session";
import { getMissions, claimMission } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = getMissions(u.id);
  return Response.json(r);
}
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.missionId || "");
  if (!id) return Response.json({ error: "missing" }, { status: 400 });
  const r = claimMission(u.id, id);
  return Response.json(r);
}
