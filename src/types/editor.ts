// ── نوع اللعبة ──────────────────────────────────────────────
export type GameCategory =
  | "platformer" | "topdown" | "puzzle" | "rpg"
  | "racing" | "shooter" | "custom";

export type ProjectStatus = "draft" | "published" | "archived";

// ── Primitives ───────────────────────────────────────────────
export interface GameColor { r: number; g: number; b: number; a: number; }
export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

// ════════════════════════════════════════════════════════════
//  COMPONENT SYSTEM (Unity-style)
// ════════════════════════════════════════════════════════════
export type ComponentType =
  | "Transform" | "SpriteRenderer" | "Rigidbody2D"
  | "BoxCollider2D" | "CircleCollider2D" | "Animator"
  | "AudioSource" | "Script" | "Camera" | "Light"
  | "ParticleSystem" | "PlayerController" | "EnemyAI"
  | "HealthSystem" | "Inventory" | "DialogueTrigger"
  | "PlatformMovement" | "Tilemap" | "NavMeshAgent";

export interface TransformComponent {
  type: "Transform"; enabled: boolean;
  position: Vec3; rotation: Vec3; scale: Vec3;
}
export interface SpriteRendererComponent {
  type: "SpriteRenderer"; enabled: boolean;
  spriteKey: string; color: GameColor;
  flipX: boolean; flipY: boolean;
  sortingLayer: number; orderInLayer: number;
}
export interface Rigidbody2DComponent {
  type: "Rigidbody2D"; enabled: boolean;
  bodyType: "Dynamic" | "Kinematic" | "Static";
  mass: number; gravityScale: number; drag: number;
  angularDrag: number; freezeRotation: boolean;
  constraints: { freezeX: boolean; freezeY: boolean };
}
export interface BoxCollider2DComponent {
  type: "BoxCollider2D"; enabled: boolean;
  isTrigger: boolean; offset: Vec2; size: Vec2;
  material: { friction: number; bounciness: number };
}
export interface CircleCollider2DComponent {
  type: "CircleCollider2D"; enabled: boolean;
  isTrigger: boolean; offset: Vec2; radius: number;
  material: { friction: number; bounciness: number };
}
export interface AnimatorClip { name: string; frames: string[]; fps: number; loop: boolean; }
export interface AnimatorComponent {
  type: "Animator"; enabled: boolean;
  currentState: string; clips: AnimatorClip[];
  parameters: Record<string, boolean | number | string>;
  transitions: Array<{ from: string; to: string; condition: string; hasExitTime: boolean; exitTime: number }>;
}
export interface AudioSourceComponent {
  type: "AudioSource"; enabled: boolean;
  clip: string; volume: number; pitch: number;
  loop: boolean; playOnAwake: boolean; spatialBlend: number;
}
export interface PlayerControllerComponent {
  type: "PlayerController"; enabled: boolean;
  moveSpeed: number; jumpForce: number; maxJumps: number;
  dashSpeed: number; dashDuration: number; canDash: boolean;
  inputMap: { left: string; right: string; jump: string; dash: string; attack: string };
}
export interface EnemyAIComponent {
  type: "EnemyAI"; enabled: boolean;
  aiPattern: "patrol" | "chase" | "guard" | "wander" | "sniper" | "custom";
  detectionRadius: number; attackRadius: number; moveSpeed: number;
  patrolPoints: Vec2[]; chaseTarget: string;
  attackDamage: number; attackCooldown: number;
}
export interface HealthSystemComponent {
  type: "HealthSystem"; enabled: boolean;
  maxHealth: number; currentHealth: number; invincibleDuration: number;
  deathAction: "destroy" | "respawn" | "gameOver" | "none";
  respawnPoint: Vec2; onDamageEvent: string; onDeathEvent: string;
}
export interface ScriptComponent {
  type: "Script"; enabled: boolean;
  scriptName: string; code: string;
  variables: Record<string, string | number | boolean>;
}
export interface ParticleSystemComponent {
  type: "ParticleSystem"; enabled: boolean;
  duration: number; loop: boolean; startLifetime: number;
  startSpeed: number; startSize: number; startColor: GameColor;
  emissionRate: number; maxParticles: number;
  shape: "cone" | "sphere" | "box" | "circle"; gravity: number;
}
export interface PlatformMovementComponent {
  type: "PlatformMovement"; enabled: boolean;
  movementType: "horizontal" | "vertical" | "circular" | "pingpong";
  speed: number; distance: number; waitTime: number;
}
export interface LightComponent {
  type: "Light"; enabled: boolean;
  lightType: "point" | "spot" | "directional";
  color: GameColor; intensity: number; range: number; castShadows: boolean;
}

