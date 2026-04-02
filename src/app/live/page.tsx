"use client";
import { useEffect, useState } from "react";
import ChatRoom from "@/components/ChatRoom";

type StreamConfig = { url: string | null; prerollSeconds: number; adUrl: string | null };

export default function LivePage() {
  const [cfg, setCfg] = useState<StreamConfig>({ url: null, prerollSeconds: 5, adUrl: null });
  const [showAd, setShowAd] = useState(true);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    fetch("/api/stream").then((r) => r.json()).then(setCfg);
  }, []);

  useEffect(() => {
    if (!cfg.url) return;
    setTimeout(() => {
      setLeft(cfg.prerollSeconds);
      setShowAd(true);
    }, 0);
    const id = setInterval(() => {
      setLeft((x) => {
        if (x <= 1) {
          clearInterval(id);
          setShowAd(false);
          return 0;
        }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cfg.url, cfg.prerollSeconds]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      <h2 className="text-2xl font-bold">البث المباشر</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative border rounded-lg overflow-hidden bg-black">
          {cfg.url ? (
            <>
              {showAd && (
                <div className="absolute inset-0 z-10 bg-black/90 text-white flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg mb-2">إعلان ما قبل البث</div>
                    {cfg.adUrl ? (
                      <video src={cfg.adUrl} autoPlay muted className="w-[80%] mx-auto rounded" />
                    ) : (
                      <div className="px-6 py-3 rounded bg-zinc-800">مساحة إعلان</div>
                    )}
                    <div className="mt-3">يبدأ البث خلال {left} ثانية</div>
                  </div>
                </div>
              )}
              <iframe src={cfg.url} className="w-full aspect-video" allow="autoplay; encrypted-media" />
            </>
          ) : (
            <div className="text-white p-10">لم يتم ضبط رابط البث بعد.</div>
          )}
        </div>
        <div className="md:col-span-1">
          <ChatRoom room="live" />
        </div>
      </div>
    </div>
  );
}
