# 🎮 Yala Game Editor — Master Plan
> **آخر تحديث:** يتم تحديث هذا الملف باستمرار مع تقدم التطوير
> **المسار:** `C:\Users\احمد\Documents\projects\yala\yalanelab-main`

---

## 📌 نقطة الانطلاق — ما عندنا بالفعل

| الملف/الموديول | الحالة | الوصف |
|---|---|---|
| `src/app/api/worlds/route.ts` | ✅ شغال | GET + POST للعوالم |
| `src/app/world/page.tsx` | ✅ شغال | صفحة استكشاف العوالم |
| `prisma/schema.prisma → World.configJson` | ✅ موجود | هنا بنحفظ اللعبة كـ JSON |
| `zustand` في package.json | ✅ موجود | State management جاهز |
| `framer-motion` في package.json | ✅ موجود | Animations جاهزة |
| `three.js` في package.json | ✅ موجود | مش هنستخدمه للـ editor (Pixi.js أفضل للـ 2D) |

---

## 🗺️ خريطة المراحل

```
المرحلة 1 → المرحلة 2 → المرحلة 3 → المرحلة 4 → المرحلة 5
  Layout      Canvas     GameObjects   Scripts     Publish
  (ابدأ هنا)
```

---

## 🔴 المرحلة 1 — Editor Shell (ابدأ هنا)

**الهدف:** تفتح `/editor` وتشوف layout بـ 3 panels

### الملفات الجديدة:

```
src/
├── app/
│   └── editor/
│       ├── page.tsx                    ← صفحة الإيديتور
│       └── [id]/
│           └── page.tsx                ← تعديل عالم موجود
├── components/
│   └── editor/
│       ├── EditorShell.tsx             ← الـ 3-panel layout
│       └── Toolbar.tsx                 ← Select/Move/Scale/Rotate/Play/Publish
└── lib/
    └── editor/
        ├── types.ts                    ← كل أنواع البيانات
        └── store.ts                    ← Zustand store
```

### تفاصيل كل ملف:

#### `src/lib/editor/types.ts`
```typescript
export type ObjectType = 'player' | 'enemy' | 'platform' | 'collectible' | 
                          'trigger' | 'camera' | 'text' | 'npc' | 'background';

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface PhysicsConfig {
  type: 'static' | 'dynamic' | 'kinematic';
  gravity: boolean;
  friction: number;
  bounce: number;
  isTrigger: boolean;
}

export interface ScriptEvent {
  id: string;
  trigger: 'OnCollide' | 'OnClick' | 'OnStart' | 'OnTimer' | 'OnKeyPress' | 'OnProximity' | 'OnHealthZero' | 'OnItemCollect';
  condition?: string;
  action: 'Move' | 'Show' | 'Hide' | 'PlaySound' | 'ChangeScene' | 'AddScore' | 'ShowDialog' | 'SpawnObject' | 'SetProperty';
  target?: string;
  property?: string;
  value?: any;
}

export interface GameObject {
  id: string;
  name: string;
  type: ObjectType;
  transform: Transform;
  spriteUrl?: string;
  color?: string;
  opacity: number;
  physics: PhysicsConfig;
  scripts: ScriptEvent[];
  tags: string[];
  isVisible: boolean;
  isLocked: boolean;
  parentId?: string;
  children: string[];
}

export interface SceneSettings {
  backgroundColor: string;
  gravity: number;
  cameraFollowPlayer: boolean;
  worldWidth: number;
  worldHeight: number;
}

export interface GameScene {
  id: string;
  name: string;
  objects: GameObject[];
  settings: SceneSettings;
}

export interface EditorState {
  worldId: string | null;
  scenes: GameScene[];
  activeSceneId: string;
  selectedObjectId: string | null;
  history: GameObject[][];
  historyIndex: number;
  isDirty: boolean;
  activeTool: 'select' | 'move' | 'scale' | 'rotate' | 'play';
}
```

