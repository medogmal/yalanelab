
export type Tile = { a: number; b: number };
export type Domino = Tile;
export type Side = "left" | "right";

export class DominoGame {
  tiles: Tile[] = [];
  hands: Record<string, Tile[]> = {};
  chain: Tile[] = [];
  boneyard: Tile[] = [];
  
  // Game State
  players: string[] = []; // ["me", "bot1", "bot2", "bot3"] or ["player", "ai"]
  turnIndex: number = 0;
  totalTurns: number = 0;
  phase: "lobby" | "playing" | "ended" = "lobby";
  winner: string | null = null;
  scores: Record<string, number> = {};
  difficulty: "easy" | "medium" | "hard" | "expert" = "medium";
  gameType: "classic" | "block" | "all_fives" = "classic";
  
  constructor(numPlayers: number = 2, difficulty: "easy" | "medium" | "hard" | "expert" = "medium", gameType: "classic" | "block" | "all_fives" = "classic") {
    this.difficulty = difficulty;
    this.gameType = gameType;
    this.reset(numPlayers);
  }

  reset(numPlayers: number = 2) {
    this.tiles = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        this.tiles.push({ a: i, b: j });
      }
    }
    this.shuffle();
    
    // Setup players
    this.players = [];
    if (numPlayers === 2) {
        this.players = ["player", "ai"];
    } else {
        this.players = ["player", "bot1", "bot2", "bot3"]; // 4 players
    }
    
    this.hands = {};
    this.scores = {};
    this.players.forEach(p => {
        this.hands[p] = [];
        this.scores[p] = 0;
    });

    this.chain = [];
    this.boneyard = [];
    this.phase = "lobby";
    this.turnIndex = 0;
    this.totalTurns = 0;
    this.winner = null;
  }

  shuffle() {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  deal(count: number = 7) {
    let idx = 0;
    
    this.players.forEach(p => {
        this.hands[p] = this.tiles.slice(idx, idx + count);
        idx += count;
    });

    // Remainder to boneyard
    this.boneyard = this.tiles.slice(idx);
    
    this.phase = "playing";
    this.chain = [];
    
    // Determine starter: highest double
    let bestDouble = -1;
    let starter = 0;
    
    this.players.forEach((p, i) => {
        this.hands[p].forEach(t => {
            if (t.a === t.b && t.a > bestDouble) {
                bestDouble = t.a;
                starter = i;
            }
        });
    });
    
    this.turnIndex = starter;
  }

  get turn() {
      return this.players[this.turnIndex];
  }

  play(playerId: string, tile: Tile, side: Side): boolean {
    if (this.phase !== "playing") return false;
    if (this.turn !== playerId) return false;

    const hand = this.hands[playerId];
    const index = hand.findIndex(t => (t.a === tile.a && t.b === tile.b) || (t.a === tile.b && t.b === tile.a));
    if (index === -1) return false;

    // Check validity
    let valid = false;
    let placedTile = { ...tile };

    if (this.chain.length === 0) {
        valid = true;
    } else {
        const head = this.chain[0];
        const tail = this.chain[this.chain.length - 1];
        
        if (side === "left") {
            if (tile.a === head.a) { placedTile = { a: tile.b, b: tile.a }; valid = true; }
            else if (tile.b === head.a) { placedTile = { a: tile.a, b: tile.b }; valid = true; }
        } else {
            if (tile.a === tail.b) { placedTile = { a: tile.a, b: tile.b }; valid = true; }
            else if (tile.b === tail.b) { placedTile = { a: tile.b, b: tile.a }; valid = true; }
        }
    }
    
    if (!valid) return false;

    // Execute Move
    this.hands[playerId].splice(index, 1);
    
    if (this.chain.length === 0) {
        this.chain.push(placedTile);
    } else if (side === "left") {
        this.chain.unshift(placedTile);
    } else {
        this.chain.push(placedTile);
    }

    // Check Win
    if (this.hands[playerId].length === 0) {
        this.phase = "ended";
        this.winner = playerId;
        this.calculateScores();
        return true;
    }
    
    // Check Blocked
    if (this.isBlocked()) {
        this.phase = "ended";
        this.resolveBlocked();
        return true;
    }

    // Next Turn
    this.nextTurn();
    return true;
  }

  nextTurn() {
      this.turnIndex = (this.turnIndex + 1) % this.players.length;
  }

  isBlocked() {
      // If boneyard is empty AND no player can move
      // In Block mode, we check if no player can move (boneyard is irrelevant as we can't draw)
      if (this.gameType === "block") {
         for (const p of this.players) {
             if (this.getValidMoves(p).length > 0) return false;
         }
         return true;
      }

      // In Classic/Draw mode, if boneyard has tiles, game is not blocked (player can draw)
      if (this.boneyard.length > 0) return false;
      
      for (const p of this.players) {
          if (this.getValidMoves(p).length > 0) return false;
      }
      return true;
  }
  
  resolveBlocked() {
      // Player with lowest pip count wins
      let minPips = Infinity;
      let winner = null;
      
      this.players.forEach(p => {
          const pips = this.hands[p].reduce((acc, t) => acc + t.a + t.b, 0);
          if (pips < minPips) {
              minPips = pips;
              winner = p;
          }
      });
      
      this.winner = winner;
      this.calculateScores();
  }
  
  calculateScores() {
      // Simple scoring: winner gets sum of all other hands
      if (!this.winner) return;
      
      let total = 0;
      this.players.forEach(p => {
          if (p !== this.winner) {
              total += this.hands[p].reduce((acc, t) => acc + t.a + t.b, 0);
          }
      });
      this.scores[this.winner] = total;
  }

  getValidMoves(playerId: string): { tile: Tile; side: Side }[] {
      const hand = this.hands[playerId];
      const moves: { tile: Tile; side: Side }[] = [];
      
      if (this.chain.length === 0) {
          return hand.map(t => ({ tile: t, side: "left" }));
      }

      const head = this.chain[0];
      const tail = this.chain[this.chain.length - 1];

      for (const t of hand) {
          if (t.a === head.a || t.b === head.a) moves.push({ tile: t, side: "left" });
          
          if (t.a === tail.b || t.b === tail.b) {
               if (!moves.some(m => m.tile === t && m.side === "right")) {
                   moves.push({ tile: t, side: "right" });
               }
          }
      }
      return moves;
  }

  playAI(): boolean {
      const currentPlayer = this.turn;
      if (currentPlayer === "player") return false; // Human turn

      let moves = this.getValidMoves(currentPlayer);
      
      // Draw if needed
      while (moves.length === 0 && this.boneyard.length > 0) {
          this.draw(currentPlayer);
          moves = this.getValidMoves(currentPlayer);
      }

      if (moves.length > 0) {
          // AI Logic based on difficulty
          if (this.difficulty === "easy") {
              // Random move
              const move = moves[Math.floor(Math.random() * moves.length)];
              return this.play(currentPlayer, move.tile, move.side);
          }
          
          // Medium/Hard: Play heaviest double, else heaviest tile
          moves.sort((a, b) => {
              const scoreA = (a.tile.a === a.tile.b ? 100 : 0) + (a.tile.a + a.tile.b);
              const scoreB = (b.tile.a === b.tile.b ? 100 : 0) + (b.tile.a + b.tile.b);
              return scoreB - scoreA;
          });
          
          const move = moves[0];
          return this.play(currentPlayer, move.tile, move.side);
      } else {
          // Pass
          this.nextTurn();
          return true;
      }
  }

  draw(playerId: string): boolean {
    if (this.phase !== "playing") return false;
    if (this.boneyard.length === 0) return false;
    if (this.gameType === "block") return false;
    const tile = this.boneyard.shift();
    if (tile) {
        this.hands[playerId].push(tile);
        return true;
    }
    return false;
  }

  // Draw tiles until the player has a valid move (or boneyard is empty)
  drawToFit(playerId: string): boolean {
    if (this.phase !== "playing") return false;
    if (this.gameType === "block") return false;
    let drew = false;
    while (this.boneyard.length > 0 && this.getValidMoves(playerId).length === 0) {
      const tile = this.boneyard.shift();
      if (tile) { this.hands[playerId].push(tile); drew = true; }
    }
    return drew;
  }

  // Returns game end status
  status(): { ended: boolean; winner?: string; reason?: string; scorePlayer?: number; scoreAi?: number } {
    if (this.phase !== "ended") return { ended: false };
    const scorePlayer = this.hands["player"]?.reduce((s, t) => s + t.a + t.b, 0) ?? 0;
    const scoreAi = this.hands["ai"]?.reduce((s, t) => s + t.a + t.b, 0) ?? 0;
    return {
      ended: true,
      winner: this.winner ?? undefined,
      reason: this.winner ? "win" : "blocked",
      scorePlayer,
      scoreAi,
    };
  }
}
