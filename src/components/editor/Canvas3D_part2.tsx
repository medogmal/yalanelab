
// ── بناء Platform/Wall ──────────────────────────────────────
function buildPlatform3D(obj: GameObject): THREE.Mesh {
  const w = obj.width  / 80;
  const h = (obj.type === "wall" ? obj.height : 20) / 80;
  const d = 0.6;
  const geo = new THREE.BoxGeometry(w, h, d);
  // لون الوجه العلوي فاتح
  const mats = [
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type as ObjectType] || 0x2563eb }),
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type as ObjectType] || 0x2563eb }),
    new THREE.MeshLambertMaterial({ color: new THREE.Color(OBJ_COLORS[obj.type as ObjectType] || 0x2563eb).addScalar(0.15).getHex() }),
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type as ObjectType] || 0x2563eb }),
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type as ObjectType] || 0x2563eb }),
    new THREE.MeshLambertMaterial({ color: OBJ_COLORS[obj.type as ObjectType] || 0x2563eb }),
  ];
  return new THREE.Mesh(geo, mats);
}

// ── بناء Collectible ──────────────────────────────────────
function buildCollectible3D(): THREE.Group {
  const g = new THREE.Group();
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22, 0),
    new THREE.MeshLambertMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.4 })
  );
  star.rotation.y = Math.PI / 4;
  g.add(star);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xfde68a, transparent: true, opacity: 0.2 })
  );
  g.add(glow);
  return g;
}

// ── بناء Spawn/Goal ───────────────────────────────────────
function buildMarker3D(color: number): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x9ca3af })
  );
  pole.position.y = 0.6;
  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.28, 0.04),
    new THREE.MeshLambertMaterial({ color })
  );
  flag.position.set(0.2, 1.1, 0);
  g.add(pole, flag);
  return g;
}

// ── Main 3D Canvas Component ─────────────────────────────
export default function Canvas3D() {
  const mountRef   = useRef<HTMLDivElement>(null);
  const sceneRef   = useRef<THREE.Scene | null>(null);
  const camRef     = useRef<THREE.PerspectiveCamera | null>(null);
  const rendRef    = useRef<THREE.WebGLRenderer | null>(null);
  const objMapRef  = useRef<Map<string, THREE.Object3D>>(new Map());
  const frameRef   = useRef<number>(0);
  const mouseRef   = useRef({ x: 0, y: 0, down: false, btn: 0, lastX: 0, lastY: 0 });
  const camRotRef  = useRef({ theta: 0.4, phi: 1.1, radius: 14 });
  const camTargRef = useRef(new THREE.Vector3(0, 0, 0));

  const store = useEditorStore();

  // ── Setup scene ──────────────────────────────────────────
  const initScene = useCallback(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1e);
    scene.fog = new THREE.Fog(0x0a0f1e, 30, 80);
    sceneRef.current = scene;

    // Camera
    const cam = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camRef.current = cam;
    updateCamera();

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);
    rendRef.current = renderer;

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0x4466aa, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.4);
    sun.position.set(8, 16, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x4488ff, 0.4);
    fill.position.set(-6, 4, -6);
    scene.add(fill);

    // ── Sky ──
    buildSky(scene);

    // ── Ground & Environment ──
    buildEnvironment(scene);

  }, []);
