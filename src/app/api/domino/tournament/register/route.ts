import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

declare global {
  var __TOUR_MEM__: { schedule: Array<{ id: string; name: string; kind: "daily" | "weekly"; startAt: number; registered: number; maxPlayers: number }> } | undefined;
}
function getMem() {
  if (!global.__TOUR_MEM__) {
    global.__TOUR_MEM__ = { schedule: [] };
  }
  return global.__TOUR_MEM__;
}
const mem: { regs: Record<string, Set<string>> } = { regs: {} };

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body?.tournamentId || "");
  if (!id) return Response.json({ error: "bad_id" }, { status: 400 });
  if (!mem.regs[id]) mem.regs[id] = new Set();
  mem.regs[id].add(u.id);
  const m = getMem();
  const item = m.schedule.find((s) => s.id === id);
  if (item) item.registered = mem.regs[id].size;
  return Response.json({ ok: true, registered: mem.regs[id].size });
}
