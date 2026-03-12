"use client";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { Environment, OrbitControls, OrthographicCamera, PerspectiveCamera, ContactShadows } from "@react-three/drei";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { ChessGame } from "@/lib/chess/game";
import { getBestMove } from "@/lib/chess/stockfish";

type Mode = "pvp" | "ai";

function Tile({
  x,
  z,
  isDark,
  onClick,
  highlight,
}: {
  x: number;
  z: number;
  isDark: boolean;
  onClick: () => void;
  highlight?: "from" | "to" | "legal";
}) {
  const color = isDark ? "#2a2a2a" : "#cfcfcf";
  const matColor =
    highlight === "from"
      ? "#22c55e"
      : highlight === "to"
      ? "#ef4444"
      : highlight === "legal"
      ? "#3b82f6"
      : color;
  return (
    <mesh position={[x, 0, z]} onClick={onClick} receiveShadow>
      <boxGeometry args={[1, 0.1, 1]} />
      <meshStandardMaterial color={matColor} />
    </mesh>
  );
}

function Piece({
  type,
  color,
  x,
  z,
  onClick,
}: {
  type: string;
  color: "w" | "b";
  x: number;
  z: number;
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const lathe = (pts: Array<[number, number]>, seg = 128) =>
    new THREE.LatheGeometry(pts.map(([rx, ry]) => new THREE.Vector2(rx, ry)), seg);
  const matPrimary = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: color === "w" ? "#e8e4d9" : "#0f1115",
        roughness: 0.24,
        metalness: 0.55,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
      }),
    [color]
  );
  const matAccent = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: color === "w" ? "#cfc9bb" : "#1b1e25",
        roughness: 0.28,
        metalness: 0.45,
        clearcoat: 0.85,
      }),
    [color]
  );
  return (
    <group position={[x, 0.55, z]} ref={group} onClick={onClick} castShadow>
      {type === "p" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.42, -0.24],
              [0.46, -0.16],
              [0.36, -0.08],
              [0.34, -0.02],
              [0.30, 0.10],
              [0.26, 0.24],
              [0.20, 0.40],
              [0.16, 0.55],
              [0.18, 0.62],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.SphereGeometry(0.20, 64, 64)} material={matPrimary} position={[0, 0.70, 0]} />
        </>
      )}
      {type === "r" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.44, -0.24],
              [0.48, -0.12],
              [0.36, -0.04],
              [0.34, 0.00],
              [0.32, 0.18],
              [0.28, 0.52],
              [0.28, 0.84],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.CylinderGeometry(0.27, 0.27, 0.10, 64)} material={matAccent} position={[0, 0.88, 0]} />
          {[...Array(6)].map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const rx = Math.cos(a) * 0.20;
            const rz = Math.sin(a) * 0.20;
            return (
              <mesh
                key={`crenel-${i}`}
                geometry={new THREE.BoxGeometry(0.10, 0.12, 0.10)}
                material={matPrimary}
                position={[rx, 0.95, rz]}
                rotation={[0, a, 0]}
              />
            );
          })}
        </>
      )}
      {type === "b" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.42, -0.24],
              [0.46, -0.12],
              [0.34, -0.02],
              [0.32, 0.00],
              [0.30, 0.18],
              [0.26, 0.38],
              [0.22, 0.62],
              [0.18, 0.90],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.SphereGeometry(0.15, 64, 64)} material={matPrimary} position={[0, 1.02, 0]} />
          <mesh geometry={new THREE.BoxGeometry(0.28, 0.02, 0.10)} material={matAccent} position={[0, 0.94, 0]} rotation={[Math.PI / 8, 0, 0]} />
        </>
      )}
      {type === "n" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.42, -0.24],
              [0.46, -0.12],
              [0.34, -0.02],
              [0.32, 0.00],
              [0.30, 0.20],
              [0.28, 0.48],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.BoxGeometry(0.30, 0.34, 0.16)} material={matPrimary} position={[0.02, 0.94, 0]} rotation={[0, 0.25, 0]} />
          <mesh geometry={new THREE.BoxGeometry(0.16, 0.10, 0.14)} material={matPrimary} position={[0.18, 1.08, 0]} rotation={[0, -0.15, 0]} />
        </>
      )}
      {type === "q" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.44, -0.24],
              [0.48, -0.12],
              [0.36, -0.02],
              [0.34, 0.00],
              [0.32, 0.22],
              [0.30, 0.42],
              [0.26, 0.76],
              [0.22, 1.04],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.CylinderGeometry(0.18, 0.20, 0.16, 64)} material={matAccent} position={[0, 1.10, 0]} />
          {[...Array(6)].map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const rx = Math.cos(a) * 0.16;
            const rz = Math.sin(a) * 0.16;
            return (
              <mesh
                key={`crown-${i}`}
                geometry={new THREE.SphereGeometry(0.06, 32, 32)}
                material={matPrimary}
                position={[rx, 1.18, rz]}
              />
            );
          })}
        </>
      )}
      {type === "k" && (
        <>
          <mesh
            geometry={lathe([
              [0.0, -0.24],
              [0.46, -0.24],
              [0.50, -0.12],
              [0.36, -0.02],
              [0.34, 0.00],
              [0.32, 0.24],
              [0.30, 0.48],
              [0.28, 0.86],
            ])}
            material={matPrimary}
            position={[0, 0, 0]}
          />
          <mesh geometry={new THREE.SphereGeometry(0.13, 32, 32)} material={matAccent} position={[0, 1.02, 0]} />
          <mesh geometry={new THREE.BoxGeometry(0.06, 0.28, 0.06)} material={matAccent} position={[0, 1.08, 0]} />
          <mesh geometry={new THREE.BoxGeometry(0.24, 0.06, 0.06)} material={matAccent} position={[0, 1.20, 0]} />
        </>
      )}
    </group>
  );
}

