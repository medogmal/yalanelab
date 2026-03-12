"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import NavBar from "@/components/NavBar";
import AnnouncementBar from "@/components/AnnouncementBar";
import SessionSync from "@/components/SessionSync";
import type { PlatformConfig } from "@/lib/platform-config";

// Pages that run fullscreen (no nav/footer)
const STANDALONE_PREFIXES = [
  "/games/domino",
  "/games/chess/play",
  "/games/ludo/play",
  "/games/baloot/play",
];

export default function AppShell({
  children,
  announcementText,
  config,
}: {
  children: React.ReactNode;
  announcementText: string;
  config?: PlatformConfig;
}) {
  const path = usePathname();
  const standalone = STANDALONE_PREFIXES.some((p) => path.startsWith(p));

  return (
    <SessionProvider>
      <SessionSync />
      {standalone ? (
        <div className="min-h-dvh">{children}</div>
      ) : (
        <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-primary)" }}>
          <NavBar config={config} />
          <AnnouncementBar text={announcementText} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/[0.05] glass-dark">
            <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">
                {config?.content?.footerText ?? "© 2026 يالا نلعب — جميع الحقوق محفوظة"}
              </span>
              <span className="text-xs text-slate-700">v2.0</span>
            </div>
          </footer>
        </div>
      )}
    </SessionProvider>
  );
}
