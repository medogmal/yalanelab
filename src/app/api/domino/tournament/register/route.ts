import { getCurrentUser } from "@/lib/auth/session";
import { spendCoins, grantXp, grantCoins } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

/* ── Share the same memory as schedule ── */
type TourneyStatus = "upcoming" | "open" | "in_progress" | "finished";
type TournamentRecord = {
  id:          string;
  name:        string;
  kind:        string;
  status:      TourneyStatus;
  startAt:     number;
  endAt:       number;
  registered:  number;
  maxPlayers:  number;
  prizeCoins:  number;
  entryFee:    number;
  description: string;
  registrants: Set<string>;
};

declare global {
  var __TOUR_MEM__: TournamentRecord[] | undefined;
}

/* ══════════════════════════════════════════════════════════════
   POST /api/domino/tournament/register
══════════════════════════════════════════════════════════════ */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tournamentId = String(body?.tournamentId || "");
  if (!tournamentId) return Response.json({ error: "bad_id" }, { status: 400 });

  const tournaments = global.__TOUR_MEM__ ?? [];
  const t = tournaments.find(x => x.id === tournamentId);
  if (!t) return Response.json({ error: "not_found" }, { status: 404 });

  // التحقق من الحالة
  if (t.status === "finished")    return Response.json({ error: "tournament_finished" }, { status: 400 });
  if (t.status === "in_progress") return Response.json({ error: "already_started" }, { status: 400 });

  // التحقق من الامتلاء
  if (t.registered >= t.maxPlayers) return Response.json({ error: "tournament_full" }, { status: 400 });

  // التحقق من عدم التسجيل المسبق
  if (!t.registrants) t.registrants = new Set();
  if (t.registrants.has(u.id)) return Response.json({ error: "already_registered" }, { status: 400 });

  // خصم رسوم الدخول
  if (t.entryFee > 0) {
    const spent = spendCoins(u.id, t.entryFee);
    if (!spent) return Response.json({ error: "insufficient_coins" }, { status: 400 });
  }

  // تسجيل اللاعب
  t.registrants.add(u.id);
  t.registered = t.registrants.size;

  return Response.json({
    ok:         true,
    registered: t.registered,
    maxPlayers: t.maxPlayers,
    message:    `تم تسجيلك في ${t.name}`,
  });
}

/* ══════════════════════════════════════════════════════════════
   DELETE /api/domino/tournament/register — إلغاء التسجيل
══════════════════════════════════════════════════════════════ */
export async function DELETE(req: Request) {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tournamentId = String(body?.tournamentId || "");
  const tournaments  = global.__TOUR_MEM__ ?? [];
  const t = tournaments.find(x => x.id === tournamentId);

  if (!t || !t.registrants?.has(u.id)) {
    return Response.json({ error: "not_registered" }, { status: 400 });
  }

  if (t.status !== "upcoming" && t.status !== "open") {
    return Response.json({ error: "cannot_cancel" }, { status: 400 });
  }

  // إعادة الرسوم
  if (t.entryFee > 0) {
    grantCoins(u.id, t.entryFee);
  }

  t.registrants.delete(u.id);
  t.registered = t.registrants.size;

  return Response.json({ ok: true });
}
