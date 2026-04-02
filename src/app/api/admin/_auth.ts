import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// BUG-04 FIX: helper موحد للتحقق من صلاحية الأدمن
// استخدام: const authError = await requireAdmin(); if (authError) return authError;
export async function requireAdmin(): Promise<NextResponse | null> {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (u.role !== "admin" && u.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}
