
import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { sendTournamentEmail } from "@/lib/email";
import { loadUsers } from "@/lib/auth/store";

const DATA_DIR = path.join(process.cwd(), "data");
const TOURNAMENTS_FILE = path.join(DATA_DIR, "tournaments.json");

// Define Tournament Type
type Tournament = {
  id: string;
  title: string;
  gameType: "baloot" | "ludo" | "domino";
  startDate: string; // ISO string
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  description?: string;
  winnerId?: string;
  createdAt: number;
};

// Helper to read/write
function getTournaments(): Tournament[] {
  if (!existsSync(TOURNAMENTS_FILE)) {
    if (!existsSync(DATA_DIR)) {
      // Create data directory if it doesn't exist
      // mkdirSync(DATA_DIR, { recursive: true }); // Assume handled by other routes or manual creation
    }
    writeFileSync(TOURNAMENTS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = readFileSync(TOURNAMENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveTournaments(tournaments: Tournament[]) {
  writeFileSync(TOURNAMENTS_FILE, JSON.stringify(tournaments, null, 2));
}

export async function GET() {
  try {
    const tournaments = getTournaments();
    return NextResponse.json(tournaments);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, gameType, startDate, maxParticipants, prizePool, description } = body;

    if (!title || !gameType || !startDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tournaments = getTournaments();
    const newTournament: Tournament = {
      id: Math.random().toString(36).substring(2, 15),
      title,
      gameType,
      startDate,
      status: "upcoming",
      maxParticipants: Number(maxParticipants) || 16,
      currentParticipants: 0,
      prizePool: prizePool || "0",
      description: description || "",
      createdAt: Date.now(),
    };

    tournaments.push(newTournament);
    saveTournaments(tournaments);

    // إرسال إيميل لكل المستخدمين المسجلين (non-blocking)
    const origin = process.env.NEXTAUTH_URL || "https://yalanelab.com";
    try {
      const users = loadUsers();
      users.forEach(u => {
        if (u.email) {
          sendTournamentEmail(u.email, u.name, {
            title: newTournament.title,
            startDate: newTournament.startDate,
            prizePool: newTournament.prizePool,
            game: newTournament.gameType,
            url: `${origin}/tournaments`,
          }).catch(() => {});
        }
      });
    } catch {}

    return NextResponse.json(newTournament);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    let tournaments = getTournaments();
    tournaments = tournaments.filter(t => t.id !== id);
    saveTournaments(tournaments);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete tournament" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, status, winnerId } = body;

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const tournaments = getTournaments();
        const index = tournaments.findIndex(t => t.id === id);

        if (index === -1) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

        if (status) tournaments[index].status = status;
        if (winnerId) tournaments[index].winnerId = winnerId;

        saveTournaments(tournaments);
        return NextResponse.json(tournaments[index]);
    } catch (e) {
        return NextResponse.json({ error: "Failed to update tournament" }, { status: 500 });
    }
}
