import { getCurrentUser } from "@/lib/auth/session";
import { spendCoins } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

/* ══════════════════════════════════════════════════════════════
   TOURNAMENT MEMORY STORE
   بيانات البطولات في الذاكرة مع persistence بـ global
══════════════════════════════════════════════════════════════ */
type TourneyStatus = "upcoming" | "open" | "in_progress" | "finished";
type TourneyKind   = "daily" | "weekly" | "special";

type TournamentRecord = {
  id:           string;
  name:         string;
  kind:         TourneyKind;
  status:       TourneyStatus;
  startAt:      number;
  endAt:        number;
  registered:   number;
  maxPlayers:   number;
  prizeCoins:   number;
  prizeGems?:   number;
  entryFee:     number;
  description:  string;
  registrants:  Set<string>;  // user IDs
};

declare global {
  var __TOUR_MEM__: TournamentRecord[] | undefined;
}

function buildSchedule(): TournamentRecord[] {
  const now = Date.now();
  const h = 3_600_000;
  const d = 86_400_000;

  return [
    {
      id:          "daily-open",
      name:        "بطولة الفجر اليومية",
      kind:        "daily",
      status:      "open",
      startAt:     now + h,
      endAt:       now + h * 3,
      registered:  Math.floor(Math.random() * 20) + 5,
      maxPlayers:  32,
      prizeCoins:  5000,
      entryFee:    0,
      description: "بطولة يومية مفتوحة للجميع — ٣٢ لاعب",
      registrants: new Set(),
    },
    {
      id:          "weekly-gold",
      name:        "كأس الأسبوع الذهبي",
      kind:        "weekly",
      status:      "open",
      startAt:     now + h * 3,
      endAt:       now + h * 5,
      registered:  Math.floor(Math.random() * 40) + 10,
      maxPlayers:  64,
      prizeCoins:  50_000,
      prizeGems:   100,
      entryFee:    500,
      description: "البطولة الأسبوعية الكبرى — جوائز ضخمة",
      registrants: new Set(),
    },
    {
      id:          "special-pro",
      name:        "دوري المحترفين",
      kind:        "special",
      status:      now % (h * 6) < h * 2 ? "in_progress" : "open",
      startAt:     now - h,
      endAt:       now + h,
      registered:  16,
      maxPlayers:  16,
      prizeCoins:  20_000,
      prizeGems:   50,
      entryFee:    1_000,
      description: "للمحترفين فقط — ELO +1400",
      registrants: new Set(),
    },
    {
      id:          "daily-upcoming",
      name:        "بطولة المساء",
      kind:        "daily",
      status:      "upcoming",
      startAt:     now + d * 0.3,
      endAt:       now + d * 0.4,
      registered:  0,
      maxPlayers:  32,
      prizeCoins:  5_000,
      entryFee:    0,
      description: "بطولة مسائية قادمة — سجّل مسبقاً",
      registrants: new Set(),
    },
  ];
}

function getMem(): TournamentRecord[] {
  if (!global.__TOUR_MEM__ || global.__TOUR_MEM__.length === 0) {
    global.__TOUR_MEM__ = buildSchedule();
  }
  // تحديث الـ status تلقائياً
  const now = Date.now();
  for (const t of global.__TOUR_MEM__) {
    if (t.status === "upcoming" && now >= t.startAt - 1800_000) t.status = "open";
    if (t.status === "open"     && now >= t.startAt)            t.status = "in_progress";
    if (t.status === "in_progress" && now >= t.endAt)           t.status = "finished";
  }
  return global.__TOUR_MEM__;
}

/* ══════════════════════════════════════════════════════════════
   GET /api/domino/tournament/schedule
══════════════════════════════════════════════════════════════ */
export async function GET(req: Request) {
  const u = await getCurrentUser().catch(() => null);
  const tournaments = getMem();

  const schedule = tournaments.map(t => ({
    id:            t.id,
    name:          t.name,
    kind:          t.kind,
    status:        t.status,
    startAt:       t.startAt,
    endAt:         t.endAt,
    registered:    t.registered,
    maxPlayers:    t.maxPlayers,
    prizeCoins:    t.prizeCoins,
    prizeGems:     t.prizeGems,
    entryFee:      t.entryFee,
    description:   t.description,
    registered_me: u ? t.registrants.has(u.id) : false,
  }));

  return Response.json({ schedule });
}

/* ══════════════════════════════════════════════════════════════
   POST /api/domino/tournament/schedule — إنشاء بطولة (admin)
══════════════════════════════════════════════════════════════ */
export async function POST(req: Request) {
  // للاستخدام المستقبلي من لوحة الإدارة
  return Response.json({ ok: false, error: "not_implemented" }, { status: 501 });
}
