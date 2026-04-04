"use client";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  EditorProject, EditorUIState, EditorTool, EditorPanel,
  GameScene, GameObject, GameEvent, GameEngineData,
  AiMessage, Vec2, GameComponent, VSGraph, VSNode, VSConnection,
  ConsoleMessage, Prefab, InspectorTab,
} from "@/types/editor";
import {
  makeTransform, makeRigidbody, makeBoxCollider,
  makePlayerController, makeEnemyAI, makeHealthSystem, makeSpriteRenderer,
} from "@/types/editor";

// ════════════════════════════════════════════════════════════
//  Default Engine Data
// ════════════════════════════════════════════════════════════
function createDefaultEngineData(): GameEngineData {
  const defaultScene: GameScene = {
    id: "scene_1",
    name: "المشهد الأول",
    width: 1920, height: 1080,
    backgroundColor: { r: 12, g: 15, b: 30, a: 1 },
    gravity: 9.8, objects: [], events: [], vsGraphs: [],
    ambientColor: { r: 40, g: 50, b: 80, a: 1 },
    ambientIntensity: 0.6,
  };
  return {
    version: "2.0",
    category: "platformer",
    scenes: [defaultScene],
    story: { title: "لعبتي", synopsis: "", characters: [], chapters: [], winCondition: "", loseCondition: "" },
    variables: {},
    prefabs: [],
    assets: { sprites: [], sounds: [], backgrounds: [], tilesets: [] },
    settings: {
      targetFPS: 60, screenWidth: 1920, screenHeight: 1080,
      physics: "arcade", gravity: 9.8, pixelsPerUnit: 100,
      defaultTag: "Untagged",
      layers: ["Default", "UI", "Player", "Enemy", "Ground", "Trigger"],
      sortingLayers: ["Background", "Default", "Foreground", "UI"],
    },
  };
}

// Migrate old v1.0 projects to v2.0
function migrateEngineData(data: GameEngineData): GameEngineData {
  return {
    ...data,
    version: "2.0",
    prefabs: data.prefabs ?? [],
    assets: { sprites: [], sounds: [], backgrounds: [], tilesets: [], ...data.assets },
    settings: {
      targetFPS: 60, screenWidth: 800, screenHeight: 600,
      physics: "arcade", gravity: 9.8,
      ...data.settings,
    },
    scenes: data.scenes.map(sc => ({
      ...sc,
      vsGraphs: sc.vsGraphs ?? [],
      objects: sc.objects.map(obj => ({
        tag: "Untagged",
        active: true,
        isStatic: obj.type === "platform" || obj.type === "wall",
        parentId: null,
        childIds: [],
        components: [],
        tags: [],
        ...obj,
      })),
    })),
  };
}

// ════════════════════════════════════════════════════════════
//  Smart Object Factory
// ════════════════════════════════════════════════════════════
export function createGameObject(
  type: GameObject["type"],
  overrides: Partial<GameObject> = {}
): GameObject {
  const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // ── الموقع الافتراضي: وسط الـ scene (960, 440) ──
  // worldX = (960-960)/80 = 0 → وسط الـ canvas
  // worldY = (1080-440)/80 - 5.5 = 8 - 5.5 = 2.5 → فوق الأرض
  const defaultX = 960;
  const defaultY = 440;

  return {
    id,
    name: labelOf(type),
    tag: tagOf(type),
    layer: 0,
    active: true,
    isStatic: type === "platform" || type === "wall" || type === "decoration",
    parentId: null,
    childIds: [],
    type,
    x: defaultX,
    y: defaultY,
    width: defaultWidth(type),
    height: defaultHeight(type),
    rotation: 0,
    visible: true,
    locked: false,
    color: defaultColor(type),
    tags: [],
    components: defaultComponents(type),
    ...overrides,
  };
}

