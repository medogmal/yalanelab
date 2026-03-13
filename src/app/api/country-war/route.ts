import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function getCurrentWeek(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
function getWeekEnd(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(23, 59, 59, 0);
  return friday.toISOString();
}

const COUNTRY_META: Record<string, { name: string; flag: string; color: string }> = {
  SA: { name: "السعودية", flag: "🇸🇦", color: "#006233" },
  EG: { name: "مصر",     flag: "🇪🇬", color: "#ce1126" },
  YE: { name: "اليمن",   flag: "🇾🇪", color: "#c8102e" },
  AE: { name: "الإمارات",flag: "🇦🇪", color: "#009e60" },
  KW: { name: "الكويت",  flag: "🇰🇼", color: "#007a3d" },
  OTHER: { name: "أخرى", flag: "🌍",  color: "#475569" },
};

export async function GET() {
  try {
    const week = getCurrentWeek();
    let scores: { country: string; score: number; wins: number }[] = [];
    try {
      scores = await prisma.countryScore.findMany({ where: { week } });
    } catch { /* table may not exist yet — returns zeros */ }

    const result = Object.entries(COUNTRY_META)
      .map(([code, meta]) => {
        const row = scores.find((s) => s.country === code);
        return { code, week, ...meta, score: row?.score ?? 0, wins: row?.wins ?? 0 };
      })
      .sort((a, b) => b.score - a.score);

    const total = result.reduce((s, c) => s + c.score, 0) || 1;
    return NextResponse.json({ week, countries: result, total, endsAt: getWeekEnd() });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // rate limit: max 60 per minute per IP
  if (!rateLimit(getIp(req), { max: 60, windowMs: 60_000 })) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  try {
    const { country, delta = 1 } = await req.json();
    if (!country || !COUNTRY_META[country])
      return NextResponse.json({ error: "invalid country" }, { status: 400 });

    const week = getCurrentWeek();
    try {
      await prisma.countryScore.upsert({
        where: { country_week: { country, week } },
        update: { score: { increment: delta }, wins: { increment: 1 } },
        create: { country, week, score: delta, wins: 1 },
      });
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