export type GameComponent =
  | TransformComponent | SpriteRendererComponent | Rigidbody2DComponent
  | BoxCollider2DComponent | CircleCollider2DComponent | AnimatorComponent
  | AudioSourceComponent | PlayerControllerComponent | EnemyAIComponent
  | HealthSystemComponent | ScriptComponent | ParticleSystemComponent
  | PlatformMovementComponent | LightComponent
  | { type: ComponentType; enabled: boolean; [key: string]: unknown };

// ── Component Factories ───────────────────────────────────────
export function makeTransform(x = 0, y = 0, z = 0): TransformComponent {
  return { type: "Transform", enabled: true, position: { x, y, z }, rotation: { x:0, y:0, z:0 }, scale: { x:1, y:1, z:1 } };
}
export function makeRigidbody(): Rigidbody2DComponent {
  return { type: "Rigidbody2D", enabled: true, bodyType: "Dynamic", mass: 1, gravityScale: 1, drag: 0, angularDrag: 0.05, freezeRotation: true, constraints: { freezeX: false, freezeY: false } };
}
export function makeBoxCollider(w = 1, h = 1): BoxCollider2DComponent {
  return { type: "BoxCollider2D", enabled: true, isTrigger: false, offset: { x:0, y:0 }, size: { x:w, y:h }, material: { friction: 0.4, bounciness: 0 } };
}
export function makePlayerController(): PlayerControllerComponent {
  return { type: "PlayerController", enabled: true, moveSpeed: 5, jumpForce: 10, maxJumps: 2, dashSpeed: 12, dashDuration: 0.15, canDash: true, inputMap: { left:"ArrowLeft", right:"ArrowRight", jump:"Space", dash:"ShiftLeft", attack:"KeyZ" } };
}
export function makeEnemyAI(): EnemyAIComponent {
  return { type: "EnemyAI", enabled: true, aiPattern: "patrol", detectionRadius: 5, attackRadius: 1, moveSpeed: 2, patrolPoints: [], chaseTarget: "Player", attackDamage: 10, attackCooldown: 1 };
}
export function makeHealthSystem(max = 100): HealthSystemComponent {
  return { type: "HealthSystem", enabled: true, maxHealth: max, currentHealth: max, invincibleDuration: 1, deathAction: "gameOver", respawnPoint: { x:0, y:0 }, onDamageEvent: "", onDeathEvent: "" };
}
export function makeSpriteRenderer(key = "", color: GameColor = { r:124, g:58, b:237, a:1 }): SpriteRendererComponent {
  return { type: "SpriteRenderer", enabled: true, spriteKey: key, color, flipX: false, flipY: false, sortingLayer: 0, orderInLayer: 0 };
}

// ════════════════════════════════════════════════════════════
//  GAMEOBJECT
// ════════════════════════════════════════════════════════════
export type ObjectType =
  | "player" | "enemy" | "platform" | "wall" | "trigger"
  | "collectible" | "npc" | "spawn" | "goal" | "decoration"
  | "text" | "camera" | "light" | "emptyObject";

