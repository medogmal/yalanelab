// patch-canvas.js — run with: node patch-canvas.js
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/editor/Canvas3D.tsx');
let content = fs.readFileSync(file, 'utf-8');

// ── الإصلاح 1: الـ sync effect — rebuild عند تغيير spriteKey ──
const oldSync = `    // Add new / update existing
    for (const obj of sceneObjects) {
      if (!objMapRef.current.has(obj.id)) {
        // Build new 3D object
        const obj3d = buildObject3D(obj);
        obj3d.position.set(worldX(obj), worldY(obj), 0);
        obj3d.castShadow = true;
        (obj3d as any)._selRing = addSelectionRing(obj3d);
        scene.add(obj3d);
        objMapRef.current.set(obj.id, obj3d);
      } else {
        // Update position for existing
        const obj3d = objMapRef.current.get(obj.id)!;
        if (obj.type !== "collectible") {
          obj3d.position.set(worldX(obj), worldY(obj), 0);
        }
        // Selection ring visibility
        const ring = (obj3d as any)._selRing as THREE.Mesh | undefined;
        if (ring) ring.visible = selectedId === obj.id;
      }
    }
  }, [sceneObjects, sceneObjects.length, selectedId, sceneId]);`;

const newSync = `    // Add new / update existing
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
        const obj3d = buildObject3D(obj);
        obj3d.position.set(worldX(obj), worldY(obj), 0);
        obj3d.castShadow = true;
        (obj3d as any)._selRing = addSelectionRing(obj3d);
        (obj3d as any)._cacheKey = cacheKey;
        scene.add(obj3d);
        objMapRef.current.set(obj.id, obj3d);
      } else {
        // تحديث موقع فقط
        if (obj.type !== "collectible") {
          existing.position.set(worldX(obj), worldY(obj), 0);
        }
        const ring = (existing as any)._selRing as THREE.Mesh | undefined;
        if (ring) ring.visible = selectedId === obj.id;
      }
    }
  }, [sceneObjects, sceneObjects.length, selectedId, sceneId]);`;

// ── الإصلاح 2: worldY — objects الجديدة تظهر فوق الأرض ──
const oldWorldY = `function worldY(obj: GameObject) {
  // في الـ 3D، Y موجب = فوق؛ في الـ editor Y موجب = تحت
  // الأرض في الـ 3D عند y=0، فاحنا نحسب من أسفل الـ scene
  const groundY3D = 0;
  const sceneH = 1080;
  // كل 80px = 1 unit في 3D
  const y3d = (sceneH - obj.y) / 80 - 5.5;
  if (obj.type === "platform" || obj.type === "wall") return y3d + 0.12;
  return y3d + 1.0;
}`;

const newWorldY = `function worldY(obj: GameObject) {
  // scene height = 1080px ، الـ origin (y=440) = 2.5 فوق الأرض
  // كل 80px = 1 unit في الـ 3D
  const sceneH = 1080;
  const y3d = (sceneH - obj.y) / 80 - 5.5;
  if (obj.type === "platform" || obj.type === "wall") return y3d + 0.12;
  if (obj.type === "collectible") return y3d + 1.5;
  return y3d + 1.0;
}`;

if (!content.includes('if (!objMapRef.current.has(obj.id))')) {
  console.log('❌ لم يتم العثور على الكود القديم للـ sync effect');
} else {
  content = content.replace(oldSync, newSync);
  console.log('✅ تم تحديث الـ sync effect');
}

if (!content.includes('const groundY3D = 0;')) {
  console.log('❌ لم يتم العثور على worldY القديم');
} else {
  content = content.replace(oldWorldY, newWorldY);
  console.log('✅ تم تحديث worldY');
}

fs.writeFileSync(file, content, 'utf-8');
console.log('✅ Canvas3D.tsx تم تحديثه!');
