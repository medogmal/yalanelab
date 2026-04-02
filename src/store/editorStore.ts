"use client";
// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR — Zustand Store
//  إدارة حالة الـ Editor كاملة + Undo/Redo
// ═══════════════════════════════════════════════════════════════
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  EditorProject,
  EditorUIState,
  EditorTool,
  EditorPanel,
  GameScene,
  GameObject,
  GameEvent,
  GameEngineData,
  AiMessage,
  Vec2,
} from "@/types/editor";

// ── Default Engine Data ──────────────────────────────────────

function createDefaultEngineData(): GameEngineData {
  const defaultScene: GameScene = {
    id: "scene_1",
    name: "المشهد الأول",
    width: 1920,
    height: 1080,
    backgroundColor: { r: 30, g: 30, b: 50, a: 1 },
    gravity: 9.8,
    objects: [],
    events: [],
  };
  return {
    version: "1.0",
    category: "platformer",
    scenes: [defaultScene],
    story: {
      title: "لعبتي",
      synopsis: "",
      characters: [],
      chapters: [],
      winCondition: "",
      loseCondition: "",
    },
    variables: {},
    assets: { sprites: [], sounds: [], backgrounds: [] },
    settings: {
      targetFPS: 60,
      screenWidth: 800,
      screenHeight: 600,
      physics: "arcade",
    },
  };
}

// ── Store Types ──────────────────────────────────────────────

const MAX_HISTORY = 50;

interface HistoryEntry {
  engineData: GameEngineData;
  timestamp: number;
  label: string;
}

interface EditorStore {
  // ── المشروع الحالي
  project: EditorProject | null;
  isLoaded: boolean;

  // ── حالة الـ UI
  ui: EditorUIState;

  // ── Undo / Redo
  history: HistoryEntry[];
  historyIndex: number;

  // ── AI Chat
  aiMessages: AiMessage[];

  // ── Actions: Project
  loadProject: (project: EditorProject) => void;
  createNewProject: (title: string, category: GameEngineData["category"]) => void;
  saveProject: () => Promise<void>;
  setProjectTitle: (title: string) => void;
  setProjectDescription: (desc: string) => void;

  // ── Actions: Engine Data
  setEngineData: (data: GameEngineData, historyLabel?: string) => void;
  patchEngineData: (patch: Partial<GameEngineData>, historyLabel?: string) => void;

  // ── Actions: Scenes
  addScene: () => void;
  removeScene: (sceneId: string) => void;
  setActiveScene: (sceneId: string) => void;
  updateScene: (sceneId: string, patch: Partial<GameScene>) => void;
  getActiveScene: () => GameScene | null;

  // ── Actions: Objects
  addObject: (obj: GameObject) => void;
  removeObject: (objectId: string) => void;
  updateObject: (objectId: string, patch: Partial<GameObject>) => void;
  selectObject: (objectId: string | null) => void;
  getSelectedObject: () => GameObject | null;
  duplicateObject: (objectId: string) => void;

  // ── Actions: Events
  addEvent: (event: GameEvent) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, patch: Partial<GameEvent>) => void;

  // ── Actions: UI
  setTool: (tool: EditorTool) => void;
  setPanel: (panel: EditorPanel) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Vec2) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  setPlaying: (playing: boolean) => void;
  toggleAiChat: () => void;

  // ── Actions: History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ── Actions: AI
  addAiMessage: (msg: AiMessage) => void;
  clearAiMessages: () => void;
  applyAiPatch: (patch: Partial<GameEngineData>) => void;
}

