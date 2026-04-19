"use client";
// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — 3D Canvas (Three.js) — Full Fix v5 (merged)
//  ✅ pendingDropRef في handleCanvasClick
//  ✅ كل objects بتظهر صح — obj.id كـ Map key
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/editorStore";
import type { GameObject } from "@/types/editor";
import { ASSET_LIBRARY } from "@/data/assets3d";

// ─────────────────────────────────────────────────────────
const CHAR_COLORS: Record<string, { body: number; head: number; accent: number }> = {
  hero_warrior:   { body: 0x7c3aed, head: 0xf5c99a, accent: 0xf59e0b },
  hero_mage:      { body: 0x1d4ed8, head: 0xf5c99a, accent: 0xc4b5fd },
  hero_archer:    { body: 0x15803d, head: 0xf5c99a, accent: 0x92400e },
  hero_ninja:     { body: 0x1c1917, head: 0x292524, accent: 0xef4444 },
  enemy_slime:    { body: 0x4ade80, head: 0x4ade80, accent: 0x166534 },
  enemy_skeleton: { body: 0xe5e7eb, head: 0xf3f4f6, accent: 0x1f2937 },
  boss_dragon:    { body: 0xdc2626, head: 0xb91c1c, accent: 0xfef08a },
  npc_merchant:   { body: 0xd97706, head: 0xf5c99a, accent: 0xf59e0b },
  npc_princess:   { body: 0xec4899, head: 0xfde8d8, accent: 0xf59e0b },
  fantasy_fairy:  { body: 0xa855f7, head: 0xfde8d8, accent: 0xfbbf24 },
  animal_fox:     { body: 0xea580c, head: 0xfda4af, accent: 0x1c1917 },
};
const OBJ_COLORS: Record<string, number> = {
  player: 0x7c3aed, enemy: 0xdc2626, platform: 0x2563eb,
  wall: 0x64748b, trigger: 0xf59e0b, collectible: 0x10b981,
  npc: 0x06b6d4, spawn: 0x84cc16, goal: 0xf97316,
  decoration: 0xa78bfa, text: 0xe2e8f0,
  camera: 0x6366f1, light: 0xfde68a, emptyObject: 0xaaaaaa,
};

// ─────────────────────────────────────────────────────────
//  3D BUILDERS
// ─────────────────────────────────────────────────────────
function buildHumanoid(spriteKey: string): THREE.Group {
  const c = CHAR_COLORS[spriteKey] || { body: 0x7c3aed, head: 0xf5c99a, accent: 0xffd700 };
  const g = new THREE.Group();
  const mat = (col: number) => new THREE.MeshLambertMaterial({ color: col });
  const leftLegPivot  = new THREE.Group(); leftLegPivot.position.set(-0.18, 0.6, 0);
  const rightLegPivot = new THREE.Group(); rightLegPivot.position.set( 0.18, 0.6, 0);
  g.add(leftLegPivot, rightLegPivot);
  for (const pivot of [leftLegPivot, rightLegPivot]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 6), mat(c.accent));
    leg.position.set(0, -0.3, 0); leg.castShadow = true; pivot.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), mat(0x111827));
    boot.position.set(0, -0.58, 0.04); pivot.add(boot);
  }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.64, 0.32), mat(c.body));
  torso.position.y = 0.92; torso.castShadow = true; g.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.34), mat(c.accent));
  belt.position.y = 0.66; g.add(belt);
  const leftArmPivot  = new THREE.Group(); leftArmPivot.position.set(-0.38, 1.14, 0);
  const rightArmPivot = new THREE.Group(); rightArmPivot.position.set( 0.38, 1.14, 0);
  g.add(leftArmPivot, rightArmPivot);
  for (const [pivot, sign] of [[leftArmPivot, -1], [rightArmPivot, 1]] as [THREE.Group, number][]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.52, 6), mat(c.body));
    arm.position.set(0, -0.26, 0); arm.rotation.z = sign < 0 ? 0.18 : -0.18; arm.castShadow = true; pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(c.head));
    hand.position.set(0, -0.52, 0); pivot.add(hand);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 6), mat(c.head));
  neck.position.y = 1.3; g.add(neck);
  const headPivot = new THREE.Group(); headPivot.position.set(0, 1.59, 0); g.add(headPivot);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.38), mat(c.head));
  head.castShadow = true; headPivot.add(head);
  for (const x of [-0.1, 0.1]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), mat(0xffffff));
    ew.position.set(x, 0.03, 0.2); headPivot.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat(0x111827));
    ep.position.set(x, 0.03, 0.23); headPivot.add(ep);
  }
  (g as any)._bones = { leftLeg: leftLegPivot, rightLeg: rightLegPivot, leftArm: leftArmPivot, rightArm: rightArmPivot, torso, head: headPivot };
  return g;
}

