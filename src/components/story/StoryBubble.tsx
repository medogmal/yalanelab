"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MapStory, StoryTrigger } from "@/lib/story/engine";
import { getStoryLine } from "@/lib/story/engine";

interface StoryBubbleProps {
  story:        MapStory;
  trigger:      StoryTrigger;
  levelNumber?: number;
  autoHide?:    number;
  onDismiss?:   () => void;
  forceShow?:   boolean;
}

export default function StoryBubble({
  story, trigger, levelNumber, autoHide = 4000, onDismiss, forceShow = false,
}: StoryBubbleProps) {
  const [line, setLine] = useState(() =>
    getStoryLine(story, trigger, levelNumber, forceShow)
  );
  const [visible, setVisible] = useState(!!line);

  useEffect(() => {
    const l = getStoryLine(story, trigger, levelNumber, forceShow);
    setLine(l);
    setVisible(!!l);
  }, [story.mapId, trigger, levelNumber]);

  useEffect(() => {
    if (!visible || !autoHide) return;
    const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, autoHide);
    return () => clearTimeout(t);
  }, [visible, autoHide]);

  const emotionColors: Record<string, string> = {
    happy: "#34d399", serious: "#f5a623", mysterious: "#a78bfa",
    proud: "#fbbf24", warning: "#f87171", sad: "#94a3b8",
  };
  const color = emotionColors[line?.emotion ?? "serious"] ?? "#f5a623";

  return (
    <AnimatePresence>
      {visible && line && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={() => { setVisible(false); onDismiss?.(); }}
          style={{
            position: "fixed", bottom: "clamp(100px, 22vh, 160px)",
            left: "50%", transform: "translateX(-50%)",
            zIndex: 60, maxWidth: "min(92vw, 360px)", width: "100%",
            cursor: "pointer", fontFamily: "Cairo, sans-serif", direction: "rtl",
          }}
        >
          <div style={{
            background: "rgba(7,9,15,0.96)", border: `1.5px solid ${color}40`,
            borderRadius: 20, padding: "14px 16px",
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${color}15`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: `${color}18`, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0,
              }}>{story.narratorAvatar}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color, lineHeight: 1 }}>{story.narrator}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{story.narratorTitle}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.65, color: "rgba(255,255,255,0.88)", margin: 0 }}>
              {line.text}
            </p>
            <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              اضغط للمتابعة
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
