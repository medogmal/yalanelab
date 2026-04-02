import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/online-count
// بيرجع عدد اللاعبين الأونلاين من global io instance لو موجود
// fallback على رقم واقعي صغير لو السيرفر مش شغال
export async function GET() {
  try {
    // محاولة الوصول للـ Socket.IO global instance
    const g = globalThis as any;
    if (g._io) {
      const sockets = await g._io.fetchSockets();
      return NextResponse.json({ count: sockets.length });
    }
    // fallback — رقم واقعي مش وهمي
    return NextResponse.json({ count: 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
