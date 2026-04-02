export type Color = "red" | "yellow" | "green" | "blue";
export type PlayerId = "player" | "ai1" | "ai2" | "ai3";
export type TokenPos = { kind: "yard" } | { kind: "track"; index: number } | { kind: "home"; count: number };
export type EndResult = { ended: boolean; winner?: PlayerId };
function rng() { return Math.floor(Math.random() * 6) + 1; }
const START: Record<Color, number> = { red: 0, yellow: 13, blue: 26, green: 39 };
const ENTRY: Record<Color, number> = { red: 51, yellow: 12, blue: 25, green: 38 };
const SAFE = new Set<number>([0, 8, 13, 21, 26, 34, 39, 47]);
function nextIndex(idx: number, steps: number) { return (idx + steps) % 52; }
export class LudoGame {
  colors: Color[];
  tokens: Record<PlayerId, Array<{ color: Color; pos: TokenPos }>>;
  turn: PlayerId;
  dice: number | null;
  order: PlayerId[];
  aiLevels: Record<PlayerId, "easy" | "medium" | "hard">;
  constructor() {
    this.colors = ["red", "yellow", "green", "blue"];
    this.tokens = { player: [], ai1: [], ai2: [], ai3: [] };
    for (let i = 0; i < 4; i++) {
      this.tokens.player.push({ color: "red", pos: { kind: "yard" } });
      this.tokens.ai1.push({ color: "yellow", pos: { kind: "yard" } });
      this.tokens.ai2.push({ color: "green", pos: { kind: "yard" } });
      this.tokens.ai3.push({ color: "blue", pos: { kind: "yard" } });
    }
    this.turn = "player";
    this.dice = null;
    this.order = ["player", "ai1", "ai2", "ai3"];
    this.aiLevels = { player: "hard", ai1: "medium", ai2: "medium", ai3: "medium" };
  }
  setAiLevel(pid: PlayerId, lvl: "easy" | "medium" | "hard") { this.aiLevels[pid] = lvl; }
  roll() {
    if (this.dice !== null) return this.dice;
    const d = rng();
    this.dice = d;
    return d;
  }
  private distToEntry(color: Color, index: number) {
    const entry = ENTRY[color];
    return (entry - index + 52) % 52;
  }
  legalMoves(pid: PlayerId) {
    const d = this.dice;
    if (d === null) return [];
    const out: Array<{ idx: number; to: TokenPos }> = [];
    const arr = this.tokens[pid];
    for (let i = 0; i < arr.length; i++) {
      const t = arr[i];
      if (t.pos.kind === "yard") {
        if (d === 6) out.push({ idx: i, to: { kind: "track", index: START[t.color] } });
        continue;
      }
      if (t.pos.kind === "track") {
        const dist = this.distToEntry(t.color, t.pos.index);
        if (d <= dist) {
          const target = nextIndex(t.pos.index, d);
          out.push({ idx: i, to: { kind: "track", index: target } });
        } else {
          const homeSteps = d - dist;
          if (homeSteps <= 6) {
            out.push({ idx: i, to: { kind: "home", count: Math.min(homeSteps, 6) } });
          }
        }
      } else if (t.pos.kind === "home") {
        const newCount = t.pos.count + d;
        if (newCount <= 6) {
          out.push({ idx: i, to: { kind: "home", count: newCount } });
        }
      }
    }
    return out;
  }
  move(pid: PlayerId, idx: number) {
    const d = this.dice;
    if (d === null) return false;
    const arr = this.tokens[pid];
    if (idx < 0 || idx >= arr.length) return false;
    const options = this.legalMoves(pid).filter((m) => m.idx === idx);
    if (options.length === 0) return false;
    const chosen = options[0];
    const t = arr[idx];
    
    // Perform move
    if (t.pos.kind === "track" && chosen.to.kind === "home") {
      t.pos = { kind: "home", count: chosen.to.count };
    } else {
      t.pos = chosen.to;
    }

    let bonusTurn = false;
    // Check Capture
    if (t.pos.kind === "track" && !SAFE.has(t.pos.index)) {
      for (const otherPid of this.order) {
        if (otherPid === pid) continue;
        const others = this.tokens[otherPid];
        for (const o of others) {
          if (o.pos.kind === "track" && o.pos.index === t.pos.index) {
            o.pos = { kind: "yard" };
            bonusTurn = true; // Capture gives bonus turn
          }
        }
      }
    }

    // Check Home Completion
    if (t.pos.kind === "home" && t.pos.count === 6) {
        bonusTurn = true; // Reaching home gives bonus turn
    }

    const six = d === 6;
    this.dice = null;
    
    // Turn passing logic:
    // Retain turn if: rolled 6 OR captured opponent OR reached home
    if (six || bonusTurn) {
        // Turn stays with pid
    } else {
        const idxTurn = this.order.indexOf(pid);
        this.turn = this.order[(idxTurn + 1) % this.order.length];
    }
    return true;
  }

