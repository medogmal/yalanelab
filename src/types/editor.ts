// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR — Type Definitions
//  كل الـ types اللي الـ Editor محتاجها
// ═══════════════════════════════════════════════════════════════

// ── نوع اللعبة ──────────────────────────────────────────────

export type GameCategory =
  | "platformer"   // ماريو ستايل
  | "topdown"      // GTA 2D ستايل
  | "puzzle"       // ألغاز
  | "rpg"          // لعبة أدوار
  | "racing"       // سباق
  | "shooter"      // شوتر
  | "custom";      // مخصص

// ── حالة المشروع ─────────────────────────────────────────────

export type ProjectStatus = "draft" | "published" | "archived";

// ── عنصر في اللعبة (Object/Entity) ──────────────────────────

export type ObjectType =
  | "player"
  | "enemy"
  | "platform"
  | "wall"
  | "trigger"
  | "collectible"
  | "npc"
  | "spawn"
  | "goal"
  | "decoration"
  | "text";

export interface GameColor {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface GameObjectBase {
  id: string;
  name: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;    // degrees
  visible: boolean;
  locked: boolean;
  color: GameColor;
  layer: number;       // z-index داخل اللعبة
  tags: string[];      // للـ scripting
}

// Player Object
export interface PlayerObject extends GameObjectBase {
  type: "player";
  speed: number;
  jumpForce: number;
  health: number;
  spriteKey: string;
}

// Enemy Object
export interface EnemyObject extends GameObjectBase {
  type: "enemy";
  speed: number;
  health: number;
  damage: number;
  aiPattern: "patrol" | "chase" | "static" | "random";
  spriteKey: string;
}

// Platform / Wall
export interface PlatformObject extends GameObjectBase {
  type: "platform" | "wall";
  solid: boolean;
}

// Trigger Zone — بيشغل حدث لما اللاعب يدخله
export interface TriggerObject extends GameObjectBase {
  type: "trigger";
  eventId: string;     // ID الحدث اللي يتشغل
  once: boolean;       // يتشغل مرة واحدة بس؟
}

// Collectible
export interface CollectibleObject extends GameObjectBase {
  type: "collectible";
  value: number;
  collectSound: string;
}

// NPC
export interface NpcObject extends GameObjectBase {
  type: "npc";
  dialogueId: string;
  spriteKey: string;
}

// Text Label
export interface TextObject extends GameObjectBase {
  type: "text";
  content: string;
  fontSize: number;
  fontColor: GameColor;
}

// Union type لكل الـ objects
export type GameObject =
  | PlayerObject
  | EnemyObject
  | PlatformObject
  | TriggerObject
  | CollectibleObject
  | NpcObject
  | TextObject
  | GameObjectBase;

// ── نظام الأحداث (Visual Scripting) ─────────────────────────

export type EventTriggerType =
  | "onCollide"
  | "onEnterZone"
  | "onKeyPress"
  | "onGameStart"
  | "onTimerEnd"
  | "onHealthZero"
  | "onCollect";

export type EventActionType =
  | "showMessage"
  | "moveObject"
  | "spawnObject"
  | "destroyObject"
  | "playSound"
  | "endGame"
  | "changeScene"
  | "addScore"
  | "setVariable"
  | "teleportPlayer";

export interface EventCondition {
  type: EventTriggerType;
  targetId?: string;    // الـ object اللي يتراقب
  key?: string;         // للـ onKeyPress
}

export interface EventAction {
  type: EventActionType;
  targetId?: string;
  message?: string;
  value?: number | string;
  position?: Vec2;
}

export interface GameEvent {
  id: string;
  name: string;
  trigger: EventCondition;
  actions: EventAction[];
  enabled: boolean;
}

// ── الـ Scene (مشهد / مرحلة) ────────────────────────────────

export interface GameScene {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: GameColor;
  backgroundImage?: string;
  gravity: number;       // 0 = لا يوجد جاذبية
  objects: GameObject[];
  events: GameEvent[];
}

// ── قصة اللعبة ───────────────────────────────────────────────

export interface StoryCharacter {
  id: string;
  name: string;
  role: "hero" | "villain" | "npc" | "narrator";
  description: string;
  spriteKey: string;
}

export interface DialogueLine {
  characterId: string;
  text: string;
  emotion?: "neutral" | "happy" | "sad" | "angry" | "surprised";
}

export interface StoryChapter {
  id: string;
  title: string;
  summary: string;
  dialogue: DialogueLine[];
  triggerSceneId?: string;  // يتشغل عند دخول مشهد معين
}

export interface GameStory {
  title: string;
  synopsis: string;
  characters: StoryCharacter[];
  chapters: StoryChapter[];
  winCondition: string;
  loseCondition: string;
}

// ── الـ Engine Data (كل بيانات اللعبة) ──────────────────────

export interface GameEngineData {
  version: "1.0";
  category: GameCategory;
  scenes: GameScene[];
  story: GameStory;
  variables: Record<string, string | number | boolean>;
  assets: {
    sprites: string[];
    sounds: string[];
    backgrounds: string[];
  };
  settings: {
    targetFPS: number;
    screenWidth: number;
    screenHeight: number;
    physics: "arcade" | "none";
  };
}

// ── مشروع الـ Editor (ما يتحفظ في الـ DB) ───────────────────

export interface EditorProject {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  category: GameCategory;
  status: ProjectStatus;
  engineData: GameEngineData;
  thumbnailUrl?: string;
  playCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── حالة الـ Editor UI ───────────────────────────────────────

export type EditorTool = "select" | "move" | "resize" | "add" | "erase" | "play";

export type EditorPanel = "scenes" | "objects" | "characters" | "events" | "story" | "settings";

export interface EditorUIState {
  activeTool: EditorTool;
  activePanel: EditorPanel;
  selectedObjectId: string | null;
  selectedSceneId: string | null;
  zoom: number;           // 0.5 - 3
  panOffset: Vec2;
  showGrid: boolean;
  gridSize: number;       // pixels
  isDirty: boolean;       // في تغييرات غير محفوظة؟
  isPlaying: boolean;     // Preview mode؟
  isSaving: boolean;
  aiChatOpen: boolean;
}

// ── نوع رسائل الـ AI Chat ────────────────────────────────────

export interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  patch?: Partial<GameEngineData>;  // لو الـ AI عمل تعديل على اللعبة
}
