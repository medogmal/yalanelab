"use client";
// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — 3D Canvas (Three.js)
//  عالم 3D حقيقي مع شخصيات Low-Poly
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/editorStore";
import type { GameObject, ObjectType } from "@/types/editor";
import { ASSET_LIBRARY } from "@/data/assets3d";

// ── ألوان الشخصيات ──────────────────────────────────────────
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
};

// ── بناء شخصية Humanoid 3D ────────────────────────────────
function buildHumanoid(spriteKey: string): THREE.Group {
  const c = CHAR_COLORS[spriteKey] || { body: 0x7c3aed, head: 0xf5c99a, accent: 0xffd700 };
  const g = new THREE.Group();
  const mat = (col: number) => new THREE.MeshLambertMaterial({ color: col });

  // ── Leg pivots (hip as rotation origin) ──────────────────
  const leftLegPivot  = new THREE.Group(); leftLegPivot.position.set(-0.18, 0.6, 0);
  const rightLegPivot = new THREE.Group(); rightLegPivot.position.set( 0.18, 0.6, 0);
  g.add(leftLegPivot, rightLegPivot);
  for (const pivot of [leftLegPivot, rightLegPivot]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 6), mat(c.accent));
    leg.position.set(0, -0.3, 0); leg.castShadow = true; pivot.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), mat(0x111827));
    boot.position.set(0, -0.58, 0.04); pivot.add(boot);
  }
  // Torso + Belt
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.64, 0.32), mat(c.body));
  torso.position.y = 0.92; torso.castShadow = true; g.add(torso);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.34), mat(c.accent));
  belt.position.y = 0.66; g.add(belt);
  // ── Arm pivots (shoulder as rotation origin) ───────────────
  const leftArmPivot  = new THREE.Group(); leftArmPivot.position.set(-0.38, 1.14, 0);
  const rightArmPivot = new THREE.Group(); rightArmPivot.position.set( 0.38, 1.14, 0);
  g.add(leftArmPivot, rightArmPivot);
  for (const [pivot, sign] of [[leftArmPivot, -1], [rightArmPivot, 1]] as [THREE.Group, number][]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.52, 6), mat(c.body));
    arm.position.set(0, -0.26, 0); arm.rotation.z = sign < 0 ? 0.18 : -0.18; arm.castShadow = true; pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(c.head));
    hand.position.set(0, -0.52, 0); pivot.add(hand);
  }
  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 6), mat(c.head));
  neck.position.y = 1.3; g.add(neck);
  // ── Head pivot ─────────────────────────────────────────────
  const headPivot = new THREE.Group(); headPivot.position.set(0, 1.59, 0); g.add(headPivot);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.38), mat(c.head));
  head.castShadow = true; headPivot.add(head);
  for (const x of [-0.1, 0.1]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), mat(0xffffff));
    ew.position.set(x, 0.03, 0.2); headPivot.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat(0x111827));
    ep.position.set(x, 0.03, 0.23); headPivot.add(ep);
  }
  // Store bones for animation
  (g as any)._bones = { leftLeg: leftLegPivot, rightLeg: rightLegPivot, leftArm: leftArmPivot, rightArm: rightArmPivot, torso, head: headPivot };
  return g;
}

// ── Animate character bones each frame ────────────────────
function animateCharacter(group: THREE.Group, t: number, isMoving = true) {
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

// ── إضافة هيلمت / قبعة ────────────────────────────────────
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
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.38, 8), mat(0x92400e));
    top.position.y = 2.1; g.add(top);
  } else if (spriteKey === "fantasy_fairy") {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4), mat(0xfbbf24));
    hair.position.set(0, 1.84, 0); hair.scale.set(1, 0.55, 1); g.add(hair);
    // Wings
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

// ── إضافة سلاح ────────────────────────────────────────────
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
    const bow = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 6, 14, Math.PI),
      mat(0x92400e));
    bow.position.set(-0.58, 1.0, 0); bow.rotation.z = Math.PI / 2; g.add(bow);
  } else if (spriteKey === "hero_ninja") {
    const k = new THREE.Mesh(new THREE.BoxGeometry(0.045, 1.1, 0.04), mat(0xd1d5db));
    k.position.set(0.56, 1.05, 0); k.rotation.z = 0.18; g.add(k);
  }
}

// ── بناء Slime ────────────────────────────────────────────
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