function ProfessionalPiece({
  type,
  color,
  x,
  z,
  onClick,
}: {
  type: string;
  color: "w" | "b";
  x: number;
  z: number;
  onClick: () => void;
}) {
  const urls: Record<string, string> = {
    k: "https://raw.githubusercontent.com/thomcom/chess/master/king.obj",
    q: "https://raw.githubusercontent.com/thomcom/chess/master/queen.obj",
    r: "https://raw.githubusercontent.com/thomcom/chess/master/rook.obj",
    b: "https://raw.githubusercontent.com/thomcom/chess/master/bishop.obj",
    n: "https://raw.githubusercontent.com/thomcom/chess/master/knight.obj",
    p: "https://raw.githubusercontent.com/thomcom/chess/master/pawn.obj",
  };
  const url = urls[type];
  const [obj, setObj] = useState<THREE.Group | null>(null);
  const [errored, setErrored] = useState(false);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: color === "w" ? "#e8e4d9" : "#0f1115",
        roughness: 0.24,
        metalness: 0.55,
        clearcoat: 1.0,
        clearcoatRoughness: 0.12,
      }),
    [color]
  );
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!url) return;
    const loader = new OBJLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (object) => {
        object.traverse((c: THREE.Object3D) => {
          if (c instanceof THREE.Mesh) {
            c.material = mat;
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const targetH = 1.2;
        const s = targetH / Math.max(size.y, 1e-3);
        object.scale.setScalar(s);
        object.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
        setObj(object);
      },
      undefined,
      () => setErrored(true)
    );
  }, [url, mat]);
  if (!obj || errored) {
    return <Piece type={type} color={color} x={x} z={z} onClick={onClick} />;
  }
  return (
    <group position={[x, 0.06, z]} ref={group} onClick={onClick} castShadow>
      <primitive object={obj} />
    </group>
  );
}

class PieceErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const LOCAL_GLTF_URLS: Record<"w" | "b", Record<string, string>> = {
  w: {
    k: "/chess/w-king-opt.glb",
    q: "/chess/w-queen-opt.glb",
    r: "/chess/w-rook-opt.glb",
    b: "/chess/w-bishop-opt.glb",
    n: "/chess/w-knight-opt.glb",
    p: "/chess/w-pawn-opt.glb",
  },
  b: {
    k: "/chess/b-king-opt.glb",
    q: "/chess/b-queen-opt.glb",
    r: "/chess/b-rook-opt.glb",
    b: "/chess/b-bishop-opt.glb",
    n: "/chess/b-knight-opt.glb",
    p: "/chess/b-pawn-opt.glb",
  },
};

