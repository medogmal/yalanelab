import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getUserById } from "./store";
import fs from "fs";
import path from "path";

type Session = { id: string; userId: string; createdAt: number };

// ── الـ sessions محفوظة في ملف JSON عشان تتحمل الـ restarts ──
const SESSIONS_FILE = path.join(process.cwd(), "data", "sessions.json");
const SESSION_TTL   = 14 * 24 * 60 * 60 * 1000; // 14 يوم

function ensureDir() {
  const dir = path.dirname(SESSIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadSessions(): Record<string, Session> {
  try {
    ensureDir();
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveSessions(sessions: Record<string, Session>) {
  try {
    ensureDir();
    // احذف الـ sessions المنتهية قبل الحفظ
    const now = Date.now();
    const active: Record<string, Session> = {};
    for (const [id, s] of Object.entries(sessions)) {
      if (now - s.createdAt < SESSION_TTL) active[id] = s;
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(active, null, 2), "utf-8");
  } catch (e) {
    console.error("[session] فشل حفظ الـ sessions:", e);
  }
}

export async function createSession(userId: string) {
  const s: Session = { id: randomUUID(), userId, createdAt: Date.now() };
  const sessions = loadSessions();
  sessions[s.id] = s;
  saveSessions(sessions);
  (await cookies()).set("sid", s.id, {
    httpOnly: true, sameSite: "lax", path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return s;
}

export async function destroySession() {
  const sid = (await cookies()).get("sid")?.value;
  if (sid) {
    const sessions = loadSessions();
    delete sessions[sid];
    saveSessions(sessions);
  }
  (await cookies()).set("sid", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getCurrentUser() {
  const sid = (await cookies()).get("sid")?.value;
  if (!sid) return null;
  const sessions = loadSessions();
  const s = sessions[sid];
  if (!s) return null;
  // تحقق إن الـ session ما انتهتش
  if (Date.now() - s.createdAt > SESSION_TTL) {
    delete sessions[sid];
    saveSessions(sessions);
    return null;
  }
  return getUserById(s.userId) || null;
}
