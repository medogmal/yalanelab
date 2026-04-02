import { useEffect, useState } from "react";

export default function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    const t = new Date(target).getTime();
    function tick() {
      const now = Date.now();
      const d = Math.max(0, t - now);
      const hh = Math.floor(d / 3600000);
      const mm = Math.floor((d % 3600000) / 60000);
      const ss = Math.floor((d % 60000) / 1000);
      setLeft(`${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return <div className="px-3 py-1 rounded bg-zinc-100">{left}</div>;
}
