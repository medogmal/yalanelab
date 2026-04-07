// ═══════════════════════════════════════════════════════════════
//  YALA EDITOR — Game Runtime Engine
//  بيشتغل في Play Mode — فيزياء + VS execution + collision
// ═══════════════════════════════════════════════════════════════

import type { GameEngineData, GameScene, GameObject, VSGraph, VSNode, GameComponent } from "@/types/editor";

interface PhysicsBody {
  id: string; x: number; y: number; vx: number; vy: number;
  w: number; h: number; mass: number; gravityScale: number;
  isStatic: boolean; isTrigger: boolean;
  restitution: number; friction: number; onGround: boolean; tag: string;
}

interface RuntimeObject {
  id: string; name: string; type: string; tag: string; active: boolean;
  x: number; y: number; vx: number; vy: number;
  width: number; height: number; rotation: number;
  health: number; maxHealth: number;
  body: PhysicsBody | null;
  components: Record<string, GameComponent>;
  userData: Record<string, string | number | boolean>;
}

interface RuntimeEvent {
  type: string; sourceId: string; targetId?: string;
  data?: Record<string, unknown>;
}

export interface RuntimeCallbacks {
  onObjectMove?:    (id: string, x: number, y: number, vx: number, vy: number) => void;
  onObjectDestroy?: (id: string) => void;
  onObjectSpawn?:   (id: string, x: number, y: number, type: string, name: string) => void;
  onScoreChange?:   (score: number) => void;
  onHealthChange?:  (id: string, health: number, maxHealth: number) => void;
  onMessage?:       (text: string) => void;
  onSceneChange?:   (sceneId: string) => void;
  onGameOver?:      (win: boolean) => void;
  onLog?:           (msg: string) => void;
}

export class GameRuntime {
  private engineData: GameEngineData;
  private currentScene: GameScene;
  private objects: Map<string, RuntimeObject> = new Map();
  private variables: Record<string, string | number | boolean> = {};
  private score = 0;
  private running = false;
  private paused  = false;
  private frameId = 0;
  private lastTime = 0;
  private keysDown: Set<string> = new Set();
  private events: RuntimeEvent[] = [];
  private callbacks: RuntimeCallbacks;
  private vsGraphs: VSGraph[] = [];
  private executedOnStart = false;
  private collisionPairs: Set<string> = new Set();
  private frameCount = 0;

  constructor(engineData: GameEngineData, sceneId: string, callbacks: RuntimeCallbacks = {}) {
    this.engineData   = engineData;
    this.callbacks    = callbacks;
    const scene = engineData.scenes.find(s => s.id === sceneId) || engineData.scenes[0];
    this.currentScene = scene;
    this.vsGraphs     = scene.vsGraphs || [];
    this.variables    = { ...engineData.variables };
  }

  // ─── init ─────────────────────────────────────────────────
  init() {
    this.objects.clear();
    this.score = 0;
    this.collisionPairs.clear();
    this.executedOnStart = false;
    this.frameCount = 0;

    for (const obj of this.currentScene.objects) {
      if (!obj.active) continue;
      const rb  = obj.components?.find(c => c.type === "Rigidbody2D")   as any;
      const col = obj.components?.find(c => c.type === "BoxCollider2D") as any;
      const hs  = obj.components?.find(c => c.type === "HealthSystem")  as any;
      const comps: Record<string, GameComponent> = {};
      for (const c of (obj.components || [])) comps[c.type] = c;

      const body: PhysicsBody | null = rb ? {
        id: obj.id, x: obj.x, y: obj.y, vx: 0, vy: 0,
        w: obj.width, h: obj.height,
        mass: rb.mass ?? 1, gravityScale: rb.gravityScale ?? 1,
        isStatic: rb.bodyType === "Static" || !!obj.isStatic,
        isTrigger: col?.isTrigger ?? false,
        restitution: col?.material?.bounciness ?? 0,
        friction: col?.material?.friction ?? 0.3,
        onGround: false, tag: obj.tag,
      } : null;

      this.objects.set(obj.id, {
        id: obj.id, name: obj.name, type: obj.type, tag: obj.tag,
        active: true, x: obj.x, y: obj.y, vx: 0, vy: 0,
        width: obj.width, height: obj.height, rotation: obj.rotation,
        health: hs?.currentHealth ?? 100, maxHealth: hs?.maxHealth ?? 100,
        body, components: comps, userData: {},
      });
    }
  }

