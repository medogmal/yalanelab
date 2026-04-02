import { NextRequest } from "next/server";
import { getEvents } from "@/lib/baloot/server";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const url = new URL(req.url);
  const since = parseInt(url.searchParams.get("since") || "0", 10);
  const ev = getEvents(id, since);
  return Response.json(ev);
}
