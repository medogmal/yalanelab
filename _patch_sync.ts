    // Add new / update existing
    for (const obj of sceneObjects) {
      const spriteKey: string = (obj as any).spriteKey || "";
      const existing = objMapRef.current.get(obj.id);
      const existingKey: string = existing ? ((existing as any)._spriteKey ?? "__none__") : "__none__";

      // rebuild لو object جديد أو الـ spriteKey اتغير
      if (!existing || existingKey !== (spriteKey || obj.type)) {
        if (existing) {
          scene.remove(existing);
          objMapRef.current.delete(obj.id);
        }
        const obj3d = buildObject3D(obj);
        obj3d.position.set(worldX(obj), worldY(obj), 0);
        obj3d.castShadow = true;
        (obj3d as any)._selRing = addSelectionRing(obj3d);
        (obj3d as any)._spriteKey = spriteKey || obj.type;
        scene.add(obj3d);
        objMapRef.current.set(obj.id, obj3d);
      } else {
        // تحديث الموقع فقط
        if (obj.type !== "collectible") {
          existing.position.set(worldX(obj), worldY(obj), 0);
        }
        const ring = (existing as any)._selRing as THREE.Mesh | undefined;
        if (ring) ring.visible = selectedId === obj.id;
      }
    }