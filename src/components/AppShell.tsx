"use client";
import React from "react";
import { SessionProvider } from "next-auth/react";
import SessionSync from "@/components/SessionSync";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import AnnouncementBar from "@/components/AnnouncementBar";
import type { PlatformConfig } from "@/lib/platform-config";

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
      {/* Announcement ticker — shows when text is set by admin */}
      {announcementText && <AnnouncementBar text={announcementText} />}
      <PWAInstallBanner />
      <div className="min-h-dvh">{children}</div>
    </SessionProvider>
  );
}
