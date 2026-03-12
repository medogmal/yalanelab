export type Suit = "S" | "H" | "D" | "C";
export type Rank = "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";
export type Card = { suit: Suit; rank: Rank };
export type PlayerId = "N" | "E" | "S" | "W";
export type Mode = "hokom" | "sun";
export type Team = "NS" | "EW";
export type Trick = { lead: PlayerId | null; cards: Partial<Record<PlayerId, Card>> };
export type Phase = "bidding" | "playing" | "ended";
export type Bid = { mode: Mode; trump?: Suit };
function deck(): Card[] {
  const suits: Suit[] = ["S", "H", "D", "C"];
  const ranks: Rank[] = ["7", "8", "9", "10", "J", "Q", "K", "A"];
  const out: Card[] = [];
  for (const s of suits) for (const r of ranks) out.push({ suit: s, rank: r });
  return out;
}
function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
}
const orderTrump = ["J", "9", "A", "10", "K", "Q", "8", "7"] as Rank[];
const orderPlain = ["A", "10", "K", "Q", "J", "9", "8", "7"] as Rank[];
const pointsTrump: Record<Rank, number> = { J: 20, "9": 14, A: 11, "10": 10, K: 4, Q: 3, "8": 0, "7": 0 };
const pointsPlain: Record<Rank, number> = { A: 11, "10": 10, K: 4, Q: 3, J: 2, "9": 0, "8": 0, "7": 0 };
function rankScore(card: Card, mode: Mode, trump: Suit | null, lead: Suit | null) {
  if (mode === "hokom" && trump && card.suit === trump) return 100 + (8 - orderTrump.indexOf(card.rank));
  if (lead && card.suit === lead) return 50 + (8 - orderPlain.indexOf(card.rank));
  if (mode === "hokom" && trump && card.suit === trump) return 100 + (8 - orderTrump.indexOf(card.rank));
  return 8 - orderPlain.indexOf(card.rank);
}
function cardPoints(card: Card, mode: Mode, trump: Suit | null) {
  if (mode === "hokom" && trump && card.suit === trump) return pointsTrump[card.rank];
  return pointsPlain[card.rank];
}
export class BalootGame {
  players: PlayerId[];
  teams: Record<PlayerId, Team>;
  dealer: PlayerId;
  mode: Mode | null;
  trump: Suit | null;
  hands: Record<PlayerId, Card[]>;
  trick: Trick;
  next: PlayerId;
  scoreRound: Record<Team, number>;
  scoreTotal: Record<Team, number>;
  lastTrickWinner: PlayerId | null;
  ended: boolean;
  phase: Phase;
  bids: Partial<Record<PlayerId, Bid>>;
  announcementsRound: Record<Team, Array<{ type: "baloot"; points: number; by: PlayerId }>>;
  bidderIndex: number;
  currentBid: Bid | null;
  passesInRow: number;
  bidWinner: PlayerId | null;
  constructor() {
    this.players = ["N", "E", "S", "W"];
    this.teams = { N: "NS", S: "NS", E: "EW", W: "EW" };
    this.dealer = "N";
    this.mode = null;
    this.trump = null;
    this.hands = { N: [], E: [], S: [], W: [] };
    this.trick = { lead: null, cards: {} };
    this.next = "N";
    this.scoreRound = { NS: 0, EW: 0 };
    this.scoreTotal = { NS: 0, EW: 0 };
    this.lastTrickWinner = null;
    this.ended = false;
    this.phase = "bidding";
    this.bids = {};
    this.announcementsRound = { NS: [], EW: [] };
    this.bidderIndex = this.players.indexOf(this.next);
    this.currentBid = null;
    this.passesInRow = 0;
    this.bidWinner = null;
  }
  rotateDealer() {
    const i = this.players.indexOf(this.dealer);
    this.dealer = this.players[(i + 1) % this.players.length];
  }
  startRound(mode?: Mode, trump?: Suit) {
    this.mode = mode ?? null;
    this.trump = mode === "hokom" ? trump ?? null : null;
    const d = deck();
    shuffle(d);
    this.hands = { N: [], E: [], S: [], W: [] };
    for (let i = 0; i < 8; i++) this.hands.N.push(d[i]);
    for (let i = 8; i < 16; i++) this.hands.E.push(d[i]);
    for (let i = 16; i < 24; i++) this.hands.S.push(d[i]);
    for (let i = 24; i < 32; i++) this.hands.W.push(d[i]);
    this.trick = { lead: null, cards: {} };
    const idx = this.players.indexOf(this.dealer);
    this.next = this.players[(idx + 1) % this.players.length];
    this.scoreRound = { NS: 0, EW: 0 };
    this.lastTrickWinner = null;
    this.ended = false;
    this.phase = this.mode ? "playing" : "bidding";
    this.bids = {};
    this.announcementsRound = { NS: [], EW: [] };
    this.bidderIndex = this.players.indexOf(this.next);
    this.currentBid = null;
    this.passesInRow = 0;
    this.bidWinner = null;
  }
  proposeBid(pid: PlayerId, bid: Bid) {
    if (this.phase !== "bidding") {
        console.error("proposeBid: Not bidding phase");
        return false;
    }
    
    // Check turn
    const expected = this.players[this.bidderIndex];
    if (expected !== pid) {
        console.error(`proposeBid: Wrong turn. Expected ${expected}, got ${pid}`);
        return false;
    }

    if (this.outranks(bid, this.currentBid)) {
      this.currentBid = bid;
      this.bidWinner = pid;
      this.passesInRow = 0;
    } else {
      console.error("proposeBid: Bid does not outrank current");
      return false;
    }
    this.advanceBidder();
    this.finalizeBidIfReady();
    return true;
  }
  passBid(pid: PlayerId) {
    if (this.phase !== "bidding") {
        console.error("passBid: Not bidding phase");
        return false;
    }
    
    const expected = this.players[this.bidderIndex];
    if (expected !== pid) {
        console.error(`passBid: Wrong turn. Expected ${expected}, got ${pid}`);
        return false;
    }

    this.passesInRow++;
    this.advanceBidder();
    this.finalizeBidIfReady();
    return true;
  }
  private advanceBidder() {
    this.bidderIndex = (this.bidderIndex + 1) % this.players.length;
  }
  private outranks(newBid: Bid, cur: Bid | null) {
    if (!cur) return true;
    if (newBid.mode === "sun" && cur.mode !== "sun") return true;
    if (newBid.mode === "hokom" && cur.mode === "hokom") return true;
    return false;
  }
  private finalizeBidIfReady() {
    if (this.currentBid && this.passesInRow >= 3) {
      const chosen = this.currentBid;
      this.mode = chosen.mode;
      this.trump = chosen.mode === "hokom" ? chosen.trump ?? "H" : null;
      this.phase = "playing";
      if (this.bidWinner) this.next = this.bidWinner;
      // announcements: baloot (K+Q of trump) for hokom
      if (this.mode === "hokom" && this.trump) {
        for (const p of this.players) {
          const h = this.hands[p];
          const hasK = h.some((c) => c.suit === this.trump && c.rank === "K");
          const hasQ = h.some((c) => c.suit === this.trump && c.rank === "Q");
          if (hasK && hasQ) {
            const team = this.teams[p];
            this.announcementsRound[team].push({ type: "baloot", points: 20, by: p });
            this.scoreRound[team] += 20;
          }
        }
      }
      // simple sequences 3/4/5 as extra announcements (20/40/50)
      const order: Rank[] = ["7", "8", "9", "10", "J", "Q", "K", "A"];
      for (const p of this.players) {
        const team = this.teams[p];
        const hand = this.hands[p];
        const bySuit: Record<Suit, Rank[]> = { S: [], H: [], D: [], C: [] };
        for (const c of hand) bySuit[c.suit].push(c.rank);
        for (const s of ["S","H","D","C"] as Suit[]) {
          const arr = bySuit[s].sort((a,b) => order.indexOf(a) - order.indexOf(b));
          let run = 1;
          for (let i=1;i<arr.length;i++) {
            if (order.indexOf(arr[i]) === order.indexOf(arr[i-1]) + 1) {
              run++;
              if (run >= 3) {
                const pts = run === 3 ? 20 : run === 4 ? 40 : run >= 5 ? 50 : 0;
                if (pts > 0) {
                  this.announcementsRound[team].push({ type: "baloot", points: pts, by: p });
                  this.scoreRound[team] += pts;
                  break;
                }
              }
            } else {
              run = 1;
            }
          }
        }
      }
    }
  }
  legalCards(pid: PlayerId) {
    if (this.phase !== "playing") return [];
    const hand = this.hands[pid];
    if (!this.trick.lead) return hand.slice();
    const lead = this.trick.lead;
    const leadSuit = this.trick.cards[lead!]?.suit ?? null;
    const inSuit = hand.filter((c) => c.suit === leadSuit);
    if (leadSuit && inSuit.length > 0) return inSuit;
    return hand.slice();
  }
  play(pid: PlayerId, card: Card) {
    if (this.ended) return false;
    if (this.phase !== "playing") return false;
    if (this.next !== pid) return false;
    const legal = this.legalCards(pid).some((c) => c.suit === card.suit && c.rank === card.rank);
    if (!legal) return false;
    const hand = this.hands[pid];
    const idx = hand.findIndex((c) => c.suit === card.suit && c.rank === card.rank);
    if (idx < 0) return false;
    hand.splice(idx, 1);
    if (!this.trick.lead) this.trick.lead = pid;
    this.trick.cards[pid] = card;
    const nextIdx = (this.players.indexOf(pid) + 1) % this.players.length;
    this.next = this.players[nextIdx];
    if (Object.keys(this.trick.cards).length === 4) {
      const leadSuit = this.trick.cards[this.trick.lead!]?.suit ?? null;
      let bestScore = -9999;
      let winner: PlayerId = this.trick.lead!;
      for (const p of this.players) {
        const c = this.trick.cards[p]!;
        const sc = rankScore(c, this.mode!, this.trump, leadSuit);
        if (sc > bestScore) {
          bestScore = sc;
          winner = p;
        }
      }
      let trickPoints = 0;
      for (const p of this.players) trickPoints += cardPoints(this.trick.cards[p]!, this.mode!, this.trump);
      const allEmpty = this.players.every((p) => this.hands[p].length === 0);
      if (allEmpty) trickPoints += 10;
      const team = this.teams[winner];
      this.scoreRound[team] += trickPoints;
      this.lastTrickWinner = winner;
      this.trick = { lead: null, cards: {} };
      this.next = winner;
      if (allEmpty) {
        this.scoreTotal.NS += this.scoreRound.NS;
        this.scoreTotal.EW += this.scoreRound.EW;
        this.ended = true;
        this.phase = "ended";
      }
    }
    return true;
  }
  aiMove(pid: PlayerId) {
    if (this.phase !== "playing") return;
    const leg = this.legalCards(pid);
    const leadSuit = this.trick.lead ? this.trick.cards[this.trick.lead]?.suit ?? null : null;
    let best = leg[0];
    let bs = -9999;
    for (const c of leg) {
      const sc = rankScore(c, this.mode!, this.trump, leadSuit);
      if (sc > bs) {
        bs = sc;
        best = c;
      }
    }
    this.play(pid, best);
  }
}