function animateCharacter(group: THREE.Group, t: number, isMoving = false) {
  const b = (group as any)._bones;
  if (!b) return;
  const spd = isMoving ? 6.0 : 1.4;
  const amp = isMoving ? 0.52 : 0.07;
  const s = Math.sin(t * spd);
  b.leftLeg.rotation.x  =  s * amp;
  b.rightLeg.rotation.x = -s * amp;
  b.leftArm.rotation.x  = -s * amp * 0.65;
  b.rightArm.rotation.x =  s * amp * 0.65;
  b.torso.position.y    = 0.92 + (isMoving ? Math.abs(s) * 0.04 : 0);
  b.head.rotation.y     = Math.sin(t * (isMoving ? spd * 0.5 : 0.7)) * (isMoving ? 0.08 : 0.14);
}

function addHeadgear(g: THREE.Group, spriteKey: string) {
  const mat = (col: number) => new THREE.MeshLambertMaterial({ color: col });
  if (spriteKey === "hero_mage") {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 8), mat(0x1e3a8a));
    brim.position.y = 1.85; g.add(brim);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.7, 7), mat(0x1e3a8a));
    cone.position.y = 2.22; g.add(cone);
  } else if (spriteKey === "hero_warrior") {
    const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.3, 8), mat(0x5b21b6));
    helm.position.y = 1.88; g.add(helm);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.04), mat(0x4c1d95));
    visor.position.set(0, 1.82, 0.22); g.add(visor);
  } else if (spriteKey === "hero_ninja") {
    const mask = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.4), mat(0x1c1917));
    mask.position.set(0, 1.56, 0.01); g.add(mask);
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.4), mat(0xef4444));
    band.position.y = 1.82; g.add(band);
  } else if (spriteKey === "npc_princess") {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 8), mat(0xf59e0b));
    base.position.y = 1.88; g.add(base);
    for (let i = 0; i < 5; i++) {
      const pt = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), mat(0xfbbf24));
      pt.position.set(Math.sin(i * 1.26) * 0.2, 2.06, Math.cos(i * 1.26) * 0.2); g.add(pt);
    }
  } else if (spriteKey === "npc_merchant") {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 8), mat(0x78350f));
    brim.position.y = 1.85; g.add(brim);
    const top2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.38, 8), mat(0x92400e));
    top2.position.y = 2.1; g.add(top2);
  } else if (spriteKey === "fantasy_fairy") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), mat(0xfbbf24));
    hair.position.set(0, 1.84, 0); hair.scale.set(1, 0.55, 1); g.add(hair);
    const wMat = new THREE.MeshLambertMaterial({ color: 0xc4b5fd, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    for (const side of [-1, 1]) {
      const wg = new THREE.BufferGeometry();
      const v = new Float32Array([0,0,0, side*1.3,0.6,-0.1, side*0.7,-0.45,-0.1]);
      wg.setAttribute("position", new THREE.BufferAttribute(v, 3));
      wg.setIndex([0,1,2]); wg.computeVertexNormals();
      const wing = new THREE.Mesh(wg, wMat);
      wing.position.set(0, 1.1, -0.15); g.add(wing);
    }
  } else {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.16, 0.4), new THREE.MeshLambertMaterial({ color: spriteKey === "animal_fox" ? 0xea580c : 0x1c1917 }));
    hair.position.y = 1.87; g.add(hair);
  }
}

function addWeapon(g: THREE.Group, spriteKey: string) {
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  if (spriteKey === "hero_warrior") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.9, 0.05), mat(0xd1d5db));
    blade.position.set(0.56, 1.05, 0.05); g.add(blade);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.07), mat(0xf59e0b));
    guard.position.set(0.56, 0.72, 0.05); g.add(guard);
  } else if (spriteKey === "hero_mage") {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), mat(0x92400e));
    staff.position.set(-0.56, 0.9, 0); g.add(staff);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x7c3aed, emissive: 0x3b0764, emissiveIntensity: 0.6 }));
    orb.position.set(-0.56, 1.72, 0); g.add(orb);
  } else if (spriteKey === "hero_archer") {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 6, 14, Math.PI), mat(0x92400e));
    bow.position.set(-0.58, 1.0, 0); bow.rotation.z = Math.PI / 2; g.add(bow);
  } else if (spriteKey === "hero_ninja") {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.1, 0.04), mat(0xd1d5db));
    k.position.set(0.56, 1.05, 0); k.rotation.z = 0.18; g.add(k);
  }
}

function buildSlime(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.52, 10, 7), mat(0x4ade80));
  body.scale.y = 0.68; body.position.y = 0.36; body.castShadow = true; g.add(body);
  for (const x of [-0.19, 0.19]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(0xffffff));
    ew.position.set(x, 0.55, 0.38); g.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat(0x166534));
    ep.position.set(x, 0.55, 0.46); g.add(ep);
  }
  return g;
}

