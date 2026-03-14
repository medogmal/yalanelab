import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById, loadUsers, updateUser } from "@/lib/auth/store";

// GET /api/user/friends — get friend list
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const friends = ((user as any).friends ?? []) as string[];
  const all = loadUsers();
  const list = friends
    .map(fid => all.find(u => u.id === fid))
    .filter(Boolean)
    .map(u => ({
      id: u!.id, name: u!.name,
      level: u!.level ?? 1,
      ratingDomino: u!.ratings?.domino ?? 1200,
      ratingChess: u!.ratings?.chess ?? 1200,
    }));

  return NextResponse.json({ friends: list });
}

// POST /api/user/friends — add or remove friend
// body: { targetId, action: "add" | "remove" }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { targetId, action } = await req.json();
  if (!targetId || !["add","remove"].includes(action))
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const user = getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const target = getUserById(targetId);
  if (!target) return NextResponse.json({ error: "target_not_found" }, { status: 404 });

  const friends: string[] = (user as any).friends ?? [];

  if (action === "add") {
    if (!friends.includes(targetId)) friends.push(targetId);
  } else {
    const idx = friends.indexOf(targetId);
    if (idx !== -1) friends.splice(idx, 1);
  }

  (user as any).friends = friends;
  updateUser(user);

  return NextResponse.json({ ok: true, friends });
}
