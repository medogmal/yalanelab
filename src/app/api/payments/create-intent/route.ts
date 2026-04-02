import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const PACKAGES: Record<string, { coins: number; bonus: number; price: number; label: string }> = {
  coins_100:  { coins: 100,  bonus: 0,    price: 499,  label: "⚡ 100 كوين" },
  coins_500:  { coins: 500,  bonus: 100,  price: 999,  label: "🔥 600 كوين (+100 بونص)" },
  coins_1000: { coins: 1000, bonus: 500,  price: 1999, label: "💎 1500 كوين (+500 بونص)" },
  coins_5000: { coins: 5000, bonus: 5000, price: 4999, label: "👑 10000 كوين (+5000 بونص)" },
};

export async function GET() {
  return NextResponse.json({
    packages: Object.entries(PACKAGES).map(([id, p]) => ({
      id, label: p.label, coins: p.coins, bonus: p.bonus,
      total: p.coins + p.bonus, priceUsd: (p.price / 100).toFixed(2),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { packageId } = await req.json().catch(() => ({}));
  const pkg = PACKAGES[packageId];
  if (!pkg) return NextResponse.json({ error: "invalid_package" }, { status: 400 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.length < 20) {
    return NextResponse.json({ error: "stripe_not_configured", message: "أضف STRIPE_SECRET_KEY في .env أولاً" }, { status: 503 });
  }

  // Dynamic import عشان ما يكسرش لو Stripe مش مثبت
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey);

  const intent = await stripe.paymentIntents.create({
    amount:   pkg.price,
    currency: "usd",
    metadata: { userId: user.id, packageId, coins: String(pkg.coins + pkg.bonus) },
  });

  return NextResponse.json({ clientSecret: intent.client_secret, packageId, total: pkg.coins + pkg.bonus });
}
