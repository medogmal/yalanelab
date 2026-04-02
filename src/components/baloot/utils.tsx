import type { Suit } from "@/lib/baloot/game";
export function suitColor(s: Suit) {
  if (s === "H") return "#ef4444";
  if (s === "D") return "#f59e0b";
  if (s === "S") return "#22d3ee";
  return "#22c55e";
}
