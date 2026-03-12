 "use client";
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

export default function GameWrapper({ children, className, style, showGrid = false }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; showGrid?: boolean }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const cr = e.contentRect;
        setSize({ w: Math.round(cr.width), h: Math.round(cr.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const dpr = React.useMemo(() => {
    const base = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    return Math.min(2, Math.max(1, base));
  }, []);
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className || ""}`} style={style}>
      <Canvas
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop="always"
        dpr={dpr}
        orthographic
        className="absolute inset-0 pointer-events-none"
      >
        <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={1} />
        <color attach="background" args={["#0b1020"]} />
        {showGrid && <gridHelper args={[Math.max(10, size.w / 40), 20, "#1e293b", "#0f172a"]} />}
        <ambientLight intensity={0.3} />
      </Canvas>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
