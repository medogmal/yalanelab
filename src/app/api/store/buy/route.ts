import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, price, type } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.profile.coins < price) {
    return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
  }

  // Deduct coins and add item
  await prisma.$transaction([
    prisma.profile.update({
      where: { id: user.profile.id },
      data: { coins: { decrement: price } },
    }),
    prisma.inventoryItem.create({
      data: {
        userId: user.id,
        itemId,
        type,
      },
    }),
  ]);

  return NextResponse.json({ success: true, newBalance: user.profile.coins - price });
}