export interface GameObject {
  id: string;
  name: string;
  tag: string;
  layer: number;
  active: boolean;
  isStatic: boolean;
  parentId: string | null;
  childIds: string[];
  // 2D canvas coords
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  locked: boolean;
  color: GameColor;
  tags: string[];
  // Unity components
  components: GameComponent[];
  // optional
  prefabId?: string;
  spriteKey?: string;
  assetScale?: number;
}

// ════════════════════════════════════════════════════════════
//  VISUAL SCRIPTING
// ════════════════════════════════════════════════════════════
export type VSNodeCategory = "event" | "condition" | "action" | "variable" | "flow" | "math" | "ai";

export type VSNodeType =
  | "OnGameStart" | "OnUpdate" | "OnCollisionEnter" | "OnTriggerEnter"
  | "OnKeyDown" | "OnKeyUp" | "OnMouseClick" | "OnTimerEnd"
  | "OnHealthZero" | "OnObjectDestroyed" | "OnSceneLoaded"
  | "If" | "Compare" | "CheckTag" | "IsGrounded" | "HasItem"
  | "MoveObject" | "DestroyObject" | "SpawnObject" | "PlaySound"
  | "SetVariable" | "AddScore" | "LoadScene" | "ShowMessage"
  | "SetActive" | "Teleport" | "ApplyForce" | "SetAnimation"
  | "PlayParticles" | "ShakeCamera" | "FadeScreen" | "EndGame"
  | "GetVariable" | "SetVar" | "MathOp" | "RandomRange"
  | "Wait" | "Sequence" | "Repeat" | "ForEach"
  | "ChaseTarget" | "PatrolPath" | "FleeFrom" | "AttackTarget";

export interface VSNodePort {
  id: string; name: string;
  type: "exec" | "bool" | "float" | "string" | "object" | "vector2";
  connected?: boolean;
}
export interface VSNode {
  id: string; type: VSNodeType; category: VSNodeCategory;
  label: string; x: number; y: number; width: number;
  inputs: VSNodePort[]; outputs: VSNodePort[];
  data: Record<string, string | number | boolean | Vec2>;
  comment?: string;
}
export interface VSConnection {
  id: string;
  fromNodeId: string; fromPortId: string;
  toNodeId: string; toPortId: string;
}
export interface VSGraph {
  id: string; name: string; objectId: string;
  nodes: VSNode[]; connections: VSConnection[];
  variables: Record<string, { type: "float" | "bool" | "string"; defaultValue: string | number | boolean }>;
}

// ════════════════════════════════════════════════════════════
//  LEGACY EVENTS
// ════════════════════════════════════════════════════════════
export type EventTriggerType =
  | "onCollide" | "onEnterZone" | "onKeyPress"
  | "onGameStart" | "onTimerEnd" | "onHealthZero" | "onCollect";
export type EventActionType =
  | "showMessage" | "moveObject" | "spawnObject" | "destroyObject"
  | "playSound" | "endGame" | "changeScene" | "addScore"
  | "setVariable" | "teleportPlayer";
export interface EventCondition { type: EventTriggerType; targetId?: string; key?: string; }
export interface EventAction { type: EventActionType; targetId?: string; message?: string; value?: number | string; position?: Vec2; }
export interface GameEvent { id: string; name: string; trigger: EventCondition; actions: EventAction[]; enabled: boolean; }

// ════════════════════════════════════════════════════════════
//  SCENE
// ════════════════════════════════════════════════════════════
export interface TilemapLayer {
  id: string; name: string;
  tiles: Array<{ x: number; y: number; tileId: string }>;
  visible: boolean; zIndex: number;
}
export interface GameScene {
  id: string; name: string;
  width: number; height: number;
  backgroundColor: GameColor;
  backgroundImage?: string;
  gravity: number;
  objects: GameObject[];
  events: GameEvent[];
  vsGraphs?: VSGraph[];
  tilemap?: { tileSize: number; layers: TilemapLayer[] };
  ambientColor?: GameColor;
  ambientIntensity?: number;
}

