import { Chess, Square, Move } from "chess.js";

// export type Square = { file: number; rank: number }; // Removed local definition to avoid conflict
export type PieceOnBoard = {
  type: "p" | "r" | "n" | "b" | "q" | "k";
  color: "w" | "b";
  square: string; // algebraic like "e4"
};

export type { Move };

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  fen() {
    return this.chess.fen();
  }

  load(fen: string) {
    this.chess = new Chess(fen);
  }

  reset() {
    this.chess = new Chess();
  }

  turn() {
    return this.chess.turn(); // 'w' or 'b'
  }

  isGameOver() {
    return this.chess.isGameOver();
  }

  isCheck() {
    return this.chess.isCheck();
  }

  isCheckmate() {
    return this.chess.isCheckmate();
  }

  isDraw() {
    return this.chess.isDraw();
  }

  isStalemate() {
    return this.chess.isStalemate();
  }

  pieces(): PieceOnBoard[] {
    const out: PieceOnBoard[] = [];
    const b = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const cell = b[r][f];
        if (!cell) continue;
        const square = `${"abcdefgh"[f]}${8 - r}`;
        out.push({ type: cell.type, color: cell.color, square });
      }
    }
    return out;
  }

  legalMoves(square: string) {
    const all = this.chess.moves({ verbose: true });
    return all.filter((m) => m.from === square).map((m) => ({ from: m.from, to: m.to, promotion: m.promotion }));
  }

  moveSAN(san: string) {
    return this.chess.move(san);
  }

  move(from: string, to: string, promotion?: string) {
    return this.chess.move({ from, to, promotion });
  }

  moveUCI(uci: string) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
      return this.chess.move({ from, to, promotion });
  }

  undo() {
    return this.chess.undo();
  }

  pgn() {
    return this.chess.pgn();
  }

  history(options?: { verbose: boolean }) {
    return this.chess.history(options as any);
  }

  moves(options?: { square?: string; verbose?: boolean; piece?: string }) {
    return this.chess.moves(options as any);
  }

  get(square: string) {
    return this.chess.get(square as Square);
  }

  loadPgn(pgn: string) {
    return this.chess.loadPgn(pgn);
  }

  header() {
    return this.chess.header();
  }
}