#### `src/lib/editor/store.ts`
```typescript
import { create } from 'zustand';
import { EditorState, GameObject, GameScene } from './types';

interface EditorStore extends EditorState {
  // Actions
  selectObject: (id: string | null) => void;
  addObject: (obj: GameObject) => void;
  updateObject: (id: string, changes: Partial<GameObject>) => void;
  deleteObject: (id: string) => void;
  setTool: (tool: EditorState['activeTool']) => void;
  undo: () => void;
  redo: () => void;
  saveToJson: () => string;
  loadFromJson: (json: string) => void;
}
```

### تيكست للـ EditorShell.tsx:
- يسار (250px): Scene Hierarchy
- وسط (flex: 1): Canvas
- يمين (280px): Properties Panel
- فوق: Toolbar (60px)

---

## 🟡 المرحلة 2 — Canvas Engine

**الهدف:** كانفاس حقيقي بـ Pixi.js - drag objects، select، transform

### npm packages:
```bash
npm install pixi.js @pixi/react
```

### الملفات الجديدة:
```
src/components/editor/
├── SceneCanvas.tsx         ← Pixi.js داخل React + Grid
├── SceneHierarchy.tsx      ← شجرة objects مع drag reorder
└── PropertiesPanel.tsx     ← Transform inputs + physics + color

src/lib/editor/
└── pixiRenderer.ts         ← منطق الـ rendering منفصل
```

### مهام المرحلة دي:
- [ ] Pixi.js Application داخل `useEffect`
- [ ] Grid background (dotted grid)
- [ ] Render كل object من الـ store
- [ ] Click لتحديد object
- [ ] Drag to move object
- [ ] Transform handles (resize)
- [ ] Undo/Redo (Ctrl+Z / Ctrl+Y)

---

## 🟠 المرحلة 3 — Game Object System

**الهدف:** مكتبة أصول كاملة + حفظ وتحميل JSON

### الملفات الجديدة:
```
src/components/editor/
└── AssetPanel.tsx          ← مكتبة sprites, shapes, sounds

src/lib/editor/
└── gameObjects.ts          ← Factory functions لكل type

src/app/api/editor/
└── assets/route.ts         ← API للـ built-in assets

public/editor/
├── sprites/                ← sprites مجانية جاهزة
└── sounds/                 ← sounds مجانية جاهزة
```

### Object Types المتاحة:
| النوع | الوصف |
|---|---|
| `player` | شخصية اللاعب + WASD/Arrow controls |
| `enemy` | عدو بـ AI بسيط (patrol, follow) |
| `platform` | سطح للقفز عليه (static physics) |
| `collectible` | آيتم يجمعه اللاعب (coins, keys) |
| `trigger` | منطقة تشغّل event لما اللاعب يدخلها |
| `npc` | شخصية بحوار |
| `text` | نص في اللعبة |
| `background` | خلفية أو سطح ديكور |

---

## 🔴 المرحلة 4 — Visual Script System

**الهدف:** الألعاب بدون كود - أحداث مرئية

### الملفات الجديدة:
```
src/components/editor/
├── ScriptEditor.tsx        ← Event → Condition → Action builder
└── StoryBuilder.tsx        ← بناء القصة: NPC حوار، مهام

src/lib/editor/
├── scriptEngine.ts         ← Runtime للـ scripts
└── physicsEngine.ts        ← Physics simulation
```

### نموذج Script في JSON:
```json
{
  "id": "script_001",
  "trigger": "OnCollide",
  "condition": "target.tag === 'door'",
  "action": "SetProperty",
  "target": "door_01",
  "property": "visible",
  "value": false
}
```

### Events المدعومة:
- `OnCollide` — لما object يلمس object تاني
- `OnClick` — لما اللاعب يضغط على object
- `OnStart` — لما المشهد يبدأ
- `OnTimer` — بعد عدد من الثواني
- `OnKeyPress` — لما يضغط مفتاح معين
- `OnProximity` — لما اللاعب يقترب
- `OnHealthZero` — لما الصحة تخلص
- `OnItemCollect` — لما يجمع آيتم معين

### Actions المدعومة:
- `Move` — تحريك object
- `Show` / `Hide` — إظهار/إخفاء
- `PlaySound` — تشغيل صوت
- `ChangeScene` — الانتقال لمشهد آخر
- `AddScore` — إضافة نقاط
- `ShowDialog` — إظهار حوار NPC
- `SpawnObject` — إنشاء object جديد
- `SetProperty` — تغيير خاصية

