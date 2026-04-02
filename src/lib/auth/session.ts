import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./store";

type Session = { id: string; userId: string; createdAt: number };
type SessionMem = { sessions: Map<string, Session> };

declare global {
  var __SESSION_MEM__: SessionMem | undefined;
}

function mem(): SessionMem {
  if (!global.__SESSION_MEM__) {
    global.__SESSION_MEM__ = { sessions: new Map() };
  }
  return global.__SESSION_MEM__;
}

export async function createSession(userId: string) {
  const s: Session = { id: randomUUID(), userId, createdAt: Date.now() };
  mem().sessions.set(s.id, s);
  (await cookies()).set("sid", s.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
  return s;
}

export async function destroySession() {
  const sid = (await cookies()).get("sid")?.value;
  if (sid) mem().sessions.delete(sid);
  (await cookies()).set("sid", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCurrentUser() {
  const sid = (await cookies()).get("sid")?.value;
  if (!sid) return null;
  const s = mem().sessions.get(sid);
  if (!s) return null;
  const u = getUserById(s.userId);
  return u || null;
}
