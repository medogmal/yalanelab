import { NextRequest, NextResponse } from "next/server";
import { loadUsers, saveUsers } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

// Stripe Webhook — يضيف الكوينز بعد الدفع
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event: any;
  try {
    if (secret && sig) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } else {
      event = JSON.parse(body);
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook error: ${e.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent  = event.data.object;
    const userId  = intent.metadata?.userId;
    const coins   = parseInt(intent.metadata?.coins || "0", 10);

    if (userId && coins > 0) {
      const users = loadUsers();
      const u = users.find((x: any) => x.id === userId);
      if (u) {
        if (!u.profile) u.profile = {};
        u.profile.coins = (u.profile.coins || 0) + coins;
        saveUsers(users);
        console.log(`[Stripe Webhook] +${coins} coins → user ${userId}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
