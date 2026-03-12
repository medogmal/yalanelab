import { BalootGame, Bid, Card, PlayerId, Rank, Suit } from "./game";

// Simple evaluation of hand strength
function evaluateHand(hand: Card[]): { maxSuit: Suit; maxPoints: number } {
  const suits: Suit[] = ["S", "H", "D", "C"];
  let maxS: Suit = "S";
  let maxP = -1;

  for (const s of suits) {
    let p = 0;
    const cards = hand.filter((c) => c.suit === s);
    for (const c of cards) {
      if (c.rank === "J") p += 20;
      else if (c.rank === "9") p += 14;
      else if (c.rank === "A") p += 11;
      else if (c.rank === "10") p += 10;
      else if (c.rank === "K") p += 4;
      else if (c.rank === "Q") p += 3;
    }
    // Length bonus
    p += cards.length * 5;
    
    if (p > maxP) {
      maxP = p;
      maxS = s;
    }
  }
  return { maxSuit: maxS, maxPoints: maxP };
}

export function getBestBid(game: BalootGame, pid: PlayerId): Bid | "pass" {
  const hand = game.hands[pid];
  const { maxSuit, maxPoints } = evaluateHand(hand);

  // Very simple logic
  // If points > 40, bid Hokom
  // If points > 60, bid Sun (Sun logic is different but simplified here)

  // Check if we can bid Sun (A, 10, K, Q are strong)
  let sunPoints = 0;
  for (const c of hand) {
    if (c.rank === "A") sunPoints += 10;
    if (c.rank === "10") sunPoints += 5;
    if (c.rank === "K") sunPoints += 3;
    if (c.rank === "Q") sunPoints += 2;
  }

  const current = game.currentBid;

  // If no bid yet, or we can outbid
  if (!current) {
    if (sunPoints > 20) return { mode: "sun" };
    if (maxPoints > 30) return { mode: "hokom", trump: maxSuit };
  } else {
    // Can we outbid?
    if (current.mode === "hokom" && sunPoints > 25) return { mode: "sun" };
  }

  return "pass";
}

export function getBestCard(game: BalootGame, pid: PlayerId): Card {
  const legal = game.legalCards(pid);
  if (legal.length === 0) return game.hands[pid][0]; // Should not happen
  if (legal.length === 1) return legal[0];

  // 1. If we can win the trick, play high
  // 2. If partner is winning, play points (if safe)
  // 3. Otherwise play low

  // Simplified: Random legal move for now, but prioritize winning if possible
  // Improve later with real minimax or heuristics
  
  // Try to play a high card if we are leading
  if (!game.trick.lead) {
      // Play highest valid card
      // Sort by rank strength (simplified)
      return legal[0];
  }

  return legal[Math.floor(Math.random() * legal.length)];
}
