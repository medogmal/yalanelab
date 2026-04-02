import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { loadUsers, saveUsers } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const users = loadUsers();
  const u = users.find((x: any) => x.id === user.id);
  return NextResponse.json({
    avatarUrl:  u?.avatarUrl  ?? null,
    playerName: u?.avatarName ?? user.name ?? "لاعب",
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { avatarUrl, playerName } = await req.json().catch(() => ({}));
  const users = loadUsers();
  const idx = users.findIndex((x: any) => x.id === user.id);
  if (idx === -1) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (avatarUrl)  users[idx].avatarUrl  = avatarUrl;
  if (playerName) users[idx].avatarName = playerName;
  users[idx].avatarUpdatedAt = new Date().toISOString();
  saveUsers(users);
  return NextResponse.json({ ok: true });
}