const REMOTE_GLTF_URLS: Record<"w" | "b", Record<string, string>> = {
  w: {
    k: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-king-opt.glb",
    q: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-queen-opt.glb",
    r: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-rook-opt.glb",
    b: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-bishop-opt.glb",
    n: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-knight-opt.glb",
    p: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/w-pawn-opt.glb",
  },
  b: {
    k: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-king-opt.glb",
    q: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-queen-opt.glb",
    r: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-rook-opt.glb",
    b: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-bishop-opt.glb",
    n: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-knight-opt.glb",
    p: "https://raw.githubusercontent.com/hyperfy-io/hyperfy-app-chess/main/apps/chess/assets/b-pawn-opt.glb",
  },
};

const CUSTOM_SCENE_URL = "/chess_custom/scene.gltf";


function GLTFMesh({
  url,
  x,
  z,
  onClick,
}: {
  url: string;
  x: number;
  z: number;
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const ktx2 = useMemo(() => {
    const k = new KTX2Loader();
    k.setTranscoderPath("/ktx2/");
    k.detectSupport(gl);
    return k;
  }, [gl]);
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.setKTX2Loader(ktx2);
  }) as unknown as { scene: THREE.Group };
  const obj = gltf.scene.clone(true);
  obj.traverse((c: THREE.Object3D) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const targetH = 1.2;
  const s = targetH / Math.max(size.y, 1e-3);
  obj.scale.setScalar(s);
  obj.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
  return (
    <group position={[x, 0.06, z]} ref={group} onClick={onClick} castShadow>
      <primitive object={obj} />
    </group>
  );
}

