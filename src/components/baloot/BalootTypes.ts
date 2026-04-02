// BalootTypes.ts — أنواع البلوت المشتركة
import type { PlayerId, Mode, Suit } from "@/lib/baloot/game";

export type CharacterType =
  | "sheikh" | "deceiver" | "warrior" | "madman" | "girl" | "lady"
  | "poet" | "adventurer" | "hunter" | "traveler" | "falcon"
  | "sultan" | "dalela" | "rez" | "mohareb" | "elmohareba"
  | "elmkhade" | "elmojamer" | "archer";

export type AbilityStatus = "ready" | "active" | "cooldown" | "used";
export type ItemRarity    = "common" | "rare" | "epic" | "legendary";

export interface CharacterData {
  id:         CharacterType;
  name:       string;
  avatar:     any;
  desc:       string;
  color:      string;
  rarity:     ItemRarity;
  price:      number;
  currency:   "coins" | "gems";
  isVip?:     boolean;
  isFree?:    boolean;
}

export type BalootUIPhase =
  | "splash" | "lobby" | "mode_select" | "character_select"
  | "table_select" | "matchmaking" | "deal" | "bidding"
  | "playing" | "ended";

export type GameMode = "classic" | "ranked";
