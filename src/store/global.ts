 "use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type GlobalState = {
  scores: Record<string, number>;
  ratings: Record<string, number>;
  addScore: (game: string, delta: number) => void;
  setRating: (game: string, rating: number) => void;
};

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      scores: {},
      ratings: {},
      addScore: (game, delta) =>
        set((s) => ({
          scores: { ...s.scores, [game]: Math.max(0, (s.scores[game] || 0) + delta) },
        })),
      setRating: (game, rating) =>
        set((s) => ({
          ratings: { ...s.ratings, [game]: rating },
        })),
    }),
    {
      name: "global-store",
    }
  )
);
