import { NextRequest, NextResponse } from "next/server";
import { registerTournament, listRegistrations } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tId = searchParams.get("tournamentId");
  if (!tId) return NextResponse.json({ error: "missing" }, { status: 400 });
  return NextResponse.json(listRegistrations(tId));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tournamentId = String(body?.tournamentId || "");
  const name = String(body?.name || "");
  const email = String(body?.email || "");
  if (!tournamentId || !name || !email) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const r = registerTournament(tournamentId, name, email);
    return NextResponse.json(r);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
