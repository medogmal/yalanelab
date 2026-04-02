import { getCurrentUser } from "@/lib/auth/session";
import { getChestStatus, startChestUnlock, openChest } from "@/lib/auth/store";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = getChestStatus(u.id);
  return Response.json(r);
}
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "");
  if (action === "start") {
    const kind = String(body?.kind || "wooden") as "wooden" | "silver" | "golden" | "legendary";
    const r = startChestUnlock(u.id, kind);
    return Response.json(r);
  }
  if (action === "open") {
    const instant = !!body?.instant;
    const r = openChest(u.id, instant);
    return Response.json(r);
  }
  return Response.json({ error: "bad_action" }, { status: 400 });
}