function labelOf(t: GameObject["type"]): string {
  const m: Record<string, string> = {
    player:"لاعب", enemy:"عدو", platform:"منصة", wall:"جدار",
    trigger:"منطقة حدث", collectible:"جائزة", npc:"شخصية",
    spawn:"نقطة بداية", goal:"هدف", decoration:"زخرفة",
    text:"نص", camera:"كاميرا", light:"ضوء", emptyObject:"كائن فارغ",
  };
  return m[t] || t;
}
function tagOf(t: GameObject["type"]): string {
  if (t === "player") return "Player";
  if (t === "enemy") return "Enemy";
  if (t === "collectible") return "Collectible";
  if (t === "trigger") return "Trigger";
  return "Untagged";
}
function defaultWidth(t: GameObject["type"]): number {
  if (t === "platform") return 320;
  if (t === "wall") return 48;
  if (t === "text") return 200;
  if (t === "trigger") return 120;
  return 96;
}
function defaultHeight(t: GameObject["type"]): number {
  if (t === "platform") return 32;
  if (t === "wall") return 320;
  if (t === "text") return 48;
  if (t === "trigger") return 120;
  return 96;
}
function defaultColor(t: GameObject["type"]): import("@/types/editor").GameColor {
  const m: Record<string, [number,number,number]> = {
    player:[124,58,237], enemy:[220,38,38], platform:[37,99,235],
    wall:[100,116,139], trigger:[245,158,11], collectible:[16,185,129],
    npc:[6,182,212], spawn:[132,204,22], goal:[249,115,22],
    decoration:[167,139,250], text:[226,232,240],
    camera:[99,102,241], light:[253,224,71], emptyObject:[100,116,139],
  };
  const [r,g,b] = m[t] || [100,100,100];
  return { r, g, b, a: 1 };
}
function defaultComponents(t: GameObject["type"]): GameComponent[] {
  const tr = makeTransform();
  switch (t) {
    case "player":
      return [tr, makeSpriteRenderer(), makeRigidbody(), makeBoxCollider(0.96,0.96), makePlayerController(), makeHealthSystem(100)];
    case "enemy":
      return [tr, makeSpriteRenderer(), makeRigidbody(), makeBoxCollider(0.96,0.96), makeEnemyAI(), makeHealthSystem(50)];
    case "platform":
    case "wall":
      return [tr, makeSpriteRenderer(), makeBoxCollider(4, 0.4)];
    case "trigger":
      return [tr, { ...makeBoxCollider(1.2,1.2), isTrigger: true } as GameComponent];
    case "collectible":
      return [tr, makeSpriteRenderer(), { type: "CircleCollider2D" as const, enabled: true, isTrigger: true, offset:{x:0,y:0}, radius:0.5, material:{friction:0,bounciness:0} }];
    case "npc":
      return [tr, makeSpriteRenderer(), makeBoxCollider(0.96,0.96)];
    default:
      return [tr];
  }
}

// ════════════════════════════════════════════════════════════
//  History
// ════════════════════════════════════════════════════════════
const MAX_HISTORY = 60;
interface HistoryEntry { engineData: GameEngineData; timestamp: number; label: string; }

// ════════════════════════════════════════════════════════════
//  Store Interface
// ════════════════════════════════════════════════════════════
interface EditorStore {
  project: EditorProject | null;
  isLoaded: boolean;
  ui: EditorUIState;
  history: HistoryEntry[];
  historyIndex: number;
  aiMessages: AiMessage[];

  loadProject: (p: EditorProject) => void;
  createNewProject: (title: string, category: GameEngineData["category"]) => void;
  saveProject: () => Promise<void>;
  setProjectTitle: (t: string) => void;

  setEngineData: (data: GameEngineData, label?: string) => void;
  patchEngineData: (patch: Partial<GameEngineData>, label?: string) => void;

  getActiveScene: () => GameScene | null;
  addScene: () => void;
  removeScene: (id: string) => void;
  setActiveScene: (id: string) => void;
  updateScene: (id: string, patch: Partial<GameScene>) => void;

  addObject: (obj: GameObject) => void;
  addObjectOfType: (type: GameObject["type"], extras?: Partial<GameObject>) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;
  updateObject: (id: string, patch: Partial<GameObject>) => void;
  selectObject: (id: string | null) => void;
  selectObjects: (ids: string[]) => void;
  toggleSelectObject: (id: string) => void;
  clearSelection: () => void;
  getSelectedObject: () => GameObject | null;
  duplicateObject: (id: string) => void;
  duplicateObjects: (ids: string[]) => void;
  moveObjects: (ids: string[], dx: number, dy: number) => void;

  addComponent: (objectId: string, component: GameComponent) => void;
  removeComponent: (objectId: string, componentType: string) => void;
  updateComponent: (objectId: string, componentType: string, patch: Partial<GameComponent>) => void;
  getComponent: <T extends GameComponent>(objectId: string, type: T["type"]) => T | null;

