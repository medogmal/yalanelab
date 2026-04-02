import fs from "fs";
import path from "path";
import { randomBytes, pbkdf2Sync } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Types from store.ts (simplified)
type User = {
  id: string;
  name: string;
  email: string;
  passHash: string;
  salt: string;
  createdAt: number;
  ratings: { chess: number; domino: number };
  tier: "free" | "pro" | "elite";
  cosmetics: any;
  unlockedPieceSets: any[];
  unlockedBoardThemes: any[];
  coins: number;
  gems: number;
  role: "user" | "admin" | "super_admin"; // Adding role support
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
}

function loadUsers(): User[] {
  ensureDataDir();
  try {
    const txt = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(txt) as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

function hashPassword(password: string, salt?: string) {
  const s = salt || randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, s, 100_000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

async function main() {
  const email = "sldv.smsm1234@gmail.com";
  const password = "a01013177727";
  
  console.log(`Creating/Updating JSON admin user: ${email}`);

  const users = loadUsers();
  const existingIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

  const { hash, salt } = hashPassword(password);

  const adminUser: User = {
    id: existingIndex >= 0 ? users[existingIndex].id : "super_admin_" + Date.now(),
    name: "Super Admin",
    email: email,
    passHash: hash,
    salt: salt,
    createdAt: Date.now(),
    ratings: { chess: 1200, domino: 1200 },
    tier: "elite",
    role: "super_admin",
    coins: 999999,
    gems: 999999,
    cosmetics: { pieceSet: "gold", boardTheme: "ocean" },
    unlockedPieceSets: ["lichess", "staunton", "gold", "neon"],
    unlockedBoardThemes: ["classic", "wood", "carbon", "ocean"]
  };

  if (existingIndex >= 0) {
    users[existingIndex] = { ...users[existingIndex], ...adminUser };
    console.log("Updated existing user.");
  } else {
    users.push(adminUser);
    console.log("Created new user.");
  }

  saveUsers(users);
  console.log("User saved to data/users.json");
}

main();
