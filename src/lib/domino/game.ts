/* ═══════════════════════════════════════════════════════════════
   DOMINO GAME ENGINE v2.0
   يالا نلعب — محرك الدومينو الكامل
   ═══════════════════════════════════════════════════════════════

   يدعم:
   - 2 أو 4 لاعبين
   - كلاسيك (سحب) / بلوك (بدون سحب) / الأخماس
   - AI بـ 4 مستويات صعوبة
   - win conditions متعددة
   ─────────────────────────────────────────────────────────── */

export type Tile   = { a: number; b: number };
export type Domino = Tile;
export type Side   = "left" | "right";

export type PlayerId =
  | "player"
  | "ai"
  | "bot1"
  | "bot2"
  | "bot3"
  | "player_a"
  | "player_b"
  | string;

export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type GameType   = "classic" | "block" | "all_fives";
export type GamePhase  = "lobby" | "playing" | "ended";

export type MoveRecord = {
  player: PlayerId;
  tile: Tile;
  side: Side;
  turnNumber: number;
};

export type GameEvent =
  | { type: "deal" }
  | { type: "move";  player: PlayerId; tile: Tile; side: Side }
  | { type: "draw";  player: PlayerId; tile: Tile }
  | { type: "pass";  player: PlayerId }
  | { type: "end";   winner: PlayerId | null; reason: "win" | "blocked" };

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tilePips(t: Tile): number {
  return t.a + t.b;
}

function tilesMatch(t1: Tile, t2: Tile): boolean {
  return (t1.a === t2.a && t1.b === t2.b) || (t1.a === t2.b && t1.b === t2.a);
}

/* ═══════════════════════════════════════════════════════════════
   DOMINO GAME CLASS
═══════════════════════════════════════════════════════════════ */
export class DominoGame {
  /* ── State ── */
  players:    PlayerId[]                         = [];
  hands:      Record<PlayerId, Tile[]>           = {};
  scores:     Record<PlayerId, number>           = {};
  chain:      Tile[]                             = [];
  boneyard:   Tile[]                             = [];
  phase:      GamePhase                          = "lobby";
  turnIndex:  number                             = 0;
  totalTurns: number                             = 0;
  winner:     PlayerId | null                    = null;
  events:     GameEvent[]                        = [];
  moveHistory:MoveRecord[]                       = [];

  /* ── Config ── */
  difficulty: Difficulty = "medium";
  gameType:   GameType   = "classic";

  /* ── Computed getters ── */
  get turn():   PlayerId { return this.players[this.turnIndex]; }
  get board():  Tile[]   { return this.chain; }
  get headVal(): number  { return this.chain.length ? this.chain[0].a : -1; }
  get tailVal(): number  { return this.chain.length ? this.chain[this.chain.length - 1].b : -1; }

  /* ── Constructor ── */
  constructor(
    numPlayers:  number     = 2,
    difficulty:  Difficulty = "medium",
    gameType:    GameType   = "classic",
  ) {
    this.difficulty = difficulty;
    this.gameType   = gameType;
    this._setupPlayers(numPlayers);
  }

  /* ─────────────────────────────────────────────────────────────
     SETUP
  ───────────────────────────────────────────────────────────── */
  private _setupPlayers(numPlayers: number) {
    if (numPlayers === 2) {
      this.players = ["player", "ai"];
    } else {
      this.players = ["player", "bot1", "bot2", "bot3"];
    }
    this.hands  = {};
    this.scores = {};
    for (const p of this.players) {
      this.hands[p]  = [];
      this.scores[p] = 0;
    }
  }

  /** إعادة ضبط اللعبة بالكامل */
  reset(numPlayers?: number) {
    const np = numPlayers ?? this.players.length;
    this._setupPlayers(np);
    this.chain      = [];
    this.boneyard   = [];
    this.phase      = "lobby";
    this.turnIndex  = 0;
    this.totalTurns = 0;
    this.winner     = null;
    this.events     = [];
    this.moveHistory = [];
  }