  addVSGraph: (graph: VSGraph) => void;
  removeVSGraph: (graphId: string) => void;
  updateVSGraph: (graphId: string, patch: Partial<VSGraph>) => void;
  getVSGraph: (graphId: string) => VSGraph | null;
  addVSNode: (graphId: string, node: VSNode) => void;
  removeVSNode: (graphId: string, nodeId: string) => void;
  updateVSNode: (graphId: string, nodeId: string, patch: Partial<VSNode>) => void;
  addVSConnection: (graphId: string, conn: VSConnection) => void;
  removeVSConnection: (graphId: string, connId: string) => void;
  selectVSGraph: (graphId: string | null) => void;
  selectVSNode: (nodeId: string | null) => void;

  savePrefab: (objectId: string, name: string) => void;
  instantiatePrefab: (prefabId: string, x: number, y: number) => void;

  addEvent: (e: GameEvent) => void;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, patch: Partial<GameEvent>) => void;

  setTool: (t: EditorTool) => void;
  setPanel: (p: EditorPanel) => void;
  setRightPanel: (p: "inspector" | "vsGraph") => void;
  setInspectorTab: (t: InspectorTab) => void;
  setZoom: (z: number) => void;
  setPanOffset: (o: Vec2) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleShowColliders: () => void;
  toggleShowGizmos: () => void;
  setGridSize: (s: number) => void;
  setPlaying: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  toggleAiChat: () => void;
  logConsole: (level: "log"|"warn"|"error", msg: string, objectId?: string) => void;
  clearConsole: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  addAiMessage: (m: AiMessage) => void;
  clearAiMessages: () => void;
  applyAiPatch: (patch: Partial<GameEngineData>) => void;
}

