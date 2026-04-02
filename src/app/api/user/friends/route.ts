import { getCurrentUser } from "@/lib/auth/session";
import { getFriends, sendFriendRequest, acceptFriendRequest, removeFriend } from "@/lib/auth/store";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// GET /api/user/friends — جلب قائمة الأصدقاء والطلبات الواردة
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(getFriends(u.id));
}

// POST /api/user/friends — إرسال طلب أو قبول أو حذف
export async function POST(req: Request) {
  if (!rateLimit(getIp(req), { max: 20, windowMs: 60_000 }))
    return Response.json({ error: "too_many_requests" }, { status: 429 });

  const u = await getCurrentUser();
  if (!u) return Response.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { action, targetId } = body;

  if (!targetId) return Response.json({ error: "missing targetId" }, { status: 400 });

  if (action === "send")   return Response.json(sendFriendRequest(u.id, targetId));
  if (action === "accept") return Response.json(acceptFriendRequest(u.id, targetId));
  if (action === "remove") return Response.json(removeFriend(u.id, targetId));

  return Response.json({ error: "invalid action" }, { status: 400 });
}
