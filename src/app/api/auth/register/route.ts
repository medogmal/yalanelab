import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { createUser, getUserByEmail } from "@/lib/auth/store";
import { createSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!name || !email || !password) return Response.json({ error: "bad_input" }, { status: 400 });
  if (getUserByEmail(email)) return Response.json({ error: "email_exists" }, { status: 409 });
  const user = createUser(randomUUID(), name, email, password);
  if (!user) return Response.json({ error: "create_failed" }, { status: 500 });
  await createSession(user.id);
  return Response.json({ id: user.id, name: user.name, email: user.email, ratings: user.ratings });
}