// ── بناء Skeleton ─────────────────────────────────────────
function buildSkeleton(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  // Skull
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), mat(0xf3f4f6));
  skull.position.y = 1.58; skull.castShadow = true; g.add(skull);
  // Eye sockets
  for (const x of [-0.1, 0.1]) {
    const sock = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 5), mat(0x1f2937));
    sock.position.set(x, 1.62, 0.22); g.add(sock);
  }
  // Spine
  for (let i = 0; i < 5; i++) {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), mat(0xe5e7eb));
    v.position.y = 0.6 + i * 0.22; g.add(v);
  }
  // Ribs
  for (const side of [-1, 1]) {
    for (let r = 0; r < 3; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 5, 10, Math.PI), mat(0xd1d5db));
      rib.position.set(0, 0.9 + r * 0.18, 0); rib.rotation.z = side * 0.6; g.add(rib);
    }
  }
  // Legs
  for (const x of [-0.16, 0.16]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.6, 5), mat(0xe5e7eb));
    leg.position.set(x, 0.3, 0); leg.castShadow = true; g.add(leg);
  }
  // Arms
  for (const x of [-0.38, 0.38]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 5), mat(0xe5e7eb));
    arm.position.set(x, 0.9, 0); arm.rotation.z = x < 0 ? 0.3 : -0.3; g.add(arm);
  }
  return g;
}

// ── بناء Dragon ───────────────────────────────────────────
function buildDragon(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 1.3, 8), mat(0xdc2626));
  body.position.y = 0.9; body.castShadow = true; g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.7, 7), mat(0xdc2626));
  neck.position.set(0, 1.75, 0.2); neck.rotation.x = -0.4; neck.castShadow = true; g.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.95), mat(0xb91c1c));
  head.position.set(0, 2.2, 0.45); head.castShadow = true; g.add(head);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.55), mat(0xef4444));
  snout.position.set(0, 2.05, 0.88); g.add(snout);
  // Eyes
  for (const x of [-0.24, 0.24]) {
    const ey = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(0xfef08a));
    ey.position.set(x, 2.3, 0.7); g.add(ey);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), mat(0x1c1917));
    ep.position.set(x, 2.3, 0.78); g.add(ep);
  }
  // Horns
  for (const x of [-0.28, 0.28]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55, 5), mat(0x7f1d1d));
    horn.position.set(x, 2.6, 0.3); horn.rotation.z = x < 0 ? -0.3 : 0.3; g.add(horn);
  }
  // Wings
  const wMat = new THREE.MeshLambertMaterial({ color: 0x991b1b, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const wg = new THREE.BufferGeometry();
    const v = new Float32Array([0,0,0, side*2.0,0.8,-0.3, side*1.2,-0.6,-0.3, side*0.4,0,-0.1]);
    wg.setAttribute("position", new THREE.BufferAttribute(v, 3));
    wg.setIndex([0,1,2, 0,2,3]); wg.computeVertexNormals();
    const wing = new THREE.Mesh(wg, wMat);
    wing.position.set(0, 1.4, -0.2); g.add(wing);
    // Wing bones
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 1.6, 5), mat(0x7f1d1d));
    bone.position.set(side * 0.8, 1.6, -0.25); bone.rotation.z = side * 1.1; g.add(bone);
  }
  // Tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.4, 7), mat(0xdc2626));
  tail.position.set(0, 0.7, -1.0); tail.rotation.x = -1.0; g.add(tail);
  // Legs
  for (const x of [-0.38, 0.38]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.75, 6), mat(0xb91c1c));
    leg.position.set(x, 0.3, 0); leg.castShadow = true; g.add(leg);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.1, 0.4), mat(0x7f1d1d));
    claw.position.set(x, -0.06, 0.06); g.add(claw);
  }
  return g;
}

// ── بناء أي object بناءً على النوع ─────────────────────────
function buildObject3D(obj: GameObject): THREE.Object3D {
  const spriteKey: string = (obj as any).spriteKey || "";
  const assetScale: number = (obj as any).assetScale ?? 1;

  // ── أصول المكتبة (بيوت، مولات، أثاث...) ──
  const assetDef = ASSET_LIBRARY.find(a => a.id === spriteKey);
  if (assetDef) {
    const group = assetDef.build();
    group.scale.setScalar(assetScale);
    return group;
  }

  // شخصيات خاصة
  if (spriteKey === "enemy_slime")    return buildSlime();
  if (spriteKey === "enemy_skeleton") return buildSkeleton();
  if (spriteKey === "boss_dragon")    return buildDragon();

  // شخصيات بشرية
  if (spriteKey && CHAR_COLORS[spriteKey]) {
    const group = buildHumanoid(spriteKey);
    addHeadgear(group, spriteKey);
    addWeapon(group, spriteKey);
    return group;
  }

  // Platform / Wall
  if (obj.type === "platform" || obj.type === "wall") {
    const w = Math.max(0.3, obj.width / 60);
    const h = obj.type === "wall" ? Math.max(0.3, obj.height / 60) : 0.25;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.5),
      new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type] || 0x2563eb })
    );
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
  }

  // Collectible — نجمة ذهبية دوارة
  if (obj.type === "collectible") {
    const g = new THREE.Group();
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28, 0),
      new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
    );
    star.rotation.y = Math.PI / 4;
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xfde68a, transparent: true, opacity: 0.18 })
    );
    g.add(star, glow); return g;
  }

  // Spawn / Goal — عمود مع علم
  if (obj.type === "spawn" || obj.type === "goal") {
    const color = obj.type === "spawn" ? 0x84cc16 : 0xf97316;
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6),
      new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
    pole.position.y = 0.7; g.add(pole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.28, 0.04),
      new THREE.MeshLambertMaterial({ color }));
    flag.position.set(0.22, 1.22, 0); g.add(flag);
    return g;
  }

  // Trigger zone — شفاف
  if (obj.type === "trigger") {
    return new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.5, obj.width / 60), 1.5, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.35 })
    );
  }

  // Default box
  const size = Math.max(0.3, Math.min(obj.width, obj.height) / 60);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type] || 0x7c3aed })
  );
  mesh.castShadow = true;
  return mesh;
}

