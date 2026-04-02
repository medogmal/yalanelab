"use client";
import React from "react";

// GameWrapper مبسّط — بدون Three.js (كان بيسبب crashes على الموبايل)
export default function GameWrapper({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative w-full min-h-screen flex flex-col ${className || ""}`}
      style={style}
    >
      {children}
    </div>
  );
}
