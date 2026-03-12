import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { equipped } = body; // Expecting { equipped: { avatar: "...", ... } }

  if (equipped) {
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        avatarSkin: equipped.avatar,
        ludoSkin: equipped.ludo_skin,
        chessSkin: equipped.chess_skin,
        balootSkin: equipped.baloot_skin,
        dominoSkin: equipped.domino_skin,
      },
    });
  }

  return NextResponse.json({ success: true });
}
