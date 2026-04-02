import { NextRequest, NextResponse } from "next/server";
import {
  getState, getEvents, pushMove, drawIfNeeded, resign,
  getMatch, joinSpectator, leaveSpectator, reconnectPlayer,
} from "@/lib/domino/server";
import type { Side, Tile } from "@/lib/domino/game";

export const dynamic = "force-dynamic";

// GET /api/domino/match/[id]
// ?playerId=xxx&action=state|events|spectate&since=0
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await context.params;
  const url      = new URL(req.url);
  const playerId = url.searchParams.get("playerId") ?? "";
  const action   = url.searchParams.get("action")   ?? "state";
  const since    = parseInt(url.searchParams.get("since") ?? "0");

  if (action === "events") {
    return NextResponse.json(getEvents(matchId, since));
  }

  if (action === "spectate") {
    if (!playerId) return NextResponse.json({ error: "missing playerId" }, { status: 400 });
    joinSpectator(matchId, playerId);
    const state = getState(matchId, playerId);
    if (!state) return NextResponse.json({ error: "match not found" }, { status: 404 });
    return NextResponse.json(state);
  }

  // default: state
  const state = getState(matchId, playerId);
  if (!state) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(state);
}

// POST /api/domino/match/[id]
// body: { playerId, action: "move"|"draw"|"resign"|"spectate_leave"|"reconnect", tile?, side? }
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const { playerId, action, tile, side } = body;

  if (!playerId && action !== "reconnect") {
    return NextResponse.json({ error: "missing_playerId" }, { status: 400 });
  }

  if (action === "resign") {
    return NextResponse.json(resign(matchId, playerId));
  }

  if (action === "draw") {
    return NextResponse.json(drawIfNeeded(matchId, playerId));
  }

  if (action === "spectate_leave") {
    leaveSpectator(matchId, playerId);
    return NextResponse.json({ ok: true });
  }

  // D19: reconnect
  if (action === "reconnect") {
    const pid = playerId || body?.playerId;
    const result = reconnectPlayer(pid);
    if (!result.ok) return NextResponse.json({ ok: false, error: "no_active_match" }, { status: 404 });
    const state = getState(result.matchId!, pid);
    return NextResponse.json({ ok: true, matchId: result.matchId, side: result.side, state });
  }

  // default: move
  if (!tile || !side) return NextResponse.json({ error: "missing_tile_or_side" }, { status: 400 });
  const r = pushMove(matchId, playerId, tile as Tile, side as Side);
  if (!r.ok) return NextResponse.json(r, { status: 422 });
  const state = getState(matchId, playerId);
  return NextResponse.json({ ok: true, state });
}
