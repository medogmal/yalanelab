"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import SessionSync from "@/components/SessionSync";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import type { PlatformConfig } from "@/lib/platform-config";

// كل الصفحات standalone — مفيش NavBar قديم خالص
// كل صفحة بتعمل navigation خاصه بيها
export default function AppShell({
  children,
  announcementText,
  config,
}: {
  children: React.ReactNode;
  announcementText?: string;
  config?: PlatformConfig;
}) {
  return (
    <SessionProvider>
      <SessionSync />
      <PWAInstallBanner />
      <div className="min-h-dvh">{children}</div>
    </SessionProvider>
  );
}
