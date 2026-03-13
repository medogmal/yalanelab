"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  text?: string;
}

export default function AnnouncementBar({ text: initialText }: Props) {
  const [text, setText] = useState(initialText || "");
  const [visible, setVisible] = useState(true);

  // Re-fetch every 60s in case admin updated it
  useEffect(() => {
    const load = () =>
      fetch("/api/announcement", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (d?.text) setText(String(d.text));
        })
        .catch(() => {});
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  if (!text || !visible) return null;

  // Repeat text so marquee feels continuous
  const repeated = `${text}   ✦   ${text}   ✦   ${text}   ✦   ${text}   ✦   `;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -32 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          height: 32,
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#7c3aed",
          borderBottom: "1px solid rgba(124,58,237,0.4)",
        }}
        dir="rtl"
      >
        {/* Dismiss button */}
        <button
          onClick={() => setVisible(false)}
          aria-label="إغلاق"
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.15)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            marginRight: 8,
            fontFamily: "inherit",
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          ✕
        </button>

        {/* Label badge */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.2)",
            marginLeft: 10,
            zIndex: 2,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#fbbf24",
              display: "inline-block",
              animation: "ann-pulse 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 900,
              color: "#fbbf24",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            إعلان
          </span>
        </div>

        {/* Scrolling text */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Fade edges */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 32,
              background: "linear-gradient(to right, #7c3aed, transparent)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 32,
              background: "linear-gradient(to left, #7c3aed, transparent)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />

          <span
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(255,255,255,0.92)",
              animation: "ann-marquee 28s linear infinite",
              paddingLeft: "100%",
            }}
          >
            {repeated}
          </span>
        </div>

        <style>{`
          @keyframes ann-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          @keyframes ann-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.3; }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
}