function buildSkeleton(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), mat(0xf3f4f6));
  skull.position.y = 1.58; skull.castShadow = true; g.add(skull);
  for (const x of [-0.1, 0.1]) {
    const sock = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), mat(0x1f2937));
    sock.position.set(x, 1.62, 0.22); g.add(sock);
  }
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), mat(0xe5e7eb));
    v.position.y = 0.6 + i * 0.22; g.add(v);
  }
  for (const side of [-1, 1]) {
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 5, 10, Math.PI), mat(0xd1d5db));
      rib.position.set(0, 0.9 + r * 0.18, 0); rib.rotation.z = side * 0.6; g.add(rib);
    }
  }
  for (const x of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.6, 5), mat(0xe5e7eb));
    leg.position.set(x, 0.3, 0); leg.castShadow = true; g.add(leg);
  }
  for (const x of [-0.38, 0.38]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), mat(0xe5e7eb));
    arm.position.set(x, 0.9, 0); arm.rotation.z = x < 0 ? 0.3 : -0.3; g.add(arm);
  }
  return g;
}

function buildDragon(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.3, 8), mat(0xdc2626));
  body.position.y = 0.9; body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.7, 7), mat(0xdc2626));
  neck.position.set(0, 1.75, 0.2); neck.rotation.x = -0.4; g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.95), mat(0xb91c1c));
  head.position.set(0, 2.2, 0.45); g.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.55), mat(0xef4444));
  snout.position.set(0, 2.05, 0.88); g.add(snout);
  for (const x of [-0.24, 0.24]) {
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(0xfef08a));
    ey.position.set(x, 2.3, 0.7); g.add(ey);
  }
  for (const x of [-0.28, 0.28]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 5), mat(0x7f1d1d));
    horn.position.set(x, 2.6, 0.3); horn.rotation.z = x < 0 ? -0.3 : 0.3; g.add(horn);
  }
  const wMat = new THREE.MeshLambertMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const wg = new THREE.BufferGeometry();
    const v = new Float32Array([0,0,0, side*2.0,0.8,-0.3, side*1.2,-0.6,-0.3, side*0.4,0,-0.1]);
    wg.setAttribute("position", new THREE.BufferAttribute(v, 3));
    wg.setIndex([0,1,2, 0,2,3]); wg.computeVertexNormals();
    const wing = new THREE.Mesh(wg, wMat); wing.position.set(0, 1.4, -0.2); g.add(wing);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.4, 7), mat(0xdc2626));
  tail.position.set(0, 0.7, -1.0); tail.rotation.x = -1.0; g.add(tail);
  for (const x of [-0.38, 0.38]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.75, 6), mat(0xb91c1c));
    leg.position.set(x, 0.3, 0); g.add(leg);
  }
  return g;
}