  /** توليد 28 قطعة وخلطهم */
  private _generateTiles(): Tile[] {
    const tiles: Tile[] = [];
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        tiles.push({ a: i, b: j });
      }
    }
    return shuffleArray(tiles);
  }

  /* ─────────────────────────────────────────────────────────────
     DEAL
  ───────────────────────────────────────────────────────────── */
  /** توزيع القطع وتحديد من يبدأ */
  deal(tilesPerPlayer: number = 7) {
    const allTiles = this._generateTiles();
    let idx = 0;

    for (const p of this.players) {
      this.hands[p] = allTiles.slice(idx, idx + tilesPerPlayer);
      idx += tilesPerPlayer;
    }
    this.boneyard = allTiles.slice(idx);
    this.chain    = [];
    this.phase    = "playing";

    // من يبدأ؟ — صاحب أعلى double
    let bestDouble = -1;
    let starterIdx = 0;
    this.players.forEach((p, i) => {
      for (const t of this.hands[p]) {
        if (t.a === t.b && t.a > bestDouble) {
          bestDouble = t.a;
          starterIdx = i;
        }
      }
    });
    this.turnIndex = starterIdx;
    this.events.push({ type: "deal" });
  }

  /* ─────────────────────────────────────────────────────────────
     VALID MOVES
  ───────────────────────────────────────────────────────────── */
  getValidMoves(playerId: PlayerId): { tile: Tile; side: Side }[] {
    const hand = this.hands[playerId];
    if (!hand || !hand.length) return [];

    // أول قطعة — أي قطعة تنفع
    if (this.chain.length === 0) {
      return hand.map(t => ({ tile: t, side: "left" as Side }));
    }

    const head = this.headVal;
    const tail = this.tailVal;
    const moves: { tile: Tile; side: Side }[] = [];
    const added = new Set<string>();

    for (const t of hand) {
      const key = `${t.a}-${t.b}`;
      const fitsLeft  = t.a === head || t.b === head;
      const fitsRight = t.a === tail || t.b === tail;

      if (fitsLeft && !added.has(`${key}-L`)) {
        moves.push({ tile: t, side: "left" });
        added.add(`${key}-L`);
      }
      if (fitsRight && !added.has(`${key}-R`)) {
        // تجنب التكرار لو القطعة تنفع الجانبين بنفس النتيجة
        const alreadyLeft = fitsLeft && added.has(`${key}-L`) && head === tail;
        if (!alreadyLeft) {
          moves.push({ tile: t, side: "right" });
          added.add(`${key}-R`);
        }
      }
    }
    return moves;
  }

  /** هل لدى اللاعب أي حركة ممكنة؟ */
  hasValidMove(playerId: PlayerId): boolean {
    return this.getValidMoves(playerId).length > 0;
  }

  /* ─────────────────────────────────────────────────────────────
     PLAY MOVE
  ───────────────────────────────────────────────────────────── */
  /**
   * وضع قطعة على السلسلة
   * @returns true لو نجح، false لو مش صح
   */
  play(playerId: PlayerId, tile: Tile, side: Side): boolean {
    if (this.phase !== "playing") return false;
    if (this.turn !== playerId) return false;

    const hand  = this.hands[playerId];
    const idx   = hand.findIndex(t => tilesMatch(t, tile));
    if (idx === -1) return false;

    // ── التحقق وتوجيه القطعة ──
    let placed: Tile | null = null;

    if (this.chain.length === 0) {
      // أول قطعة — توضع كما هي
      placed = { ...tile };
    } else {
      const head = this.headVal;
      const tail = this.tailVal;

      if (side === "left") {
        if (tile.b === head)      placed = { a: tile.a, b: tile.b };
        else if (tile.a === head) placed = { a: tile.b, b: tile.a };
      } else {
        if (tile.a === tail)      placed = { a: tile.a, b: tile.b };
        else if (tile.b === tail) placed = { a: tile.b, b: tile.a };
      }
    }

    if (!placed) return false;

    // ── تنفيذ الحركة ──
    hand.splice(idx, 1);
    if (this.chain.length === 0 || side === "right") {
      this.chain.push(placed);
    } else {
      this.chain.unshift(placed);
    }

    this.totalTurns++;
    this.moveHistory.push({
      player: playerId,
      tile: { ...tile },
      side,
      turnNumber: this.totalTurns,
    });
    this.events.push({ type: "move", player: playerId, tile: { ...tile }, side });

    // ── هل انتهت اللعبة؟ ──
    if (hand.length === 0) {
      this._endGame(playerId, "win");
      return true;
    }

    if (this._checkBlocked()) {
      this._resolveBlocked();
      return true;
    }

    this._nextTurn();
    return true;
  }

  /** alias للتوافق مع الكود القديم */
  playMove(playerId: PlayerId, tile: Tile, side: Side): boolean {
    return this.play(playerId, tile, side);
  }

  /* ─────────────────────────────────────────────────────────────
     DRAW
  ───────────────────────────────────────────────────────────── */
  /** سحب قطعة واحدة من المستودع */
  draw(playerId: PlayerId): boolean {
    if (this.phase !== "playing") return false;
    if (this.gameType === "block")  return false;
    if (!this.boneyard.length)      return false;

    const tile = this.boneyard.shift()!;
    this.hands[playerId].push(tile);
    this.events.push({ type: "draw", player: playerId, tile });
    return true;
  }

  /** سحب حتى يجد اللاعب حركة — يرجع عدد القطع المسحوبة */
  drawToFit(playerId: PlayerId): number {
    if (this.phase !== "playing") return 0;
    if (this.gameType === "block") return 0;
    let count = 0;
    while (this.boneyard.length > 0 && !this.hasValidMove(playerId)) {
      this.draw(playerId);
      count++;
    }
    return count;
  }

  /** تمرير الدور (لما مفيش حركة ومفيش مستودع) */
  pass(playerId: PlayerId): boolean {
    if (this.turn !== playerId) return false;
    if (this.hasValidMove(playerId)) return false;
    if (this.boneyard.length > 0 && this.gameType !== "block") return false;
    this.events.push({ type: "pass", player: playerId });
    this._nextTurn();
    return true;
  }

  /* ─────────────────────────────────────────────────────────────
     NEXT TURN
  ───────────────────────────────────────────────────────────── */
  nextTurn() { this._nextTurn(); }
  private _nextTurn() {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
  }

  /* ─────────────────────────────────────────────────────────────
     BLOCK DETECTION
  ───────────────────────────────────────────────────────────── */
  private _checkBlocked(): boolean {
    if (this.gameType === "block") {
      return this.players.every(p => !this.hasValidMove(p));
    }
    // كلاسيك: لو المستودع فضي وما حدش يقدر يلعب
    if (this.boneyard.length > 0) return false;
    return this.players.every(p => !this.hasValidMove(p));
  }

  private _resolveBlocked() {
    let minPips = Infinity;
    let winner: PlayerId | null = null;

    for (const p of this.players) {
      const pips = this.hands[p].reduce((s, t) => s + tilePips(t), 0);
      if (pips < minPips) { minPips = pips; winner = p; }
    }
    this._endGame(winner, "blocked");
  }

  /* ─────────────────────────────────────────────────────────────
     END GAME
  ───────────────────────────────────────────────────────────── */
  private _endGame(winner: PlayerId | null, reason: "win" | "blocked") {
    this.phase  = "ended";
    this.winner = winner;

    // حساب النقاط — الفائز يأخذ مجموع قطع الخاسرين
    if (winner) {
      let total = 0;
      for (const p of this.players) {
        if (p !== winner) {
          total += this.hands[p].reduce((s, t) => s + tilePips(t), 0);
        }
      }
      this.scores[winner] = (this.scores[winner] ?? 0) + total;
    }

    this.events.push({ type: "end", winner, reason });
  }

  /* ─────────────────────────────────────────────────────────────
     STATUS
  ───────────────────────────────────────────────────────────── */
  status(): {
    ended:    boolean;
    winner?:  PlayerId;
    reason?:  "win" | "blocked";
    scores:   Record<PlayerId, number>;
    pipCounts:Record<PlayerId, number>;
  } {
    const pipCounts: Record<PlayerId, number> = {};
    for (const p of this.players) {
      pipCounts[p] = this.hands[p]?.reduce((s, t) => s + tilePips(t), 0) ?? 0;
    }

    if (this.phase !== "ended") {
      return { ended: false, scores: this.scores, pipCounts };
    }
    return {
      ended:    true,
      winner:   this.winner ?? undefined,
      reason:   (this.events.findLast(e => e.type === "end") as any)?.reason,
      scores:   this.scores,
      pipCounts,
    };
  }

  /* ─────────────────────────────────────────────────────────────
     AI ENGINE
  ───────────────────────────────────────────────────────────── */
  /**
   * يلعب دور الـ AI الحالي
   * @returns true لو تم اتخاذ أي إجراء (لعب / سحب / تمرير)
   */
  playAI(): boolean {
    const current = this.turn;

    // تأكد إن الـ turn هو فعلاً bot
    if (current === "player" || current === "player_a" || current === "player_b") return false;

    // سحب لو مفيش حركة
    if (!this.hasValidMove(current) && this.gameType !== "block") {
      const drawn = this.drawToFit(current);
      // لو المستودع خلص ومازال مفيش حركة — تمرير
      if (!this.hasValidMove(current)) {
        this.pass(current);
        return true;
      }
    }

    const moves = this.getValidMoves(current);
    if (!moves.length) {
      // تمرير اضطراري
      this.events.push({ type: "pass", player: current });
      this._nextTurn();
      return true;
    }

    const chosen = this._pickAIMove(moves, current);
    return this.play(current, chosen.tile, chosen.side);
  }

  private _pickAIMove(
    moves: { tile: Tile; side: Side }[],
    playerId: PlayerId,
  ): { tile: Tile; side: Side } {
    if (this.difficulty === "easy") {
      // عشوائي
      return moves[Math.floor(Math.random() * moves.length)];
    }

    if (this.difficulty === "medium") {
      // العب أثقل double أولاً، ثم أثقل tile
      return this._greedyMove(moves);
    }

    if (this.difficulty === "hard") {
      // طمّر القيم اللي المنافس محتاجها
      return this._defensiveMove(moves, playerId);
    }

    // expert — نفس hard + blocking awareness
    return this._expertMove(moves, playerId);
  }

  private _greedyMove(moves: { tile: Tile; side: Side }[]) {
    return [...moves].sort((a, b) => {
      const sa = (a.tile.a === a.tile.b ? 200 : 0) + tilePips(a.tile);
      const sb = (b.tile.a === b.tile.b ? 200 : 0) + tilePips(b.tile);
      return sb - sa;
    })[0];
  }

  private _defensiveMove(moves: { tile: Tile; side: Side }[], playerId: PlayerId) {
    // حاول تلعب القيم اللي المنافسين مش عندهم
    const opponents = this.players.filter(p => p !== playerId);
    const oppValues = new Set<number>();
    for (const opp of opponents) {
      for (const t of this.hands[opp]) {
        oppValues.add(t.a);
        oppValues.add(t.b);
      }
    }

    // افضّل moves اللي بتغلق قيمة عند الخصم
    const blocking = moves.filter(m =>
      oppValues.has(m.side === "left" ? this.headVal : this.tailVal) === false
    );
    if (blocking.length) return this._greedyMove(blocking);
    return this._greedyMove(moves);
  }

  private _expertMove(moves: { tile: Tile; side: Side }[], playerId: PlayerId) {
    // لو عنده moves قليلة، يلعب اللي بيقلله الـ pips
    const myPips = this.hands[playerId].reduce((s, t) => s + tilePips(t), 0);

    if (this.hands[playerId].length <= 3) {
      // إنهاء سريع
      return [...moves].sort((a, b) => tilePips(b.tile) - tilePips(a.tile))[0];
    }
    return this._defensiveMove(moves, playerId);
  }

  /* ─────────────────────────────────────────────────────────────
     UTILITIES
  ───────────────────────────────────────────────────────────── */
  /** هل اللاعب ده bot/AI؟ */
  isBot(playerId: PlayerId): boolean {
    return playerId !== "player" && playerId !== "player_a" && playerId !== "player_b";
  }

  /** عدد اللاعبين */
  get numPlayers(): number { return this.players.length; }

  /** snapshot للـ state */
  snapshot() {
    return {
      players:    this.players,
      chain:      [...this.chain],
      boneyard:   this.boneyard.length,
      hands:      Object.fromEntries(
        this.players.map(p => [p, this.hands[p].length])
      ),
      turn:       this.turn,
      phase:      this.phase,
      winner:     this.winner,
      totalTurns: this.totalTurns,
      scores:     { ...this.scores },
    };
  }
}
