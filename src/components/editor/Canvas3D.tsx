"use client";
// ═══════════════════════════════════════════════════════════
//  YALA EDITOR — 3D Canvas (Three.js)
//  عالم 3D حقيقي مع شخصيات Low-Poly
// ═══════════════════════════════════════════════════════════
import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useEditorStore } from "@/store/editorStore";
import type { GameObject, ObjectType } from "@/types/editor";

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

  // Legs
  for (const x of [-0.18, 0.18]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.6, 6), mat(c.accent));
    leg.position.set(x, 0.3, 0); leg.castShadow = true; g.add(leg);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.3), mat(0x111827));
    boot.position.set(x, 0.02, 0.04); g.add(boot);
  }
  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.64, 0.32), mat(c.body));
  torso.position.y = 0.92; torso.castShadow = true; g.add(torso);
  // Belt
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.34), mat(c.accent));
  belt.position.y = 0.66; g.add(belt);
  // Arms
  for (const x of [-0.38, 0.38]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.52, 6), mat(c.body));
    arm.position.set(x, 0.88, 0); arm.rotation.z = x < 0 ? 0.2 : -0.2; arm.castShadow = true; g.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat(c.head));
    hand.position.set(x < 0 ? -0.44 : 0.44, 0.64, 0); g.add(hand);
  }
  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 6), mat(c.head));
  neck.position.y = 1.3; g.add(neck);
  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.44, 0.38), mat(c.head));
  head.position.y = 1.59; head.castShadow = true; g.add(head);
  // Eyes
  for (const x of [-0.1, 0.1]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(0.055, 5, 5), mat(0xffffff));
    ew.position.set(x, 1.62, 0.2); g.add(ew);
    const ep = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 5), mat(0x111827));
    ep.position.set(x, 1.62, 0.23); g.add(ep);
  }
  return g;
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

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1e);
    scene.fog = new THREE.Fog(0x0a0f1e, 40, 90);
    sceneRef.current = scene;

    // Camera
    const cam = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camRef.current = cam;
    updateCamera();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendRef.current = renderer;

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

    buildSky(scene);
    buildEnvironment(scene);

    // Animate
    let t = 0;
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;

      // Animate collectibles (rotate + float)
      objMapRef.current.forEach((obj3d, id) => {
        const sceneData = store.getActiveScene();
        const gameObj = sceneData?.objects.find(o => o.id === id);
        if (gameObj?.type === "collectible") {
          obj3d.rotation.y = t * 1.8;
          obj3d.position.y = worldY(gameObj) + 0.3 + Math.sin(t * 2) * 0.18;
        }
      });

      renderer.render(scene, cam);
    }
    animate();

    // Resize
    const onResize = () => {
      if (!mount || !cam || !renderer) return;
      cam.aspect = mount.clientWidth / mount.clientHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
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
  const scene = sceneRef.current;
  const activeScene = store.getActiveScene();

  useEffect(() => {
    if (!scene || !activeScene) return;
    const currentIds = new Set(activeScene.objects.map(o => o.id));

    // Remove deleted
    objMapRef.current.forEach((obj3d, id) => {
      if (!currentIds.has(id)) { scene.remove(obj3d); objMapRef.current.delete(id); }
    });

    // Add / update
    for (const obj of activeScene.objects) {
      if (!objMapRef.current.has(obj.id)) {
        const obj3d = buildObject3D(obj);
        obj3d.position.set(worldX(obj), worldY(obj), 0);
        obj3d.castShadow = true;
        // Selection ring
        (obj3d as any)._selRing = addSelectionRing(obj3d);
        scene.add(obj3d);
        objMapRef.current.set(obj.id, obj3d);
      } else {
        const obj3d = objMapRef.current.get(obj.id)!;
        if (obj.type !== "collectible") {
          obj3d.position.set(worldX(obj), worldY(obj), 0);
        }
        // Selection highlight
        const ring = (obj3d as any)._selRing as THREE.Mesh | undefined;
        if (ring) ring.visible = store.ui.selectedObjectId === obj.id;
      }
    }
  });

  return (
    <div
      ref={mountRef}
      style={{ flex: 1, position: "relative", overflow: "hidden", cursor: "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Hint */}
      <div style={{
        position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 14px",
        fontSize: 11, color: "rgba(255,255,255,0.5)", pointerEvents: "none",
        fontFamily: "var(--font-cairo)",
      }}>
        🖱 يسار: تدوير الكاميرا &nbsp;|&nbsp; يمين: تحريك &nbsp;|&nbsp; عجلة: zoom
      </div>
    </div>
  );
}

// ── تحويل إحداثيات الـ editor (pixels) → 3D world ────────────
function worldX(obj: GameObject) { return (obj.x - 540) / 60; }
function worldY(obj: GameObject) {
  if (obj.type === "platform" || obj.type === "wall") return -(obj.y - 400) / 60 + 0.12;
  return -(obj.y - 400) / 60 + 1.0;
}

// ── حلقة تحديد (selection ring) ──────────────────────────────
function addSelectionRing(obj3d: THREE.Object3D): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.72, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.02;
  ring.visible = false;
  obj3d.add(ring);
  return ring;
}