// ─────────────────────────────────────────────────────────
//  buildObject3D — يبني mesh لكل نوع object
// ─────────────────────────────────────────────────────────
function buildObject3D(obj: GameObject): THREE.Object3D {
  const spriteKey: string = (obj as any).spriteKey || "";
  const assetScale: number = (obj as any).assetScale ?? 1;

  const assetDef = ASSET_LIBRARY.find(a => a.id === spriteKey);
  if (assetDef) {
    const group = assetDef.build();
    group.scale.setScalar(assetScale);
    return group;
  }

  if (spriteKey === "enemy_slime")    return buildSlime();
  if (spriteKey === "enemy_skeleton") return buildSkeleton();
  if (spriteKey === "boss_dragon")    return buildDragon();

  if ((spriteKey && CHAR_COLORS[spriteKey]) ||
      (!spriteKey && (obj.type === "player" || obj.type === "enemy" || obj.type === "npc"))) {
    const key = spriteKey || (obj.type === "enemy" ? "enemy_slime" : obj.type === "npc" ? "npc_merchant" : "hero_warrior");
    const group = buildHumanoid(key);
    addHeadgear(group, key);
    addWeapon(group, key);
    return group;
  }

  if (obj.type === "platform") {
    const w = Math.max(1.0, obj.width / 60);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.8), new THREE.MeshLambertMaterial({ color: 0x2563eb }));
    mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
  }
  if (obj.type === "wall") {
    const w = Math.max(0.4, obj.width / 60), h = Math.max(1.0, obj.height / 60);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), new THREE.MeshLambertMaterial({ color: 0x64748b }));
    mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
  }
  if (obj.type === "collectible") {
    const grp = new THREE.Group();
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.7 }));
    star.rotation.y = Math.PI / 4;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), new THREE.MeshLambertMaterial({ color: 0xfde68a, transparent: true, opacity: 0.2 }));
    grp.add(star, glow); return grp;
  }
  if (obj.type === "spawn") {
    const grp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
    pole.position.y = 1.0; grp.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.06), new THREE.MeshLambertMaterial({ color: 0x84cc16 }));
    flag.position.set(0.35, 1.85, 0); grp.add(flag); return grp;
  }
  if (obj.type === "goal") {
    const grp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 6), new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
    pole.position.y = 1.0; grp.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.06), new THREE.MeshLambertMaterial({ color: 0xf97316 }));
    flag.position.set(0.35, 1.85, 0); grp.add(flag);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.5 }));
    star.position.y = 2.3; grp.add(star); return grp;
  }
  if (obj.type === "trigger") {
    const w = Math.max(1.0, obj.width / 60), h = Math.max(1.0, obj.height / 60);
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.15), new THREE.MeshLambertMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 }));
  }
  if (obj.type === "decoration") {
    const s = Math.max(0.5, Math.min(obj.width, obj.height) / 60);
    const grp = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), new THREE.MeshLambertMaterial({ color: 0xa78bfa }));
    box.castShadow = true; grp.add(box);
    const wire = new THREE.Mesh(new THREE.BoxGeometry(s+0.04, s+0.04, s+0.04), new THREE.MeshLambertMaterial({ color: 0x7c3aed, wireframe: true }));
    grp.add(wire); return grp;
  }
  if (obj.type === "text") {
    const w = Math.max(1.0, obj.width / 60);
    return new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, 0.08), new THREE.MeshLambertMaterial({ color: 0xe2e8f0, emissive: 0x94a3b8, emissiveIntensity: 0.3 }));
  }
  if (obj.type === "camera") {
    const grp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.4), new THREE.MeshLambertMaterial({ color: 0x1e293b }));
    body.castShadow = true; grp.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.35, 12), new THREE.MeshLambertMaterial({ color: 0x0f172a }));
    lens.rotation.x = Math.PI/2; lens.position.z = 0.32; grp.add(lens);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 8, 16), new THREE.MeshLambertMaterial({ color: 0x6366f1, emissive: 0x6366f1, emissiveIntensity: 0.4 }));
    ring.rotation.x = Math.PI/2; ring.position.z = 0.36; grp.add(ring); return grp;
  }
  if (obj.type === "light") {
    const grp = new THREE.Group();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshLambertMaterial({ color: 0xfde68a, emissive: 0xfde68a, emissiveIntensity: 0.8 }));
    grp.add(bulb);
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), new THREE.MeshLambertMaterial({ color: 0xfde68a, emissive: 0xfbbf24, emissiveIntensity: 0.6, transparent: true, opacity: 0.6 }));
      ray.rotation.z = (i / 8) * Math.PI * 2;
      ray.position.set(Math.sin((i/8)*Math.PI*2)*0.5, Math.cos((i/8)*Math.PI*2)*0.5, 0);
      grp.add(ray);
    }
    return grp;
  }
  if (obj.type === "emptyObject") {
    const grp = new THREE.Group();
    const colors = [0xef4444, 0x22c55e, 0x3b82f6];
    const dirs   = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,1)];
    for (let i = 0; i < 3; i++) {
      const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), new THREE.MeshLambertMaterial({ color: colors[i] }));
      arrow.position.copy(dirs[i].clone().multiplyScalar(0.4));
      if (i === 0) arrow.rotation.z = Math.PI/2;
      if (i === 2) arrow.rotation.x = Math.PI/2;
      grp.add(arrow);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    grp.add(center); return grp;
  }

  const size = Math.max(0.8, Math.min(obj.width || 96, obj.height || 96) / 60);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type] || 0x7c3aed }));
  mesh.castShadow = true;
  return mesh;
}

// ─────────────────────────────────────────────────────────
//  ENVIRONMENT
// ─────────────────────────────────────────────────────────
function buildSky(scene: THREE.Scene) {
  const skyGeo = new THREE.SphereGeometry(90, 16, 10);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `varying vec3 vPos; void main(){vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 vPos; void main(){float t=clamp((vPos.y+20.)/80.,0.,1.);vec3 top=vec3(0.02,0.04,0.18);vec3 mid=vec3(0.05,0.18,0.45);vec3 hor=vec3(0.55,0.78,0.95);vec3 col=t>0.5?mix(mid,top,(t-0.5)*2.):mix(hor,mid,t*2.);gl_FragColor=vec4(col,1.);}`,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));
  const starVerts: number[] = [];
  for (let i = 0; i < 600; i++) {
    const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI * 0.5, r = 75 + Math.random() * 10;
    starVerts.push(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22 })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfef9c3 }));
  moon.position.set(-30, 45, -60); scene.add(moon);
}

