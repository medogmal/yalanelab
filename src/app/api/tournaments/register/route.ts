import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { getCurrentUser } from "@/lib/auth/session";
import { spendCoins } from "@/lib/auth/store";
import { rateLimit, getIp } from "@/lib/rateLimit";

const DATA_DIR  = path.join(process.cwd(), "data");
const T_FILE    = path.join(DATA_DIR, "tournaments.json");
const REG_FILE  = path.join(DATA_DIR, "tournament_registrations.json");

type Registration = { tournamentId: string; userId: string; name: string; registeredAt: number };

function getTournaments() {
  try { return JSON.parse(readFileSync(T_FILE, "utf-8")); } catch { return []; }
}
function getRegistrations(): Registration[] {
  try { return JSON.parse(readFileSync(REG_FILE, "utf-8")); } catch { return []; }
}
function saveRegistrations(regs: Registration[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(REG_FILE, JSON.stringify(regs, null, 2));
}

export const dynamic = "force-dynamic";

// GET — قائمة المسجلين في بطولة
export async function GET(req: NextRequest) {
  const tid = new URL(req.url).searchParams.get("tournamentId");
  if (!tid) return NextResponse.json({ error: "missing tournamentId" }, { status: 400 });
  const regs = getRegistrations().filter(r => r.tournamentId === tid);
  return NextResponse.json({ count: regs.length, registrations: regs });
}

// POST — تسجيل في بطولة
export async function POST(req: NextRequest) {
  if (!rateLimit(getIp(req), { max: 10, windowMs: 60_000 }))
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tournamentId } = await req.json().catch(() => ({}));
  if (!tournamentId) return NextResponse.json({ error: "missing tournamentId" }, { status: 400 });

  const tournaments = getTournaments();
  const t = tournaments.find((x: any) => x.id === tournamentId);
  if (!t) return NextResponse.json({ error: "tournament not found" }, { status: 404 });
  if (t.status !== "upcoming") return NextResponse.json({ error: "registration closed" }, { status: 400 });

  const regs = getRegistrations();
  if (regs.some(r => r.tournamentId === tournamentId && r.userId === u.id))
    return NextResponse.json({ error: "already_registered" }, { status: 409 });

  if (t.currentParticipants >= t.maxParticipants)
    return NextResponse.json({ error: "tournament_full" }, { status: 400 });

  // Entry fee (لو محدد في الـ prizePool كـ "5000 كوين")
  const feeParsed = parseInt(String(t.entryFee ?? "0").replace(/\D/g, ""));
  if (feeParsed > 0 && !spendCoins(u.id, feeParsed))
    return NextResponse.json({ error: "insufficient_coins" }, { status: 402 });

  regs.push({ tournamentId, userId: u.id, name: u.name, registeredAt: Date.now() });
  saveRegistrations(regs);

  // update count
  const idx = tournaments.findIndex((x: any) => x.id === tournamentId);
  if (idx >= 0) {
    tournaments[idx].currentParticipants = regs.filter((r: Registration) => r.tournamentId === tournamentId).length;
    writeFileSync(T_FILE, JSON.stringify(tournaments, null, 2));
  }

  return NextResponse.json({ ok: true, message: "تم التسجيل بنجاح!" });
}
