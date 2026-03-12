import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth/session";
import { type Player } from "@/lib/domino/server";
export const dynamic = "force-dynamic";
declare global {
  var __ROOMS__: Map<string, { id: string; players: Player[]; matchId?: string }>;
}
function rooms() {
  if (!global.__ROOMS__) global.__ROOMS__ = new Map();
  return global.__ROOMS__;
}
export async function POST() {
  const u = await getCurrentUser();
  const id = randomUUID().slice(0, 6).toUpperCase();
  rooms().set(id, { id, players: [] });
  return Response.json({ id, owner: u?.id || null });
}