function buildEnvironment(scene: THREE.Scene) {
  const groundGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    if (Math.abs(x) > 8 || z < -3) pos.setY(i, Math.sin(x * 0.3) * 0.3 + Math.cos(z * 0.4) * 0.2);
  }
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ color: 0x3d7a2e }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const dirt = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 14), new THREE.MeshLambertMaterial({ color: 0x8B5E3C }));
  dirt.position.set(0, -0.16, 0); scene.add(dirt);
  const grass = new THREE.Mesh(new THREE.BoxGeometry(30, 0.12, 14), new THREE.MeshLambertMaterial({ color: 0x5cb85c }));
  grass.position.set(0, 0.06, 0); scene.add(grass);
  for (const m of [{x:-25,z:-18,h:14,r:7},{x:-15,z:-22,h:18,r:9},{x:0,z:-25,h:22,r:11},{x:16,z:-21,h:16,r:8},{x:28,z:-17,h:12,r:6}]) {
    const mc = new THREE.Mesh(new THREE.ConeGeometry(m.r, m.h, 7), new THREE.MeshLambertMaterial({ color: 0x2d4a6e }));
    mc.position.set(m.x, m.h/2-0.5, m.z); scene.add(mc);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(m.r*0.35, m.h*0.28, 7), new THREE.MeshLambertMaterial({ color: 0xf0f9ff }));
    snow.position.set(m.x, m.h*0.87, m.z); scene.add(snow);
  }
  for (const x of [-14,-11,-9,10,12,15]) {
    addTree(scene, x, -3+Math.random()*2-1);
    if (Math.abs(x)>10) addTree(scene, x+(Math.random()-0.5)*2, -5+Math.random()*2);
  }
  for (let i=0;i<8;i++) addCloud(scene,-30+Math.random()*60, 12+Math.random()*10, -10-Math.random()*20);
}

function addTree(scene: THREE.Scene, x: number, z: number) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6), new THREE.MeshLambertMaterial({ color: 0x5c3d1e }));
  trunk.position.set(x, 0.6, z); trunk.castShadow = true; scene.add(trunk);
  for (let i=0;i<3;i++) {
    const tier = new THREE.Mesh(new THREE.ConeGeometry(1.1-i*0.2, 1.2, 7), new THREE.MeshLambertMaterial({ color: 0x2d6b26+i*0x051000 }));
    tier.position.set(x, 1.4+i*0.8, z); tier.castShadow = true; scene.add(tier);
  }
}

function addCloud(scene: THREE.Scene, x: number, y: number, z: number) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
  for (const [dx,dy,,r] of [[0,0,0,1.2],[-1.2,0.1,0,0.9],[1.1,-0.1,0,0.95],[0.3,0.5,0,0.7],[-0.5,0.4,0,0.75]] as [number,number,number,number][]) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mat);
    blob.position.set(x+dx, y+dy, z); scene.add(blob);
  }
}

function addSelectionRing(obj3d: THREE.Object3D): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.02; ring.visible = false;
  obj3d.add(ring); return ring;
}

// ─────────────────────────────────────────────────────────
//  إحداثيات: editor pixels → 3D world
// ─────────────────────────────────────────────────────────
function worldX(obj: GameObject) { return (obj.x - 960) / 80; }

function worldY(obj: GameObject) {
  const base = (1080 - obj.y) / 80 - 5.5;
  switch (obj.type) {
    case "platform":    return base + 0.15;
    case "wall":        return base + (Math.max(1.0, obj.height/60) / 2);
    case "trigger":     return base + (Math.max(1.0, obj.height/60) / 2);
    case "text":        return base + 0.25;
    case "collectible": return base + 1.5;
    case "spawn":
    case "goal":        return base + 0.0;
    default:            return base + 1.0;
  }
}

