import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/streak — يرجع الـ streak الحالي للمستخدم
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ current: 0, longest: 0, canClaim: false });
    }

    const streak = await prisma.dailyStreak.findUnique({
      where: { userId: session.user.id },
    });

    if (!streak) {
      return NextResponse.json({ current: 0, longest: 0, canClaim: true });
    }

    const now = new Date();
    const last = streak.lastClaimedAt ? new Date(streak.lastClaimedAt) : null;
    const hoursSinceLast = last
      ? (now.getTime() - last.getTime()) / 3600000
      : 999;

    const canClaim = hoursSinceLast >= 20; // يقدر يطلب كل 20 ساعة
    const isBroken = hoursSinceLast >= 48; // الـ streak بينكسر بعد 48 ساعة

    return NextResponse.json({
      current: isBroken ? 0 : streak.current,
      longest: streak.longest,
      canClaim,
      lastClaimedAt: streak.lastClaimedAt,
    });
  } catch {
    return NextResponse.json({ current: 0, longest: 0, canClaim: false });
  }
}

// POST /api/streak/claim — يطلب المكافأة اليومية
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();

    const existing = await prisma.dailyStreak.findUnique({ where: { userId } });

    const hoursSinceLast = existing?.lastClaimedAt
      ? (now.getTime() - new Date(existing.lastClaimedAt).getTime()) / 3600000
      : 999;

    if (hoursSinceLast < 20) {
      return NextResponse.json({ error: "too_soon" }, { status: 400 });
    }

    const isBroken = hoursSinceLast >= 48;
    const newCurrent = isBroken ? 1 : (existing?.current ?? 0) + 1;
    const newLongest = Math.max(newCurrent, existing?.longest ?? 0);

    // مكافأة حسب عدد الأيام المتواصلة
    const reward = Math.min(100 + newCurrent * 50, 500); // 150، 200، ..، max 500

    const streak = await prisma.dailyStreak.upsert({
      where: { userId },
      update: { current: newCurrent, longest: newLongest, lastClaimedAt: now, updatedAt: now },
      create: { userId, current: 1, longest: 1, lastClaimedAt: now, updatedAt: now },
    });

    // أضف الكوينز للـ profile
    await prisma.profile.updateMany({
      where: { userId },
      data: { coins: { increment: reward } },
    });

    return NextResponse.json({
      ok: true,
      current: streak.current,
      longest: streak.longest,
      reward,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