// ════════════════════════════════════════════════════════════
//  Implementation
// ════════════════════════════════════════════════════════════
export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => {

    function mutateScene(sceneId: string, fn: (s: GameScene) => GameScene, label = "تعديل"): void {
      const { project } = get();
      if (!project) return;
      const scenes = project.engineData.scenes.map(s => s.id === sceneId ? fn(s) : s);
      get().setEngineData({ ...project.engineData, scenes }, label);
    }

    function activeSceneId(): string | null { return get().ui.selectedSceneId; }

    const initialUI: EditorUIState = {
      activeTool: "select",
      activePanel: "hierarchy",
      activeRightPanel: "inspector",
      selectedObjectId: null,
      selectedObjectIds: [],
      selectedSceneId: "scene_1",
      selectedVSNodeId: null,
      selectedVSGraphId: null,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showGrid: true,
      showColliders: false,
      showGizmos: true,
      gridSize: 32,
      snapToGrid: false,
      isDirty: false,
      isPlaying: false,
      isPaused: false,
      isSaving: false,
      aiChatOpen: false,
      consoleMessages: [],
      inspectorTab: "components",
    };

    return {
      project: null,
      isLoaded: false,
      ui: initialUI,
      history: [],
      historyIndex: -1,
      aiMessages: [],

      // ── Project ───────────────────────────────────────────
      loadProject: (project) => {
        const migrated = migrateEngineData(project.engineData);
        const p = { ...project, engineData: migrated };
        set({
          project: p,
          isLoaded: true,
          history: [{ engineData: migrated, timestamp: Date.now(), label: "فتح المشروع" }],
          historyIndex: 0,
          ui: { ...get().ui, selectedSceneId: migrated.scenes[0]?.id ?? null, isDirty: false },
        });
      },

      createNewProject: (title, category) => {
        const engineData = createDefaultEngineData();
        engineData.category = category;
        get().loadProject({
          id: "", title, description: "", ownerId: "", category,
          status: "draft", engineData, playCount: 0, likeCount: 0,
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        set(s => ({ ui: { ...s.ui, isDirty: true } }));
      },

      saveProject: async () => {
        const { project } = get();
        if (!project) return;
        set(s => ({ ui: { ...s.ui, isSaving: true } }));
        try {
          const isNew = !project.id;
          const res = await fetch(
            isNew ? "/api/editor/projects" : `/api/editor/projects/${project.id}`,
            { method: isNew ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: project.title, description: project.description, category: project.category, engineData: project.engineData }) }
          );
          if (!res.ok) throw new Error("فشل الحفظ");
          const saved = await res.json();
          set(s => ({ project: { ...s.project!, id: saved.id, updatedAt: saved.updatedAt }, ui: { ...s.ui, isDirty: false, isSaving: false } }));
        } catch {
          set(s => ({ ui: { ...s.ui, isSaving: false } }));
        }
      },

      setProjectTitle: (title) =>
        set(s => ({ project: s.project ? { ...s.project, title } : null, ui: { ...s.ui, isDirty: true } })),

      // ── Engine Data ───────────────────────────────────────
      setEngineData: (data, label = "تعديل") => {
        const { project, history, historyIndex } = get();
        if (!project) return;
        const newHist = [...history.slice(0, historyIndex + 1)];
        if (newHist.length >= MAX_HISTORY) newHist.shift();
        newHist.push({ engineData: data, timestamp: Date.now(), label });
        set({ project: { ...project, engineData: data }, history: newHist, historyIndex: newHist.length - 1, ui: { ...get().ui, isDirty: true } });
      },

      patchEngineData: (patch, label) => {
        const { project } = get();
        if (!project) return;
        get().setEngineData({ ...project.engineData, ...patch }, label);
      },

      // ── Scenes ────────────────────────────────────────────
      getActiveScene: () => {
        const { project, ui } = get();
        return project?.engineData.scenes.find(s => s.id === ui.selectedSceneId) ?? null;
      },

      addScene: () => {
        const { project } = get();
        if (!project) return;
        const s: GameScene = {
          id: `scene_${Date.now()}`,
          name: `مشهد ${project.engineData.scenes.length + 1}`,
          width: 1920, height: 1080,
          backgroundColor: { r: 12, g: 15, b: 30, a: 1 },
          gravity: 9.8, objects: [], events: [], vsGraphs: [],
        };
        get().setEngineData({ ...project.engineData, scenes: [...project.engineData.scenes, s] }, "إضافة مشهد");
        set(st => ({ ui: { ...st.ui, selectedSceneId: s.id } }));
      },

      removeScene: (id) => {
        const { project } = get();
        if (!project || project.engineData.scenes.length <= 1) return;
        const scenes = project.engineData.scenes.filter(s => s.id !== id);
        get().setEngineData({ ...project.engineData, scenes }, "حذف مشهد");
        if (get().ui.selectedSceneId === id)
          set(st => ({ ui: { ...st.ui, selectedSceneId: scenes[0].id } }));
      },

      setActiveScene: (id) =>
        set(s => ({ ui: { ...s.ui, selectedSceneId: id, selectedObjectId: null, selectedObjectIds: [] } })),

      updateScene: (id, patch) =>
        mutateScene(id, s => ({ ...s, ...patch }), "تعديل مشهد"),

      // ── Objects ───────────────────────────────────────────
      addObject: (obj) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, objects: [...s.objects, obj] }), `إضافة ${obj.name}`);
        set(st => ({ ui: { ...st.ui, selectedObjectId: obj.id, selectedObjectIds: [obj.id] } }));
      },

      addObjectOfType: (type, extras = {}) => {
        // ── وسط الـ 3D scene تماماً ──
        // worldX(960) = 0, worldY(440) ≈ 2.5 فوق الأرض
        const obj = createGameObject(type, {
          x: 960 + (Math.random() - 0.5) * 200,  // scatter بسيط عشان المحاذاة
          y: 440,
          ...extras,
        });
        get().addObject(obj);
      },

      removeObject: (id) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, objects: s.objects.filter(o => o.id !== id) }), "حذف عنصر");
        set(st => ({ ui: { ...st.ui, selectedObjectId: null, selectedObjectIds: [] } }));
      },

      removeObjects: (ids) => {
        const sid = activeSceneId(); if (!sid) return;
        const set2 = new Set(ids);
        mutateScene(sid, s => ({ ...s, objects: s.objects.filter(o => !set2.has(o.id)) }), `حذف ${ids.length} عناصر`);
        set(st => ({ ui: { ...st.ui, selectedObjectId: null, selectedObjectIds: [] } }));
      },

      updateObject: (id, patch) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, objects: s.objects.map(o => o.id === id ? { ...o, ...patch } : o) }), "تعديل عنصر");
      },

      selectObject: (id) =>
        set(s => ({ ui: { ...s.ui, selectedObjectId: id, selectedObjectIds: id ? [id] : [] } })),
      selectObjects: (ids) =>
        set(s => ({ ui: { ...s.ui, selectedObjectIds: ids, selectedObjectId: ids[0] ?? null } })),
      toggleSelectObject: (id) => {
        const { selectedObjectIds } = get().ui;
        const next = selectedObjectIds.includes(id)
          ? selectedObjectIds.filter(x => x !== id)
          : [...selectedObjectIds, id];
        set(s => ({ ui: { ...s.ui, selectedObjectIds: next, selectedObjectId: next[next.length - 1] ?? null } }));
      },
      clearSelection: () =>
        set(s => ({ ui: { ...s.ui, selectedObjectId: null, selectedObjectIds: [] } })),

      getSelectedObject: () => {
        const { project, ui } = get();
        if (!project || !ui.selectedObjectId || !ui.selectedSceneId) return null;
        return project.engineData.scenes.find(s => s.id === ui.selectedSceneId)?.objects.find(o => o.id === ui.selectedObjectId) ?? null;
      },

      duplicateObject: (id) => {
        const scene = get().getActiveScene();
        const orig = scene?.objects.find(o => o.id === id);
        if (!orig) return;
        get().addObject({ ...orig, id: `obj_${Date.now()}`, name: `${orig.name} (نسخة)`, x: orig.x + 80, y: orig.y + 80 });
      },

      duplicateObjects: (ids) => {
        const scene = get().getActiveScene();
        if (!scene) return;
        ids.forEach(id => {
          const orig = scene.objects.find(o => o.id === id);
          if (orig) get().addObject({ ...orig, id: `obj_${Date.now()}`, name: `${orig.name} (نسخة)`, x: orig.x + 80, y: orig.y + 80 });
        });
      },

      moveObjects: (ids, dx, dy) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, objects: s.objects.map(o => ids.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o) }), "تحريك عناصر");
      },

      // ── Components ────────────────────────────────────────
      addComponent: (objectId, component) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, objects: s.objects.map(o => o.id === objectId
            ? { ...o, components: [...(o.components || []), component] } : o)
        }), `إضافة ${component.type}`);
      },

      removeComponent: (objectId, componentType) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, objects: s.objects.map(o => o.id === objectId
            ? { ...o, components: (o.components || []).filter(c => c.type !== componentType) } : o)
        }), `حذف ${componentType}`);
      },

      updateComponent: (objectId, componentType, patch) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, objects: s.objects.map(o => o.id === objectId
            ? { ...o, components: (o.components || []).map(c => c.type === componentType ? { ...c, ...patch } : c) } : o)
        }), `تعديل ${componentType}`);
      },

      getComponent: <T extends GameComponent>(objectId: string, type: T["type"]): T | null => {
        const scene = get().getActiveScene();
        const obj = scene?.objects.find(o => o.id === objectId);
        return (obj?.components?.find(c => c.type === type) as T) ?? null;
      },

      // ── Visual Scripting ──────────────────────────────────
      addVSGraph: (graph) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, vsGraphs: [...(s.vsGraphs || []), graph] }), "إضافة VS Graph");
        set(st => ({ ui: { ...st.ui, selectedVSGraphId: graph.id, activeRightPanel: "vsGraph" } }));
      },

      removeVSGraph: (graphId) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, vsGraphs: (s.vsGraphs || []).filter(g => g.id !== graphId) }), "حذف VS Graph");
        if (get().ui.selectedVSGraphId === graphId)
          set(st => ({ ui: { ...st.ui, selectedVSGraphId: null } }));
      },

      updateVSGraph: (graphId, patch) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId ? { ...g, ...patch } : g)
        }), "تعديل VS Graph");
      },

      getVSGraph: (graphId) => {
        const scene = get().getActiveScene();
        return scene?.vsGraphs?.find(g => g.id === graphId) ?? null;
      },

      addVSNode: (graphId, node) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId ? { ...g, nodes: [...g.nodes, node] } : g)
        }), `إضافة node`);
      },

      removeVSNode: (graphId, nodeId) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId
            ? { ...g, nodes: g.nodes.filter(n => n.id !== nodeId), connections: g.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId) }
            : g)
        }), "حذف node");
      },

      updateVSNode: (graphId, nodeId, patch) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId
            ? { ...g, nodes: g.nodes.map(n => n.id === nodeId ? { ...n, ...patch } : n) } : g)
        }), "تعديل node");
      },

      addVSConnection: (graphId, conn) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId ? { ...g, connections: [...g.connections, conn] } : g)
        }), "ربط nodes");
      },

      removeVSConnection: (graphId, connId) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({
          ...s, vsGraphs: (s.vsGraphs || []).map(g => g.id === graphId
            ? { ...g, connections: g.connections.filter(c => c.id !== connId) } : g)
        }), "قطع ربط");
      },

      selectVSGraph: (id) =>
        set(s => ({ ui: { ...s.ui, selectedVSGraphId: id, activeRightPanel: id ? "vsGraph" : "inspector" } })),
      selectVSNode: (id) =>
        set(s => ({ ui: { ...s.ui, selectedVSNodeId: id } })),

      // ── Prefabs ───────────────────────────────────────────
      savePrefab: (objectId, name) => {
        const scene = get().getActiveScene();
        const obj = scene?.objects.find(o => o.id === objectId);
        if (!obj || !get().project) return;
        const { id: _id, x: _x, y: _y, ...template } = obj;
        const prefab: Prefab = { id: `prefab_${Date.now()}`, name, template };
        get().patchEngineData({ prefabs: [...(get().project!.engineData.prefabs ?? []), prefab] }, "حفظ Prefab");
      },

      instantiatePrefab: (prefabId, x, y) => {
        const prefab = get().project?.engineData.prefabs?.find(p => p.id === prefabId);
        if (!prefab) return;
        get().addObject({ ...prefab.template, id: `obj_${Date.now()}`, x, y, prefabId } as GameObject);
      },

      // ── Events ────────────────────────────────────────────
      addEvent: (event) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, events: [...s.events, event] }), "إضافة حدث");
      },
      removeEvent: (id) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, events: s.events.filter(e => e.id !== id) }), "حذف حدث");
      },
      updateEvent: (id, patch) => {
        const sid = activeSceneId(); if (!sid) return;
        mutateScene(sid, s => ({ ...s, events: s.events.map(e => e.id === id ? { ...e, ...patch } : e) }), "تعديل حدث");
      },

      // ── UI ────────────────────────────────────────────────
      setTool: (t) => set(s => ({ ui: { ...s.ui, activeTool: t } })),
      setPanel: (p) => set(s => ({ ui: { ...s.ui, activePanel: p } })),
      setRightPanel: (p) => set(s => ({ ui: { ...s.ui, activeRightPanel: p } })),
      setInspectorTab: (t) => set(s => ({ ui: { ...s.ui, inspectorTab: t } })),
      setZoom: (z) => set(s => ({ ui: { ...s.ui, zoom: Math.min(4, Math.max(0.1, z)) } })),
      setPanOffset: (o) => set(s => ({ ui: { ...s.ui, panOffset: o } })),
      toggleGrid: () => set(s => ({ ui: { ...s.ui, showGrid: !s.ui.showGrid } })),
      toggleSnapToGrid: () => set(s => ({ ui: { ...s.ui, snapToGrid: !s.ui.snapToGrid } })),
      toggleShowColliders: () => set(s => ({ ui: { ...s.ui, showColliders: !s.ui.showColliders } })),
      toggleShowGizmos: () => set(s => ({ ui: { ...s.ui, showGizmos: !s.ui.showGizmos } })),
      setGridSize: (gs) => set(s => ({ ui: { ...s.ui, gridSize: gs } })),
      setPlaying: (v) => set(s => ({ ui: { ...s.ui, isPlaying: v, isPaused: false } })),
      setPaused: (v) => set(s => ({ ui: { ...s.ui, isPaused: v } })),
      toggleAiChat: () => set(s => ({ ui: { ...s.ui, aiChatOpen: !s.ui.aiChatOpen } })),

      logConsole: (level, msg, objectId) =>
        set(s => ({ ui: { ...s.ui, consoleMessages: [...s.ui.consoleMessages.slice(-199), { id: `log_${Date.now()}`, level, message: msg, timestamp: Date.now(), objectId }] } })),
      clearConsole: () =>
        set(s => ({ ui: { ...s.ui, consoleMessages: [] } })),

      // ── Undo / Redo ───────────────────────────────────────
      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      undo: () => {
        const { history, historyIndex, project } = get();
        if (historyIndex <= 0 || !project) return;
        const idx = historyIndex - 1;
        set({ project: { ...project, engineData: history[idx].engineData }, historyIndex: idx, ui: { ...get().ui, isDirty: true } });
      },

      redo: () => {
        const { history, historyIndex, project } = get();
        if (historyIndex >= history.length - 1 || !project) return;
        const idx = historyIndex + 1;
        set({ project: { ...project, engineData: history[idx].engineData }, historyIndex: idx, ui: { ...get().ui, isDirty: true } });
      },

      // ── AI ────────────────────────────────────────────────
      addAiMessage: (m) => set(s => ({ aiMessages: [...s.aiMessages, m] })),
      clearAiMessages: () => set({ aiMessages: [] }),
      applyAiPatch: (patch) => {
        const { project } = get();
        if (!project) return;
        get().setEngineData({ ...project.engineData, ...patch }, "تعديل بالـ AI");
      },
    };
  })
);
