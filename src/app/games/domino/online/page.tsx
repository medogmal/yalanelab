"use client";
import React from "react";
import DominoLobby from "@/components/domino/DominoLobby";
import { DominoErrorBoundary } from "@/components/GameErrorBoundary";

export default function DominoOnlinePage() {
  return (
    <DominoErrorBoundary>
      <DominoLobby />
    </DominoErrorBoundary>
  );
}