function SingleScenePiece({
  type,
  color,
  x,
  z,
  onClick,
}: {
  type: string;
  color: "w" | "b";
  x: number;
  z: number;
  onClick: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { gl } = useThree();
  const ktx2 = useMemo(() => {
    const k = new KTX2Loader();
    k.setTranscoderPath("/ktx2/");
    k.detectSupport(gl);
    return k;
  }, [gl]);
  const gltf = useLoader(GLTFLoader, CUSTOM_SCENE_URL, (loader) => {
    loader.setKTX2Loader(ktx2);
  }) as unknown as { scene: THREE.Group };
  const scene = gltf.scene;
  function norm(s: string) {
    return s.toLowerCase().replace(/[\s\-_]+/g, "");
  }
  const typeTokens: Record<string, string[]> = {
    p: ["pawn"],
    r: ["rook", "castle", "tower"],
    n: ["knight", "horse"],
    b: ["bishop"],
    q: ["queen"],
    k: ["king"],
  };
  const colorTokens: Record<"w" | "b", string[]> = {
    w: ["white", "w", "light"],
    b: ["black", "b", "dark"],
  };
  const want = new Set(
    [...typeTokens[type], ...colorTokens[color]].map((t) => norm(t))
  );
  let candidate: THREE.Object3D | null = null;
  scene.traverse((obj) => {
    if (candidate) return;
    const n = norm(obj.name || "");
    let matches = true;
    for (const t of want) {
      if (!n.includes(t)) {
        matches = false;
        break;
      }
    }
    if (matches) {
      candidate = obj;
    }
  });
  if (!candidate) {
    return (
      <GLTFMesh
        url={LOCAL_GLTF_URLS[color][type]}
        x={x}
        z={z}
        onClick={onClick}
      />
    );
  }
  const obj = (candidate as THREE.Object3D).clone(true);
  obj.traverse((c: THREE.Object3D) => {
    if (c instanceof THREE.Mesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const targetH = 1.2;
  const s = targetH / Math.max(size.y, 1e-3);
  obj.scale.setScalar(s);
  obj.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
  return (
    <group position={[x, 0.06, z]} ref={group} onClick={onClick} castShadow>
      <primitive object={obj} />
    </group>
  );
}

function GLTFPiece({
  type,
  color,
  x,
  z,
  onClick,
  pieceSet,
}: {
  type: string;
  color: "w" | "b";
  x: number;
  z: number;
  onClick: () => void;
  pieceSet: "default" | "custom";
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (pieceSet === "custom") {
        setChosen(null);
        return;
      } else {
        const candidates: string[] = [LOCAL_GLTF_URLS[color][type], REMOTE_GLTF_URLS[color][type]];
        for (const u of candidates) {
          try {
            const res = await fetch(u, { method: "HEAD" });
            if (cancelled) return;
            if (res.ok) {
              setChosen(u);
              return;
            }
          } catch {}
        }
      }
      if (!cancelled) setChosen(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [color, type, pieceSet]);
  if (pieceSet === "custom") {
    return <SingleScenePiece type={type} color={color} x={x} z={z} onClick={onClick} />;
  }
  if (!chosen) return <ProfessionalPiece type={type} color={color} x={x} z={z} onClick={onClick} />;
  return <GLTFMesh url={chosen} x={x} z={z} onClick={onClick} />;
}

function toCoord(square: string) {
  const file = "abcdefgh".indexOf(square[0]);
  const rank = Number(square[1]) - 1;
  const x = file - 3.5;
  const z = rank - 3.5;
  return { x, z };
}

export default function ChessBoard3D() {
  const [mode, setMode] = useState<Mode>("ai");
  const [game] = useState(() => new ChessGame());
  const [selected, setSelected] = useState<string | null>(null);
  const [legal, setLegal] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [lastFrom, setLastFrom] = useState<string | null>(null);
  const [lastTo, setLastTo] = useState<string | null>(null);
  const [aiSkill, setAiSkill] = useState<number>(12);
  const [aiDepth, setAiDepth] = useState<number>(12);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [timeMinutes, setTimeMinutes] = useState<number>(5);
  const [incSeconds, setIncSeconds] = useState<number>(2);
  const [timeW, setTimeW] = useState<number>(5 * 60_000);
  const [timeB, setTimeB] = useState<number>(5 * 60_000);
  const [running, setRunning] = useState<boolean>(false);
  const [view, setView] = useState<"top" | "iso">("top");
  const [topTiltDeg, setTopTiltDeg] = useState<number>(12);
  const [pieceSet, setPieceSet] = useState<"default" | "custom">("custom");
  // clock ticker
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const turn = game.turn();
      if (turn === "w") {
        setTimeW((t) => Math.max(0, t - 1000));
      } else {
        setTimeB((t) => Math.max(0, t - 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [running, game]);

  const pieces = game.pieces();

  function onSelectSquare(square: string) {
    if (selected) {
      const ok = legal.includes(square);
      if (ok) {
        const move = game.move(selected, square);
        setSelected(null);
        setLegal([]);
        updateStatus(move?.from || null, move?.to || null, true);
        applyIncrementForMove(move?.color || (playerColor === "w" ? "w" : "b"));
        if (mode === "ai" && game.turn() === "b") {
          setTimeout(async () => {
            const fen = game.fen();
            const best = await getBestMove(fen, { skill: aiSkill, depth: aiDepth });
            const from = best.slice(0, 2);
            const to = best.slice(2, 4);
            const mv = game.move(from, to);
            updateStatus(mv?.from || null, mv?.to || null, true);
            applyIncrementForMove("b");
          }, 200);
        }
      } else {
        setSelected(square);
        setLegal(game.legalMoves(square).map((m) => m.to));
      }
    } else {
      setSelected(square);
      setLegal(game.legalMoves(square).map((m) => m.to));
    }
  }

  function updateStatus(from: string | null = null, to: string | null = null, started = false) {
    if (from && to) {
      setLastFrom(from);
      setLastTo(to);
    }
    if (game.isGameOver()) {
      setStatus("انتهت المباراة");
    } else if (game.isCheck()) {
      setStatus("كش!");
    } else {
      setStatus(game.turn() === "w" ? "دور الأبيض" : "دور الأسود");
    }
    if (started) setRunning(true);
  }

  function applyIncrementForMove(mover: "w" | "b") {
    const incMs = incSeconds * 1000;
    if (mover === "w") setTimeW((t) => t + incMs);
    else setTimeB((t) => t + incMs);
  }

  function startGame() {
    game.reset();
    setSelected(null);
    setLegal([]);
    setLastFrom(null);
    setLastTo(null);
    const base = timeMinutes * 60_000;
    setTimeW(base);
    setTimeB(base);
    setRunning(true);
    updateStatus(null, null, false);
    if (mode === "ai" && playerColor === "b") {
      setTimeout(async () => {
        const best = await getBestMove(game.fen(), { skill: aiSkill, depth: aiDepth });
        const from = best.slice(0, 2);
        const to = best.slice(2, 4);
        const mv = game.move(from, to);
        applyIncrementForMove("b");
        updateStatus(mv?.from || null, mv?.to || null, true);
      }, 200);
    }
  }

  function pauseGame() {
    setRunning(false);
  }

  function undoMove() {
    const u = game.undo();
    if (u) {
      setLastFrom(u.from);
      setLastTo(u.to);
      updateStatus(null, null, false);
    }
  }

  function fmt(ms: number) {
    const m = Math.floor(ms / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 border rounded-xl overflow-hidden bg-gradient-to-b from-zinc-900 to-black">
        <Canvas shadows>
          {view === "top" ? (
            <OrthographicCamera
              makeDefault
              position={[0, 18, topTiltDeg > 0 ? 6 : 0]}
              rotation={[-Math.PI / 2 + (topTiltDeg * Math.PI) / 180, 0, 0]}
              zoom={70}
            />
          ) : (
            <PerspectiveCamera makeDefault position={[9, 11, 9]} fov={40} />
          )}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          {view === "iso" && <directionalLight position={[-6, 8, -6]} intensity={0.5} castShadow />}
          <hemisphereLight args={["#ffffff", "#444444", 0.45]} />
          <group position={[0, 0, 0]}>
            {[...Array(8)].map((_, r) =>
              [...Array(8)].map((__, f) => {
                const file = "abcdefgh"[f];
                const rank = r + 1;
                const square = `${file}${rank}`;
                const { x, z } = toCoord(square);
                const isDark = (f + r) % 2 === 0;
                const hl =
                  lastFrom === square
                    ? "from"
                    : lastTo === square
                    ? "to"
                    : selected === square
                    ? "from"
                    : legal.includes(square)
                    ? "legal"
                    : undefined;
                const highlight: "from" | "to" | "legal" | undefined = hl as
                  | "from"
                  | "to"
                  | "legal"
                  | undefined;
                return (
                  <Tile
                    key={square}
                    x={x}
                    z={z}
                    isDark={isDark}
                    onClick={() => onSelectSquare(square)}
                    highlight={highlight}
                  />
                );
              })
            )}
            {pieces.map((p) => {
              const { x, z } = toCoord(p.square);
              return (
                <Suspense
                  key={p.square + p.type + p.color}
                  fallback={
                    <Piece type={p.type} color={p.color} x={x} z={z} onClick={() => onSelectSquare(p.square)} />
                  }
                >
                  <PieceErrorBoundary
                    fallback={
                      <Piece type={p.type} color={p.color} x={x} z={z} onClick={() => onSelectSquare(p.square)} />
                    }
                  >
                    <GLTFPiece
                      type={p.type}
                      color={p.color}
                      x={x}
                      z={z}
                      onClick={() => onSelectSquare(p.square)}
                      pieceSet={pieceSet}
                    />
                  </PieceErrorBoundary>
                </Suspense>
              );
            })}
          </group>
          <ContactShadows position={[0, 0.01, 0]} scale={12} blur={2.5} opacity={0.45} far={8} />
          {view === "top" ? (
            <OrbitControls enableRotate={false} enablePan={true} enableZoom={true} target={[0, 0, 0]} />
          ) : (
            <OrbitControls
              enableRotate={true}
              minPolarAngle={0.8}
              maxPolarAngle={1.3}
              enablePan={false}
              enableZoom={true}
              target={[0, 0, 0]}
            />
          )}
          <Environment preset="city" />
        </Canvas>
      </div>
      <div className="md:col-span-1 border rounded-xl p-4 bg-white space-y-4">
        <div className="text-lg font-semibold">الإعدادات</div>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${view === "iso" ? "bg-zinc-900 text-white" : ""}`}
            onClick={() => setView("iso")}
          >
            منظور ثلاثي
          </button>
          <button
            className={`px-3 py-1 rounded border ${view === "top" ? "bg-zinc-900 text-white" : ""}`}
            onClick={() => setView("top")}
          >
            منظور علوي
          </button>
        </div>
        {view === "top" && (
          <div className="space-y-1">
            <div className="text-sm">انحراف المنظور العلوي: {topTiltDeg}°</div>
            <input
              type="range"
              min={0}
              max={20}
              value={topTiltDeg}
              onChange={(e) => setTopTiltDeg(Number(e.target.value))}
            />
          </div>
        )}
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${mode === "ai" ? "bg-zinc-900 text-white" : ""}`}
            onClick={() => setMode("ai")}
          >
            لاعب ضد الكمبيوتر
          </button>
          <button
            className={`px-3 py-1 rounded border ${mode === "pvp" ? "bg-zinc-900 text-white" : ""}`}
            onClick={() => setMode("pvp")}
          >
            لاعب ضد لاعب
          </button>
        </div>
        <div className="space-y-2">
          <div className="text-sm">حزمة القطع</div>
          <div className="flex gap-2">
            <button
              className={`px-3 py-1 rounded border ${pieceSet === "default" ? "bg-zinc-900 text-white" : ""}`}
              onClick={() => setPieceSet("default")}
            >
              افتراضية
            </button>
            <button
              className={`px-3 py-1 rounded border ${pieceSet === "custom" ? "bg-zinc-900 text-white" : ""}`}
              onClick={() => setPieceSet("custom")}
            >
              مخصصة
            </button>
          </div>
          <div className="text-xs text-zinc-600">
            ضع ملفاتك في public/chess_custom بالأسماء: w-king,q,rook,bishop,knight,pawn و b-king,q,rook,bishop,knight,pawn
          </div>
        </div>
        {mode === "ai" && (
          <div className="space-y-2">
            <div className="text-sm">لون اللاعب:</div>
            <div className="flex gap-2">
              <button className={`px-3 py-1 rounded border ${playerColor === "w" ? "bg-zinc-900 text-white" : ""}`} onClick={() => setPlayerColor("w")}>أبيض</button>
              <button className={`px-3 py-1 rounded border ${playerColor === "b" ? "bg-zinc-900 text-white" : ""}`} onClick={() => setPlayerColor("b")}>أسود</button>
            </div>
            <div className="text-sm">مستوى الكمبيوتر: {aiSkill}</div>
            <input type="range" min={0} max={20} value={aiSkill} onChange={(e) => setAiSkill(Number(e.target.value))} />
            <div className="text-sm">عمق البحث: {aiDepth}</div>
            <input type="range" min={8} max={20} value={aiDepth} onChange={(e) => setAiDepth(Number(e.target.value))} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 items-center">
          <label className="text-sm">دقائق لكل لاعب</label>
          <input className="border rounded px-2 py-1" type="number" min={1} max={60} value={timeMinutes} onChange={(e) => setTimeMinutes(Number(e.target.value))} />
          <label className="text-sm">زيادة (ث)</label>
          <input className="border rounded px-2 py-1" type="number" min={0} max={30} value={incSeconds} onChange={(e) => setIncSeconds(Number(e.target.value))} />
        </div>
        <div className="flex items-center justify-between p-3 rounded bg-zinc-100">
          <div className="font-semibold">أبيض</div>
          <div className="font-mono">{fmt(timeW)}</div>
        </div>
        <div className="flex items-center justify-between p-3 rounded bg-zinc-100">
          <div className="font-semibold">أسود</div>
          <div className="font-mono">{fmt(timeB)}</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={startGame}>بدء مباراة</button>
          <button className="px-3 py-1 rounded bg-zinc-900 text-white" onClick={pauseGame}>إيقاف مؤقت</button>
          <button className="px-3 py-1 rounded border" onClick={undoMove}>تراجع</button>
        </div>
        <div className="text-sm text-zinc-700">{status}</div>
        <div className="text-sm text-zinc-600">
          اختر قطعة ثم مربع التحرك، يتم التحقق بالقواعد الكاملة (chess.js).
        </div>
        <div className="text-sm">
          التحركات:
          <div className="mt-1 p-2 border rounded max-h-40 overflow-y-auto">
            {game.history({ verbose: true }).map((m, i) => (
              <div key={`${m.from}${m.to}${i}`} className="flex gap-2">
                <div className="text-zinc-500">{i + 1}.</div>
                <div>{m.san}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
