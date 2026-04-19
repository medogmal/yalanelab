  const pendingDropRef = useRef<any>(null);

  // ─── تحويل نقطة الكليك على الـ canvas لإحداثيات editor ──────────────
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
    // worldX(obj) = (obj.x - 960) / 80  →  obj.x = target.x * 80 + 960
    // worldY(obj) = (1080 - obj.y) / 80 - 5.5  →  obj.y = 1080 - (target.y + 5.5) * 80
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
        const wx = (obj.x - 960) / 80;
        const wy = (1080 - obj.y) / 80 - 5.5;
        const tx = (pos.x - 960) / 80;
        const ty = (1080 - pos.y) / 80 - 5.5;
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
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
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
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
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
          x: pos.x, y: pos.y,
          width: data.width || 96, height: data.height || 96,
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
    : store.ui.activeTool === "move" ? "move"
    : "grab";

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
