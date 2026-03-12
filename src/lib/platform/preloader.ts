 "use client";
import React from "react";

export function useAssetPreloader(urls: string[]) {
  const [progress, setProgress] = React.useState(0);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    const total = urls.length || 1;
    let done = 0;
    const inc = () => {
      done += 1;
      if (!mounted) return;
      setProgress(Math.round((done / total) * 100));
      if (done >= total) setReady(true);
    };
    const loadImg = (url: string) => {
      const img = new Image();
      img.onload = inc;
      img.onerror = inc;
      img.src = url;
    };
    const loadAudio = (url: string) => {
      const a = new Audio();
      const doneOnce = () => inc();
      a.addEventListener("canplaythrough", doneOnce, { once: true });
      a.addEventListener("error", doneOnce, { once: true });
      a.src = url;
      a.load();
    };
    const isImg = (u: string) => /\.(png|jpg|jpeg|gif|svg)$/i.test(u);
    const isAudio = (u: string) => /\.(mp3|wav|ogg)$/i.test(u);
    urls.forEach((u) => {
      if (isImg(u)) loadImg(u);
      else if (isAudio(u)) loadAudio(u);
      else fetch(u, { cache: "force-cache" }).then(() => inc()).catch(() => inc());
    });
    return () => { mounted = false; };
  }, [urls]);
  return { progress, ready };
}
