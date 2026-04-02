import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const AVATURN_API = "https://api.avaturn.me";
const API_KEY     = process.env.AVATURN_API_KEY || "";

/* ══════════════════════════════════════════════════════════════
   POST /api/avatar/session
   بيعمل Avaturn session للاعب ويرجع URL يفتحه في الـ iframe
══════════════════════════════════════════════════════════════ */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // لو مفيش API Key — ارجع demo URL
  if (!API_KEY) {
    return NextResponse.json({
      url: "https://demo.avaturn.me",
      demo: true,
      message: "أضف AVATURN_API_KEY في .env للنسخة الكاملة",
    });
  }

  try {
    // 1. جلب أو إنشاء Avaturn user ID للـ user ده
    const { loadUsers, saveUsers } = await import("@/lib/auth/store");
    const users = loadUsers();
    const idx   = users.findIndex((u: any) => u.id === user.id);

    let avaturnUserId = users[idx]?.avaturnUserId;

    if (!avaturnUserId) {
      // إنشاء user جديد في Avaturn
      const createRes = await fetch(`${AVATURN_API}/users/new`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (!createRes.ok) throw new Error("Failed to create Avaturn user");
      const userData = await createRes.json();
      avaturnUserId  = userData.id;

      // حفظ الـ ID
      users[idx].avaturnUserId = avaturnUserId;
      saveUsers(users);
    }

    // 2. إنشاء Session
    const sessionRes = await fetch(`${AVATURN_API}/sessions/new`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id:      avaturnUserId,
        session_type: "create_or_edit_existing",
      }),
    });

    if (!sessionRes.ok) throw new Error("Failed to create session");
    const session = await sessionRes.json();

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error("[Avaturn Session]", err.message);
    // Fallback للـ demo
    return NextResponse.json({
      url: "https://demo.avaturn.me",
      demo: true,
      error: err.message,
    });
  }
}
