
export type WinCondition = 
  | { type: "win_match" }
  | { type: "points", target: number }
  | { type: "max_turns", count: number }
  | { type: "no_draws" };

export type LevelConfig = {
    id: string;
    levelNumber: number;
    title: string;
    description: string;
    winCondition: WinCondition;
    opponentDifficulty: "easy" | "medium" | "hard" | "expert";
    rewards: {
        coins: number;
        xp: number;
        stars: number;
    };
    locked?: boolean;
};

export type CampaignMap = {
    id: string;
    name: string;
    description: string;
    bgImage: string;
    themeColor: string;
    levels: LevelConfig[];
};

export const CAMPAIGN_MAPS: CampaignMap[] = [
    {
        id: "classic",
        name: "الكلاسيكية",
        description: "البداية في عالم الدومينو. تعلم الأساسيات واهزم المبتدئين.",
        bgImage: "/domino/tables/classic.png",
        themeColor: "emerald",
        levels: Array.from({ length: 10 }).map((_, i) => ({
            id: `classic-${i + 1}`,
            levelNumber: i + 1,
            title: `المستوى ${i + 1}`,
            description: i === 0 ? "فز بالمباراة لتثبت جدارتك" : "تحدي جديد بانتظارك",
            winCondition: { type: "win_match" },
            opponentDifficulty: i < 3 ? "easy" : i < 7 ? "medium" : "hard",
            rewards: { coins: 100 * (i + 1), xp: 50 * (i + 1), stars: 3 },
            locked: i !== 0 // First level unlocked
        }))
    },
    {
        id: "desert",
        name: "الصحراء الغامضة",
        description: "تحديات قاسية تحت شمس الصحراء. الذكاء هنا هو مفتاح النجاة.",
        bgImage: "/domino/tables/desert.png",
        themeColor: "amber",
        levels: Array.from({ length: 10 }).map((_, i) => ({
            id: `desert-${i + 1}`,
            levelNumber: i + 1,
            title: `واحة ${i + 1}`,
            description: "لا تسمح للخصم بجمع النقاط",
            winCondition: { type: "points", target: 50 },
            opponentDifficulty: "medium",
            rewards: { coins: 200 * (i + 1), xp: 100 * (i + 1), stars: 3 },
            locked: true
        }))
    },
    {
        id: "egyptian",
        name: "أسرار الفراعنة",
        description: "في حضرة التاريخ، فقط الأساطير يمكنهم الفوز.",
        bgImage: "/domino/tables/egyptian.png",
        themeColor: "yellow",
        levels: Array.from({ length: 10 }).map((_, i) => ({
            id: `egypt-${i + 1}`,
            levelNumber: i + 1,
            title: `مقبرة ${i + 1}`,
            description: "فز دون سحب أي قطعة إضافية",
            winCondition: { type: "no_draws" },
            opponentDifficulty: "hard",
            rewards: { coins: 300 * (i + 1), xp: 150 * (i + 1), stars: 3 },
            locked: true
        }))
    },
    {
        id: "sultan",
        name: "قصر السلطان",
        description: "الفخامة تتطلب مهارة عالية. هل أنت جدير بلقب الوزير؟",
        bgImage: "/domino/tables/sultan.png",
        themeColor: "purple",
        levels: Array.from({ length: 10 }).map((_, i) => ({
            id: `sultan-${i + 1}`,
            levelNumber: i + 1,
            title: `مجلس ${i + 1}`,
            description: "اهزم الخبير في أقل من 10 أدوار",
            winCondition: { type: "max_turns", count: 10 },
            opponentDifficulty: "expert",
            rewards: { coins: 500 * (i + 1), xp: 250 * (i + 1), stars: 3 },
            locked: true
        }))
    },
    {
        id: "turkish",
        name: "الليالي التركية",
        description: "النهاية الكبرى. هنا يتوج أبطال الدومينو.",
        bgImage: "/domino/tables/turkish.png",
        themeColor: "rose",
        levels: Array.from({ length: 10 }).map((_, i) => ({
            id: `turkish-${i + 1}`,
            levelNumber: i + 1,
            title: `ليلة ${i + 1}`,
            description: "البقاء للأقوى. فز 3 مرات متتالية.",
            winCondition: { type: "win_match" },
            opponentDifficulty: "expert",
            rewards: { coins: 1000 * (i + 1), xp: 500 * (i + 1), stars: 3 },
            locked: true
        }))
    }
];
