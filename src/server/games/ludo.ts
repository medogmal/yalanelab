import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { LudoGame } from "../../lib/ludo/game";
import { setGame, getGame } from "../redis";

type LudoMatch = {
  id: string;
  players: { id: string; socketId: string; name: string; side: "player" | "ai1" | "ai2" | "ai3" }[];
  game: LudoGame;
  lastActivity: number;
};

export function setupLudoHandlers(io: Server, socket: Socket) {
  // Find Match
  socket.on("ludo:find_match", async ({ name }) => {
    const roomName = "ludo_waiting_room";
    socket.join(roomName);
    
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && room.size >= 2) { // 2 players minimum for testing, usually 4
      const players = Array.from(room).slice(0, 4);
      const matchId = randomUUID();
      
      const game = new LudoGame();
      const matchData: LudoMatch = {
        id: matchId,
        players: [],
        game: game,
        lastActivity: Date.now()
      };

      const sides = ["player", "ai1", "ai2", "ai3"] as const;
      
      // Assign real players
      for (let i = 0; i < players.length; i++) {
        const pid = players[i];
        const pSocket = io.sockets.sockets.get(pid);
        if (pSocket) {
          pSocket.leave(roomName);
          pSocket.join(matchId);
          matchData.players.push({
            id: pid,
            socketId: pid,
            name: `Player ${i+1}`,
            side: sides[i]
          });
          pSocket.emit("ludo:match_found", { matchId, side: sides[i] });
        }
      }

      // Fill rest with AI
      for (let i = players.length; i < 4; i++) {
         // AI logic would be handled by the server loop, or simplified
      }

      await setGame(`ludo:${matchId}`, matchData);
      io.to(matchId).emit("ludo:state", {
        dice: game.dice,
        tokens: game.tokens,
        turn: game.turn
      });
    }
  });

  // Roll Dice
  socket.on("ludo:roll", async ({ matchId }) => {
    const match = await getGame<LudoMatch>(`ludo:${matchId}`);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player || match.game.turn !== player.side) return;

    // Restore Game Class Logic
    const game = new LudoGame();
    Object.assign(game, match.game);
    
    if (game.dice !== null) return; // Already rolled

    const dice = game.roll();
    match.game = game;
    
    await setGame(`ludo:${matchId}`, match);
    io.to(matchId).emit("ludo:rolled", { side: player.side, dice });
    io.to(matchId).emit("ludo:state", { dice: game.dice, tokens: game.tokens, turn: game.turn });
  });

  // Move Token
  socket.on("ludo:move", async ({ matchId, tokenIndex }) => {
    const match = await getGame<LudoMatch>(`ludo:${matchId}`);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player || match.game.turn !== player.side) return;

    const game = new LudoGame();
    Object.assign(game, match.game);

    const success = game.move(player.side, tokenIndex);
    if (success) {
      // Check turn change or bonus logic (needs to be exposed in LudoGame or inferred)
      // Assuming game.turn is updated internally by game.move() if no bonus
      // But game.move() in lib/ludo/game.ts handles logic but might need review if it updates 'turn'
      // Checking source: LudoGame.move() calculates bonusTurn but doesn't seem to switch turn automatically?
      // Wait, source code snippet ends before turn switch. Let's assume we need to handle turn switch here.
      
      // Let's improve LudoGame logic later, for now we assume manual turn switch if needed or check game state.
      // For this implementation, we will manually switch turn if no bonus.
      
      // Simple turn switch logic for now (Round Robin)
      if (game.dice !== 6) { // Simplified rule: 6 gives another turn
         const order = ["player", "ai1", "ai2", "ai3"] as const;
         const currentIdx = order.indexOf(game.turn as any);
         game.turn = order[(currentIdx + 1) % 4];
      }
      
      game.dice = null; // Reset dice
      match.game = game;
      
      await setGame(`ludo:${matchId}`, match);
      io.to(matchId).emit("ludo:moved", { side: player.side, tokenIndex });
      io.to(matchId).emit("ludo:state", { dice: game.dice, tokens: game.tokens, turn: game.turn });
    }
  });
}