// ── Store Implementation ─────────────────────────────────────

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial State
    project: null,
    isLoaded: false,
    ui: {
      activeTool: "select",
      activePanel: "objects",
      selectedObjectId: null,
      selectedSceneId: "scene_1",
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      showGrid: true,
      gridSize: 32,
      isDirty: false,
      isPlaying: false,
      isSaving: false,
      aiChatOpen: false,
    },
    history: [],
    historyIndex: -1,
    aiMessages: [],

    // ── Load / Create Project
    loadProject: (project) => {
      const initialHistory: HistoryEntry = {
        engineData: project.engineData,
        timestamp: Date.now(),
        label: "فتح المشروع",
      };
      set({
        project,
        isLoaded: true,
        history: [initialHistory],
        historyIndex: 0,
        ui: {
          ...get().ui,
          selectedSceneId: project.engineData.scenes[0]?.id || null,
          isDirty: false,
        },
      });
    },

    createNewProject: (title, category) => {
      const engineData = createDefaultEngineData();
      engineData.category = category;
      const newProject: EditorProject = {
        id: "",
        title,
        description: "",
        ownerId: "",
        category,
        status: "draft",
        engineData,
        playCount: 0,
        likeCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      get().loadProject(newProject);
      set((s) => ({ ui: { ...s.ui, isDirty: true } }));
    },

    saveProject: async () => {
      const { project } = get();
      if (!project) return;
      set((s) => ({ ui: { ...s.ui, isSaving: true } }));
      try {
        const isNew = !project.id;
        const url = isNew ? "/api/editor/projects" : `/api/editor/projects/${project.id}`;
        const method = isNew ? "POST" : "PATCH";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: project.title,
            description: project.description,
            category: project.category,
            engineData: project.engineData,
          }),
        });
        if (!res.ok) throw new Error("فشل الحفظ");
        const saved = await res.json();
        set((s) => ({
          project: { ...s.project!, id: saved.id, updatedAt: saved.updatedAt },
          ui: { ...s.ui, isDirty: false, isSaving: false },
        }));
      } catch (e) {
        console.error("Save failed:", e);
        set((s) => ({ ui: { ...s.ui, isSaving: false } }));
      }
    },

    setProjectTitle: (title) =>
      set((s) => ({
        project: s.project ? { ...s.project, title } : null,
        ui: { ...s.ui, isDirty: true },
      })),

    setProjectDescription: (description) =>
      set((s) => ({
        project: s.project ? { ...s.project, description } : null,
        ui: { ...s.ui, isDirty: true },
      })),

    // ── Engine Data
    setEngineData: (data, label = "تعديل") => {
      const { project, history, historyIndex } = get();
      if (!project) return;
      const newHistory = history.slice(0, historyIndex + 1);
      if (newHistory.length >= MAX_HISTORY) newHistory.shift();
      newHistory.push({ engineData: data, timestamp: Date.now(), label });
      set({
        project: { ...project, engineData: data },
        history: newHistory,
        historyIndex: newHistory.length - 1,
        ui: { ...get().ui, isDirty: true },
      });
    },

    patchEngineData: (patch, label) => {
      const { project } = get();
      if (!project) return;
      const merged = { ...project.engineData, ...patch };
      get().setEngineData(merged, label);
    },

    // ── Scenes
    getActiveScene: () => {
      const { project, ui } = get();
      if (!project) return null;
      return project.engineData.scenes.find((s) => s.id === ui.selectedSceneId) || null;
    },

    addScene: () => {
      const { project } = get();
      if (!project) return;
      const newScene: GameScene = {
        id: `scene_${Date.now()}`,
        name: `مشهد ${project.engineData.scenes.length + 1}`,
        width: 1920,
        height: 1080,
        backgroundColor: { r: 30, g: 30, b: 50, a: 1 },
        gravity: 9.8,
        objects: [],
        events: [],
      };
      const data = {
        ...project.engineData,
        scenes: [...project.engineData.scenes, newScene],
      };
      get().setEngineData(data, "إضافة مشهد");
      set((s) => ({ ui: { ...s.ui, selectedSceneId: newScene.id } }));
    },

    removeScene: (sceneId) => {
      const { project } = get();
      if (!project || project.engineData.scenes.length <= 1) return;
      const scenes = project.engineData.scenes.filter((s) => s.id !== sceneId);
      get().setEngineData({ ...project.engineData, scenes }, "حذف مشهد");
      if (get().ui.selectedSceneId === sceneId)
        set((s) => ({ ui: { ...s.ui, selectedSceneId: scenes[0].id } }));
    },

    setActiveScene: (sceneId) =>
      set((s) => ({
        ui: { ...s.ui, selectedSceneId: sceneId, selectedObjectId: null },
      })),

    updateScene: (sceneId, patch) => {
      const { project } = get();
      if (!project) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...patch } : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "تعديل مشهد");
    },

    // ── Objects
    addObject: (obj) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? { ...s, objects: [...s.objects, obj] }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, `إضافة ${obj.name}`);
      set((s) => ({ ui: { ...s.ui, selectedObjectId: obj.id } }));
    },

    removeObject: (objectId) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? { ...s, objects: s.objects.filter((o) => o.id !== objectId) }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "حذف عنصر");
      set((s) => ({ ui: { ...s.ui, selectedObjectId: null } }));
    },

    updateObject: (objectId, patch) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? {
              ...s,
              objects: s.objects.map((o) =>
                o.id === objectId ? { ...o, ...patch } : o
              ),
            }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "تعديل عنصر");
    },

    selectObject: (objectId) =>
      set((s) => ({ ui: { ...s.ui, selectedObjectId: objectId } })),

    getSelectedObject: () => {
      const { project, ui } = get();
      if (!project || !ui.selectedObjectId || !ui.selectedSceneId) return null;
      const scene = project.engineData.scenes.find((s) => s.id === ui.selectedSceneId);
      return scene?.objects.find((o) => o.id === ui.selectedObjectId) || null;
    },

    duplicateObject: (objectId) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scene = project.engineData.scenes.find((s) => s.id === ui.selectedSceneId);
      const original = scene?.objects.find((o) => o.id === objectId);
      if (!original) return;
      const copy: GameObject = {
        ...original,
        id: `obj_${Date.now()}`,
        name: `${original.name} (نسخة)`,
        x: original.x + 20,
        y: original.y + 20,
      };
      get().addObject(copy);
    },

    // ── Events
    addEvent: (event) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? { ...s, events: [...s.events, event] }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "إضافة حدث");
    },

    removeEvent: (eventId) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? { ...s, events: s.events.filter((e) => e.id !== eventId) }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "حذف حدث");
    },

    updateEvent: (eventId, patch) => {
      const { project, ui } = get();
      if (!project || !ui.selectedSceneId) return;
      const scenes = project.engineData.scenes.map((s) =>
        s.id === ui.selectedSceneId
          ? {
              ...s,
              events: s.events.map((e) =>
                e.id === eventId ? { ...e, ...patch } : e
              ),
            }
          : s
      );
      get().setEngineData({ ...project.engineData, scenes }, "تعديل حدث");
    },

    // ── UI
    setTool: (tool) => set((s) => ({ ui: { ...s.ui, activeTool: tool } })),
    setPanel: (panel) => set((s) => ({ ui: { ...s.ui, activePanel: panel } })),
    setZoom: (zoom) => set((s) => ({ ui: { ...s.ui, zoom: Math.min(3, Math.max(0.25, zoom)) } })),
    setPanOffset: (panOffset) => set((s) => ({ ui: { ...s.ui, panOffset } })),
    toggleGrid: () => set((s) => ({ ui: { ...s.ui, showGrid: !s.ui.showGrid } })),
    setGridSize: (gridSize) => set((s) => ({ ui: { ...s.ui, gridSize } })),
    setPlaying: (isPlaying) => set((s) => ({ ui: { ...s.ui, isPlaying } })),
    toggleAiChat: () => set((s) => ({ ui: { ...s.ui, aiChatOpen: !s.ui.aiChatOpen } })),

    // ── Undo / Redo
    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    undo: () => {
      const { history, historyIndex, project } = get();
      if (historyIndex <= 0 || !project) return;
      const newIndex = historyIndex - 1;
      const entry = history[newIndex];
      set({
        project: { ...project, engineData: entry.engineData },
        historyIndex: newIndex,
        ui: { ...get().ui, isDirty: true },
      });
    },

    redo: () => {
      const { history, historyIndex, project } = get();
      if (historyIndex >= history.length - 1 || !project) return;
      const newIndex = historyIndex + 1;
      const entry = history[newIndex];
      set({
        project: { ...project, engineData: entry.engineData },
        historyIndex: newIndex,
        ui: { ...get().ui, isDirty: true },
      });
    },

    // ── AI
    addAiMessage: (msg) =>
      set((s) => ({ aiMessages: [...s.aiMessages, msg] })),

    clearAiMessages: () => set({ aiMessages: [] }),

    applyAiPatch: (patch) => {
      const { project } = get();
      if (!project) return;
      const merged = { ...project.engineData, ...patch };
      get().setEngineData(merged, "تعديل بالـ AI");
    },
  }))
);
