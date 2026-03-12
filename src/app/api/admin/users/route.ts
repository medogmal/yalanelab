
import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function getUsers() {
  if (!existsSync(USERS_FILE)) return [];
  try {
    const data = readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveUsers(users: any[]) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export async function GET() {
  const users = getUsers();
  // Return safe user data
  const safeUsers = users.map((u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    tier: u.tier || "free",
    coins: u.coins || 0,
    createdAt: u.createdAt
  }));
  return NextResponse.json(safeUsers);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, role, tier } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const users = getUsers();
    const index = users.findIndex((u: any) => u.id === id);

    if (index === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update fields
    if (role) users[index].role = role;
    if (tier) users[index].tier = tier;

    saveUsers(users);
    
    return NextResponse.json({ success: true, user: users[index] });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