---

## 🔵 المرحلة 5 — Publish Pipeline

**الهدف:** نشر اللعبة وتشغيلها في /world

### الملفات الجديدة/المعدلة:
```
src/app/world/[id]/play/
└── page.tsx                ← Game Runtime (يقرأ JSON ويشغل)

src/lib/editor/
└── gameRuntime.ts          ← نفس Pixi renderer لكن full game mode

src/app/api/worlds/[id]/
└── publish/route.ts        ← PATCH isPublished = true + حفظ configJson
```

### Flow النشر:
```
Editor → Save JSON → World.configJson في DB → /world/[id]/play يشغل اللعبة
```

---

## 🏗️ المعمارية الكاملة

```
┌─────────────────────────────────────────────────────────┐
│                    EDITOR UI LAYER                       │
│  EditorShell → Toolbar + Canvas + Hierarchy + Properties │
└────────────────────────┬────────────────────────────────┘
                         │ reads/writes
┌────────────────────────▼────────────────────────────────┐
│                  ZUSTAND STORE LAYER                     │
│        objects[] + selectedId + history[] + scenes[]     │
└────────────────────────┬────────────────────────────────┘
                         │ serialize/deserialize
┌────────────────────────▼────────────────────────────────┐
│                    DATA LAYER (JSON)                     │
│           World.configJson في data/worlds.json           │
└────────────────────────┬────────────────────────────────┘
                         │ loads
┌────────────────────────▼────────────────────────────────┐
│                   GAME RUNTIME LAYER                     │
│    /world/[id]/play + Pixi.js + scriptEngine + physics   │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies المطلوبة

| Package | الحالة | الاستخدام |
|---|---|---|
| `pixi.js` | ❌ مش موجود - محتاج install | Canvas rendering للـ editor والـ runtime |
| `@pixi/react` | ❌ مش موجود | React wrapper لـ Pixi.js |
| `zustand` | ✅ موجود v5 | Editor state management |
| `framer-motion` | ✅ موجود | UI animations |

```bash
npm install pixi.js @pixi/react
```

---

## ✅ Checklist التقدم

### المرحلة 1 — Layout
- [ ] `src/lib/editor/types.ts`
- [ ] `src/lib/editor/store.ts`
- [ ] `src/components/editor/EditorShell.tsx`
- [ ] `src/components/editor/Toolbar.tsx`
- [ ] `src/app/editor/page.tsx`
- [ ] /editor يفتح صح في المتصفح

### المرحلة 2 — Canvas
- [ ] npm install pixi.js
- [ ] `SceneCanvas.tsx` مع Grid
- [ ] `SceneHierarchy.tsx`
- [ ] `PropertiesPanel.tsx`
- [ ] Drag object يشتغل
- [ ] Click to select يشتغل
- [ ] Undo/Redo يشتغل

### المرحلة 3 — Game Objects
- [ ] `gameObjects.ts`
- [ ] `AssetPanel.tsx`
- [ ] إضافة sprites في public/
- [ ] حفظ JSON يشتغل
- [ ] تحميل JSON يشتغل

### المرحلة 4 — Scripts
- [ ] `ScriptEditor.tsx`
- [ ] `scriptEngine.ts`
- [ ] OnCollide يشتغل في preview
- [ ] `StoryBuilder.tsx`
- [ ] NPC حوار يشتغل

### المرحلة 5 — Publish
- [ ] `/world/[id]/play/page.tsx`
- [ ] `gameRuntime.ts`
- [ ] زر Publish يشتغل
- [ ] اللعبة تظهر في /world

---

## 🚨 قواعد مهمة

1. **كل object = JSON** — مفيش حاجة مش قابلة للتسلسل في الـ store
2. **Pixi.js فقط للـ 2D** — Three.js للـ 3D لو احتجناه بعدين
3. **configJson في World model** — هنا بيتحفظ كل حاجة
4. **مفيش AI API دلوقتي** — الوظائف الأساسية الأول
5. **من سكراتش** — Visual scripting بدون كود يدوي

---

*آخر تحديث: تم إنشاؤه في بداية المشروع*