  // Explicitly pass turn if no moves available
  passTurn() {
      if (this.dice === null) return; // Must have rolled first
      this.dice = null;
      const idxTurn = this.order.indexOf(this.turn);
      this.turn = this.order[(idxTurn + 1) % this.order.length];
  }

  aiPlay() {
    if (this.turn === "player") return;
    if (this.dice === null) this.roll();
    const pid = this.turn;
    const legal = this.legalMoves(pid);
    if (legal.length === 0) {
      // AI has no moves, pass turn
      // Note: If roll was 6, they should get another go, but if legal is empty on a 6 (e.g. all blocked?), 
      // usually they pass. But with 6 you can always exit yard. 
      // If all in yard and roll != 6 -> legal empty.
      // If all in home -> legal empty.
      
      // If roll was 6, and no moves? (Impossible if tokens in yard, unless all 4 in home)
      // If all 4 in home, game should have ended.
      
      const six = this.dice === 6;
      this.dice = null;
      if (!six) {
        const idxTurn = this.order.indexOf(pid);
        this.turn = this.order[(idxTurn + 1) % this.order.length];
      } else {
         // Rolled 6 but no moves? (e.g. all pieces finished or stuck?)
         // If all finished, status() handles it.
         // If stuck? Pass to next or roll again? 
         // Let's assume pass to next to avoid infinite loop.
         const idxTurn = this.order.indexOf(pid);
         this.turn = this.order[(idxTurn + 1) % this.order.length];
      }
      return;
    }
    const lvl = this.aiLevels[pid] ?? "medium";
    if (lvl === "easy") {
      const pick = legal[Math.floor(Math.random() * legal.length)];
      this.move(pid, pick.idx);
    } else {
      let best = legal[0];
      let score = -1;
      for (const m of legal) {
        let s = 0;
        const to = m.to;
        if (to.kind === "home") {
          s += to.count === 6 ? (lvl === "hard" ? 30 : 20) : (lvl === "hard" ? 16 : 10);
        }
        if (to.kind === "track") {
          let found = false;
          for (const otherPid of this.order) {
            if (otherPid === pid) continue;
            const opp = this.tokens[otherPid].find((p) => p.pos.kind === "track" && p.pos.index === to.index);
            if (opp && !SAFE.has(to.index)) { found = true; break; }
          }
          if (found) s += (lvl === "hard" ? 10 : 5);
          if (SAFE.has(to.index)) s -= (lvl === "hard" ? 2 : 1);
        }
        if (s > score) { score = s; best = m; }
      }
      this.move(pid, best.idx);
    }
    // If AI still has turn (bonus roll), continue playing
    if (this.turn === pid && !this.status().ended) {
        // Use timeout in UI, but here we can't block. 
        // The UI loop calls aiPlay periodically.
    }
  }
  status(): EndResult {
    for (const pid of this.order) {
      const done = this.tokens[pid].every((t) => t.pos.kind === "home" && t.pos.count === 6);
      if (done) return { ended: true, winner: pid };
    }
    return { ended: false };
  }
}
