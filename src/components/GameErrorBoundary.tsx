"use client";
import React from "react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
  gameName?: string;
  gameHref?: string;
  gameColor?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[GameErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { gameName = "اللعبة", gameHref = "/", gameColor = "#7c3aed" } = this.props;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0c0e",
          color: "#f4f4f8",
          fontFamily: "'Cairo',sans-serif",
          padding: "24px",
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>حدث خطأ في {gameName}</h2>
        <p style={{ fontSize: 13, color: "#7a7a8a", marginBottom: 28, maxWidth: 340, lineHeight: 1.7 }}>
          واجهت اللعبة مشكلة غير متوقعة. يمكنك المحاولة مجدداً أو العودة للرئيسية.
        </p>

        {process.env.NODE_ENV === "development" && this.state.error && (
          <pre
            style={{
              fontSize: 10,
              color: "#ef4444",
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 10,
              padding: "12px",
              maxWidth: 480,
              overflow: "auto",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            {this.state.error.message}
          </pre>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              border: "none",
              background: gameColor,
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔄 حاول مجدداً
          </button>
          <Link
            href={gameHref}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#c0c0cc",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            العودة
          </Link>
        </div>
      </div>
    );
  }
}

// Convenience wrappers per game
export function DominoErrorBoundary({ children }: { children: React.ReactNode }) {
  return <GameErrorBoundary gameName="الدومينو" gameHref="/games/domino/online" gameColor="#f59e0b">{children}</GameErrorBoundary>;
}
export function ChessErrorBoundary({ children }: { children: React.ReactNode }) {
  return <GameErrorBoundary gameName="الشطرنج" gameHref="/games/chess/online" gameColor="#8b5cf6">{children}</GameErrorBoundary>;
}
export function BalootErrorBoundary({ children }: { children: React.ReactNode }) {
  return <GameErrorBoundary gameName="البلوت" gameHref="/games/baloot/online" gameColor="#ec4899">{children}</GameErrorBoundary>;
}
export function LudoErrorBoundary({ children }: { children: React.ReactNode }) {
  return <GameErrorBoundary gameName="اللودو" gameHref="/games/ludo/online" gameColor="#06b6d4">{children}</GameErrorBoundary>;
}
