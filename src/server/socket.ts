import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { setupLudoHandlers } from "./games/ludo";
import { setupBalootHandlers } from "./games/baloot";
import { setupChessHandlers } from "./games/chess";
import {
  joinLobby, leaveLobby, pairPlayers, getMatch,
  getState, pushMove, drawIfNeeded, resign, getEvents, joinHighStakes,
} from "@/lib/domino/server";
import { getCurrentUser } from "@/lib/auth/session";

export function initSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // اجعل الـ io متاح globally للـ /api/online-count
  (globalThis as any)._io = io;

  // ── Domino room helper ──────────────────────────────────────────
  function emitMatchState(matchId: string) {
    const match = getMatch(matchId);
    if (!match) return;
    const stateA = getState(matchId, match.a.id);
    const stateB = getState(matchId, match.b.id);
    if (stateA) io.to(`domino:${matchId}:${match.a.id}`).emit("domino:state", stateA);
    if (stateB) io.to(`domino:${matchId}:${match.b.id}`).emit("domino:state", stateB);
    // also broadcast chain + turn to spectators
    const game = match.game;
    io.to(`domino:spectate:${matchId}`).emit("domino:spectate_state", {
      chain: game.chain,
      turn: game.turn,
      handCounts: { a: game.hands.player?.length, b: game.hands.ai?.length },
    });
  }

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // ── Join general lobby ────────────────────────────────────────
    socket.on("join_lobby", (gameType: string) => {
      socket.join(`lobby:${gameType}`);
    });

    // ── DOMINO ───────────────────────────────────────────────────

    // Join matchmaking queue
    socket.on("domino:join_queue", async (data: { name?: string; stakes?: "normal" | "high" }) => {
      const name = String(data?.name || "لاعب").slice(0, 30);
      const stakes = data?.stakes === "high" ? "high" : "normal";

      let player;
      let match;

      if (stakes === "high") {
        const result = joinHighStakes(name, (socket as any).__userId);
        player = result.player;
        match = result.match;
      } else {
        player = joinLobby(name, (socket as any).__userId);
        match = pairPlayers();
      }

      // Store player id on socket for future events
      (socket as any).__dominoPlayerId = player.id;
      socket.emit("domino:queued", { playerId: player.id });

      if (match) {
        // Notify both players
        const aSocket = [...io.sockets.sockets.values()].find(
          (s) => (s as any).__dominoPlayerId === match!.a.id
        );
        const bSocket = [...io.sockets.sockets.values()].find(
          (s) => (s as any).__dominoPlayerId === match!.b.id
        );

        const payload = {
          matchId: match.id,
          a: { id: match.a.id, name: match.a.name },
          b: { id: match.b.id, name: match.b.name },
        };

        if (aSocket) {
          aSocket.join(`domino:${match.id}:${match.a.id}`);
          aSocket.emit("domino:match_found", { ...payload, you: "a" });
        }
        if (bSocket) {
          bSocket.join(`domino:${match.id}:${match.b.id}`);
          bSocket.emit("domino:match_found", { ...payload, you: "b" });
        }

        // Start match — send initial state
        setTimeout(() => emitMatchState(match!.id), 200);
      }
    });

    // Leave queue
    socket.on("domino:leave_queue", () => {
      const pid = (socket as any).__dominoPlayerId;
      if (pid) leaveLobby(pid);
    });

    // Join existing match room (reconnect)
    socket.on("domino:join_match", (data: { matchId: string; playerId: string }) => {
      const { matchId, playerId } = data;
      socket.join(`domino:${matchId}:${playerId}`);
      (socket as any).__dominoPlayerId = playerId;
      (socket as any).__dominoMatchId = matchId;
      const state = getState(matchId, playerId);
      if (state) socket.emit("domino:state", state);
    });

    // Spectate match
    socket.on("domino:spectate", (data: { matchId: string }) => {
      socket.join(`domino:spectate:${data.matchId}`);
    });

    // Play a tile
    socket.on("domino:play", (data: { matchId: string; playerId: string; tile: { a: number; b: number }; side: "left" | "right" }) => {
      const { matchId, playerId, tile, side } = data;
      const result = pushMove(matchId, playerId, tile, side);
      if (result.ok) {
        emitMatchState(matchId);
      } else {
        socket.emit("domino:error", { code: result.error });
      }
    });

    // Draw from boneyard
    socket.on("domino:draw", (data: { matchId: string; playerId: string }) => {
      const { matchId, playerId } = data;
      const result = drawIfNeeded(matchId, playerId);
      if (result.ok) emitMatchState(matchId);
    });

    // Resign
    socket.on("domino:resign", (data: { matchId: string; playerId: string }) => {
      const { matchId, playerId } = data;
      const result = resign(matchId, playerId);
      if (result.ok) emitMatchState(matchId);
    });

    // Poll events (for non-socket fallback)
    socket.on("domino:poll", (data: { matchId: string; playerId: string; sinceSeq: number }) => {
      const { matchId, playerId, sinceSeq } = data;
      const ev = getEvents(matchId, sinceSeq);
      const state = getState(matchId, playerId);
      socket.emit("domino:poll_result", { ...ev, state });
    });

    // ── Game Handlers (other games) ──────────────────────────────
    setupLudoHandlers(io, socket);
    setupBalootHandlers(io, socket);
    setupChessHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}