interface PlayState {
  pos: THREE.Vector3; vel: THREE.Vector3;
  yaw: number; pitch: number; onGround: boolean;
  viewMode: "third" | "first";
}

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
export default function Canvas3D() {
  const mountRef       = useRef<HTMLDivElement>(null);
  const sceneRef       = useRef<THREE.Scene | null>(null);
  const camRef         = useRef<THREE.PerspectiveCamera | null>(null);
  const rendRef        = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef       = useRef<number>(0);
  // ✅ KEY FIX: Map يستخدم obj.id كـ key — مش type
  const objMapRef      = useRef<Map<string, THREE.Object3D>>(new Map());
  const isDragging     = useRef(false);
  const lastMouse      = useRef({ x: 0, y: 0, btn: 0 });
  const mouseDownPos   = useRef({ x: 0, y: 0 });
  const camState       = useRef({ theta: 0.5, phi: 1.05, radius: 16, tx: 0, ty: 1, tz: 0 });
  const playRef        = useRef<PlayState>({ pos: new THREE.Vector3(0,1.5,5), vel: new THREE.Vector3(), yaw:0, pitch:0, onGround:false, viewMode:"third" });
  const playerMeshRef  = useRef<THREE.Group | null>(null);
  const keysRef        = useRef<Record<string,boolean>>({});
  const isPlayingRef   = useRef(false);
  const pendingDropRef = useRef<any>(null);
  const raycaster      = useRef(new THREE.Raycaster());
  const groundPlane    = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));
  const [playHUD, setPlayHUD] = React.useState({ viewMode: "third" });

  const store = useEditorStore();
  isPlayingRef.current = store.ui.isPlaying;

  function updateCamera() {
    const cam = camRef.current; if (!cam) return;
    const { theta, phi, radius, tx, ty, tz } = camState.current;
    cam.position.set(tx + radius*Math.sin(phi)*Math.sin(theta), ty + radius*Math.cos(phi), tz + radius*Math.sin(phi)*Math.cos(theta));
    cam.lookAt(tx, ty, tz);
  }

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const W = mount.clientWidth || 800, H = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1e);
    scene.fog = new THREE.Fog(0x0a0f1e, 40, 90);
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(52, W/Math.max(H,1), 0.1, 200);
    camRef.current = cam;
    updateCamera();

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch { console.error("WebGL not supported"); return; }
    renderer.setSize(W, Math.max(H,1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block;";
    mount.appendChild(renderer.domElement);
    rendRef.current = renderer;

    scene.add(new THREE.AmbientLight(0x445577, 0.7));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(10, 20, 8); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left:-22, right:22, top:22, bottom:-22, near:0.5, far:60 });
    scene.add(sun);
    scene.add(Object.assign(new THREE.DirectionalLight(0x4488ff, 0.35), { position: new THREE.Vector3(-8,6,-8) }));

    buildSky(scene);
    buildEnvironment(scene);

    let t = 0;
    const GRAVITY = -18;

    // ════════════════════════════════════════════════════
    //  ✅ FIXED syncObjects — obj.id كـ Map key
    // ════════════════════════════════════════════════════
    function syncObjects() {
      const storeState = useEditorStore.getState();
      const activeScene = storeState.getActiveScene();
      const objects = activeScene?.objects ?? [];
      const selectedId = storeState.ui.selectedObjectId;

      const currentIds = new Set(objects.map((o: GameObject) => o.id));
      objMapRef.current.forEach((_mesh, id) => {
        if (!currentIds.has(id)) { scene.remove(_mesh); objMapRef.current.delete(id); }
      });

      const posCount: Record<string, number> = {};

      for (const obj of objects) {
        const spriteKey  = (obj as any).spriteKey  || "";
        const assetScale = (obj as any).assetScale ?? 1;
        const cacheKey   = `${obj.type}__${spriteKey}__${assetScale}`;
        const existing   = objMapRef.current.get(obj.id);
        const existingKey = (existing as any)?._cacheKey ?? "";
        const wx = worldX(obj), wy = worldY(obj);
        const posKey = `${Math.round(wx * 10)}_${Math.round(wy * 10)}`;
        posCount[posKey] = (posCount[posKey] || 0) + 1;
        const zOff = (posCount[posKey] - 1) * 0.5;

        if (!existing || existingKey !== cacheKey) {
          if (existing) scene.remove(existing);
          let obj3d: THREE.Object3D;
          try { obj3d = buildObject3D(obj); }
          catch (e) { console.error("[Canvas3D] buildObject3D failed:", obj.name, obj.type, e); continue; }
          obj3d.position.set(wx, wy, zOff);
          obj3d.castShadow = true;
          (obj3d as any)._selRing  = addSelectionRing(obj3d);
          (obj3d as any)._cacheKey = cacheKey;
          scene.add(obj3d);
          objMapRef.current.set(obj.id, obj3d);
        } else {
          if (obj.type !== "collectible") existing.position.set(wx, wy, zOff);
          const ring = (existing as any)._selRing as THREE.Mesh | undefined;
          if (ring) ring.visible = selectedId === obj.id;
        }
      }
    }

    function updatePlayMode(dt: number) {
      const ps = playRef.current, cam2 = camRef.current; if (!cam2) return;
      const keys = keysRef.current;
      const sinY = Math.sin(ps.yaw), cosY = Math.cos(ps.yaw);
      let mx = 0, mz = 0;
      if (keys["KeyW"]||keys["ArrowUp"])    { mx+=sinY; mz+=cosY; }
      if (keys["KeyS"]||keys["ArrowDown"])  { mx-=sinY; mz-=cosY; }
      if (keys["KeyA"]||keys["ArrowLeft"])  { mx+=cosY; mz-=sinY; }
      if (keys["KeyD"]||keys["ArrowRight"]) { mx-=cosY; mz+=sinY; }
      const len=Math.sqrt(mx*mx+mz*mz); if(len>0){mx/=len;mz/=len;}
      ps.vel.x=mx*6; ps.vel.z=mz*6;
      if(!ps.onGround) ps.vel.y+=GRAVITY*dt;
      if((keys["Space"]||keys["KeyQ"])&&ps.onGround){ ps.vel.y=8; ps.onGround=false; }
      ps.pos.x+=ps.vel.x*dt; ps.pos.y+=ps.vel.y*dt; ps.pos.z+=ps.vel.z*dt;
      if(ps.pos.y<=1.0){ ps.pos.y=1.0; ps.vel.y=0; ps.onGround=true; } else ps.onGround=false;
      if(playerMeshRef.current){ playerMeshRef.current.position.copy(ps.pos); playerMeshRef.current.position.y-=1.0; playerMeshRef.current.rotation.y=ps.yaw+Math.PI; }
      if(ps.viewMode==="first"){
        cam2.position.set(ps.pos.x, ps.pos.y+0.3, ps.pos.z);
        cam2.rotation.order="YXZ"; cam2.rotation.y=ps.yaw; cam2.rotation.x=ps.pitch;
      } else {
        const tx2=ps.pos.x-Math.sin(ps.yaw)*5, ty2=ps.pos.y+2.5, tz2=ps.pos.z-Math.cos(ps.yaw)*5;
        cam2.position.lerp(new THREE.Vector3(tx2,ty2,tz2), 0.12);
        cam2.lookAt(new THREE.Vector3(ps.pos.x, ps.pos.y+1, ps.pos.z));
      }
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;
      syncObjects();
      if (isPlayingRef.current) updatePlayMode(0.016);
      objMapRef.current.forEach((obj3d, id) => {
        const obj = useEditorStore.getState().getActiveScene()?.objects.find((o: GameObject) => o.id === id);
        if (!obj) return;
        if (obj.type === "collectible") { obj3d.rotation.y = t * 1.8; obj3d.position.y = worldY(obj) + 0.3 + Math.sin(t*2)*0.18; }
        if ((obj3d as any)._bones) animateCharacter(obj3d as THREE.Group, t, false);
        if (obj.type === "light") obj3d.rotation.y = t * 0.8;
      });
      if (isPlayingRef.current && playerMeshRef.current) {
        const ps = playRef.current;
        const moving = Math.abs(ps.vel.x)>0.2||Math.abs(ps.vel.z)>0.2;
        animateCharacter(playerMeshRef.current as THREE.Group, t, moving);
      }
      renderer.render(scene, cam);
    }
    animate();

    const onResize = () => {
      const w=mount.clientWidth||800, h=mount.clientHeight||600;
      cam.aspect=w/Math.max(h,1); cam.updateProjectionMatrix();
      renderer.setSize(w, Math.max(h,1));
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // Play Mode
  const isPlayMode = store.ui.isPlaying;
  useEffect(() => {
    const scene = sceneRef.current; if (!scene) return;
    if (!isPlayMode) return;
    const activeScene = store.getActiveScene();
    const spawnObj = activeScene?.objects.find(o => o.type === "spawn");
    if (spawnObj) playRef.current.pos.set(worldX(spawnObj), worldY(spawnObj)+0.5, 0);
    else          playRef.current.pos.set(0, 2, 5);
    playRef.current.vel.set(0,0,0); playRef.current.yaw=0; playRef.current.pitch=0;
    const playerGroup = buildHumanoid("hero_warrior");
    addHeadgear(playerGroup, "hero_warrior");
    addWeapon(playerGroup, "hero_warrior");
    playerGroup.position.copy(playRef.current.pos);
    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (e.code === "KeyV") {
        playRef.current.viewMode = playRef.current.viewMode === "third" ? "first" : "third";
        setPlayHUD({ viewMode: playRef.current.viewMode });
        if (playerMeshRef.current) playerMeshRef.current.visible = playRef.current.viewMode === "third";
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup",   onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup",   onKeyUp);
      if (playerMeshRef.current) { scene.remove(playerMeshRef.current); playerMeshRef.current = null; }
      keysRef.current = {};
    };
  }, [isPlayMode]);

  // ─── تحويل نقطة الكليك على الـ canvas لإحداثيات editor ───
  function canvasPointToEditorXY(clientX: number, clientY: number): { x: number; y: number } | null {
    const mount = mountRef.current, cam = camRef.current;
    if (!mount || !cam) return null;
    const canvas = mount.querySelector("canvas") || mount;
    const rect = canvas.getBoundingClientRect();
    const ndcX =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    const ndcY = -((clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const target = new THREE.Vector3();
    if (!raycaster.current.ray.intersectPlane(groundPlane.current, target)) return null;
    const edX = Math.round(target.x * 80 + 960);
    const edY = Math.round(1080 - (target.y + 5.5) * 80);
    return { x: edX, y: edY };
  }

  function handleCanvasClick(clientX: number, clientY: number) {
    const pos = canvasPointToEditorXY(clientX, clientY);
    if (!pos) return;
    const { activeTool } = store.ui;

    if (activeTool === "add") {
      const pending = pendingDropRef.current;
      if (pending) {
        store.addObject({ ...pending, x: pos.x, y: pos.y });
        pendingDropRef.current = null;
      } else {
        store.addObjectOfType("platform", pos);
      }
      return;
    }

    if (activeTool === "select") {
      const scene = store.getActiveScene();
      if (!scene) return;
      let closest: string | null = null;
      let minDist = Infinity;
      for (const obj of scene.objects) {
        const wx = (obj.x - 960) / 80, wy = (1080 - obj.y) / 80 - 5.5;
        const tx = (pos.x - 960) / 80, ty = (1080 - pos.y) / 80 - 5.5;
        const dist = Math.sqrt((wx - tx) ** 2 + (wy - ty) ** 2);
        if (dist < 1.5 && dist < minDist) { minDist = dist; closest = obj.id; }
      }
      store.selectObject(closest);
    }
  }

  function onMouseDown(e: React.MouseEvent) {
    if (isPlayMode) { mountRef.current?.requestPointerLock?.(); return; }
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: e.button };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (isPlayMode || !isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x, dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: lastMouse.current.btn };
    if (lastMouse.current.btn === 0 && store.ui.activeTool !== "add") {
      camState.current.theta -= dx * 0.008;
      camState.current.phi = Math.max(0.15, Math.min(1.5, camState.current.phi + dy * 0.008));
    } else if (lastMouse.current.btn === 2) {
      camState.current.tx -= dx * 0.04;
      camState.current.tz += dy * 0.04;
    }
    updateCamera();
  }
  function onMouseUp(e: React.MouseEvent) {
    if (isPlayMode) return;
    isDragging.current = false;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    if (dx < 6 && dy < 6 && e.button === 0) handleCanvasClick(e.clientX, e.clientY);
  }
  function onWheel(e: React.WheelEvent) {
    if (isPlayMode) return;
    camState.current.radius = Math.max(3, Math.min(40, camState.current.radius + e.deltaY * 0.02));
    updateCamera();
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault(); e.dataTransfer.dropEffect = "copy";
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const pos = canvasPointToEditorXY(e.clientX, e.clientY);
    if (!pos) return;
    try {
      const raw = e.dataTransfer.getData("application/x-editor-object");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.type) return;
      if (data.spriteKey) {
        store.addObject({
          id: `obj_${Date.now()}`, name: data.name || data.type,
          tag: data.tag || "Untagged", layer: 0, active: true, isStatic: false,
          parentId: null, childIds: [], type: data.type,
          x: pos.x, y: pos.y, width: data.width || 96, height: data.height || 96,
          rotation: 0, visible: true, locked: false,
          color: { r: 124, g: 58, b: 237, a: 1 }, tags: [], components: [],
          spriteKey: data.spriteKey,
        } as any);
      } else {
        store.addObjectOfType(data.type, pos);
      }
    } catch {/* ignore */}
  }

  const cursor = isPlayMode ? "none"
    : store.ui.activeTool === "add" ? "crosshair"
    : store.ui.activeTool === "move" ? "move" : "grab";

  return (
    <div
      ref={mountRef}
      style={{ flex:1, position:"relative", overflow:"hidden", cursor, minHeight:0, height:"100%", width:"100%" }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onMouseLeave={() => { if (!isPlayMode) isDragging.current = false; }}
      onWheel={onWheel} onContextMenu={e => e.preventDefault()}
      onDragOver={onDragOver} onDrop={onDrop}
    >
      {!isPlayMode && (
        <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)",
          background:"rgba(7,9,15,0.82)", backdropFilter:"blur(8px)",
          borderRadius:20, padding:"5px 16px", fontSize:11,
          color:"rgba(255,255,255,0.42)", pointerEvents:"none",
          fontFamily:"var(--font-cairo)", whiteSpace:"nowrap",
          border:"1px solid rgba(255,255,255,0.07)" }}>
          {store.ui.activeTool === "add"
            ? "🖱️ كليك أو اسحب كائن هنا"
            : "يسار: تدوير • يمين: تحريك • عجلة: zoom • كليك: تحديد"}
        </div>
      )}
      {isPlayMode && (
        <>
          <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)",
            background:"rgba(7,9,15,0.82)", backdropFilter:"blur(8px)",
            borderRadius:24, padding:"6px 20px", fontSize:11, color:"#a5b4fc",
            pointerEvents:"none", fontFamily:"var(--font-cairo)", display:"flex", gap:16,
            border:"1px solid rgba(124,58,237,0.3)" }}>
            <span>WASD حركة</span><span>Space قفز</span>
            <span>V كاميرا ({playHUD.viewMode==="first"?"FPS":"TPS"})</span>
          </div>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <line x1="10" y1="2" x2="10" y2="18" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
              <line x1="2" y1="10" x2="18" y2="10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="2" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5"/>
            </svg>
          </div>
          <button onClick={() => store.setPlaying(false)}
            style={{ position:"absolute", top:12, right:12,
              background:"rgba(239,68,68,0.9)", border:"none", borderRadius:10,
              color:"#fff", padding:"6px 14px", fontSize:11, cursor:"pointer",
              fontFamily:"var(--font-cairo)", fontWeight:700 }}>
            ⏹ خروج
          </button>
        </>
      )}
    </div>
  );
}