// ════════════════════════════════════════════════════════════
//  PREFAB
// ════════════════════════════════════════════════════════════
export interface Prefab {
  id: string; name: string;
  template: Omit<GameObject, "id" | "x" | "y">;
  thumbnail?: string;
}

// ════════════════════════════════════════════════════════════
//  STORY
// ════════════════════════════════════════════════════════════
export interface StoryCharacter { id: string; name: string; role: "hero"|"villain"|"npc"|"narrator"; description: string; spriteKey: string; }
export interface DialogueLine { characterId: string; text: string; emotion?: "neutral"|"happy"|"sad"|"angry"|"surprised"; }
export interface StoryChapter { id: string; title: string; summary: string; dialogue: DialogueLine[]; triggerSceneId?: string; }
export interface GameStory { title: string; synopsis: string; characters: StoryCharacter[]; chapters: StoryChapter[]; winCondition: string; loseCondition: string; }

// ════════════════════════════════════════════════════════════
//  ENGINE DATA — version accepts both "1.0" and "2.0"
// ════════════════════════════════════════════════════════════
export interface GameEngineData {
  version: "1.0" | "2.0";
  category: GameCategory;
  scenes: GameScene[];
  story: GameStory;
  variables: Record<string, string | number | boolean>;
  prefabs: Prefab[];
  assets: {
    sprites: string[];
    sounds: string[];
    backgrounds: string[];
    tilesets?: string[];
  };
  settings: {
    targetFPS: number;
    screenWidth: number;
    screenHeight: number;
    physics: "arcade" | "box2d" | "none";
    gravity?: number;
    pixelsPerUnit?: number;
    defaultTag?: string;
    layers?: string[];
    sortingLayers?: string[];
  };
  build?: { target: "html5"|"unity_json"|"godot_json"; lastExportedAt?: string };
}

// ════════════════════════════════════════════════════════════
//  PROJECT
// ════════════════════════════════════════════════════════════
export interface EditorProject {
  id: string; title: string; description: string; ownerId: string;
  category: GameCategory; status: ProjectStatus;
  engineData: GameEngineData;
  thumbnailUrl?: string; playCount: number; likeCount: number;
  createdAt: string; updatedAt: string;
}

// ════════════════════════════════════════════════════════════
//  EDITOR UI STATE
// ════════════════════════════════════════════════════════════
export type EditorTool =
  | "select" | "move" | "resize" | "rotate"
  | "add" | "erase" | "pan" | "play"
  | "vsNode" | "paint" | "measure";

export type EditorPanel =
  | "hierarchy" | "inspector" | "project"
  | "characters" | "assets" | "events"
  | "visualScript" | "story" | "settings"
  | "console" | "animator" | "tilemap"
  // legacy compat
  | "objects";

export type InspectorTab = "components" | "tags" | "prefab" | "physics";

export interface ConsoleMessage {
  id: string; level: "log"|"warn"|"error";
  message: string; timestamp: number; objectId?: string;
}

export interface EditorUIState {
  activeTool: EditorTool;
  activePanel: EditorPanel;
  activeRightPanel: "inspector" | "vsGraph";
  selectedObjectId: string | null;
  selectedObjectIds: string[];
  selectedSceneId: string | null;
  selectedVSNodeId: string | null;
  selectedVSGraphId: string | null;
  zoom: number;
  panOffset: Vec2;
  showGrid: boolean;
  showColliders: boolean;
  showGizmos: boolean;
  gridSize: number;
  snapToGrid: boolean;
  isDirty: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isSaving: boolean;
  aiChatOpen: boolean;
  consoleMessages: ConsoleMessage[];
  inspectorTab: InspectorTab;
}

// ════════════════════════════════════════════════════════════
//  AI CHAT
// ════════════════════════════════════════════════════════════
export interface AiMessage {
  id: string; role: "user" | "assistant";
  content: string; timestamp: number;
  patch?: Partial<GameEngineData>;
}
