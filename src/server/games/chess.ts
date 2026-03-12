import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { Chess } from "chess.js";
import { setGame, getGame } from "../redis";

type ChessMatch = {
  id: string;
  players: { id: string; socketId: string; name: string; color: "w" | "b" }[];
  fen: string;
  pgn: string;
  lastActivity: number;
};

export function setupChessHandlers(io: Server, socket: Socket) {
  socket.on("chess:find_match", async ({ name }) => {
    const roomName = "chess_waiting_room";
    socket.join(roomName);
    
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && room.size >= 2) {
      const players = Array.from(room).slice(0, 2);
      const matchId = randomUUID();
      
      const chess = new Chess();
      const matchData: ChessMatch = {
        id: matchId,
        players: [],
        fen: chess.fen(),
        pgn: chess.pgn(),
        lastActivity: Date.now()
      };

      const colors = ["w", "b"] as const;
      
      for (let i = 0; i < 2; i++) {
        const pid = players[i];
        const pSocket = io.sockets.sockets.get(pid);
        if (pSocket) {
          pSocket.leave(roomName);
          pSocket.join(matchId);
          matchData.players.push({
            id: pid,
            socketId: pid,
            name: `Player ${i+1}`,
            color: colors[i]
          });
          pSocket.emit("chess:match_found", { matchId, color: colors[i] });
        }
      }

      await setGame(`chess:${matchId}`, matchData);
      io.to(matchId).emit("chess:state", { fen: matchData.fen, pgn: matchData.pgn });
    }
  });

  socket.on("chess:move", async ({ matchId, from, to, promotion }) => {
    const match = await getGame<ChessMatch>(`chess:${matchId}`);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player) return;

    const chess = new Chess(match.fen);
    if (chess.turn() !== player.color) return;

    try {
        const move = chess.move({ from, to, promotion });
        if (move) {
            match.fen = chess.fen();
            match.pgn = chess.pgn();
            await setGame(`chess:${matchId}`, match);
            io.to(matchId).emit("chess:moved", { from, to, promotion, fen: match.fen });
            
            if (chess.isGameOver()) {
                io.to(matchId).emit("chess:game_over", { 
                    winner: chess.isCheckmate() ? player.color : "draw",
                    reason: chess.isCheckmate() ? "checkmate" : "draw"
                });
            }
        }
    } catch (e) {
        // Invalid move
    }
  });
}