// ── بناء السماء ──────────────────────────────────────────
function buildSky(scene: THREE.Scene) {
  // Sky dome gradient via vertex colors
  const skyGeo = new THREE.SphereGeometry(90, 16, 10);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }
    `,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        float t = clamp((vPos.y + 20.) / 80., 0., 1.);
        vec3 top = vec3(0.02, 0.04, 0.18);
        vec3 mid = vec3(0.05, 0.18, 0.45);
        vec3 hor = vec3(0.55, 0.78, 0.95);
        vec3 col = t > 0.5 ? mix(mid, top, (t-0.5)*2.) : mix(hor, mid, t*2.);
        gl_FragColor = vec4(col, 1.);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starVerts: number[] = [];
  for (let i = 0; i < 600; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.random() * Math.PI * 0.5;
    const r = 75 + Math.random() * 10;
    starVerts.push(r*Math.sin(phi)*Math.cos(theta), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(theta));
  }
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, sizeAttenuation: true }));
  scene.add(stars);

  // Moon
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfef9c3 })
  );
  moon.position.set(-30, 45, -60);
  scene.add(moon);
}

// ── بناء البيئة (أرض + جبال + أشجار) ───────────────────────
function buildEnvironment(scene: THREE.Scene) {
  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(120, 120, 40, 40);
  // تموجات بسيطة في الأرض
  const pos = groundGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const dist = Math.sqrt(x*x + z*z);
    if (Math.abs(x) > 8 || z < -3) {
      pos.setY(i, Math.sin(x * 0.3) * 0.3 + Math.cos(z * 0.4) * 0.2);
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d7a2e });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Dirt strip under playing area
  const dirtStrip = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.3, 14),
    new THREE.MeshLambertMaterial({ color: 0x8B5E3C })
  );
  dirtStrip.position.set(0, -0.16, 0);
  scene.add(dirtStrip);

  // Grass top
  const grassTop = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.12, 14),
    new THREE.MeshLambertMaterial({ color: 0x5cb85c })
  );
  grassTop.position.set(0, 0.06, 0);
  scene.add(grassTop);

  // Mountains (background)
  const mountainPositions = [
    { x: -25, z: -18, h: 14, r: 7 },
    { x: -15, z: -22, h: 18, r: 9 },
    { x:   0, z: -25, h: 22, r: 11 },
    { x:  16, z: -21, h: 16, r: 8 },
    { x:  28, z: -17, h: 12, r: 6 },
  ];
  for (const m of mountainPositions) {
    const geo = new THREE.ConeGeometry(m.r, m.h, 7);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x2d4a6e }));
    mesh.position.set(m.x, m.h / 2 - 0.5, m.z);
    scene.add(mesh);
    // Snow cap
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(m.r * 0.35, m.h * 0.28, 7),
      new THREE.MeshLambertMaterial({ color: 0xf0f9ff })
    );
    snow.position.set(m.x, m.h * 0.87, m.z);
    scene.add(snow);
  }

  // Trees
  const treePositions = [
    -14, -11, -9, 10, 12, 15,
  ];
  for (const x of treePositions) {
    addTree(scene, x, -3 + Math.random() * 2 - 1);
    if (Math.abs(x) > 10) addTree(scene, x + (Math.random()-0.5)*2, -5 + Math.random()*2);
  }

  // Clouds
  for (let i = 0; i < 8; i++) {
    addCloud(scene,
      -30 + Math.random() * 60,
      12 + Math.random() * 10,
      -10 - Math.random() * 20
    );
  }
}

function addTree(scene: THREE.Scene, x: number, z: number) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
  const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d6b26 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.2, 6), trunkMat);
  trunk.position.set(x, 0.6, z); trunk.castShadow = true; scene.add(trunk);
  for (let i = 0; i < 3; i++) {
    const tier = new THREE.Mesh(
      new THREE.ConeGeometry(1.1 - i * 0.2, 1.2, 7),
      new THREE.MeshLambertMaterial({ color: 0x2d6b26 + i * 0x051000 })
    );
    tier.position.set(x, 1.4 + i * 0.8, z); tier.castShadow = true; scene.add(tier);
  }
}

function addCloud(scene: THREE.Scene, x: number, y: number, z: number) {
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
  const offsets = [[0,0,0,1.2], [-1.2,0.1,0,0.9], [1.1,-0.1,0,0.95], [0.3,0.5,0,0.7], [-0.5,0.4,0,0.75]];
  for (const [dx, dy, dz, r] of offsets) {
    const blob = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 5), mat);
    blob.position.set(x + dx, y + dy, z + dz); scene.add(blob);
  }
}

// ══════════════════════════════════════════════════════════
//  PLAY MODE — شخصية اللاعب + فيزياء + كاميرا FPS/TPS
// ══════════════════════════════════════════════════════════
interface PlayState {
  pos: THREE.Vector3;        // موقع اللاعب
  vel: THREE.Vector3;        // السرعة
  yaw: number;               // دوران Y (ماوس)
  pitch: number;             // دوران X
  onGround: boolean;
  viewMode: 'third' | 'first';
  placingType: string | null; // النوع الي هيتحط لما يضغط E
  previewMesh: THREE.Object3D | null;
}

// ── React Component ──────────────────────────────────────
export default function Canvas3D() {
  const mountRef  = useRef<HTMLDivElement>(null);
  const sceneRef  = useRef<THREE.Scene | null>(null);
  const camRef    = useRef<THREE.PerspectiveCamera | null>(null);
  const rendRef   = useRef<THREE.WebGLRenderer | null>(null);
  const objMapRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const frameRef  = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0, btn: 0 });
  const camState   = useRef({ theta: 0.5, phi: 1.05, radius: 16, tx: 0, ty: 1, tz: 0 });
  const store = useEditorStore();

  // ── Play Mode refs ────────────────────────────────────
  const playRef    = useRef<PlayState>({
    pos: new THREE.Vector3(0, 1.5, 5),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0,
    onGround: false,
    viewMode: 'third',
    placingType: null,
    previewMesh: null,
  });
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const keysRef    = useRef<Record<string, boolean>>({});
  const isPlayMode = store.ui.isPlaying;
  const [playHUD, setPlayHUD] = React.useState({ viewMode: 'third', placingType: null as string|null });
  const raycaster  = useRef(new THREE.Raycaster());
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0,1,0), 0));

  // ── Play Mode: إضافة شخصية اللاعب للـ scene ──────────────────
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (isPlayMode) {
      // ابدأ من spawn point لو في الـ scene
      const activeScene = store.getActiveScene();
      const spawnObj = activeScene?.objects.find(o => o.type === 'spawn');
      if (spawnObj) {
        playRef.current.pos.set(worldX(spawnObj), worldY(spawnObj) + 0.5, 0);
      } else {
        playRef.current.pos.set(0, 2, 5);
      }
      playRef.current.vel.set(0,0,0);
      playRef.current.yaw = 0;
      playRef.current.pitch = 0;
      playRef.current.onGround = false;

      // بني شخصية اللاعب
      const playerGroup = buildHumanoid('hero_warrior');
      addHeadgear(playerGroup, 'hero_warrior');
      addWeapon(playerGroup, 'hero_warrior');
      playerGroup.position.copy(playRef.current.pos);
      scene.add(playerGroup);
      playerMeshRef.current = playerGroup;

      // أخفي شخصية اللاعب من الـ hierarchy (عشان متتضاعفش)
      const playerObjId = activeScene?.objects.find(o => o.type === 'player')?.id;
      if (playerObjId) {
        const mesh3d = objMapRef.current.get(playerObjId);
        if (mesh3d) mesh3d.visible = false;
      }

      // Keyboard
      const onKeyDown = (e: KeyboardEvent) => {
        keysRef.current[e.code] = true;
        // V = toggle view
        if (e.code === 'KeyV') {
          playRef.current.viewMode = playRef.current.viewMode === 'third' ? 'first' : 'third';
          setPlayHUD(h => ({ ...h, viewMode: playRef.current.viewMode }));
          if (playerMeshRef.current) playerMeshRef.current.visible = playRef.current.viewMode === 'third';
        }
        // E = place selected object type
        if (e.code === 'KeyE') {
          const ps = playRef.current;
          const cam = camRef.current;
          if (!cam) return;
          // تحديد مكان وضع الـ object (2 وحدة قدام اللاعب)
          const forward = new THREE.Vector3();
          cam.getWorldDirection(forward);
          forward.y = 0; forward.normalize();
          const placePos = ps.pos.clone().addScaledVector(forward, 2);
          placePos.y = 0;

          const placingType = ps.placingType || store.ui.activeTool === 'add'
            ? (store.getActiveScene()?.objects.find(o => o.id === store.ui.selectedObjectId)?.type || 'platform')
            : 'platform';

          // تحويل 3D → editor coords
          const edX = Math.round(placePos.x * 80 + 960);
          const edY = Math.round(1080 - (placePos.y + 5.5 - 1.0) * 80);
          store.addObjectOfType(placingType as any, { x: edX, y: edY });
        }
      };
      const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        if (playerMeshRef.current) {
          scene.remove(playerMeshRef.current);
          playerMeshRef.current = null;
        }
        // أظهر شخصية اللاعب تاني
        if (playerObjId) {
          const mesh3d = objMapRef.current.get(playerObjId);
          if (mesh3d) mesh3d.visible = true;
        }
        keysRef.current = {};
      };
    }
  }, [isPlayMode]);

  // ── Play Mode: ماوس للدوران FPS ──────────────────────
  const onPlayMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isPlayMode) return;
    const ps = playRef.current;
    ps.yaw   -= e.movementX * 0.002;
    ps.pitch  = Math.max(-0.8, Math.min(0.8, ps.pitch - e.movementY * 0.002));
  }, [isPlayMode]);

  function updateCamera() {
    const cam = camRef.current; if (!cam) return;
    const { theta, phi, radius, tx, ty, tz } = camState.current;
    cam.position.set(
      tx + radius * Math.sin(phi) * Math.sin(theta),
      ty + radius * Math.cos(phi),
      tz + radius * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(tx, ty, tz);
  }

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;

    console.log('[Canvas3D] 🚀 Initializing Three.js...');
    console.log('[Canvas3D] Mount size:', mount.clientWidth, 'x', mount.clientHeight);
    console.log('[Canvas3D] THREE version:', THREE.REVISION);

    // لو الـ height = 0 انتظر frame واحد عشان الـ layout يكتمل
    const actualW = mount.clientWidth  || mount.offsetWidth  || 800;
    const actualH = mount.clientHeight || mount.offsetHeight || 600;
    console.log('[Canvas3D] Actual size used:', actualW, 'x', actualH);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1e);
    scene.fog = new THREE.Fog(0x0a0f1e, 40, 90);
    sceneRef.current = scene;
    console.log('[Canvas3D] ✅ Scene created');

    // Camera
    const cam = new THREE.PerspectiveCamera(52, actualW / Math.max(actualH, 1), 0.1, 200);
    camRef.current = cam;
    updateCamera();
    console.log('[Canvas3D] ✅ Camera created');

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      console.log('[Canvas3D] ✅ WebGLRenderer created');
    } catch (err) {
      console.error('[Canvas3D] ❌ WebGL NOT supported or failed:', err);
      return;
    }
    renderer.setSize(actualW, Math.max(actualH, 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    // اجعل الـ canvas يملأ الـ div تماماً
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    rendRef.current = renderer;
    console.log('[Canvas3D] ✅ Renderer appended to DOM');

    // Lights
    scene.add(new THREE.AmbientLight(0x445577, 0.7));
    const sun = new THREE.DirectionalLight(0xfff5e0, 1.5);
    sun.position.set(10, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left:-22, right:22, top:22, bottom:-22, near:0.5, far:60 });
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x4488ff, 0.35);
    fill.position.set(-8, 6, -8);
    scene.add(fill);

    console.log('[Canvas3D] Building sky and environment...');
    try { buildSky(scene); console.log('[Canvas3D] ✅ Sky built'); } catch(e) { console.error('[Canvas3D] ❌ Sky error:', e); }
    try { buildEnvironment(scene); console.log('[Canvas3D] ✅ Environment built'); } catch(e) { console.error('[Canvas3D] ❌ Environment error:', e); }

    // Animate
    let t = 0;
    let frameCount = 0;
    const GRAVITY = -18;
    const GROUND_Y = 0.0; // الأرض

    function updatePlayMode(dt: number) {
      const ps = playRef.current;
      const cam = camRef.current;
      const playerMesh = playerMeshRef.current;
      if (!cam) return;

      const keys = keysRef.current;
      const speed = 6;

      // حساب اتجاه الحركة بناءً على الـ yaw
      const sinY = Math.sin(ps.yaw);
      const cosY = Math.cos(ps.yaw);
      let moveX = 0, moveZ = 0;
      if (keys['KeyW'] || keys['ArrowUp'])    { moveX += sinY; moveZ += cosY; }
      if (keys['KeyS'] || keys['ArrowDown'])  { moveX -= sinY; moveZ -= cosY; }
      if (keys['KeyA'] || keys['ArrowLeft'])  { moveX += cosY; moveZ -= sinY; }
      if (keys['KeyD'] || keys['ArrowRight']) { moveX -= cosY; moveZ += sinY; }

      const len = Math.sqrt(moveX*moveX + moveZ*moveZ);
      if (len > 0) { moveX /= len; moveZ /= len; }

      ps.vel.x = moveX * speed;
      ps.vel.z = moveZ * speed;

      // جاذبية
      if (!ps.onGround) ps.vel.y += GRAVITY * dt;

      // قفز
      if ((keys['Space'] || keys['KeyQ']) && ps.onGround) {
        ps.vel.y = 8;
        ps.onGround = false;
      }

      // تحديث الموقع
      ps.pos.x += ps.vel.x * dt;
      ps.pos.y += ps.vel.y * dt;
      ps.pos.z += ps.vel.z * dt;

      // صدام بسيط مع الارض
      if (ps.pos.y <= GROUND_Y + 1.0) {
        ps.pos.y = GROUND_Y + 1.0;
        ps.vel.y = 0;
        ps.onGround = true;
      } else {
        ps.onGround = false;
      }

      // صدام مبسط مع الـ platforms
      objMapRef.current.forEach((obj3d, id) => {
        const sceneData = store.getActiveScene();
        const gameObj = sceneData?.objects.find(o => o.id === id);
        if (!gameObj || (gameObj.type !== 'platform' && gameObj.type !== 'wall')) return;
        const px = worldX(gameObj), py = worldY(gameObj);
        const hw = Math.max(0.3, gameObj.width / 120);
        const hh = 0.25;
        if (
          Math.abs(ps.pos.x - px) < hw + 0.4 &&
          Math.abs(ps.pos.z)       < 2 &&
          ps.pos.y - 1.0 < py + hh &&
          ps.pos.y - 1.0 > py - hh * 3 &&
          ps.vel.y <= 0
        ) {
          ps.pos.y = py + hh + 1.0;
          ps.vel.y = 0;
          ps.onGround = true;
        }
      });

      // Update player mesh position & rotation
      if (playerMesh) {
        playerMesh.position.copy(ps.pos);
        playerMesh.position.y -= 1.0;
        playerMesh.rotation.y = ps.yaw + Math.PI;
      }

      // تحديث الكاميرا
      if (ps.viewMode === 'first') {
        // FPS: الكاميرا من رأس الشخصية
        cam.position.set(ps.pos.x, ps.pos.y + 0.3, ps.pos.z);
        cam.rotation.order = 'YXZ';
        cam.rotation.y = ps.yaw;
        cam.rotation.x = ps.pitch;
      } else {
        // TPS: كاميرا من ورا الشخصية
        const dist = 5, heightOff = 2.5;
        const tx = ps.pos.x - Math.sin(ps.yaw) * dist;
        const ty = ps.pos.y + heightOff;
        const tz = ps.pos.z - Math.cos(ps.yaw) * dist;
        cam.position.lerp(new THREE.Vector3(tx, ty, tz), 0.12);
        const lookAt = new THREE.Vector3(ps.pos.x, ps.pos.y + 1, ps.pos.z);
        cam.lookAt(lookAt);
      }
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;
      frameCount++;
      if (frameCount === 1) console.log('[Canvas3D] 🎬 First frame rendered!');
      if (frameCount === 60) console.log('[Canvas3D] 🎬 60 frames rendered (1 second) — render loop working fine');

      // ─ Play Mode ─
      if (store.ui.isPlaying) {
        updatePlayMode(0.016);
      }

      // Animate objects every frame
      objMapRef.current.forEach((obj3d, id) => {
        const sceneData = store.getActiveScene();
        const gameObj = sceneData?.objects.find(o => o.id === id);
        if (!gameObj) return;

        // Collectibles: spin + float
        if (gameObj.type === "collectible") {
          obj3d.rotation.y = t * 1.8;
          obj3d.position.y = worldY(gameObj) + 0.3 + Math.sin(t * 2) * 0.18;
        }

        // Characters: animate bones if they have _bones (set by buildHumanoid)
        // Check directly on the object — no spriteKey dependency
        if ((obj3d as any)._bones) {
          animateCharacter(obj3d as THREE.Group, t, false); // idle in editor
        }
      });

      // Player mesh animation in play mode
      if (store.ui.isPlaying && playerMeshRef.current) {
        const ps = playRef.current;
        const moving = Math.abs(ps.vel.x) > 0.2 || Math.abs(ps.vel.z) > 0.2;
        animateCharacter(playerMeshRef.current as THREE.Group, t, moving);
      }

      renderer.render(scene, cam);
    }
    animate();

    // Resize
    const onResize = () => {
      if (!mount || !cam || !renderer) return;
      const w = mount.clientWidth  || mount.offsetWidth  || 800;
      const h = mount.clientHeight || mount.offsetHeight || 600;
      cam.aspect = w / Math.max(h, 1);
      cam.updateProjectionMatrix();
      renderer.setSize(w, Math.max(h, 1));
    };
    window.addEventListener("resize", onResize);

    return () => {
      console.log('[Canvas3D] 🧹 Cleanup');
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── Mouse controls (orbit + pan) ─────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: e.button };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: lastMouse.current.btn };
    const cs = camState.current;
    if (lastMouse.current.btn === 0) {
      cs.theta -= dx * 0.008;
      cs.phi    = Math.max(0.15, Math.min(1.5, cs.phi + dy * 0.008));
    } else if (lastMouse.current.btn === 2) {
      cs.tx -= dx * 0.04;
      cs.tz += dy * 0.04;
    }
    updateCamera();
  }
  function onMouseUp() { isDragging.current = false; }
  function onWheel(e: React.WheelEvent) {
    camState.current.radius = Math.max(3, Math.min(40, camState.current.radius + e.deltaY * 0.02));
    updateCamera();
  }

  // ── Sync game objects to 3D scene ────────────────────────
  const activeScene = store.getActiveScene();
  const sceneObjects = activeScene?.objects ?? [];
  const selectedId   = store.ui.selectedObjectId;
  const sceneId      = store.ui.selectedSceneId;

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentIds = new Set(sceneObjects.map((o: GameObject) => o.id));

    // Remove deleted objects
    objMapRef.current.forEach((obj3d, id) => {
      if (!currentIds.has(id)) {
        scene.remove(obj3d);
        objMapRef.current.delete(id);
      }
    });

    console.log('[Canvas3D] 🔄 Syncing', sceneObjects.length, 'objects to 3D scene');
    // Add new / update existing
    for (const obj of sceneObjects) {
      const spriteKey: string = (obj as any).spriteKey || "";
      const cacheKey = spriteKey || obj.type;
      const existing = objMapRef.current.get(obj.id);
      const existingKey: string = existing ? ((existing as any)._cacheKey ?? "") : "";

      if (!existing || existingKey !== cacheKey) {
        // احذف القديم لو موجود
        if (existing) {
          scene.remove(existing);
          objMapRef.current.delete(obj.id);
        }
        // بني جديد
        console.log('[Canvas3D] ➕ Adding object:', obj.name, '| type:', obj.type, '| spriteKey:', (obj as any).spriteKey || 'none', '| pos:', worldX(obj).toFixed(2), worldY(obj).toFixed(2));
        let obj3d: THREE.Object3D;
        try {
          obj3d = buildObject3D(obj);
        } catch(err) {
          console.error('[Canvas3D] ❌ Failed to build object:', obj.name, err);
          continue;
        }
        obj3d.position.set(worldX(obj), worldY(obj), 0);
        obj3d.castShadow = true;
        (obj3d as any)._selRing = addSelectionRing(obj3d);
        (obj3d as any)._cacheKey = cacheKey;
        scene.add(obj3d);
        objMapRef.current.set(obj.id, obj3d);
        console.log('[Canvas3D] ✅ Object added to scene:', obj.name);
      } else {
        // تحديث موقع فقط
        if (obj.type !== "collectible") {
          existing.position.set(worldX(obj), worldY(obj), 0);
        }
        const ring = (existing as any)._selRing as THREE.Mesh | undefined;
        if (ring) ring.visible = selectedId === obj.id;
      }
    }
  }, [sceneObjects, sceneObjects.length, selectedId, sceneId]);

  // ── Mouse controls (orbit + pan + click-to-place) ───────────────
  const mouseDownPos = useRef({ x: 0, y: 0 });

  function handleEditorClick(clientX: number, clientY: number) {
    const mount = mountRef.current;
    const cam   = camRef.current;
    if (!mount || !cam) return;

    const rect = mount.getBoundingClientRect();
    const ndcX =  ((clientX - rect.left) / rect.width)  * 2 - 1;
    const ndcY = -((clientY - rect.top)  / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    const target = new THREE.Vector3();
    if (!raycaster.current.ray.intersectPlane(groundPlane.current, target)) return;

    // تحويل 3D coords → editor pixel coords
    const edX = Math.round(target.x * 80 + 960);
    const edY = Math.round(1080 - (target.y + 5.5) * 80);

    // حدد النوع: إما المحدد في الـ inspector، أو platform افتراضياً
    const selObj = store.getSelectedObject();
    const objType = selObj?.type || 'platform';
    store.addObjectOfType(objType as any, { x: edX, y: edY });
  }

  function onMouseDown(e: React.MouseEvent) {
    if (isPlayMode) { mountRef.current?.requestPointerLock?.(); return; }
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: e.button };
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (isPlayMode) return;
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY, btn: lastMouse.current.btn };
    const cs = camState.current;
    if (lastMouse.current.btn === 0) { cs.theta -= dx*0.008; cs.phi = Math.max(0.15,Math.min(1.5,cs.phi+dy*0.008)); }
    else if (lastMouse.current.btn === 2) { cs.tx -= dx*0.04; cs.tz += dy*0.04; }
    updateCamera();
  }

  function onMouseUp(e: React.MouseEvent) {
    if (isPlayMode) return;
    isDragging.current = false;
    const dx = Math.abs(e.clientX - mouseDownPos.current.x);
    const dy = Math.abs(e.clientY - mouseDownPos.current.y);
    // كليك بسيط (مش drag) + زر يسار + tool = add
    if (dx < 5 && dy < 5 && e.button === 0 && store.ui.activeTool === 'add') {
      handleEditorClick(e.clientX, e.clientY);
    }
  }

  function onWheel(e: React.WheelEvent) {
    if (isPlayMode) return;
    camState.current.radius = Math.max(3, Math.min(40, camState.current.radius + e.deltaY * 0.02));
    updateCamera();
  }

  const cursorStyle = isPlayMode ? 'none' : store.ui.activeTool === 'add' ? 'crosshair' : 'grab';

  return (
    <div ref={mountRef}
      style={{ flex:1, position:"relative", overflow:"hidden", cursor:cursorStyle, minHeight:0, height:"100%", width:"100%" }}
      onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
      onMouseLeave={() => { if (!isPlayMode) isDragging.current = false; }}
      onWheel={onWheel} onContextMenu={e => e.preventDefault()}
    >
      {!isPlayMode && (
        <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)",
          background:"rgba(0,0,0,0.6)", borderRadius:20, padding:"4px 14px",
          fontSize:11, color:"rgba(255,255,255,0.5)", pointerEvents:"none", fontFamily:"var(--font-cairo)" }}>
          {store.ui.activeTool === 'add'
            ? `كليك على أي مكان في الـ 3D لوضع: ${store.getSelectedObject()?.type || 'platform'}`
            : 'يسار: تدوير | يمين: تحريك | عجلة: zoom — اختار ➕ لوضع كائن بالمكان'}
        </div>
      )}
      {isPlayMode && (
        <>
          <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)",
            background:"rgba(0,0,0,0.75)", borderRadius:12, padding:"6px 18px",
            fontSize:11, color:"#a5b4fc", pointerEvents:"none", fontFamily:"var(--font-cairo)", display:"flex", gap:16 }}>
            <span>WASD: حركة</span><span>Space: قفز</span>
            <span>V: كاميرا ({playHUD.viewMode==='first'?'FPS':'TPS'})</span>
            <span>E: ضع {store.getSelectedObject()?.type||'platform'}</span>
          </div>
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }}>
            <div style={{ position:"relative", width:20, height:20 }}>
              <div style={{ position:"absolute", top:"50%", left:0, right:0, height:1.5, background:"rgba(255,255,255,0.9)", transform:"translateY(-50%)" }}/>
              <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:1.5, background:"rgba(255,255,255,0.9)", transform:"translateX(-50%)" }}/>
            </div>
          </div>
          <button onClick={()=>store.setPlaying(false)} style={{ position:"absolute", top:12, right:12,
            background:"rgba(239,68,68,0.85)", border:"none", borderRadius:8,
            color:"#fff", padding:"5px 12px", fontSize:11, cursor:"pointer", fontFamily:"var(--font-cairo)" }}>
            خروج
          </button>
        </>
      )}
    </div>
  );
}

function worldX(obj: GameObject) { return (obj.x - 960) / 80; }
function worldY(obj: GameObject) {
  const y3d = (1080 - obj.y) / 80 - 5.5;
  if (obj.type === "platform" || obj.type === "wall") return y3d + 0.12;
  if (obj.type === "collectible") return y3d + 1.5;
  return y3d + 1.0;
}
function addSelectionRing(obj3d: THREE.Object3D): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.02; ring.visible = false;
  obj3d.add(ring); return ring;
}
