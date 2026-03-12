export default function DominoGameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-dvw overflow-hidden">
      <style>{`
        @keyframes gameFadeIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        .game-shell { animation: gameFadeIn 240ms ease-out; }
        .font-domino {
          font-family: 'Cairo', 'Segoe UI', 'Noto Naskh Arabic', system-ui, sans-serif;
        }
      `}</style>
      <div className="game-shell relative min-h-dvh font-domino">
        <main className="min-h-dvh">{children}</main>
      </div>
    </div>
  );
}
