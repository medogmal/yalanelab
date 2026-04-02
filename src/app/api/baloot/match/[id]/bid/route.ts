import { NextRequest } from "next/server";
import { bid } from "@/lib/baloot/server";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const playerId = String(body?.playerId || "");
  const mode = String(body?.mode || "hokom") as "hokom" | "sun" | "pass";
  const trump = body?.trump || null;
  if (mode === "pass") {
    const res = await (async () => {
      // reuse bid endpoint with pass signal
      return bid(id, playerId, "hokom", trump || undefined); // will be interpreted as pass in server if not outranking (handled there)
    })();
    return Response.json(res);
  } else {
    const res = bid(id, playerId, mode as "hokom" | "sun", trump || undefined);
    return Response.json(res);
  }
}
