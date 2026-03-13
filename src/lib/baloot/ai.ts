import { BalootGame, Bid, Card, PlayerId, Suit, Rank } from "./game";

// ── نقاط قوة الورقة ──────────────────────────────────────────────
const TRUMP_STRENGTH: Record<Rank, number> = {
  J: 9, "9": 8, A: 7, "10": 6, K: 5, Q: 4, "8": 2, "7": 1,
};
const PLAIN_STRENGTH: Record<Rank, number> = {
  A: 8, "10": 7, K: 6, Q: 5, J: 4, "9": 3, "8": 2, "7": 1,
};

function cardStrength(card: Card, isTrump: boolean): number {
  return isTrump ? TRUMP_STRENGTH[card.rank] : PLAIN_STRENGTH[card.rank];
}

function evaluateHand(hand: Card[]): { maxSuit: Suit; maxPoints: number } {
  const suits: Suit[] = ["S", "H", "D", "C"];
  let maxS: Suit = "S";
  let maxP = -1;

  for (const s of suits) {
    let p = 0;
    for (const c of hand.filter((x) => x.suit === s)) {
      if (c.rank === "J")   p += 20;
      else if (c.rank === "9") p += 14;
      else if (c.rank === "A") p += 11;
      else if (c.rank === "10") p += 10;
      else if (c.rank === "K") p += 4;
      else if (c.rank === "Q") p += 3;
    }
    p += hand.filter((x) => x.suit === s).length * 5;
    if (p > maxP) { maxP = p; maxS = s; }
  }
  return { maxSuit: maxS, maxPoints: maxP };
}

// ── اختيار أفضل مزاد ─────────────────────────────────────────────
export function getBestBid(game: BalootGame, pid: PlayerId): Bid | "pass" {
  const hand = game.hands[pid];
  const { maxSuit, maxPoints } = evaluateHand(hand);

  let sunPoints = 0;
  for (const c of hand) {
    if (c.rank === "A")  sunPoints += 10;
    if (c.rank === "10") sunPoints += 5;
    if (c.rank === "K")  sunPoints += 3;
    if (c.rank === "Q")  sunPoints += 2;
  }

  const current = game.currentBid;
  if (!current) {
    if (sunPoints > 20)   return { mode: "sun" };
    if (maxPoints > 30)   return { mode: "hokom", trump: maxSuit };
  } else {
    if (current.mode === "hokom" && sunPoints > 25) return { mode: "sun" };
  }
  return "pass";
}

// ── اختيار أفضل ورقة (استراتيجي) ────────────────────────────────
export function getBestCard(game: BalootGame, pid: PlayerId): Card {
  const legal = game.legalCards(pid);
  if (legal.length === 0) return game.hands[pid][0];
  if (legal.length === 1) return legal[0];

  const trump = game.trump;
  const team = game.teams[pid];

  // حدد شريك الفريق
  const partnerEntry = Object.entries(game.teams).find(
    ([p, t]) => p !== pid && t === team
  );
  const partner = partnerEntry?.[0] as PlayerId | undefined;

  // هل شريكنا يكسب الحيلة الحالية؟
  let partnerWinning = false;
  if (partner && game.trick.cards[partner] && game.trick.lead) {
    const leadCard = game.trick.cards[game.trick.lead];
    const partnerCard = game.trick.cards[partner];
    if (leadCard && partnerCard) {
      const leadIsTrump = trump ? leadCard.suit === trump : false;
      const partnerIsTrump = trump ? partnerCard.suit === trump : false;
      const leadStr = cardStrength(leadCard, leadIsTrump);
      const partnerStr = cardStrength(partnerCard, partnerIsTrump);
      partnerWinning = partnerStr >= leadStr;
    }
  }

  // لو شريكنا يكسب — ألعب أصغر ورقة (احتفظ بالكبار)
  if (partnerWinning) {
    return legal.sort(
      (a, b) =>
        cardStrength(a, trump ? a.suit === trump : false) -
        cardStrength(b, trump ? b.suit === trump : false)
    )[0];
  }

  // لو أنت تبدأ الحيلة — العب أعلى ورقة في الـ trump لو عندك
  if (!game.trick.lead) {
    const trumpCards = trump ? legal.filter((c) => c.suit === trump) : [];
    if (trumpCards.length > 0) {
      // العب الـ Jack أو الـ 9 أولاً
      const jackOrNine = trumpCards.find((c) => c.rank === "J" || c.rank === "9");
      if (jackOrNine) return jackOrNine;
      return trumpCards.sort(
        (a, b) => TRUMP_STRENGTH[b.rank] - TRUMP_STRENGTH[a.rank]
      )[0];
    }
    // لو ما عندكش trump — العب أعلى A أو 10
    const highCards = legal.filter((c) => c.rank === "A" || c.rank === "10");
    if (highCards.length > 0) return highCards[0];
  }

  // حاول تكسب الحيلة — العب أعلى ورقة مناسبة
  const leadSuit = game.trick.lead ? game.trick.cards[game.trick.lead]?.suit : null;
  const inSuit = leadSuit ? legal.filter((c) => c.suit === leadSuit) : [];
  const trumpCards = trump ? legal.filter((c) => c.suit === trump) : [];

  if (inSuit.length > 0) {
    // ألعب أعلى ورقة في نفس اللون لو تكسب
    return inSuit.sort(
      (a, b) =>
        cardStrength(b, trump ? b.suit === trump : false) -
        cardStrength(a, trump ? a.suit === trump : false)
    )[0];
  }

  // ما عندكش نفس اللون — ألعب trump لو عندك
  if (trumpCards.length > 0) {
    return trumpCards.sort(
      (a, b) => TRUMP_STRENGTH[b.rank] - TRUMP_STRENGTH[a.rank]
    )[0];
  }

  // ألعب أقل ورقة (تخلص من الـ dead cards)
  return legal.sort(
    (a, b) =>
      cardStrength(a, trump ? a.suit === trump : false) -
      cardStrength(b, trump ? b.suit === trump : false)
  )[0];
}
