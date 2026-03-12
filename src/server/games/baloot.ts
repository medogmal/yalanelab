import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";
import { BalootGame, Card, Mode, PlayerId, Suit } from "../../lib/baloot/game";
import { setGame, getGame } from "../redis";

type BalootMatch = {
  id: string;
  players: { id: string; socketId: string; name: string; side: PlayerId }[];
  game: BalootGame;
  lastActivity: number;
};

export function setupBalootHandlers(io: Server, socket: Socket) {
  socket.on("baloot:find_match", async ({ name }) => {
    const roomName = "baloot_waiting_room";
    socket.join(roomName);
    
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && room.size >= 4) {
      const players = Array.from(room).slice(0, 4);
      const matchId = randomUUID();
      
      const game = new BalootGame();
      game.startRound(); // Initial Deal

      const matchData: BalootMatch = {
        id: matchId,
        players: [],
        game: game,
        lastActivity: Date.now()
      };

      const sides: PlayerId[] = ["N", "E", "S", "W"];
      
      for (let i = 0; i < 4; i++) {
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
          pSocket.emit("baloot:match_found", { matchId, side: sides[i] });
        }
      }

      await setGame(`baloot:${matchId}`, matchData);
      io.to(matchId).emit("baloot:state", {
        phase: game.phase,
        turn: game.next,
        trump: game.trump,
        mode: game.mode,
        hands: { N: game.hands.N.length, E: game.hands.E.length, S: game.hands.S.length, W: game.hands.W.length }, // Hide cards
        trick: game.trick,
        score: game.scoreRound
      });
      
      // Send private hands
      matchData.players.forEach(p => {
        io.to(p.socketId).emit("baloot:hand", game.hands[p.side]);
      });
    }
  });

  socket.on("baloot:bid", async ({ matchId, mode, trump }) => {
    const match = await getGame<BalootMatch>(`baloot:${matchId}`);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player || match.game.next !== player.side) return; // Using 'next' as current turn indicator for bidding too

    const game = new BalootGame();
    Object.assign(game, match.game);

    if (mode === "pass") {
        game.passBid(player.side);
    } else {
        game.proposeBid(player.side, { mode, trump });
    }

    match.game = game;
    await setGame(`baloot:${matchId}`, match);
    
    io.to(matchId).emit("baloot:state", {
        phase: game.phase,
        turn: game.next,
        trump: game.trump,
        mode: game.mode,
        hands: { N: game.hands.N.length, E: game.hands.E.length, S: game.hands.S.length, W: game.hands.W.length },
        trick: game.trick,
        score: game.scoreRound
    });
  });

  socket.on("baloot:play", async ({ matchId, card }) => {
    const match = await getGame<BalootMatch>(`baloot:${matchId}`);
    if (!match) return;

    const player = match.players.find(p => p.socketId === socket.id);
    if (!player || match.game.next !== player.side) return;

    const game = new BalootGame();
    Object.assign(game, match.game);

    const success = game.play(player.side, card);
    if (success) {
        match.game = game;
        await setGame(`baloot:${matchId}`, match);
        
        io.to(matchId).emit("baloot:played", { side: player.side, card });
        io.to(matchId).emit("baloot:state", {
            phase: game.phase,
            turn: game.next,
            trump: game.trump,
            mode: game.mode,
            hands: { N: game.hands.N.length, E: game.hands.E.length, S: game.hands.S.length, W: game.hands.W.length },
            trick: game.trick,
            score: game.scoreRound
        });
        
        // Update private hands
        io.to(socket.id).emit("baloot:hand", game.hands[player.side]);
    }
  });
}