  // ─── start / stop ─────────────────────────────────────────
  start() {
    this.init();
    this.running = true; this.paused = false;
    this.lastTime = performance.now();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup",   this.onKeyUp);
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup",   this.onKeyUp);
  }

  setPaused(v: boolean) { this.paused = v; }

  // ─── main loop ────────────────────────────────────────────
  private loop = (now: number) => {
    if (!this.running) return;
    this.frameId = requestAnimationFrame(this.loop);
    if (this.paused) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.frameCount++;

    // OnGameStart — once
    if (!this.executedOnStart) {
      this.executedOnStart = true;
      for (const g of this.vsGraphs) {
        const n = g.nodes.find(x => x.type === "OnGameStart");
        if (n) this.executeFromNode(g, n, {});
      }
    }

    // OnUpdate — every frame
    for (const g of this.vsGraphs) {
      const n = g.nodes.find(x => x.type === "OnUpdate");
      if (n) this.executeFromNode(g, n, {});
    }

    this.processEventQueue();
    this.updatePhysics(dt);
    this.detectCollisions();
    this.updateAI();
    this.notifyPositions();
  };

  // ─── keyboard ─────────────────────────────────────────────
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.keysDown.has(e.code)) return;
    this.keysDown.add(e.code);
    for (const g of this.vsGraphs) {
      for (const n of g.nodes) {
        if (n.type === "OnKeyDown" && (!n.data.key || n.data.key === e.code)) {
          this.executeFromNode(g, n, { key: e.code });
        }
      }
    }
  };
  private onKeyUp = (e: KeyboardEvent) => this.keysDown.delete(e.code);

  queueEvent(ev: RuntimeEvent) { this.events.push(ev); }

  private processEventQueue() {
    const evs = [...this.events]; this.events = [];
    for (const ev of evs) {
      for (const g of this.vsGraphs) {
        for (const n of g.nodes) {
          if (n.type !== ev.type) continue;
          if (n.data.targetId && n.data.targetId !== ev.sourceId) continue;
          this.executeFromNode(g, n, { event: ev, sourceId: ev.sourceId, targetId: ev.targetId });
        }
      }
    }
  }

  // ─── VS executor ──────────────────────────────────────────
  private executeFromNode(graph: VSGraph, node: VSNode, ctx: Record<string, unknown>): unknown {
    const d = node.data;
    switch (node.type) {

      // Events — just chain out
      case "OnGameStart": case "OnUpdate": case "OnCollisionEnter":
      case "OnTriggerEnter": case "OnKeyDown": case "OnHealthZero":
        return this.chain(graph, node, "out", ctx);

      // Conditions
      case "If": {
        const cond = Boolean(this.resolveIn(graph, node, "cond", ctx) ?? d.condition ?? false);
        return this.chain(graph, node, cond ? "true" : "false", ctx);
      }
      case "Compare": {
        const a = Number(this.resolveIn(graph, node, "a", ctx) ?? d.a ?? 0);
        const b = Number(this.resolveIn(graph, node, "b", ctx) ?? d.b ?? 0);
        const ops: Record<string,boolean> = { "==":a===b,"!=":a!==b,">":a>b,"<":a<b,">=":a>=b,"<=":a<=b };
        return ops[String(d.operator ?? "==")] ?? false;
      }

      // Actions
      case "AddScore": {
        const v = Number(this.resolveIn(graph, node, "val", ctx) ?? d.val ?? 10);
        this.score += v; this.callbacks.onScoreChange?.(this.score);
        return this.chain(graph, node, "out", ctx);
      }
      case "ShowMessage": {
        const m = String(this.resolveIn(graph, node, "msg", ctx) ?? d.message ?? "");
        this.callbacks.onMessage?.(m);
        return this.chain(graph, node, "out", ctx);
      }
      case "EndGame": {
        this.callbacks.onGameOver?.(Boolean(d.win ?? false)); this.stop(); return;
      }
      case "DestroyObject": {
        const tid = String(this.resolveIn(graph, node, "target", ctx) ?? d.targetId ?? ctx.sourceId ?? "");
        this.destroyObject(tid);
        return this.chain(graph, node, "out", ctx);
      }
      case "SetActive": {
        const obj = this.objects.get(String(d.targetId ?? "")); if (obj) obj.active = Boolean(d.value ?? true);
        return this.chain(graph, node, "out", ctx);
      }
      case "Teleport": {
        const obj = this.objects.get(String(d.targetId ?? ""));
        if (obj) { obj.x = Number(d.x ?? 0); obj.y = Number(d.y ?? 0); if (obj.body) { obj.body.x = obj.x; obj.body.y = obj.y; } }
        return this.chain(graph, node, "out", ctx);
      }
      case "ApplyForce": {
        const obj = this.objects.get(String(d.targetId ?? ctx.sourceId ?? ""));
        if (obj?.body && !obj.body.isStatic) {
          obj.body.vx += Number(d.forceX ?? 0); obj.body.vy += Number(d.forceY ?? 0);
        }
        return this.chain(graph, node, "out", ctx);
      }
      case "MoveObject": {
        const obj = this.objects.get(String(d.targetId ?? ""));
        if (obj?.body) { obj.body.vx = Number(d.dirX ?? 0) * Number(d.speed ?? 3); obj.body.vy = Number(d.dirY ?? 0) * Number(d.speed ?? 3); }
        return this.chain(graph, node, "out", ctx);
      }
      case "LoadScene": {
        this.callbacks.onSceneChange?.(String(d.sceneId ?? "")); return;
      }
      case "ShakeCamera": {
        this.callbacks.onLog?.(`shake:${d.intensity ?? 5}`); return this.chain(graph, node, "out", ctx);
      }
      case "SpawnObject": {
        const newId = `rt_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        const x = Number(d.x ?? 200), y = Number(d.y ?? 200);
        const type = String(d.objectType ?? "decoration");
        this.objects.set(newId, {
          id: newId, name: String(d.name ?? type), type, tag: "Untagged",
          active: true, x, y, vx: 0, vy: 0, width: 48, height: 48, rotation: 0,
          health: 100, maxHealth: 100, body: null, components: {}, userData: {},
        });
        this.callbacks.onObjectSpawn?.(newId, x, y, type, String(d.name ?? type));
        return this.chain(graph, node, "out", ctx);
      }

      // Variables
      case "GetVariable": return this.variables[String(d.variableName ?? "")] ?? 0;
      case "SetVariable": {
        const k = String(d.variableName ?? ""), v = this.resolveIn(graph, node, "val", ctx) ?? d.value ?? 0;
        this.variables[k] = v as string|number|boolean;
        return this.chain(graph, node, "out", ctx);
      }
      case "MathOp": {
        const a = Number(this.resolveIn(graph, node, "a", ctx) ?? d.a ?? 0);
        const b = Number(this.resolveIn(graph, node, "b", ctx) ?? d.b ?? 0);
        const m: Record<string,number> = {"+":a+b,"-":a-b,"*":a*b,"/":b?a/b:0,"%":a%b};
        return m[String(d.op ?? "+")] ?? a;
      }
      case "Repeat": {
        const c = Number(d.count ?? 3);
        for (let i=0;i<c;i++) this.chain(graph, node, "body", {...ctx, i});
        return this.chain(graph, node, "done", ctx);
      }
      case "Wait": return this.chain(graph, node, "out", ctx);

      default: return this.chain(graph, node, "out", ctx);
    }
  }

  private chain(g: VSGraph, n: VSNode, portId: string, ctx: Record<string, unknown>): unknown {
    let last: unknown;
    for (const c of g.connections.filter(x => x.fromNodeId === n.id && x.fromPortId === portId)) {
      const next = g.nodes.find(x => x.id === c.toNodeId);
      if (next) last = this.executeFromNode(g, next, ctx);
    }
    return last;
  }

  private resolveIn(g: VSGraph, n: VSNode, portId: string, ctx: Record<string, unknown>): unknown {
    const c = g.connections.find(x => x.toNodeId === n.id && x.toPortId === portId);
    if (!c) return undefined;
    const src = g.nodes.find(x => x.id === c.fromNodeId);
    if (!src) return undefined;
    return this.executeFromNode(g, src, ctx);
  }

  // ─── physics ──────────────────────────────────────────────
  private updatePhysics(dt: number) {
    const G = (this.currentScene.gravity ?? 9.8) * 80;

    for (const obj of this.objects.values()) {
      if (!obj.active || !obj.body) continue;
      const b = obj.body;
      if (b.isStatic) continue;

      b.vy += G * b.gravityScale * dt;

      // Player controller
      const pc = obj.components["PlayerController"] as any;
      if (pc) {
        const spd = (pc.moveSpeed ?? 5) * 80;
        let mx = 0;
        if (this.keysDown.has(pc.inputMap?.left  || "ArrowLeft")  || this.keysDown.has("KeyA")) mx -= spd;
        if (this.keysDown.has(pc.inputMap?.right || "ArrowRight") || this.keysDown.has("KeyD")) mx += spd;
        b.vx = mx;
        const jumpKey = pc.inputMap?.jump || "Space";
        if ((this.keysDown.has(jumpKey) || this.keysDown.has("KeyW")) && b.onGround) {
          b.vy = -(pc.jumpForce ?? 10) * 80 * 0.55;
          b.onGround = false;
        }
      }

      // Enemy patrol
      const ai = obj.components["EnemyAI"] as any;
      if (ai) {
        const ud = obj.userData as any;
        if (ai.aiPattern === "patrol") {
          if (!ud.pDir) ud.pDir = 1; if (!ud.pStart) ud.pStart = obj.x;
          if (Math.abs(obj.x - ud.pStart) > 150) ud.pDir *= -1;
          b.vx = ud.pDir * (ai.moveSpeed ?? 2) * 32;
        } else if (ai.aiPattern === "chase") {
          const p = this.findByTag("Player");
          if (p) { const dx=p.x-obj.x; const s=(ai.moveSpeed??2)*32; b.vx=dx>0?s:dx<0?-s:0; }
        }
      }

      // Integrate
      b.x += b.vx * dt; b.y += b.vy * dt;

      // Bounds
      const sw = this.currentScene.width, sh = this.currentScene.height;
      if (b.x < 0) { b.x = 0; b.vx = 0; }
      if (b.x + b.w > sw) { b.x = sw - b.w; b.vx = 0; }
      if (b.y + b.h >= sh - 20) {
        b.y = sh - 20 - b.h; b.vy = b.vy > 0 ? -(b.vy * b.restitution) : 0;
        b.onGround = true; b.vx *= (1 - b.friction * dt * 10);
      } else { b.onGround = false; }

      obj.x = b.x; obj.y = b.y; obj.vx = b.vx; obj.vy = b.vy;
    }
  }

  // ─── collision ────────────────────────────────────────────
  private detectCollisions() {
    const list = [...this.objects.values()].filter(o => o.active && o.body);

    for (let i = 0; i < list.length; i++) {
      for (let j = i+1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!this.overlap(a, b)) continue;

        const key = `${a.id}:${b.id}`;
        const isTrig = a.body!.isTrigger || b.body!.isTrigger;

        if (!this.collisionPairs.has(key)) {
          this.collisionPairs.add(key);
          const evType = isTrig ? "OnTriggerEnter" : "OnCollisionEnter";
          this.queueEvent({ type: evType, sourceId: a.id, targetId: b.id });
          this.queueEvent({ type: evType, sourceId: b.id, targetId: a.id });

          // Collectible pickup
          if (a.type==="collectible"&&b.tag==="Player") { this.destroyObject(a.id); this.score+=10; this.callbacks.onScoreChange?.(this.score); }
          else if (b.type==="collectible"&&a.tag==="Player") { this.destroyObject(b.id); this.score+=10; this.callbacks.onScoreChange?.(this.score); }

          // Enemy damages player
          if (a.tag==="Enemy"&&b.tag==="Player") this.damageObject(b.id,5);
          else if (b.tag==="Enemy"&&a.tag==="Player") this.damageObject(a.id,5);

          // Goal
          if ((a.type==="goal"&&b.tag==="Player")||(b.type==="goal"&&a.tag==="Player")) {
            this.callbacks.onGameOver?.(true); this.stop();
          }
        }

        if (!isTrig) this.resolveCollision(a, b);
      }
    }

    for (const key of this.collisionPairs) {
      const [aId, bId] = key.split(":");
      const a = this.objects.get(aId), b = this.objects.get(bId);
      if (!a || !b || !this.overlap(a, b)) this.collisionPairs.delete(key);
    }
  }

  private overlap(a: RuntimeObject, b: RuntimeObject) {
    return a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;
  }

  private resolveCollision(a: RuntimeObject, b: RuntimeObject) {
    if (!a.body||!b.body||a.body.isStatic&&b.body.isStatic) return;
    const ox = Math.min(a.x+a.width-b.x, b.x+b.width-a.x);
    const oy = Math.min(a.y+a.height-b.y, b.y+b.height-a.y);
    if (ox < oy) {
      const d = a.x < b.x ? -1 : 1;
      if (!a.body.isStatic) { a.x += d*ox/2; a.body.x=a.x; a.body.vx=0; }
      if (!b.body.isStatic) { b.x -= d*ox/2; b.body.x=b.x; b.body.vx=0; }
    } else {
      if (a.y < b.y) {
        if (!a.body.isStatic) { a.y=b.y-a.height; a.body.y=a.y; a.body.onGround=true; a.body.vy=0; }
      } else {
        if (!b.body.isStatic) { b.y=a.y-b.height; b.body.y=b.y; b.body.onGround=true; b.body.vy=0; }
      }
    }
  }

  // ─── AI ───────────────────────────────────────────────────
  private updateAI() {
    for (const obj of this.objects.values()) {
      if (!obj.active) continue;
      const hs = obj.components["HealthSystem"] as any;
      if (hs && obj.health <= 0) {
        this.queueEvent({ type: "OnHealthZero", sourceId: obj.id });
        if (hs.deathAction === "destroy")  this.destroyObject(obj.id);
        else if (hs.deathAction === "gameOver") { this.callbacks.onGameOver?.(false); this.stop(); }
      }
    }
  }

  // ─── helpers ──────────────────────────────────────────────
  private findByTag(tag: string) {
    for (const o of this.objects.values()) if (o.active && o.tag===tag) return o;
    return null;
  }

  destroyObject(id: string) {
    if (this.objects.delete(id)) this.callbacks.onObjectDestroy?.(id);
  }

  damageObject(id: string, dmg: number) {
    const obj = this.objects.get(id); if (!obj) return;
    obj.health = Math.max(0, obj.health - dmg);
    this.callbacks.onHealthChange?.(id, obj.health, obj.maxHealth);
  }

  private notifyPositions() {
    for (const obj of this.objects.values())
      if (obj.active) this.callbacks.onObjectMove?.(obj.id, obj.x, obj.y, obj.vx, obj.vy);
  }

  // ─── public ───────────────────────────────────────────────
  getScore()  { return this.score; }
  getObject(id: string) { return this.objects.get(id) ?? null; }
  getAllObjects() { return [...this.objects.values()]; }
  getVariable(k: string) { return this.variables[k]; }
  isRunning() { return this.running; }
  getKeys()   { return this.keysDown; }
}
