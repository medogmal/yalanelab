
import type { Metadata } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { ensureScheduler } from "@/lib/scheduler";
import { getPlatformConfig } from "@/lib/platform-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = getPlatformConfig();
  return {
    title: config.branding.siteName,
    description: config.branding.description,
    icons: config.branding.faviconUrl ? [{ url: config.branding.faviconUrl }] : undefined,
  };
}

async function getAnnouncementText() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/announcement`, { cache: "no-store" });
    const data = await res.json();
    return String(data?.text || "مرحبًا بكم في منصة yalla nelab. شارك الآن في البطولات المباشرة.");
  } catch {
    return "مرحبًا بكم في منصة yalla nelab. شارك الآن في البطولات المباشرة.";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  ensureScheduler();
  const announcementText = await getAnnouncementText();
  const config = getPlatformConfig();
  
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} font-sans antialiased`}
      >
        <AppShell announcementText={announcementText} config={config}>{children}</AppShell>
      </body>
    </html>
  );
}
