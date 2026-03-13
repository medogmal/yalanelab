import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type CulturalMood, DEFAULT_MOOD } from "./cultural-themes";

// --- Types ---

export type Language = "ar" | "en";
export type { CulturalMood };

export type UserProfile = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  max_xp: number;
  coins: number;
  gems: number;
  vip: boolean;
  bio?: string;
  country?: string;
  stats?: {
    games_played: number;
    wins: number;
    tournaments_won: number;
  };
};

export type InventoryItem = {
  id: string;
  type: "avatar" | "ludo_skin" | "chess_skin" | "domino_skin" | "baloot_skin" | "baloot_frame" | "character" | "chat_bubble";
  name: string;
  asset: string;
  price?: number;
};

export type PlatformState = {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  addCurrency: (coins: number, gems: number) => void;
  
  // Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  soundEnabled: boolean;
  toggleSound: () => void;

  // المود الثقافي
  culturalMood: CulturalMood;
  setCulturalMood: (mood: CulturalMood) => void;

  // الدولة
  country: "EG" | "SA" | "YE" | "OTHER";
  setCountry: (c: "EG" | "SA" | "YE" | "OTHER") => void;
  
  // Inventory
  inventory: InventoryItem[];
  catalog: InventoryItem[]; // Dynamic Catalog
  fetchCatalog: () => Promise<void>;
  fetchProfile: () => Promise<void>; // Fetch user profile from DB
  equipped: {
    avatar: string;
    ludo_skin: string;
    chess_skin: string;
    domino_skin: string;
    baloot_skin: string;
    baloot_frame?: string;
    character?: string;
  };
  unlockItem: (item: InventoryItem) => void;
  buyItem: (item: InventoryItem) => Promise<boolean>;
  equipItem: (type: InventoryItem["type"], itemId: string) => Promise<void>;
};

// --- Catalog ---
// Catalog is now fetched from the server/API, no hardcoded defaults here.
export const INITIAL_CATALOG: InventoryItem[] = [];

// --- Store ---

export const usePlatformStore = create<PlatformState>()(
  persist(
    (set, get) => ({
      // Default User (Guest)
      user: {
        id: "guest_001",
        name: "Guest Player",
        avatar: "/avatars/default.png", // Use local default or upload
        level: 1,
        xp: 0,
        max_xp: 1000,
        coins: 1000,
        gems: 10,
        vip: false,
        bio: "Just a casual player enjoying the games!",
        stats: {
            games_played: 0,
            wins: 0,
            tournaments_won: 0
        }
      },
      
      setUser: (user) => set({ user }),
      updateUser: (updates) => set((state) => ({ 
          user: state.user ? { ...state.user, ...updates } : null 
      })),
      addCurrency: (c, g) => set((state) => state.user ? ({ user: { ...state.user, coins: state.user.coins + c, gems: state.user.gems + g } }) : {}),

      // Settings
      language: "ar",
      setLanguage: (lang) => set({ language: lang }),
      soundEnabled: true,
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      // المود الثقافي
      culturalMood: DEFAULT_MOOD,
      setCulturalMood: (mood) => set({ culturalMood: mood }),

      // الدولة
      country: "SA",
      setCountry: (c) => set({ country: c }),

      // Inventory & Catalog
      inventory: [],
      catalog: INITIAL_CATALOG,
      equipped: {
        avatar: "avatar_king", // Default
        ludo_skin: "skin_default",
        chess_skin: "skin_wood",
        domino_skin: "default_domino", // Default skin ID
        baloot_skin: "skin_classic",
      },
      
      fetchCatalog: async () => {
        try {
          const res = await fetch("/api/admin/skins");
          if (res.ok) {
            const data = await res.json();
            set({ catalog: data });
          }
        } catch (e) {
          console.error("Failed to fetch catalog", e);
        }
      },

      fetchProfile: async () => {
        try {
          const res = await fetch("/api/user/me");
          if (res.ok) {
            const data = await res.json();
            set((state) => ({
              user: {
                ...state.user!,
                ...data.user,
                // Ensure ID is string
                id: data.user.id || state.user?.id,
              },
              inventory: data.inventory || [],
              ...(data.user.country ? { country: data.user.country } : {}),
              equipped: {
                avatar: data.user.avatarSkin || "avatar_king",
                ludo_skin: data.user.ludoSkin || "skin_default",
                chess_skin: data.user.chessSkin || "skin_wood",
                baloot_skin: data.user.balootSkin || "skin_classic",
                domino_skin: data.user.dominoSkin || "default_domino",
              }
            }));
          }
        } catch (e) {
          console.error("Failed to fetch profile", e);
        }
      },

      equipped: {
        avatar: "avatar_king",
        ludo_skin: "skin_default",
        chess_skin: "skin_wood",
        domino_skin: "default_domino",
        baloot_skin: "skin_classic",
      },
      
      unlockItem: (item) => set((state) => ({ inventory: [...state.inventory, item] })),
      
      buyItem: async (item) => {
        // Optimistic UI update
        const state = get();
        if (!state.user || state.user.coins < (item.price || 0)) return false;

        // Call API
        try {
            const res = await fetch("/api/store/buy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: item.id, type: item.type, price: item.price })
            });
            
            if (res.ok) {
                const data = await res.json();
                set((s) => ({
                    user: s.user ? { ...s.user, coins: data.newBalance } : null,
                    inventory: [...s.inventory, item]
                }));
                return true;
            }
        } catch (e) {
            console.error(e);
        }
        return false;
      },

      equipItem: async (type, itemId) => {
        set((state) => ({ 
            equipped: { ...state.equipped, [type]: itemId } 
        }));
        
        // Sync with API
        try {
            const state = get();
            await fetch("/api/user/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ equipped: state.equipped })
            });
        } catch (e) {
            console.error(e);
        }
      },
    }),
    {
      name: "yalla-storage", // name of the item in the storage (must be unique)
    }
  )
);
