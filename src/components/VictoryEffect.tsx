"use client";
import { useState } from "react";

export default function VictoryEffect() {
  const [show, setShow] = useState(false);
  const [confetti, setConfetti] = useState<{ left: string; color: string; delay: string }[]>([]);
  function trigger() {
    const arr = Array.from({ length: 60 }).map((_, i) => ({
      left: `${Math.round(Math.random() * 100)}%`,
      color: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][i % 4],
      delay: `${(Math.random() * 0.5).toFixed(2)}s`,
    }));
    setConfetti(arr);
    setShow(true);
    setTimeout(() => setShow(false), 3000);
  }

  return (
    <div className="mt-4">
      <button className="px-4 py-2 rounded bg-emerald-600 text-white" onClick={trigger}>
        احتفال بالفوز
      </button>
      {show && (
        <div className="fixed inset-0 pointer-events-none">
          {confetti.map((c, i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: c.left,
                backgroundColor: c.color,
                animationDelay: c.delay,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
